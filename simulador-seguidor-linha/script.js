// ==========================================================================
// SIMULADOR SEGUIDOR DE LINHA V2 DEFINITIVO (FÍSICA CORRIGIDA, ESTADOS & TELEMETRIA)
// Escola de Tecnologias
// ==========================================================================

const PIXELS_PER_CM = 1.862;

const simState = {
    isRunning: false,
    isTurbo: false,
    mode: 'garage', // 'garage' ou 'race'
    trackType: 'official',
    
    // Cinemática do Robô
    x: 520,
    y: 356,
    angle: 0,
    vLeft: 0,
    vRight: 0,
    realSpeed: 0,
    trail: [],
    
    // Parâmetros Físicos e Mecânicos
    sensorDist: 10.0,
    sensorGap: 2.2,
    gearRatio: 1.0,
    wheelDiam: 56,
    sensorMode: 'dual',
    
    // Parâmetros do Controlador PID & Motores
    baseSpeed: 50,
    kp: 2.20,
    ki: 0.002,
    kd: 4.50,
    
    // Variáveis Internas do PID
    error: 0,
    prevError: 0,
    integral: 0,
    derivative: 0,
    pOut: 0,
    iOut: 0,
    dOut: 0,
    turn: 0,
    
    // Amostragem de Sensor a 60Hz (~16.6ms) & Ponto Cego
    sensorSamplingRateHz: 60,
    lastSensorSampleTime: 0,
    sampledL: 255,
    sampledR: 255,
    isSamplingBlindSpot: false,

    // Infrações & Checkpoint
    infractions: 0,
    offTrackTimerMs: 0,
    hasPenalizedThisOffTrack: false,
    lastValidPos: { x: 520, y: 356, angle: 0 },
    validPosHistory: [],

    // Debounce e Log do Mentor IA
    diagLastMsgId: '',
    diagLastSwitchTime: 0,
    mentorLogHistory: [],
    
    // Telemetria e Cronômetro
    lapStartTime: 0,
    currentLapMs: 0,
    bestLapMs: null,
    lapCount: 0,
    hasCrossedStart: false,
    lastCrossTimestamp: 0,
    isOffTrack: false,
    lastUIDisplayTime: 0,
    
    // Histórico para o Gráfico de Onda
    graphErrorHistory: [],
    graphTurnHistory: [],
    graphPHistory: [],
    graphIHistory: [],
    graphDHistory: [],
    graphSpeedHistory: [],
    graphTimeWindow: 200,
    graphZoom: 1.0,
    graphHoverX: null,
    graphHoverY: null,
    isGraphPaused: false
};

// ELEMENTOS DOM E CANVAS
let canvas, ctx;
let pipCanvas, pipCtx;
let graphCanvas, graphCtx;
let largeGraphCanvas, largeGraphCtx;
let offscreenCanvas, offscreenCtx;
let officialTrackImage = new Image();
let customTrackImage = null;
let animFrameId = null;
let lastTimestamp = 0;

const TRACK_STARTS = {
    official: { x: 520, y: 356, angle: 0 },
    custom: { x: 512, y: 356, angle: 0 }
};

document.addEventListener('DOMContentLoaded', () => {
    initCanvas();
    setupEventListeners();
    loadOfficialTrackImage();
});

function initCanvas() {
    canvas = document.getElementById('sim-canvas');
    ctx = canvas.getContext('2d');

    pipCanvas = document.getElementById('pip-canvas');
    pipCtx = pipCanvas.getContext('2d');

    graphCanvas = document.getElementById('graph-canvas');
    graphCtx = graphCanvas.getContext('2d');

    largeGraphCanvas = document.getElementById('large-graph-canvas');
    largeGraphCtx = largeGraphCanvas ? largeGraphCanvas.getContext('2d') : null;

    if (largeGraphCanvas) {
        largeGraphCanvas.addEventListener('mousemove', (e) => {
            const rect = largeGraphCanvas.getBoundingClientRect();
            simState.graphHoverX = Math.max(0, Math.min(largeGraphCanvas.width, e.clientX - rect.left));
            simState.graphHoverY = Math.max(0, Math.min(largeGraphCanvas.height, e.clientY - rect.top));
            drawLargeGraph();
        });
        largeGraphCanvas.addEventListener('mouseleave', () => {
            simState.graphHoverX = null;
            simState.graphHoverY = null;
            const tt = document.getElementById('graph-tooltip');
            if (tt) tt.style.display = 'none';
            drawLargeGraph();
        });

        window.addEventListener('resize', () => {
            const modal = document.getElementById('telemetry-modal');
            if (modal && modal.style.display !== 'none') {
                resizeLargeGraphCanvas();
                drawLargeGraph();
            }
        });
    }

    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    offscreenCtx = offscreenCanvas.getContext('2d');

    resetRobotPosition();
    renderStaticTrack();
    drawScene();
}

function resizeLargeGraphCanvas() {
    if (!largeGraphCanvas) return;
    const container = largeGraphCanvas.parentElement;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width > 20 && rect.height > 20) {
        const targetW = Math.floor(rect.width);
        const targetH = Math.floor(rect.height);
        if (largeGraphCanvas.width !== targetW || largeGraphCanvas.height !== targetH) {
            largeGraphCanvas.width = targetW;
            largeGraphCanvas.height = targetH;
        }
    }
}

function loadOfficialTrackImage() {
    officialTrackImage.src = 'pista-torneio.png';
    officialTrackImage.onload = () => {
        renderStaticTrack();
        drawScene();
    };
    officialTrackImage.onerror = () => {
        renderStaticTrack();
        drawScene();
    };
}

// 2. CONFIGURAÇÃO DE LISTENERS & SINCRONIZAÇÃO BIDIRECIONAL DE INPUTS NUMÉRICOS LIVRES
function setupEventListeners() {
    // Geometria Mecânica
    bindSyncInput('sensor-dist-input', 'num-sensor-dist', 'sensorDist', (v) => parseFloat(v));
    bindSyncInput('sensor-gap-input', 'num-sensor-gap', 'sensorGap', (v) => parseFloat(v));

    document.getElementById('gear-ratio-select').addEventListener('change', (e) => {
        simState.gearRatio = parseFloat(e.target.value);
    });

    document.getElementById('wheel-size-select').addEventListener('change', (e) => {
        simState.wheelDiam = parseInt(e.target.value, 10);
    });

    document.getElementById('sensor-mode-select').addEventListener('change', (e) => {
        simState.sensorMode = e.target.value;
    });

    // Sliders & Number Inputs de PID (Oficina/Garagem)
    bindSyncInput('base-speed-input', 'num-base-speed', 'baseSpeed', (v) => parseFloat(v), 'race-base-speed-input', 'race-num-base-speed');
    bindSyncInput('kp-input', 'num-kp', 'kp', (v) => parseFloat(v), 'race-kp-input', 'race-num-kp');
    bindSyncInput('ki-input', 'num-ki', 'ki', (v) => parseFloat(v), 'race-ki-input', 'race-num-ki');
    bindSyncInput('kd-input', 'num-kd', 'kd', (v) => parseFloat(v), 'race-kd-input', 'race-num-kd');

    // Sliders & Number Inputs de PID (Ao Vivo no Cockpit de Corrida)
    bindSyncInput('race-base-speed-input', 'race-num-base-speed', 'baseSpeed', (v) => parseFloat(v), 'base-speed-input', 'num-base-speed');
    bindSyncInput('race-kp-input', 'race-num-kp', 'kp', (v) => parseFloat(v), 'kp-input', 'num-kp');
    bindSyncInput('race-ki-input', 'race-num-ki', 'ki', (v) => parseFloat(v), 'ki-input', 'num-ki');
    bindSyncInput('race-kd-input', 'race-num-kd', 'kd', (v) => parseFloat(v), 'kd-input', 'num-kd');

    // Fechar modais com Escape ou clique fora (backdrop)
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeTelemetryModal();
            closeLegoCodeModal();
        }
    });
    const modalEl = document.getElementById('telemetry-modal');
    if (modalEl) {
        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) closeTelemetryModal();
        });
    }
    const legoModalEl = document.getElementById('lego-code-modal');
    if (legoModalEl) {
        legoModalEl.addEventListener('click', (e) => {
            if (e.target === legoModalEl) closeLegoCodeModal();
        });
    }
}

// Sincronização Bidirecional entre Range Slider e Number Input (Suporta valores extremos livres)
function bindSyncInput(rangeId, numId, stateKey, parser, mirrorRangeId, mirrorNumId) {
    const rangeEl = document.getElementById(rangeId);
    const numEl = document.getElementById(numId);

    if (rangeEl && numEl) {
        rangeEl.addEventListener('input', (e) => {
            const val = parser(e.target.value);
            simState[stateKey] = val;
            numEl.value = e.target.value;
            syncMirrorInput(mirrorRangeId, mirrorNumId, e.target.value);
            if (!simState.isRunning) {
                drawScene();
                updateEquationsDisplay();
            }
            renderLegoCodeDisplay();
        });

        numEl.addEventListener('input', (e) => {
            const val = parser(e.target.value);
            if (!isNaN(val)) {
                simState[stateKey] = val;
                rangeEl.value = val; // Atualiza slider dentro dos seus limites
                syncMirrorInput(mirrorRangeId, mirrorNumId, e.target.value);
                if (!simState.isRunning) {
                    drawScene();
                    updateEquationsDisplay();
                }
                renderLegoCodeDisplay();
            }
        });
    }
}

function syncMirrorInput(rangeId, numId, valueStr) {
    if (!rangeId || !numId) return;
    const rEl = document.getElementById(rangeId);
    const nEl = document.getElementById(numId);
    if (rEl) rEl.value = valueStr;
    if (nEl) nEl.value = valueStr;
}

// 3. TRANSIÇÃO DE ESTADOS (MODO GARAGEM <-> MODO CORRIDA)
function enterRaceMode() {
    simState.mode = 'race';
    document.body.className = 'mode-race';
    document.getElementById('app-mode-badge').textContent = '🏎️ MODO CORRIDA';

    startSimulation();
}

function exitRaceModeToGarage() {
    simState.mode = 'garage';
    document.body.className = 'mode-garage';
    document.getElementById('app-mode-badge').textContent = '🛠️ MODO GARAGEM';

    resetSimulation();
}

// 4. BOTÃO 'COPIAR' (EXCLUSIVAMENTE PARÂMETROS REAIS DE CONTROLE DO LEGO)
function copyPythonVariables() {
    const pyCode = `# --- PARÂMETROS CALIBRADOS NO SIMULADOR ---
V_BASE = ${simState.baseSpeed}
KP = ${simState.kp}
KD = ${simState.kd}
KI = ${simState.ki}`;

    if (navigator.clipboard) {
        navigator.clipboard.writeText(pyCode).then(() => {
            showToast('Parâmetros (V_BASE, KP, KD, KI) copiados para a área de transferência!');
        });
    }
}

// MODAL DIDÁTICO ("COMO PASSAR PARA O ROBÔ REAL" - PYBRICKS & EV3DEV)
let activeLegoCodeTab = 'pybricks';

function openLegoCodeModal() {
    const modal = document.getElementById('lego-code-modal');
    if (!modal) return;
    renderLegoCodeDisplay();
    modal.style.display = 'flex';
}

function closeLegoCodeModal() {
    const modal = document.getElementById('lego-code-modal');
    if (modal) modal.style.display = 'none';
}

function switchLegoCodeTab(tabName) {
    activeLegoCodeTab = tabName;
    const btnPybricks = document.getElementById('tab-btn-pybricks');
    const btnEv3dev = document.getElementById('tab-btn-ev3dev');
    const copyLabel = document.getElementById('copy-tab-label');

    if (btnPybricks) btnPybricks.classList.toggle('active', tabName === 'pybricks');
    if (btnEv3dev) btnEv3dev.classList.toggle('active', tabName === 'ev3dev');
    if (copyLabel) copyLabel.textContent = tabName === 'pybricks' ? 'Pybricks' : 'EV3Dev';

    renderLegoCodeDisplay();
}

function getLegoTabRawCode(tabName) {
    const vBase = simState.baseSpeed;
    const kp = simState.kp;
    const kd = simState.kd;
    const ki = simState.ki;

    if (tabName === 'ev3dev') {
        return `from ev3dev2.motor import LargeMotor, OUTPUT_A, OUTPUT_B, SpeedPercent
from ev3dev2.sensor import INPUT_1, INPUT_2
from ev3dev2.sensor.lego import ColorSensor

motor_esq, motor_dir = LargeMotor(OUTPUT_A), LargeMotor(OUTPUT_B)
sensor_esq, sensor_dir = ColorSensor(INPUT_1), ColorSensor(INPUT_2)

# --- PARÂMETROS CALIBRADOS NO SIMULADOR ---
V_BASE = ${vBase}
KP = ${kp}
KD = ${kd}
KI = ${ki}

erro_anterior, integral = 0, 0
while True:
    erro = sensor_esq.reflected_light_intensity - sensor_dir.reflected_light_intensity
    integral += erro
    derivativo = erro - erro_anterior
    correcao = (KP * erro) + (KD * derivativo) + (KI * integral)
    motor_esq.on(SpeedPercent(max(-100, min(100, V_BASE + correcao))))
    motor_dir.on(SpeedPercent(max(-100, min(100, V_BASE - correcao))))
    erro_anterior = erro`;
    }

    return `from pybricks.pupdevices import Motor, ColorSensor
from pybricks.parameters import Port, Direction
from pybricks.tools import wait

motor_esq = Motor(Port.A, Direction.COUNTERCLOCKWISE)
motor_dir = Motor(Port.B)
sensor_esq, sensor_dir = ColorSensor(Port.C), ColorSensor(Port.D)

# --- PARÂMETROS CALIBRADOS NO SIMULADOR ---
V_BASE = ${vBase}
KP = ${kp}
KD = ${kd}
KI = ${ki}

erro_anterior, integral = 0, 0
while True:
    erro = sensor_esq.reflection() - sensor_dir.reflection()
    integral += erro
    derivativo = erro - erro_anterior
    correcao = (KP * erro) + (KD * derivativo) + (KI * integral)
    motor_esq.dc(V_BASE + correcao)
    motor_dir.dc(V_BASE - correcao)
    erro_anterior = erro
    wait(10)`;
}

function renderLegoCodeDisplay() {
    const codeEl = document.getElementById('lego-code-display');
    if (!codeEl) return;

    const vBase = simState.baseSpeed;
    const kp = simState.kp;
    const kd = simState.kd;
    const ki = simState.ki;

    if (activeLegoCodeTab === 'ev3dev') {
        codeEl.innerHTML = `<span class="code-hl-comment"># Loop de Controle PID — LEGO EV3Dev (Python 3)</span>
from ev3dev2.motor import LargeMotor, OUTPUT_A, OUTPUT_B, SpeedPercent
from ev3dev2.sensor import INPUT_1, INPUT_2
from ev3dev2.sensor.lego import ColorSensor

motor_esq, motor_dir = LargeMotor(OUTPUT_A), LargeMotor(OUTPUT_B)
sensor_esq, sensor_dir = ColorSensor(INPUT_1), ColorSensor(INPUT_2)

<span class="code-hl-banner"># --- PARÂMETROS CALIBRADOS NO SIMULADOR ---</span>
<span class="code-hl-var">V_BASE = <span class="val">${vBase}</span></span>
<span class="code-hl-var">KP = <span class="val">${kp}</span></span>
<span class="code-hl-var">KD = <span class="val">${kd}</span></span>
<span class="code-hl-var">KI = <span class="val">${ki}</span></span>

erro_anterior, integral = 0, 0
while True:
    erro = sensor_esq.reflected_light_intensity - sensor_dir.reflected_light_intensity
    integral += erro
    derivativo = erro - erro_anterior
<span class="code-hl-pid">    correcao = (KP * erro) + (KD * derivativo) + (KI * integral)</span>
<span class="code-hl-motor">    motor_esq.on(SpeedPercent(max(-100, min(100, V_BASE + correcao))))</span>
<span class="code-hl-motor">    motor_dir.on(SpeedPercent(max(-100, min(100, V_BASE - correcao))))</span>
    erro_anterior = erro`;
    } else {
        codeEl.innerHTML = `<span class="code-hl-comment"># Loop de Controle PID — LEGO Pybricks (MicroPython)</span>
from pybricks.pupdevices import Motor, ColorSensor
from pybricks.parameters import Port, Direction
from pybricks.tools import wait

motor_esq = Motor(Port.A, Direction.COUNTERCLOCKWISE)
motor_dir = Motor(Port.B)
sensor_esq, sensor_dir = ColorSensor(Port.C), ColorSensor(Port.D)

<span class="code-hl-banner"># --- PARÂMETROS CALIBRADOS NO SIMULADOR ---</span>
<span class="code-hl-var">V_BASE = <span class="val">${vBase}</span></span>
<span class="code-hl-var">KP = <span class="val">${kp}</span></span>
<span class="code-hl-var">KD = <span class="val">${kd}</span></span>
<span class="code-hl-var">KI = <span class="val">${ki}</span></span>

erro_anterior, integral = 0, 0
while True:
    erro = sensor_esq.reflection() - sensor_dir.reflection()
    integral += erro
    derivativo = erro - erro_anterior
<span class="code-hl-pid">    correcao = (KP * erro) + (KD * derivativo) + (KI * integral)</span>
<span class="code-hl-motor">    motor_esq.dc(V_BASE + correcao)</span>
<span class="code-hl-motor">    motor_dir.dc(V_BASE - correcao)</span>
    erro_anterior = erro
    wait(10)`;
    }
}

function copyActiveLegoTabCode() {
    const rawCode = getLegoTabRawCode(activeLegoCodeTab);
    const label = activeLegoCodeTab === 'pybricks' ? 'Pybricks (MicroPython)' : 'EV3Dev (Python 3)';
    if (navigator.clipboard) {
        navigator.clipboard.writeText(rawCode).then(() => {
            showToast(`Código completo ${label} copiado para a área de transferência!`);
        });
    }
}

function showToast(msg) {
    const toast = document.getElementById('toast-msg');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// 5. ENGINE DE SIMULAÇÃO E LOOP DE ANIMAÇÃO
function toggleSimulation() {
    if (simState.isRunning) {
        pauseSimulation();
    } else {
        startSimulation();
    }
}

function startSimulation() {
    simState.isRunning = true;
    
    const mainPlayLabel = document.getElementById('play-label');
    const mainPlayIcon = document.getElementById('play-icon');
    if (mainPlayLabel) mainPlayLabel.textContent = 'Pausar';
    if (mainPlayIcon) mainPlayIcon.textContent = '⏸️';

    const racePlayBtn = document.getElementById('btn-race-play-pause');
    if (racePlayBtn) racePlayBtn.innerHTML = `<span id="race-play-icon">⏸️</span> Pausar`;

    document.getElementById('hud-robot-status').textContent = 'Simulando na Pista...';
    document.getElementById('hud-robot-status').style.color = 'var(--color-cyan)';

    lastTimestamp = performance.now();
    animFrameId = requestAnimationFrame(simulationLoop);
}

function pauseSimulation() {
    simState.isRunning = false;

    const mainPlayLabel = document.getElementById('play-label');
    const mainPlayIcon = document.getElementById('play-icon');
    if (mainPlayLabel) mainPlayLabel.textContent = 'Continuar';
    if (mainPlayIcon) mainPlayIcon.textContent = '▶';

    const racePlayBtn = document.getElementById('btn-race-play-pause');
    if (racePlayBtn) racePlayBtn.innerHTML = `<span id="race-play-icon">▶</span> Continuar`;

    document.getElementById('hud-robot-status').textContent = 'Pausado';
    document.getElementById('hud-robot-status').style.color = 'var(--color-yellow)';
    if (animFrameId) cancelAnimationFrame(animFrameId);
}

function resetSimulation(keepMode = false) {
    pauseSimulation();
    if (!keepMode && simState.mode === 'race') {
        exitRaceModeToGarage();
    }
    resetRobotPosition();
    simState.integral = 0;
    simState.prevError = 0;
    simState.error = 0;
    simState.turn = 0;
    simState.trail = [];
    simState.lapStartTime = 0;
    simState.currentLapMs = 0;
    simState.hasCrossedStart = false;
    simState.isOffTrack = false;
    simState.offTrackTimerMs = 0;
    simState.infractions = 0;
    simState.hasPenalizedThisOffTrack = false;
    simState.isSamplingBlindSpot = false;
    simState.graphErrorHistory = [];
    simState.graphTurnHistory = [];
    simState.graphPHistory = [];
    simState.graphIHistory = [];
    simState.graphDHistory = [];
    simState.graphSpeedHistory = [];
    simState.mentorLogHistory = [];
    simState.graphScrubPercent = 100;

    const scrubRange = document.getElementById('graph-scrub-range');
    if (scrubRange) scrubRange.value = 100;
    const scrubLabel = document.getElementById('history-scrub-label');
    if (scrubLabel) {
        scrubLabel.textContent = 'Tempo Real';
        scrubLabel.style.color = 'var(--color-cyan)';
    }

    document.getElementById('hud-robot-status').textContent = 'Pronto na Largada';
    document.getElementById('hud-robot-status').style.color = '#4ade80';
    document.getElementById('hud-lap-time').textContent = '00:00.00';
    document.getElementById('hud-infractions').textContent = '0 / 5';

    const raceLap = document.getElementById('race-hud-lap');
    const raceInf = document.getElementById('race-hud-infractions');
    if (raceLap) raceLap.textContent = '00:00.00';
    if (raceInf) raceInf.textContent = '0/5';

    const racePlayBtn = document.getElementById('btn-race-play-pause');
    if (racePlayBtn) racePlayBtn.innerHTML = `<span id="race-play-icon">▶</span> Continuar`;

    const btnCk = document.getElementById('btn-checkpoint');
    const btnRaceCk = document.getElementById('btn-race-checkpoint');
    if (btnCk) btnCk.style.display = 'none';
    if (btnRaceCk) btnRaceCk.style.display = 'none';

    renderStaticTrack();
    drawScene();
    updateEquationsDisplay();
    drawLargeGraph();
}

function resetRobotPosition() {
    const startPos = TRACK_STARTS[simState.trackType] || TRACK_STARTS.official;
    simState.x = startPos.x;
    simState.y = startPos.y;
    simState.angle = startPos.angle;
    simState.lastValidPos = { x: startPos.x, y: startPos.y, angle: startPos.angle };
    simState.validPosHistory = [];
}

function teleportToCheckpoint() {
    let safePos = simState.lastValidPos;
    if (simState.validPosHistory.length > 0) {
        const idx = Math.max(0, simState.validPosHistory.length - 25);
        safePos = simState.validPosHistory[idx];
    }

    simState.x = safePos.x;
    simState.y = safePos.y;
    simState.angle = safePos.angle;
    simState.vLeft = 0;
    simState.vRight = 0;
    simState.realSpeed = 0;
    simState.isOffTrack = false;
    simState.offTrackTimerMs = 0;
    simState.hasPenalizedThisOffTrack = false;
    simState.isSamplingBlindSpot = false;
    simState.error = 0;
    simState.integral = 0;
    simState.prevError = 0;
    simState.turn = 0;
    simState.validPosHistory = [];

    document.getElementById('hud-robot-status').textContent = '📍 Reposicionado no Checkpoint';
    document.getElementById('hud-robot-status').style.color = 'var(--color-cyan)';

    const btnCk = document.getElementById('btn-checkpoint');
    const btnRaceCk = document.getElementById('btn-race-checkpoint');
    if (btnCk) btnCk.style.display = 'none';
    if (btnRaceCk) btnRaceCk.style.display = 'none';

    drawScene();
    updateEquationsDisplay();
}

function toggleTurboSpeed() {
    simState.isTurbo = !simState.isTurbo;
    document.getElementById('speed-multiplier-label').textContent = simState.isTurbo ? '2x' : '1x';
}

function clearTrackTrail() {
    simState.trail = [];
    drawScene();
}

function switchTrack(type) {
    simState.trackType = type;
    document.querySelectorAll('.track-tab-btn').forEach(btn => btn.classList.remove('active'));
    
    const tabEl = document.getElementById(`tab-${type}`);
    if (tabEl) tabEl.classList.add('active');

    resetSimulation();
}

function handleCustomTrackUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            customTrackImage = img;
            switchTrack('custom');
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 6. LOOP PRINCIPAL DE FÍSICA & CORREÇÃO MATEMÁTICA DO PID (DERIVATIVO E ANTI-WINDUP)
function simulationLoop(timestamp) {
    if (!simState.isRunning) return;

    let dt = (timestamp - lastTimestamp) / 1000;
    if (dt > 0.1) dt = 0.016;
    lastTimestamp = timestamp;

    const steps = simState.isTurbo ? 2 : 1;
    for (let s = 0; s < steps; s++) {
        updatePhysicsAndPID(dt);
    }

    drawScene();
    renderPiPZoomCanvas();
    
    // Suavização e Rate-limiting da Renderização dos Números do HUD (a cada 140ms / ~7 FPS) para Leitura Humana Confortável
    const nowMs = performance.now();
    if (!simState.lastUIDisplayTime || nowMs - simState.lastUIDisplayTime >= 140) {
        simState.lastUIDisplayTime = nowMs;
        updateTelemetryHUD();
        updateEquationsDisplay();
    }

    drawGraph();
    drawLargeGraph();
    checkEducationalDiagnostics();

    animFrameId = requestAnimationFrame(simulationLoop);
}

function updatePhysicsAndPID(dt) {
    const armPx = simState.sensorDist * PIXELS_PER_CM;
    const gapPx = (simState.sensorGap / 2.0) * PIXELS_PER_CM;

    const cosA = Math.cos(simState.angle);
    const sinA = Math.sin(simState.angle);

    const xL = simState.x + armPx * cosA - gapPx * sinA;
    const yL = simState.y + armPx * sinA + gapPx * cosA;

    const xR = simState.x + armPx * cosA + gapPx * sinA;
    const yR = simState.y + armPx * sinA - gapPx * cosA;

    // Amostragem Dinâmica (LEGO 60Hz / Maker 500Hz / Ideal 1000Hz)
    const now = performance.now();
    const actualL = sampleTrackBrightness(xL, yL);
    const actualR = sampleTrackBrightness(xR, yR);

    const sampleIntervalMs = 1000.0 / (simState.sensorSamplingRateHz || 60);

    if (now - simState.lastSensorSampleTime >= (sampleIntervalMs - 2.0) || simState.lastSensorSampleTime === 0) {
        simState.lastSensorSampleTime = now;
        simState.sampledL = actualL;
        simState.sampledR = actualR;

        if ((actualL < 160 || actualR < 160) && (simState.sampledL > 230 && simState.sampledR > 230) && simState.realSpeed > 90) {
            simState.isSamplingBlindSpot = true;
        } else if (actualL < 200 || actualR < 200) {
            simState.isSamplingBlindSpot = false;
        }
    }

    const brightnessL = simState.sampledL;
    const brightnessR = simState.sampledR;

    if (simState.sensorMode === 'dual') {
        simState.error = (brightnessL - brightnessR) / 255.0;
    } else {
        simState.error = (brightnessL - 128.0) / 128.0;
    }

    // CORREÇÃO MATEMÁTICA DO PID (ROBÓTICA DISCRETA)
    // 1. Proporcional (P)
    simState.pOut = simState.kp * simState.error;
    
    // 2. Integral (I) com Anti-Windup Reset ao cruzar o centro da fita
    if (Math.sign(simState.error) !== Math.sign(simState.prevError) && simState.prevError !== 0) {
        simState.integral = 0; // Zerar acumulador ao trocar de lado da linha
    } else {
        simState.integral += simState.error * dt;
        simState.integral = Math.max(-5, Math.min(5, simState.integral));
    }
    simState.iOut = simState.ki * simState.integral;

    // 3. Derivativo (D) com filtro passa-baixa (EMA) para amortecimento estável sem ruído espúrio
    const rawDerivative = (simState.error - simState.prevError);
    simState.filteredDerivative = (simState.filteredDerivative || 0) * 0.65 + rawDerivative * 0.35;
    simState.derivative = simState.filteredDerivative;
    simState.dOut = simState.kd * simState.filteredDerivative;

    // Trava Suave de Direção (Turn) entre -100 e +100
    simState.turn = Math.max(-100, Math.min(100, simState.pOut + simState.iOut + simState.dOut));
    simState.prevError = simState.error;

    const gearFactor = 1.0 / simState.gearRatio;
    const wheelFactor = simState.wheelDiam / 56.0;
    const speedMultiplier = gearFactor * wheelFactor;

    // Desaceleração adaptativa suave em curvas fechadas para máxima aderência e estabilidade
    const curveSlowdown = 1.0 - Math.min(0.35, Math.abs(simState.error) * 0.40);
    const effectiveBaseSpeed = simState.baseSpeed * curveSlowdown;

    // Potência dos Motores [%] (-100% a +100%) com esterçamento calibrado para curvas dinâmicas
    const steerMultiplier = 22.0;
    const rawLeft = effectiveBaseSpeed + simState.turn * steerMultiplier;
    const rawRight = effectiveBaseSpeed - simState.turn * steerMultiplier;

    simState.vLeft = Math.max(-100, Math.min(100, rawLeft));
    simState.vRight = Math.max(-100, Math.min(100, rawRight));

    const vL_px = simState.vLeft * 1.58 * speedMultiplier;
    const vR_px = simState.vRight * 1.58 * speedMultiplier;

    const linearV = (vL_px + vR_px) / 2.0;
    const trackWidthPx = 16.0 * PIXELS_PER_CM;
    const angularW = (vR_px - vL_px) / trackWidthPx;

    simState.x += linearV * Math.cos(simState.angle) * dt;
    simState.y += linearV * Math.sin(simState.angle) * dt;
    simState.angle += angularW * dt;

    const instantSpeed = Math.max(0, Math.round((linearV / PIXELS_PER_CM) * 10) / 10);
    simState.realSpeed = instantSpeed;
    if (simState.smoothSpeed === undefined || isNaN(simState.smoothSpeed)) {
        simState.smoothSpeed = instantSpeed;
    } else {
        simState.smoothSpeed = simState.smoothSpeed * 0.90 + instantSpeed * 0.10;
    }

    simState.trail.push({ x: simState.x, y: simState.y });
    if (simState.trail.length > 3500) simState.trail.shift();

    if (!simState.isGraphPaused) {
        simState.graphErrorHistory.push(simState.error);
        simState.graphTurnHistory.push(simState.turn);
        simState.graphPHistory.push(simState.pOut);
        simState.graphIHistory.push(simState.iOut);
        simState.graphDHistory.push(simState.dOut);
        simState.graphSpeedHistory.push(simState.smoothSpeed || simState.realSpeed);
        if (simState.graphErrorHistory.length > 2000) {
            simState.graphErrorHistory.shift();
            simState.graphTurnHistory.shift();
            simState.graphPHistory.shift();
            simState.graphIHistory.shift();
            simState.graphDHistory.shift();
            simState.graphSpeedHistory.shift();
        }
    }

    checkLapTimer();
    checkOffTrackStatus(brightnessL, brightnessR, dt);
}

function sampleTrackBrightness(px, py) {
    const ix = Math.floor(px);
    const iy = Math.floor(py);

    if (ix < 1 || ix >= offscreenCanvas.width - 1 || iy < 1 || iy >= offscreenCanvas.height - 1) {
        return 255;
    }

    const imgData = offscreenCtx.getImageData(ix - 1, iy - 1, 3, 3).data;
    let totalBrightness = 0;
    for (let i = 0; i < 9; i++) {
        const r = imgData[i * 4];
        const g = imgData[i * 4 + 1];
        const b = imgData[i * 4 + 2];
        totalBrightness += (r * 0.299 + g * 0.587 + b * 0.114);
    }
    return totalBrightness / 9.0;
}

function checkLapTimer() {
    const startPos = TRACK_STARTS[simState.trackType] || TRACK_STARTS.official;
    const dx = simState.x - startPos.x;
    const dy = simState.y - startPos.y;
    const distToLine = Math.sqrt(dx * dx + dy * dy);

    const now = performance.now();

    if (distToLine < 35) {
        if (!simState.hasCrossedStart) {
            simState.hasCrossedStart = true;
            simState.lapStartTime = now;
            simState.lastCrossTimestamp = now;
        } else if (now - simState.lastCrossTimestamp > 4000) {
            const lapMs = now - simState.lapStartTime;
            simState.currentLapMs = lapMs;
            simState.lapCount++;
            simState.lastCrossTimestamp = now;
            simState.lapStartTime = now;

            if (simState.bestLapMs === null || lapMs < simState.bestLapMs) {
                simState.bestLapMs = lapMs;
                document.getElementById('hud-best-lap').textContent = formatMsToTime(lapMs);
            }
        }
    }

    if (simState.hasCrossedStart && simState.isRunning) {
        simState.currentLapMs = now - simState.lapStartTime;
        const timeStr = formatMsToTime(simState.currentLapMs);
        document.getElementById('hud-lap-time').textContent = timeStr;
        const raceLap = document.getElementById('race-hud-lap');
        if (raceLap) raceLap.textContent = timeStr;
    }
}

function checkOffTrackStatus(bL, bR, dt) {
    if (bL > 235 && bR > 235) {
        simState.offTrackTimerMs += (dt || 0.016) * 1000;
        
        if (simState.offTrackTimerMs >= 400) {
            simState.isOffTrack = true;
            
            if (!simState.hasPenalizedThisOffTrack) {
                simState.hasPenalizedThisOffTrack = true;
                simState.infractions = Math.min(5, simState.infractions + 1);
                const infStr = `${simState.infractions} / 5`;
                document.getElementById('hud-infractions').textContent = infStr;
                const raceInf = document.getElementById('race-hud-infractions');
                if (raceInf) raceInf.textContent = `${simState.infractions}/5`;
            }

            document.getElementById('hud-robot-status').textContent = '🚨 FORA DA PISTA (0.4s)';
            document.getElementById('hud-robot-status').style.color = 'var(--color-red)';
            
            const btnCk = document.getElementById('btn-checkpoint');
            const btnRaceCk = document.getElementById('btn-race-checkpoint');
            if (btnCk) btnCk.style.display = 'inline-flex';
            if (btnRaceCk) btnRaceCk.style.display = 'inline-flex';

            pauseSimulation();
        }
    } else {
        simState.offTrackTimerMs = 0;
        simState.isOffTrack = false;
        simState.hasPenalizedThisOffTrack = false;
        
        simState.validPosHistory.push({ x: simState.x, y: simState.y, angle: simState.angle });
        if (simState.validPosHistory.length > 50) simState.validPosHistory.shift();

        simState.lastValidPos = { x: simState.x, y: simState.y, angle: simState.angle };

        if (simState.isRunning) {
            document.getElementById('hud-robot-status').textContent = 'Na Pista (OK)';
            document.getElementById('hud-robot-status').style.color = 'var(--color-green)';
        }
    }
}

// 7. RENDERIZAÇÃO DA CENA PRINCIPAL & MINI-LUPA (PIP ZOOM 4X)
function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);

    if (simState.trail.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
        ctx.lineWidth = 1.5;
        ctx.moveTo(simState.trail[0].x, simState.trail[0].y);
        for (let i = 1; i < simState.trail.length; i++) {
            ctx.lineTo(simState.trail[i].x, simState.trail[i].y);
        }
        ctx.stroke();
    }

    ctx.save();
    ctx.translate(simState.x, simState.y);
    ctx.rotate(simState.angle);

    const bodyL = 18.0 * PIXELS_PER_CM;
    const bodyW = 14.0 * PIXELS_PER_CM;

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-bodyL / 2, -bodyW / 2, bodyL, bodyW, 6);
    ctx.fill();
    ctx.stroke();

    const wheelW = (simState.wheelDiam / 10.0) * PIXELS_PER_CM;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-wheelW / 2, -bodyW / 2 - 4, wheelW, 4);
    ctx.fillRect(-wheelW / 2, bodyW / 2, wheelW, 4);

    ctx.fillStyle = '#a855f7';
    ctx.fillRect(-10, -6, 20, 12);

    const armPx = simState.sensorDist * PIXELS_PER_CM;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(armPx, 0);
    ctx.stroke();

    const gapPx = (simState.sensorGap / 2.0) * PIXELS_PER_CM;
    
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(armPx, gapPx, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(armPx, -gapPx, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function renderPiPZoomCanvas() {
    if (!pipCtx || simState.mode !== 'race') return;

    const pw = pipCanvas.width;
    const ph = pipCanvas.height;

    pipCtx.clearRect(0, 0, pw, ph);

    const armPx = simState.sensorDist * PIXELS_PER_CM;
    const targetX = simState.x + armPx * Math.cos(simState.angle);
    const targetY = simState.y + armPx * Math.sin(simState.angle);

    // Suavização da Câmera por Interpolação Linear (Lerp) para evitar trepidação
    if (simState.pipCamX === undefined || isNaN(simState.pipCamX)) {
        simState.pipCamX = targetX;
        simState.pipCamY = targetY;
    } else {
        simState.pipCamX += (targetX - simState.pipCamX) * 0.15;
        simState.pipCamY += (targetY - simState.pipCamY) * 0.15;
    }

    const cropSize = 40;
    const srcX = Math.max(0, Math.min(canvas.width - cropSize, simState.pipCamX - cropSize / 2));
    const srcY = Math.max(0, Math.min(canvas.height - cropSize, simState.pipCamY - cropSize / 2));

    pipCtx.drawImage(canvas, srcX, srcY, cropSize, cropSize, 0, 0, pw, ph);

    pipCtx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    pipCtx.lineWidth = 1;
    pipCtx.beginPath();
    pipCtx.moveTo(pw / 2, 0); pipCtx.lineTo(pw / 2, ph);
    pipCtx.moveTo(0, ph / 2); pipCtx.lineTo(pw, ph / 2);
    pipCtx.stroke();
}

// 8. RENDERIZAÇÃO DAS PISTAS & TEXTO LIMPO 'LARGADA / CHEGADA'
function renderStaticTrack() {
    offscreenCtx.fillStyle = '#ffffff';
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    if (simState.trackType === 'custom' && customTrackImage) {
        offscreenCtx.drawImage(customTrackImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
    } else {
        if (officialTrackImage.complete && officialTrackImage.naturalWidth > 0) {
            offscreenCtx.drawImage(officialTrackImage, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            // Limpa interferência óptica de letras de texto decorativo abaixo da fita na imagem
            offscreenCtx.fillStyle = '#ffffff';
            offscreenCtx.fillRect(455, 360, 130, 35);
        }
    }

    drawStartFinishLine();
}

function drawStartFinishLine() {
    const startPos = TRACK_STARTS[simState.trackType] || TRACK_STARTS.official;
    offscreenCtx.strokeStyle = '#ef4444';
    offscreenCtx.lineWidth = 6;
    offscreenCtx.beginPath();
    offscreenCtx.moveTo(startPos.x, startPos.y - 25);
    offscreenCtx.lineTo(startPos.x, startPos.y + 25);
    offscreenCtx.stroke();

    // Texto visual nítido posicionado com folga segura para visualização humana
    offscreenCtx.font = 'bold 11px Outfit, sans-serif';
    offscreenCtx.fillStyle = '#475569';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.fillText('LARGADA / CHEGADA', startPos.x, startPos.y + 42);
}

// 9. TELEMETRIA E TELEMETRIA EXPANDIDA / MODAL
function updateEquationsDisplay() {
    document.getElementById('eq-error').textContent = (simState.error >= 0 ? '+' : '') + simState.error.toFixed(2);
    document.getElementById('eq-p').textContent = (simState.pOut >= 0 ? '+' : '') + simState.pOut.toFixed(2);
    document.getElementById('eq-i').textContent = (simState.iOut >= 0 ? '+' : '') + simState.iOut.toFixed(3);
    document.getElementById('eq-d').textContent = (simState.dOut >= 0 ? '+' : '') + simState.dOut.toFixed(2);
    document.getElementById('eq-turn').textContent = (simState.turn >= 0 ? '+' : '') + simState.turn.toFixed(2);
    document.getElementById('eq-motors').textContent = `${Math.round(simState.vLeft)}% / ${Math.round(simState.vRight)}%`;

    const rowP = document.getElementById('row-eq-p');
    const rowI = document.getElementById('row-eq-i');
    const rowD = document.getElementById('row-eq-d');

    if (rowP) {
        if (Math.abs(simState.pOut) > 0.25) rowP.classList.add('active-glow');
        else rowP.classList.remove('active-glow');
    }
    if (rowI) {
        if (Math.abs(simState.iOut) > 0.05) rowI.classList.add('active-glow');
        else rowI.classList.remove('active-glow');
    }
    if (rowD) {
        if (Math.abs(simState.dOut) > 0.35) rowD.classList.add('active-glow');
        else rowD.classList.remove('active-glow');
    }
}

function updateTelemetryHUD() {
    const displaySpeed = (simState.smoothSpeed !== undefined) ? simState.smoothSpeed.toFixed(1) : (simState.realSpeed || 0);
    const spdStr = `${displaySpeed} cm/s`;
    document.getElementById('hud-real-speed').textContent = spdStr;
    const raceSpd = document.getElementById('race-hud-speed');
    if (raceSpd) raceSpd.textContent = spdStr;
}

function drawGraph() {
    if (!graphCtx) return;
    const w = graphCanvas.width;
    const h = graphCanvas.height;

    graphCtx.clearRect(0, 0, w, h);

    graphCtx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    graphCtx.lineWidth = 1;
    graphCtx.beginPath();
    graphCtx.moveTo(0, h / 2);
    graphCtx.lineTo(w, h / 2);
    graphCtx.stroke();

    const len = simState.graphErrorHistory.length;
    if (len < 2) return;

    // Desenha as últimas 100 amostras
    const sampleWindow = 100;
    const startIndex = Math.max(0, len - sampleWindow);
    const count = len - startIndex;
    const step = w / Math.max(1, count - 1);

    // Erro (Vermelho)
    graphCtx.beginPath();
    graphCtx.strokeStyle = '#ef4444';
    graphCtx.lineWidth = 2;

    for (let i = 0; i < count; i++) {
        const x = i * step;
        const err = simState.graphErrorHistory[startIndex + i];
        const y = Math.max(2, Math.min(h - 2, h / 2 - err * (h * 0.42)));
        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();

    // Turn (Ciano)
    graphCtx.beginPath();
    graphCtx.strokeStyle = '#06b6d4';
    graphCtx.lineWidth = 1.5;

    for (let i = 0; i < count; i++) {
        const x = i * step;
        const turn = simState.graphTurnHistory[startIndex + i];
        const y = Math.max(2, Math.min(h - 2, h / 2 - (turn / 5.0) * (h * 0.42)));
        if (i === 0) graphCtx.moveTo(x, y);
        else graphCtx.lineTo(x, y);
    }
    graphCtx.stroke();
}

function adjustGraphZoom(factor) {
    if (!simState.graphZoom) simState.graphZoom = 1.0;
    simState.graphZoom *= factor;
    simState.graphZoom = Math.max(0.2, Math.min(10.0, simState.graphZoom));
    const label = document.getElementById('zoom-level-label');
    if (label) label.textContent = `Ampl: ${simState.graphZoom.toFixed(1)}x`;
    drawLargeGraph();
}

function adjustTimeWindow(factor) {
    if (!simState.graphTimeWindow) simState.graphTimeWindow = 200;
    simState.graphTimeWindow = Math.round(simState.graphTimeWindow * factor);
    simState.graphTimeWindow = Math.max(30, Math.min(800, simState.graphTimeWindow));
    const label = document.getElementById('time-window-label');
    if (label) label.textContent = `Janela: ${simState.graphTimeWindow} pts`;
    drawLargeGraph();
}

function resetGraphZoom() {
    simState.graphZoom = 1.0;
    simState.graphTimeWindow = 200;
    simState.graphScrubPercent = 100;
    simState.isGraphPaused = false;

    const scrubRange = document.getElementById('graph-scrub-range');
    if (scrubRange) scrubRange.value = 100;
    const scrubLabel = document.getElementById('history-scrub-label');
    if (scrubLabel) {
        scrubLabel.textContent = 'Tempo Real';
        scrubLabel.style.color = 'var(--color-cyan)';
    }
    const pauseBtn = document.getElementById('btn-pause-graph');
    if (pauseBtn) {
        pauseBtn.innerHTML = `<span id="graph-pause-icon">⏸️</span> Pausar Onda`;
    }
    const label = document.getElementById('zoom-level-label');
    if (label) label.textContent = 'Ampl: 1.0x';
    const twLabel = document.getElementById('time-window-label');
    if (twLabel) twLabel.textContent = 'Janela: 200 pts';
    drawLargeGraph();
}

function changeSensorSamplingRate(rateHz) {
    simState.sensorSamplingRateHz = parseFloat(rateHz);
}

function handleGraphScrub(valuePct) {
    simState.graphScrubPercent = parseFloat(valuePct);
    const labelEl = document.getElementById('history-scrub-label');
    if (labelEl) {
        if (valuePct >= 99) {
            labelEl.textContent = 'Tempo Real';
            labelEl.style.color = 'var(--color-cyan)';
        } else {
            labelEl.textContent = `Histórico (${Math.round(valuePct)}%)`;
            labelEl.style.color = 'var(--color-yellow)';
        }
    }
    drawLargeGraph();
}

function drawLargeGraph() {
    if (!largeGraphCtx || !largeGraphCanvas || document.getElementById('telemetry-modal').style.display === 'none') return;

    const w = largeGraphCanvas.width;
    const h = largeGraphCanvas.height;
    if (w <= 10 || h <= 10) return;
    const zoom = simState.graphZoom || 1.0;

    largeGraphCtx.clearRect(0, 0, w, h);

    // Grade de fundo (Grid)
    largeGraphCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    largeGraphCtx.lineWidth = 1;

    const gridYStep = h / 6;
    for (let y = gridYStep; y < h; y += gridYStep) {
        largeGraphCtx.beginPath();
        largeGraphCtx.moveTo(0, y);
        largeGraphCtx.lineTo(w, y);
        largeGraphCtx.stroke();
    }

    const gridXStep = w / 10;
    for (let x = gridXStep; x < w; x += gridXStep) {
        largeGraphCtx.beginPath();
        largeGraphCtx.moveTo(x, 0);
        largeGraphCtx.lineTo(x, h);
        largeGraphCtx.stroke();
    }

    // Linha Central (Baseline Zero)
    largeGraphCtx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
    largeGraphCtx.lineWidth = 1.5;
    largeGraphCtx.beginPath();
    largeGraphCtx.moveTo(0, h / 2);
    largeGraphCtx.lineTo(w, h / 2);
    largeGraphCtx.stroke();

    // Marcadores do Eixo Y (Amplitude)
    largeGraphCtx.font = '600 10px Fira Code, monospace';
    largeGraphCtx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    largeGraphCtx.fillText(`+1.0 Erro | +5.0 Turn`, 8, gridYStep - 4);
    largeGraphCtx.fillText(` 0.0 (Centro)`, 8, h / 2 - 4);
    largeGraphCtx.fillText(`-1.0 Erro | -5.0 Turn`, 8, h - gridYStep + 12);

    const totalLen = simState.graphErrorHistory.length;
    if (totalLen < 2) {
        largeGraphCtx.font = '600 13px Outfit, sans-serif';
        largeGraphCtx.fillStyle = 'rgba(148, 163, 184, 0.7)';
        largeGraphCtx.textAlign = 'center';
        largeGraphCtx.fillText('Aguardando telemetria... Inicie ou continue a corrida para gerar a onda.', w / 2, h / 2 + 25);
        largeGraphCtx.textAlign = 'left';
        return;
    }

    const windowSize = simState.graphTimeWindow || 200; // Quantidade ajustável de pontos visíveis
    const pct = (simState.graphScrubPercent !== undefined ? simState.graphScrubPercent : 100) / 100.0;
    
    let endIndex, startIndex, count;
    if (totalLen <= windowSize) {
        startIndex = 0;
        endIndex = totalLen;
        count = totalLen;
    } else {
        endIndex = Math.max(windowSize, Math.min(totalLen, Math.floor(pct * totalLen)));
        startIndex = Math.max(0, endIndex - windowSize);
        count = endIndex - startIndex;
    }

    const step = w / Math.max(1, count - 1);

    // Encontrar Picos (Máximos e Mínimos na janela visível)
    let maxErr = -Infinity, minErr = Infinity, maxErrIdx = -1, minErrIdx = -1;
    let maxTurn = -Infinity, minTurn = Infinity, maxTurnIdx = -1, minTurnIdx = -1;
    let sumSpeed = 0;

    for (let i = 0; i < count; i++) {
        const idx = startIndex + i;
        const e = simState.graphErrorHistory[idx];
        const t = simState.graphTurnHistory[idx];
        const s = (simState.graphSpeedHistory && simState.graphSpeedHistory[idx] !== undefined) ? simState.graphSpeedHistory[idx] : 0;
        sumSpeed += s;

        if (e > maxErr) { maxErr = e; maxErrIdx = i; }
        if (e < minErr) { minErr = e; minErrIdx = i; }
        if (t > maxTurn) { maxTurn = t; maxTurnIdx = i; }
        if (t < minTurn) { minTurn = t; minTurnIdx = i; }
    }

    // Atualiza barra de estatísticas do topo
    const peakErrEl = document.getElementById('stat-peak-error');
    const peakTurnEl = document.getElementById('stat-peak-turn');
    const avgSpdEl = document.getElementById('stat-avg-speed');
    if (peakErrEl) peakErrEl.textContent = `${maxErr >= 0 ? '+' : ''}${maxErr.toFixed(2)} / ${minErr >= 0 ? '+' : ''}${minErr.toFixed(2)}`;
    if (peakTurnEl) peakTurnEl.textContent = `${maxTurn >= 0 ? '+' : ''}${maxTurn.toFixed(2)} / ${minTurn >= 0 ? '+' : ''}${minTurn.toFixed(2)}`;
    if (avgSpdEl) avgSpdEl.textContent = `${(sumSpeed / Math.max(1, count)).toFixed(1)} cm/s`;

    // Mapeamento vertical seguro sem estourar canvas
    const mapYErr = (val) => {
        const rawY = h / 2 - val * (h * 0.40) * zoom;
        return Math.max(6, Math.min(h - 6, rawY));
    };
    const mapYTurn = (val) => {
        const rawY = h / 2 - (val / 5.0) * (h * 0.40) * zoom;
        return Math.max(6, Math.min(h - 6, rawY));
    };

    // Erro (Vermelho)
    largeGraphCtx.beginPath();
    largeGraphCtx.strokeStyle = '#ef4444';
    largeGraphCtx.lineWidth = 2.2;

    for (let i = 0; i < count; i++) {
        const x = i * step;
        const err = simState.graphErrorHistory[startIndex + i];
        const y = mapYErr(err);
        if (i === 0) largeGraphCtx.moveTo(x, y);
        else largeGraphCtx.lineTo(x, y);
    }
    largeGraphCtx.stroke();

    // Turn (Ciano)
    largeGraphCtx.beginPath();
    largeGraphCtx.strokeStyle = '#06b6d4';
    largeGraphCtx.lineWidth = 2.0;

    for (let i = 0; i < count; i++) {
        const x = i * step;
        const turn = simState.graphTurnHistory[startIndex + i];
        const y = mapYTurn(turn);
        if (i === 0) largeGraphCtx.moveTo(x, y);
        else largeGraphCtx.lineTo(x, y);
    }
    largeGraphCtx.stroke();

    // Marcadores Visuais dos Picos (Pontos Máximo e Mínimo de Erro)
    if (maxErrIdx >= 0 && Math.abs(maxErr) > 0.05) {
        const px = maxErrIdx * step;
        const py = mapYErr(maxErr);
        largeGraphCtx.fillStyle = '#ef4444';
        largeGraphCtx.beginPath();
        largeGraphCtx.arc(px, py, 4.5, 0, Math.PI * 2);
        largeGraphCtx.fill();
        largeGraphCtx.font = 'bold 9px Fira Code';
        largeGraphCtx.fillText(`▲ ${maxErr > 0 ? '+' : ''}${maxErr.toFixed(2)}`, Math.min(w - 45, px + 6), Math.max(15, py - 6));
    }
    if (minErrIdx >= 0 && Math.abs(minErr) > 0.05 && minErrIdx !== maxErrIdx) {
        const px = minErrIdx * step;
        const py = mapYErr(minErr);
        largeGraphCtx.fillStyle = '#ef4444';
        largeGraphCtx.beginPath();
        largeGraphCtx.arc(px, py, 4.5, 0, Math.PI * 2);
        largeGraphCtx.fill();
        largeGraphCtx.font = 'bold 9px Fira Code';
        largeGraphCtx.fillText(`▼ ${minErr.toFixed(2)}`, Math.min(w - 45, px + 6), Math.min(h - 8, py + 12));
    }

    // INSPECTOR DE MOUSE HOVER (TOOLTIP EM TEMPO REAL AO PASSAR O MOUSE SOBRE A ONDA)
    if (simState.graphHoverX !== null && simState.graphHoverX >= 0 && simState.graphHoverX <= w) {
        const hoverX = simState.graphHoverX;
        
        largeGraphCtx.strokeStyle = 'rgba(234, 179, 8, 0.85)';
        largeGraphCtx.lineWidth = 1.5;
        largeGraphCtx.setLineDash([4, 4]);
        largeGraphCtx.beginPath();
        largeGraphCtx.moveTo(hoverX, 0);
        largeGraphCtx.lineTo(hoverX, h);
        largeGraphCtx.stroke();
        largeGraphCtx.setLineDash([]);

        const sampleRatio = hoverX / w;
        const hoverIdx = Math.min(startIndex + Math.floor(sampleRatio * count), totalLen - 1);

        if (hoverIdx >= 0 && simState.graphErrorHistory[hoverIdx] !== undefined) {
            const errVal = simState.graphErrorHistory[hoverIdx];
            const turnVal = simState.graphTurnHistory[hoverIdx];
            const pVal = (simState.graphPHistory && simState.graphPHistory[hoverIdx] !== undefined) ? simState.graphPHistory[hoverIdx] : (simState.kp * errVal);
            const iVal = (simState.graphIHistory && simState.graphIHistory[hoverIdx] !== undefined) ? simState.graphIHistory[hoverIdx] : 0;
            const dVal = (simState.graphDHistory && simState.graphDHistory[hoverIdx] !== undefined) ? simState.graphDHistory[hoverIdx] : 0;
            const spdVal = (simState.graphSpeedHistory && simState.graphSpeedHistory[hoverIdx] !== undefined) ? simState.graphSpeedHistory[hoverIdx] : simState.realSpeed;

            // Highlight dots on the curves at hover position
            const dotYErr = mapYErr(errVal);
            const dotYTurn = mapYTurn(turnVal);

            largeGraphCtx.fillStyle = '#ef4444';
            largeGraphCtx.beginPath();
            largeGraphCtx.arc(hoverX, dotYErr, 5, 0, Math.PI * 2);
            largeGraphCtx.fill();

            largeGraphCtx.fillStyle = '#06b6d4';
            largeGraphCtx.beginPath();
            largeGraphCtx.arc(hoverX, dotYTurn, 5, 0, Math.PI * 2);
            largeGraphCtx.fill();

            const tt = document.getElementById('graph-tooltip');
            if (tt) {
                tt.style.display = 'block';
                let tipX = hoverX + 15;
                if (tipX + 220 > w) {
                    tipX = hoverX - 235;
                }
                tipX = Math.max(10, Math.min(w - 230, tipX));
                let tipY = Math.max(10, Math.min(h - 150, (simState.graphHoverY || 40) - 40));
                tt.style.left = `${tipX}px`;
                tt.style.top = `${tipY}px`;
                tt.innerHTML = `
                    <div style="font-weight:700; color:var(--color-yellow); border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:0.25rem; margin-bottom:0.35rem;">
                        🎯 Ponto na Onda (Amostra #${hoverIdx})
                    </div>
                    <div>🔴 Erro: <strong style="color:#ef4444;">${errVal >= 0 ? '+' : ''}${errVal.toFixed(3)}</strong></div>
                    <div>🔷 Turn (Correção): <strong style="color:#06b6d4;">${turnVal >= 0 ? '+' : ''}${turnVal.toFixed(2)}</strong></div>
                    <div style="font-size:0.73rem; color:#94a3b8; margin-top:0.25rem; background:rgba(0,0,0,0.3); padding:0.2rem 0.4rem; border-radius:4px;">
                        P: <strong>${(pVal >= 0 ? '+' : '') + pVal.toFixed(2)}</strong> | I: <strong>${(iVal >= 0 ? '+' : '') + iVal.toFixed(3)}</strong> | D: <strong>${(dVal >= 0 ? '+' : '') + dVal.toFixed(2)}</strong>
                    </div>
                    <div style="font-size:0.78rem; color:var(--color-yellow); margin-top:0.3rem;">
                        🏎️ Velocidade: <strong>${spdVal.toFixed(1)} cm/s</strong>
                    </div>
                `;
            }
        }
    }
}

// 10. DIAGNÓSTICO E MENTOR DIDÁTICO AUTOMÁTICO (COM LOG HISTÓRICO NO MODAL)
function checkEducationalDiagnostics() {
    const titleEl = document.getElementById('diag-title');
    const textEl = document.getElementById('diag-text');
    const iconEl = document.getElementById('diag-icon');
    if (!titleEl || !textEl || !iconEl) return;

    const now = performance.now();
    let target = null;

    if (simState.isOffTrack) {
        target = {
            id: 'offtrack',
            icon: '🚨',
            title: `Saída de Pista! (Infração ${simState.infractions}/5)`,
            color: 'var(--color-red)',
            text: 'O robô ficou fora da fita por mais de 0,4s. Clique no botão "📍 Checkpoint" para reposicionar na fita.'
        };
    } else if (simState.isSamplingBlindSpot) {
        target = {
            id: 'blindspot',
            icon: '⚡',
            title: 'Falha de Amostragem (Ponto Cego 60Hz)',
            color: 'var(--color-yellow)',
            text: `O robô passou pela curva a ${simState.realSpeed} cm/s, mais rápido do que a taxa do sensor (60Hz / 16.6ms)!`
        };
    } else if (Math.abs(simState.derivative) > 1.5 && simState.kd < 1.0) {
        target = {
            id: 'oscillation',
            icon: '〰️',
            title: 'Oscilação Detectada!',
            color: 'var(--color-yellow)',
            text: 'O robô está sacudindo nas curvas. Aumente o Ganho Derivativo (Kd) para amortecer a variação brusca do erro.'
        };
    } else {
        target = {
            id: 'stable',
            icon: '🎯',
            title: 'Desempenho Estável',
            color: 'var(--color-purple)',
            text: 'Os parâmetros estão equilibrados! Observe o rastro fino (1.5px) e a Lupa 4x no canto da pista.'
        };
    }

    if (target) {
        const isEmergency = target.id === 'offtrack';
        const isDifferent = simState.diagLastMsgId !== target.id;
        const isTimeElapsed = (now - simState.diagLastSwitchTime > 2500);

        if (isEmergency || (isDifferent && (isTimeElapsed || simState.diagLastMsgId === ''))) {
            simState.diagLastMsgId = target.id;
            simState.diagLastSwitchTime = now;
            iconEl.textContent = target.icon;
            titleEl.textContent = target.title;
            titleEl.style.color = target.color;
            textEl.textContent = target.text;

            // Registra no Histórico do Log do Mentor
            const timeStr = formatMsToTime(simState.currentLapMs);
            simState.mentorLogHistory.unshift({
                time: timeStr,
                icon: target.icon,
                text: target.title + ' - ' + target.text,
                type: target.id
            });
            if (simState.mentorLogHistory.length > 30) simState.mentorLogHistory.pop();
            renderMentorLogUI();
        }
    }
}

function renderMentorLogUI() {
    const listEl = document.getElementById('mentor-log-list');
    if (!listEl) return;

    if (simState.mentorLogHistory.length === 0) {
        listEl.innerHTML = `
            <div class="log-item default">
                <span class="log-time">00:00.00</span>
                <span class="log-icon">🤖</span>
                <span class="log-text">Simulação iniciada no Modo Garagem.</span>
            </div>`;
        return;
    }

    listEl.innerHTML = simState.mentorLogHistory.map(item => `
        <div class="log-item ${item.type}">
            <span class="log-time">${item.time}</span>
            <span class="log-icon">${item.icon}</span>
            <span class="log-text">${item.text}</span>
        </div>
    `).join('');
}

// 11. CONTROLE DO MODAL DE TELEMETRIA
function openTelemetryModal() {
    const modal = document.getElementById('telemetry-modal');
    modal.style.display = 'flex';
    requestAnimationFrame(() => {
        resizeLargeGraphCanvas();
        drawLargeGraph();
    });
}

function closeTelemetryModal() {
    document.getElementById('telemetry-modal').style.display = 'none';
}

function toggleGraphPause() {
    simState.isGraphPaused = !simState.isGraphPaused;
    const btn = document.getElementById('btn-pause-graph');
    if (btn) {
        btn.innerHTML = simState.isGraphPaused ? `<span>▶</span> Retomar Onda` : `<span>⏸️</span> Pausar Onda`;
    }
}

// 12. PRESETS DIDÁTICOS RÁPIDOS
function applyPreset(name) {
    if (name === 'stable') {
        setPresetValues(50, 2.20, 0.002, 4.5, 10.0, 2.2);
    } else if (name === 'speed') {
        setPresetValues(70, 2.80, 0.004, 6.0, 12.0, 2.2);
    } else if (name === 'oscillating') {
        setPresetValues(60, 3.80, 0.000, 0.0, 10.0, 2.2);
    } else if (name === 'longAxle') {
        setPresetValues(50, 1.40, 0.002, 6.5, 20.0, 2.2);
    }
    resetSimulation();
}

function setPresetValues(baseSpd, kp, ki, kd, dist, gap) {
    setSyncInputValue('base-speed-input', 'num-base-speed', 'baseSpeed', baseSpd, 'race-base-speed-input', 'race-num-base-speed');
    setSyncInputValue('kp-input', 'num-kp', 'kp', kp, 'race-kp-input', 'race-num-kp');
    setSyncInputValue('ki-input', 'num-ki', 'ki', ki, 'race-ki-input', 'race-num-ki');
    setSyncInputValue('kd-input', 'num-kd', 'kd', kd, 'race-kd-input', 'race-num-kd');
    setSyncInputValue('sensor-dist-input', 'num-sensor-dist', 'sensorDist', dist);
    setSyncInputValue('sensor-gap-input', 'num-sensor-gap', 'sensorGap', gap);
    renderLegoCodeDisplay();
}

function setSyncInputValue(rangeId, numId, stateKey, value, mirrorRangeId, mirrorNumId) {
    simState[stateKey] = value;
    const rEl = document.getElementById(rangeId);
    const nEl = document.getElementById(numId);
    if (rEl) rEl.value = value;
    if (nEl) nEl.value = value;
    syncMirrorInput(mirrorRangeId, mirrorNumId, value.toString());
}

function formatMsToTime(ms) {
    const totalSec = ms / 1000;
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}
