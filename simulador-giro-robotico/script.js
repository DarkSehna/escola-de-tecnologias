// ==========================================================================
// CORE ROBOT GIRO SIMULATOR - DIFF-DRIVE KINEMATICS
// Escola de Tecnologias - TitanTech
// ==========================================================================

// --- PARÂMETROS E CONFIGURAÇÕES FÍSICAS ---
const SCALE_MM_TO_PX = 1.5;
const TREAD_SLIP_ROTATION = 0.70;    // Perda de 30% na eficiência rotacional
const TREAD_SLIP_TRANSLATION = 0.90; // Perda de 10% na translação

// Presets de Motores (RPM Máximos)
const MOTOR_PRESETS = {
    "LEGO EV3 (160 RPM)": 160.0,
    "LEGO NXT (170 RPM)": 170.0
};

// Presets de Rodas (Diâmetro em mm)
const WHEEL_PRESETS = {
    "Padrão (56mm)": 56.0,
    "Pequena (43.2mm)": 43.2,
    "Moto (94.2mm)": 94.2,
    "Esteira (Aplica atrito)": 56.0
};

// Paleta de Cores do Canvas
const COLOR_BG = "#0c0f16";
const COLOR_GRID_MAJOR = "#1a2233";
const COLOR_GRID_MINOR = "#121824";
const COLOR_AXIS = "rgba(34, 42, 61, 0.55)";
const COLOR_ROBOT_BODY = "#2d3548";
const COLOR_ROBOT_WHEEL = "#ffdd00";
const COLOR_ROBOT_TREAD = "#424b5e";
const COLOR_NEON_GREEN = "#39ff14";
const COLOR_NEON_CYAN = "#00f0ff";
const COLOR_NEON_ORANGE = "#ff8800";

// --- ESTADO INICIAL ---
let robot = {
    x: 0.0,      // em mm
    y: 0.0,      // em mm
    theta: 0.0   // em radianos (0 aponta para cima, rotação horária positiva)
};

// Histórico de Rastros
// Cada rastro = { centerPoints: [{x,y}], leftPoints: [{x,y}], rightPoints: [{x,y}], wheelType: "" }
let allTraces = [];
let currentTrace = null;

// Visualização ativa
let activePanX = 0;
let activePanY = 0;
let zoomScale = 1.0;

let isPanning = false;
let startPanX = 0;
let startPanY = 0;

// Estado da Animação
let isSimulating = false;
let simStartTime = 0;
let simDuration = 0;

// Parâmetros da Cinemática Diferencial em execução
let simStartX = 0.0;
let simStartY = 0.0;
let simStartTheta = 0.0;
let simPowerL = 0.0;
let simPowerR = 0.0;
let simMaxRPM = 160.0;
let simWheelDia = 56.0;
let simChassisWidth = 120.0;
let simIsTread = false;

// Elementos DOM
const canvas = document.getElementById("sim-canvas");
const ctx = canvas.getContext("2d");
const viewport = document.getElementById("canvas-viewport");

const comboMotor = document.getElementById("combo-motor");
const comboWheels = document.getElementById("combo-wheels");
const inputWheelDiameter = document.getElementById("input-wheel-diameter");
const inputChassisWidth = document.getElementById("input-chassis-width");
const comboTrace = document.getElementById("combo-trace");

const sliderPowerL = document.getElementById("slider-power-l");
const inputPowerL = document.getElementById("input-power-l");
const valPowerL = document.getElementById("val-power-l");

const sliderPowerR = document.getElementById("slider-power-r");
const inputPowerR = document.getElementById("input-power-r");
const valPowerR = document.getElementById("val-power-r");

const comboExecMode = document.getElementById("combo-exec-mode");
const inputExecValue = document.getElementById("input-exec-value");
const btnExecute = document.getElementById("btn-execute");

const btnClearTrace = document.getElementById("btn-clear-trace");
const btnResetPos = document.getElementById("btn-reset-pos");

const hudMotorDeg = document.querySelector("#hud-motor-deg .hud-value");
const hudChassisDeg = document.querySelector("#hud-chassis-deg .hud-value");

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Configura tamanho inicial do Canvas
    resizeCanvas();
    window.addEventListener("resize", () => {
        resizeCanvas();
        drawAll();
    });

    // 2. Eventos de Panning e Zoom
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    // Evita menu de contexto ao usar clique do meio/direito no canvas
    canvas.addEventListener("contextmenu", e => e.preventDefault());

    // 3. Ouvintes de Mudança de Parâmetros Físicos e Presets
    comboMotor.addEventListener("change", handleMotorPresetChange);
    comboWheels.addEventListener("change", handleWheelPresetChange);
    inputWheelDiameter.addEventListener("input", savePhysicalParams);
    inputChassisWidth.addEventListener("input", savePhysicalParams);
    comboTrace.addEventListener("change", () => {
        savePhysicalParams();
        drawAll();
    });

    // 4. Ouvintes de Sincronização dos Sliders de Potência
    syncSliderAndInput(sliderPowerL, inputPowerL, valPowerL, "L");
    syncSliderAndInput(sliderPowerR, inputPowerR, valPowerR, "R");

    // 5. Botões de Ação
    btnExecute.addEventListener("click", startSimulation);
    btnClearTrace.addEventListener("click", clearTracePath);
    btnResetPos.addEventListener("click", resetRobotPosition);

    // 6. Carrega configurações do localStorage se existirem
    loadSettingsFromStorage();

    // Centraliza a câmera no robô (0, 0)
    centerCameraOnOrigin();

    // Primeiro desenho completo
    drawAll();
});

// --- CONTROLE DE MUDANÇA DE PARÂMETROS E PERSISTÊNCIA ---
function loadSettingsFromStorage() {
    const saved = localStorage.getItem("titan_tech_giro_settings");
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.motor) comboMotor.value = data.motor;
            if (data.wheels) comboWheels.value = data.wheels;
            if (data.wheelDia) inputWheelDiameter.value = data.wheelDia;
            if (data.chassisWidth) inputChassisWidth.value = data.chassisWidth;
            if (data.traceMode) comboTrace.value = data.traceMode;
            if (data.powerL) {
                sliderPowerL.value = data.powerL;
                inputPowerL.value = data.powerL;
                valPowerL.textContent = `${data.powerL}%`;
            }
            if (data.powerR) {
                sliderPowerR.value = data.powerR;
                inputPowerR.value = data.powerR;
                valPowerR.textContent = `${data.powerR}%`;
            }
            if (data.execMode) comboExecMode.value = data.execMode;
            if (data.execVal) inputExecValue.value = data.execVal;
        } catch (e) {
            console.error("Falha ao ler cache de configurações", e);
        }
    }
}

function savePhysicalParams() {
    const settings = {
        motor: comboMotor.value,
        wheels: comboWheels.value,
        wheelDia: parseFloat(inputWheelDiameter.value),
        chassisWidth: parseFloat(inputChassisWidth.value),
        traceMode: comboTrace.value,
        powerL: parseInt(sliderPowerL.value),
        powerR: parseInt(sliderPowerR.value),
        execMode: comboExecMode.value,
        execVal: parseFloat(inputExecValue.value)
    };
    localStorage.setItem("titan_tech_giro_settings", JSON.stringify(settings));
}

function handleMotorPresetChange() {
    savePhysicalParams();
}

function handleWheelPresetChange() {
    const model = comboWheels.value;
    if (model in WHEEL_PRESETS) {
        inputWheelDiameter.value = WHEEL_PRESETS[model].toFixed(1);
    }
    savePhysicalParams();
    drawAll();
}

function syncSliderAndInput(slider, input, displayVal, side) {
    const update = (val) => {
        slider.value = val;
        input.value = val;
        displayVal.textContent = `${val}%`;
        
        // Atualiza a cor de destaque no slider
        const color = side === "L" ? "var(--color-neon-orange)" : "var(--color-neon-cyan)";
        const percentage = ((parseInt(val) + 100) / 200) * 100;
        slider.style.background = `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #0d111c ${percentage}%, #0d111c 100%)`;
        
        savePhysicalParams();
    };

    slider.addEventListener("input", (e) => update(e.target.value));
    input.addEventListener("input", (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        val = Math.max(-100, Math.min(100, val));
        update(val);
    });

    // Inicia com valor padrão
    update(slider.value);
}

// --- REDIMENSIONAR CANVAS ---
function resizeCanvas() {
    canvas.width = viewport.clientWidth;
    canvas.height = viewport.clientHeight;
}

function centerCameraOnOrigin() {
    activePanX = canvas.width / 2;
    activePanY = canvas.height / 2;
    zoomScale = 1.0;
    updateTransform();
}

function updateTransform() {
    // Não usamos transforms do CSS no canvas diretamente para manter o desenho procedural nítido
}

// --- PAN E ZOOM DO CANVAS (CAMERA) ---
function onPointerDown(e) {
    const isMiddleClick = (e.button === 1);
    const isRightClick = (e.button === 2);
    const isSpaceDrag = (e.button === 0 && e.shiftKey); // Shift + Click esquerdo serve como alternativo

    if (isMiddleClick || isRightClick || isSpaceDrag) {
        isPanning = true;
        startPanX = e.clientX - activePanX;
        startPanY = e.clientY - activePanY;
        canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
    }
}

function onPointerMove(e) {
    if (isPanning) {
        activePanX = e.clientX - startPanX;
        activePanY = e.clientY - startPanY;
        drawAll();
    }
}

function onPointerUp(e) {
    if (isPanning) {
        isPanning = false;
        canvas.releasePointerCapture(e.pointerId);
    }
}

function onWheel(e) {
    e.preventDefault();

    const zoomIntensity = 0.06;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const prevZoom = zoomScale;
    if (e.deltaY < 0) {
        zoomScale = Math.min(4.0, zoomScale + zoomIntensity);
    } else {
        zoomScale = Math.max(0.25, zoomScale - zoomIntensity);
    }

    // Zoom centrado na posição do cursor do mouse
    const sceneMouseX = (mouseX - activePanX) / prevZoom;
    const sceneMouseY = (mouseY - activePanY) / prevZoom;

    activePanX = mouseX - sceneMouseX * zoomScale;
    activePanY = mouseY - sceneMouseY * zoomScale;

    drawAll();
}

// --- LÓGICA CINEMÁTICA E LOOP DE SIMULAÇÃO ---
function startSimulation() {
    if (isSimulating) return;

    // Coleta dados físicos e de programação
    simPowerL = parseFloat(inputPowerL.value);
    simPowerR = parseFloat(inputPowerR.value);
    simWheelDia = parseFloat(inputWheelDiameter.value);
    simChassisWidth = parseFloat(inputChassisWidth.value);
    
    const motorPreset = comboMotor.value;
    simMaxRPM = MOTOR_PRESETS[motorPreset] || 160.0;

    const wheelPreset = comboWheels.value;
    simIsTread = (wheelPreset === "Esteira (Aplica atrito)");

    const mode = comboExecMode.value;
    const value = parseFloat(inputExecValue.value);

    // Salva configurações
    savePhysicalParams();

    // 1. Calcula o tempo total necessário da execução física
    const duration = calculateExecutionTime(simPowerL, simPowerR, simMaxRPM, mode, value);
    if (duration <= 0) {
        showToast("Simulação cancelada: Força de motor ou valor alvo inválidos.");
        return;
    }

    simDuration = duration;
    simStartX = robot.x;
    simStartY = robot.y;
    simStartTheta = robot.theta;

    // 2. Prepara novo rastro no histórico
    currentTrace = {
        centerPoints: [],
        leftPoints: [],
        rightPoints: [],
        wheelType: wheelPreset
    };
    allTraces.push(currentTrace);

    // 3. Trava controles da tela
    isSimulating = true;
    btnExecute.disabled = true;
    btnExecute.textContent = "SIMULANDO...";
    
    // Configura tempo inicial
    simStartTime = performance.now();
    
    // Inicia loop de animação
    requestAnimationFrame(simulationStep);
}

function simulationStep(now) {
    if (!isSimulating) return;

    let elapsed = (now - simStartTime) / 1000.0; // em segundos
    elapsed = Math.min(elapsed, simDuration);

    // Velocidade linear máxima teórica de cada roda (mm/s)
    const v_max = (simMaxRPM / 60.0) * Math.PI * simWheelDia;
    
    // Velocidade linear configurada de cada roda (mm/s)
    const v_l = v_max * (simPowerL / 100.0);
    const v_r = v_max * (simPowerR / 100.0);

    let v_c = 0.0;
    let omega = 0.0;

    if (simIsTread) {
        v_c = TREAD_SLIP_TRANSLATION * (v_r + v_l) / 2.0;
        omega = TREAD_SLIP_ROTATION * (v_r - v_l) / simChassisWidth;
    } else {
        v_c = (v_r + v_l) / 2.0;
        omega = (v_r - v_l) / simChassisWidth;
    }

    // 1. Integração Numérica (Differential Drive) a partir da pose inicial do Giro
    const steps = 150;
    const dt = elapsed / steps;
    
    let cx = simStartX;
    let cy = simStartY;
    let ctheta = simStartTheta;

    for (let i = 0; i < steps; i++) {
        // dx, dy com y invertido na tela (para cima é -y)
        const dx = v_c * Math.sin(ctheta) * dt;
        const dy = -v_c * Math.cos(ctheta) * dt;
        const dtheta = omega * dt;
        
        cx += dx;
        cy += dy;
        ctheta += dtheta;
    }

    // 2. Atualiza pose do robô
    robot.x = cx;
    robot.y = cy;
    robot.theta = ctheta;

    // 3. Adiciona pontos ao rastro ativo atual
    if (currentTrace) {
        currentTrace.centerPoints.push({ x: cx, y: cy });

        // Calcula posições das rodas esquerda/direita para rastro lateral
        const halfW = simChassisWidth / 2.0;
        
        const wl_x = cx - halfW * Math.cos(ctheta);
        const wl_y = cy - halfW * Math.sin(ctheta);
        
        const wr_x = cx + halfW * Math.cos(ctheta);
        const wr_y = cy + halfW * Math.sin(ctheta);

        currentTrace.leftPoints.push({ x: wl_x, y: wl_y });
        currentTrace.rightPoints.push({ x: wr_x, y: wr_y });
    }

    // 4. Calcula telemetria acumulada para o HUD
    // Velocidade angular máxima em graus por segundo de cada motor: RPM * 6
    const deg_l = simMaxRPM * (simPowerL / 100.0) * 6.0 * elapsed;
    const deg_r = simMaxRPM * (simPowerR / 100.0) * 6.0 * elapsed;
    
    // Média absoluta dos graus do motor
    const motor_deg_avg = (Math.abs(deg_l) + Math.abs(deg_r)) / 2.0;

    // Distâncias lineares reais percorridas por cada roda (mm)
    const dist_l = Math.PI * simWheelDia * (deg_l / 360.0);
    const dist_r = Math.PI * simWheelDia * (deg_r / 360.0);

    // Ângulo acumulado de rotação do chassi em graus
    let chassis_angle_rad = (dist_r - dist_l) / simChassisWidth;
    if (simIsTread) {
        chassis_angle_rad *= TREAD_SLIP_ROTATION;
    }
    const chassis_angle_deg = chassis_angle_rad * (180.0 / Math.PI);

    // Atualiza HUD displays
    hudMotorDeg.textContent = Math.abs(motor_deg_avg).toFixed(1);
    hudChassisDeg.textContent = chassis_angle_deg.toFixed(1);

    // 5. Redesenha a tela
    drawAll();

    if (elapsed >= simDuration) {
        // Fim da simulação
        isSimulating = false;
        btnExecute.disabled = false;
        btnExecute.textContent = "▶️ EXECUTAR GIRO";
        showToast("Giro simulado com sucesso!");
    } else {
        requestAnimationFrame(simulationStep);
    }
}

// --- CÁLCULO FÍSICO DE TEMPO DE EXECUÇÃO ---
function calculateExecutionTime(powerL, powerR, maxRPM, mode, value) {
    if (mode === "Segundos") {
        return value;
    }

    // Alvo em graus de rotação do motor
    const targetDegrees = (mode === "Graus") ? value : value * 360.0;

    // O motor de referência é o que possui maior potência absoluta
    const p_max = Math.max(Math.abs(powerL), Math.abs(powerR));
    if (p_max === 0) {
        return 0.0;
    }

    // Velocidade angular atual do motor de referência em graus/segundo
    const rpm_atual = maxRPM * (p_max / 100.0);
    const omega_deg_s = rpm_atual * 6.0;

    if (omega_deg_s === 0) {
        return 0.0;
    }

    return targetDegrees / omega_deg_s;
}

// --- LIMPAR RASTROS E RESETAR POSIÇÃO ---
function clearTracePath() {
    allTraces = [];
    currentTrace = null;
    drawAll();
    showToast("Trajeto excluído do mapa.");
}

function resetRobotPosition() {
    robot.x = 0.0;
    robot.y = 0.0;
    robot.theta = 0.0;

    hudMotorDeg.textContent = "0000.0";
    hudChassisDeg.textContent = "0000.0";

    centerCameraOnOrigin();
    drawAll();
    showToast("Posição resetada na origem.");
}

// --- DESENHO GRÁFICO (HTML5 CANVAS RENDERER) ---
function drawAll() {
    // 1. Limpa tela geral
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Aplica translação (pan) e escala (zoom)
    ctx.translate(activePanX, activePanY);
    ctx.scale(zoomScale, zoomScale);

    // 2. Desenhar Grade CAD Blueprint
    drawGrid();

    // 3. Desenhar Eixos Cartesianos da Origem
    drawOriginAxes();

    // 4. Desenhar Rastro dos Caminhos
    drawTraces();

    // 5. Desenhar o Robô Procedural
    drawRobot();

    ctx.restore();
}

function drawGrid() {
    const minorSpacing = 10.0 * SCALE_MM_TO_PX;
    const majorSpacing = 50.0 * SCALE_MM_TO_PX;

    // Calcula os limites visíveis do Canvas em coordenadas do cenário (world coordinates)
    const leftScene = -activePanX / zoomScale;
    const rightScene = (canvas.width - activePanX) / zoomScale;
    const topScene = -activePanY / zoomScale;
    const bottomScene = (canvas.height - activePanY) / zoomScale;

    // Arredonda limites para alinhar com o espaçamento da grade
    const startX = Math.floor(leftScene / minorSpacing) * minorSpacing;
    const endX = Math.ceil(rightScene / minorSpacing) * minorSpacing;
    const startY = Math.floor(topScene / minorSpacing) * minorSpacing;
    const endY = Math.ceil(bottomScene / minorSpacing) * minorSpacing;

    // A. Desenhar grade secundária (linhas finas a cada 10mm)
    ctx.strokeStyle = COLOR_GRID_MINOR;
    ctx.lineWidth = 0.5 / zoomScale; // Mantém a linha nítida independente do zoom
    ctx.beginPath();

    for (let x = startX; x <= endX; x += minorSpacing) {
        // Pula se for linha principal para evitar sobreposição
        if (Math.abs(x) % majorSpacing < 0.1) continue;
        ctx.moveTo(x, topScene);
        ctx.lineTo(x, bottomScene);
    }
    for (let y = startY; y <= endY; y += minorSpacing) {
        if (Math.abs(y) % majorSpacing < 0.1) continue;
        ctx.moveTo(leftScene, y);
        ctx.lineTo(rightScene, y);
    }
    ctx.stroke();

    // B. Desenhar grade principal (linhas mais grossas a cada 50mm)
    ctx.strokeStyle = COLOR_GRID_MAJOR;
    ctx.lineWidth = 1.0 / zoomScale;
    ctx.beginPath();

    for (let x = startX; x <= endX; x += minorSpacing) {
        if (Math.abs(x) % majorSpacing < 0.1) {
            ctx.moveTo(x, topScene);
            ctx.lineTo(x, bottomScene);
        }
    }
    for (let y = startY; y <= endY; y += minorSpacing) {
        if (Math.abs(y) % majorSpacing < 0.1) {
            ctx.moveTo(leftScene, y);
            ctx.lineTo(rightScene, y);
        }
    }
    ctx.stroke();
}

function drawOriginAxes() {
    const leftScene = -activePanX / zoomScale;
    const rightScene = (canvas.width - activePanX) / zoomScale;
    const topScene = -activePanY / zoomScale;
    const bottomScene = (canvas.height - activePanY) / zoomScale;

    ctx.strokeStyle = COLOR_AXIS;
    ctx.lineWidth = 1.5 / zoomScale;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    
    // Eixo Y
    ctx.moveTo(0, topScene);
    ctx.lineTo(0, bottomScene);
    
    // Eixo X
    ctx.moveTo(leftScene, 0);
    ctx.lineTo(rightScene, 0);
    
    ctx.stroke();
    ctx.setLineDash([]); // Limpa dash
}

function drawTraces() {
    const mode = comboTrace.value;
    if (mode === "Ocultar") return;

    allTraces.forEach(trace => {
        // Cores padrão baseadas no tipo de roda
        let colorCenter = COLOR_NEON_GREEN;
        let colorLeft = COLOR_NEON_ORANGE;
        let colorRight = COLOR_NEON_CYAN;

        if (trace.wheelType.includes("Pequena")) {
            colorCenter = "#ff007f"; // Rosa neon
            colorLeft = "#ffa07a";   // Salmon
            colorRight = "#87cefa";  // Sky blue
        } else if (trace.wheelType.includes("Moto")) {
            colorCenter = "#ffff00"; // Amarelo
            colorLeft = "#ff7f50";   // Coral
            colorRight = "#40e0d0";  // Turquesa
        } else if (trace.wheelType.includes("Esteira")) {
            colorCenter = "#b57cff"; // Roxo
            colorLeft = "#ff4500";   // Laranja-avermelhado
            colorRight = "#1e90ff";  // Dodger blue
        }

        ctx.lineWidth = 2.0 / zoomScale;
        ctx.setLineDash([3, 4]);

        // A. Rastro do Centro (Verde/Rosa/Amarelo/Roxo)
        if ((mode === "Completo" || mode === "Centro") && trace.centerPoints.length > 1) {
            ctx.strokeStyle = colorCenter;
            ctx.beginPath();
            ctx.moveTo(trace.centerPoints[0].x * SCALE_MM_TO_PX, trace.centerPoints[0].y * SCALE_MM_TO_PX);
            for (let i = 1; i < trace.centerPoints.length; i++) {
                ctx.lineTo(trace.centerPoints[i].x * SCALE_MM_TO_PX, trace.centerPoints[i].y * SCALE_MM_TO_PX);
            }
            ctx.stroke();
        }

        // B. Rastro das Rodas
        if (mode === "Completo" || mode === "Rodas") {
            // Roda Esquerda
            if (trace.leftPoints.length > 1) {
                ctx.strokeStyle = colorLeft;
                ctx.beginPath();
                ctx.moveTo(trace.leftPoints[0].x * SCALE_MM_TO_PX, trace.leftPoints[0].y * SCALE_MM_TO_PX);
                for (let i = 1; i < trace.leftPoints.length; i++) {
                    ctx.lineTo(trace.leftPoints[i].x * SCALE_MM_TO_PX, trace.leftPoints[i].y * SCALE_MM_TO_PX);
                }
                ctx.stroke();
            }

            // Roda Direita
            if (trace.rightPoints.length > 1) {
                ctx.strokeStyle = colorRight;
                ctx.beginPath();
                ctx.moveTo(trace.rightPoints[0].x * SCALE_MM_TO_PX, trace.rightPoints[0].y * SCALE_MM_TO_PX);
                for (let i = 1; i < trace.rightPoints.length; i++) {
                    ctx.lineTo(trace.rightPoints[i].x * SCALE_MM_TO_PX, trace.rightPoints[i].y * SCALE_MM_TO_PX);
                }
                ctx.stroke();
            }
        }
    });

    ctx.setLineDash([]); // Reset
}

function drawRobot() {
    const wheelDia = parseFloat(inputWheelDiameter.value);
    const chassisWidth = parseFloat(inputChassisWidth.value);
    const wheelPreset = comboWheels.value;
    const isTread = (wheelPreset === "Esteira (Aplica atrito)");

    // Converter mm para pixels
    const w_px = chassisWidth * SCALE_MM_TO_PX;
    const d_px = wheelDia * SCALE_MM_TO_PX;
    const wheel_w_px = 15.0 * SCALE_MM_TO_PX; // Largura do pneu
    
    const brick_w_px = 50.0 * SCALE_MM_TO_PX;
    const brick_h_px = 75.0 * SCALE_MM_TO_PX;

    ctx.save();
    // Posiciona e rotaciona na pose do robô no Canvas
    ctx.translate(robot.x * SCALE_MM_TO_PX, robot.y * SCALE_MM_TO_PX);
    ctx.rotate(robot.theta);

    // 1. Desenhar o Eixo Principal (Axle Metálico)
    ctx.strokeStyle = "#7a8a9e";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(-w_px / 2.0, 0);
    ctx.lineTo(w_px / 2.0, 0);
    ctx.stroke();

    // 2. Corpo do Robô (Bloco EV3)
    ctx.fillStyle = COLOR_ROBOT_BODY;
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 2;
    drawRoundRect(ctx, -brick_w_px / 2.0, -brick_h_px / 2.0, brick_w_px, brick_h_px, 6);
    ctx.fill();
    ctx.stroke();

    // Tela LCD
    const screen_w = brick_w_px - 14;
    const screen_h = brick_h_px / 3.0;
    ctx.fillStyle = "#0d121c";
    ctx.strokeStyle = "#3b4860";
    ctx.lineWidth = 1;
    ctx.fillRect(-screen_w / 2.0, -brick_h_px / 2.0 + 7, screen_w, screen_h);
    ctx.strokeRect(-screen_w / 2.0, -brick_h_px / 2.0 + 7, screen_w, screen_h);

    // Texto LCD
    ctx.fillStyle = COLOR_NEON_CYAN;
    ctx.font = `bold ${5.5 * SCALE_MM_TO_PX}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Titan-Mind", 0, -brick_h_px / 2.0 + 7 + screen_h / 2.0);

    // Botões de comando redondos do EV3
    const btn_y = brick_h_px / 4.0;
    ctx.fillStyle = "#4e5970";
    ctx.strokeStyle = "#222a3d";
    // Botão central
    ctx.beginPath();
    ctx.arc(0, btn_y, 4.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    // Direcionais esquerda/direita
    ctx.beginPath();
    ctx.arc(-11, btn_y, 2.5, 0, 2 * Math.PI);
    ctx.arc(11, btn_y, 2.5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Roda de Apoio (Castor Wheel) traseira
    ctx.fillStyle = COLOR_ROBOT_WHEEL;
    ctx.strokeStyle = "#222a3d";
    ctx.beginPath();
    ctx.arc(0, brick_h_px / 2.0 - 10, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // 3. Desenhar Rodas Laterais
    const drawSideWheel = (x_center) => {
        const rx = x_center - wheel_w_px / 2.0;
        const ry = -d_px / 2.0;

        if (isTread) {
            // Esteira (Tread)
            ctx.fillStyle = COLOR_ROBOT_TREAD;
            ctx.strokeStyle = "#222a3d";
            ctx.lineWidth = 1.5;
            drawRoundRect(ctx, rx, ry, wheel_w_px, d_px, 5);
            ctx.fill();
            ctx.stroke();

            // Ranhuras da esteira
            ctx.strokeStyle = "#1b2230";
            ctx.lineWidth = 1.5;
            const y_start = Math.floor(ry);
            const y_end = Math.ceil(ry + d_px);
            ctx.beginPath();
            for (let ty = y_start + 5; ty < y_end - 3; ty += 6) {
                ctx.moveTo(rx + 2, ty);
                ctx.lineTo(rx + wheel_w_px - 2, ty);
            }
            ctx.stroke();
        } else {
            // Roda Pneumática LEGO Padrão (Tire)
            ctx.fillStyle = "#161a24"; // Borracha preta
            ctx.strokeStyle = "#080a0f";
            ctx.lineWidth = 1.8;
            drawRoundRect(ctx, rx, ry, wheel_w_px, d_px, 4);
            ctx.fill();
            ctx.stroke();

            // Calota de plástico amarela (Rim)
            const rim_w = wheel_w_px - 6;
            const rim_h = d_px - 14;
            if (rim_h > 2) {
                ctx.fillStyle = COLOR_ROBOT_WHEEL;
                ctx.strokeStyle = "#b59c00";
                ctx.lineWidth = 1;
                drawRoundRect(ctx, x_center - rim_w / 2.0, -rim_h / 2.0, rim_w, rim_h, 2);
                ctx.fill();
                ctx.stroke();
            }
        }
    };

    drawSideWheel(-w_px / 2.0); // Esquerda
    drawSideWheel(w_px / 2.0);  // Direita

    // 4. Seta indicando direção frontal (-y)
    ctx.strokeStyle = COLOR_NEON_GREEN;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, -brick_h_px / 2.0 + 5);
    ctx.lineTo(0, -brick_h_px / 2.0 - 15);
    
    // Ponta da seta
    ctx.lineTo(-5, -brick_h_px / 2.0 - 9);
    ctx.moveTo(0, -brick_h_px / 2.0 - 15);
    ctx.lineTo(5, -brick_h_px / 2.0 - 9);
    ctx.stroke();

    ctx.restore();
}

// Helper para desenhar retângulo com cantos arredondados (Compatível com navegadores antigos)
function drawRoundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

// --- UTILS ---
function showToast(message) {
    let toast = document.getElementById("tt-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "tt-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast show";
    
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}
