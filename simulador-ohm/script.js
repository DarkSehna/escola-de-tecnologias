// ==========================================================================
// CORE OHM'S LAW SIMULATOR AND CANVAS ANIMATION
// Escola de Tecnologias - TitanTech
// ==========================================================================

// --- SISTEMA DE SINTETIZADOR DE ÁUDIO (WEB AUDIO API) ---
class SynthAudio {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, volume = 0.08) {
        const checkboxSound = document.getElementById("checkbox-sound");
        if (checkboxSound && !checkboxSound.checked) return;

        try {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Web Audio API bloqueada ou indisponível.", e);
        }
    }

    playBoot() {
        this.playTone(523.25, 'sine', 0.15, 0.05); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.05), 70); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.05), 140); // G5
    }

    playClick() {
        this.playTone(880, 'sine', 0.05, 0.06); // A5
    }

    playTab() {
        this.playTone(587.33, 'triangle', 0.1, 0.05); // D5
    }

    playSuccess() {
        this.playTone(783.99, 'sine', 0.08, 0.06); // G5
        setTimeout(() => this.playTone(987.77, 'sine', 0.08, 0.06), 50); // B5
        setTimeout(() => this.playTone(1174.66, 'sine', 0.15, 0.06), 100); // D6
    }

    playWarning() {
        this.playTone(180, 'sawtooth', 0.35, 0.12);
        setTimeout(() => this.playTone(150, 'sawtooth', 0.35, 0.12), 65);
    }
}

const audio = new SynthAudio();

// --- CONSTANTES E PRESETS E24 ---
const E24_BASES = [
    1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 
    3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
];

const e24Values = [];
for (let m of [1, 10, 100, 1000, 10000]) {
    for (let b of E24_BASES) {
        e24Values.push(b * m);
    }
}
e24Values.push(100000); // 100k limit

// Cores dos resistores
const COLOR_MAP = {
    0: { name: "Preto", hex: "#000000" },
    1: { name: "Marrom", hex: "#8B4513" },
    2: { name: "Vermelho", hex: "#FF0000" },
    3: { name: "Laranja", hex: "#FF8C00" },
    4: { name: "Amarelo", hex: "#FFD700" },
    5: { name: "Verde", hex: "#008000" },
    6: { name: "Azul", hex: "#0000FF" },
    7: { name: "Violeta", hex: "#8A2BE2" },
    8: { name: "Cinza", hex: "#808080" },
    9: { name: "Branco", hex: "#FFFFFF" }
};

const MULT_MAP = {
    "Gold": { name: "Ouro", hex: "#D4AF37" },
    "Black": { name: "Preto", hex: "#000000" },
    "Brown": { name: "Marrom", hex: "#8B4513" },
    "Red": { name: "Vermelho", hex: "#FF0000" },
    "Orange": { name: "Laranja", hex: "#FF8C00" },
    "Yellow": { name: "Amarelo", hex: "#FFD700" },
    "Green": { name: "Verde", hex: "#008000" },
    "Blue": { name: "Azul", hex: "#0000FF" }
};

// --- CONFIGURAÇÃO FÍSICA E GEOMÉTRICA DO CIRCUITO ---
const CX = 60;
const CY = 50;
const CW = 550;
const CH = 280;

const ELECTRON_RADIUS = 3.5;
const BASE_SPEED_MULTIPLIER = 10.0;
const MIN_SPEED = 0.5;
const MAX_SPEED = 25.0;

// --- ESTADO DO SIMULADOR ---
const state = {
    mode: 'series', // 'series' ou 'parallel'
    loadType: 'resistor', // 'resistor', 'bulb' ou 'motor'
    voltage: 12.0,
    resistance: 10.0,
    resistance2: 20.0,
    current: 1.20,
    // Estados de queima
    bulbBurned: false,
    bulb1Burned: false,
    bulb2Burned: false,
    // Ângulo de rotação do motor
    motorRotation: 0.0,
    // Animação de elétrons (distâncias ao longo do fio)
    electronsSeries: [],
    electronsParallelMain: [],
    electronsParallelB1: [],
    electronsParallelB2: []
};

// Inicializa elétrons
function initElectrons() {
    // Série: 36 elétrons ao longo do perímetro (1660px)
    state.electronsSeries = [];
    const stepS = 1660 / 36;
    for (let i = 0; i < 36; i++) {
        state.electronsSeries.push(i * stepS);
    }

    // Paralelo Principal: 18 elétrons ao longo de 1140px
    state.electronsParallelMain = [];
    const stepM = 1140 / 18;
    for (let i = 0; i < 18; i++) {
        state.electronsParallelMain.push(i * stepM);
    }

    // Paralelo Ramo 1: 9 elétrons ao longo de 380px
    state.electronsParallelB1 = [];
    const stepB1 = 380 / 9;
    for (let i = 0; i < 9; i++) {
        state.electronsParallelB1.push(i * stepB1);
    }

    // Paralelo Ramo 2: 9 elétrons ao longo de 520px
    state.electronsParallelB2 = [];
    const stepB2 = 520 / 9;
    for (let i = 0; i < 9; i++) {
        state.electronsParallelB2.push(i * stepB2);
    }
}

// --- MAPEAMENTO DOS ELEMENTOS DOM ---
const canvas = document.getElementById("circuit-canvas");
const ctx = canvas.getContext("2d");

const tabBtnSeries = document.getElementById("tab-btn-series");
const tabBtnParallel = document.getElementById("tab-btn-parallel");

const loadSelectorGroup = document.getElementById("load-selector-group");
const btnLoadResistor = document.getElementById("btn-load-resistor");
const btnLoadBulb = document.getElementById("btn-load-bulb");
const btnLoadMotor = document.getElementById("btn-load-motor");

const inputVoltage = document.getElementById("input-voltage");
const sliderVoltage = document.getElementById("slider-voltage");

const resistanceControlContainer = document.getElementById("resistance-control-container");
const ammeterReadout = document.getElementById("ammeter-readout");

const formulaPanel = document.querySelector(".formula-panel");
const formulaTitle = formulaPanel.querySelector(".panel-title");
const formulaErrorMsg = document.getElementById("formula-error-msg");
const formulaMathDisplay = document.getElementById("formula-math-display");
const formulaCalculationDetails = document.getElementById("formula-calculation-details");
const formulaDenomLbl = document.getElementById("formula-denom-lbl");

const mathVarI = document.getElementById("math-var-i");
const mathVarV = document.getElementById("math-var-v");
const mathVarR = document.getElementById("math-var-r");

const band1 = document.getElementById("band-1");
const band2 = document.getElementById("band-2");
const band3 = document.getElementById("band-3");
const band4 = document.getElementById("band-4");
const resistorColorsTextList = document.getElementById("resistor-colors-text-list");

const resistor2WidgetContainer = document.getElementById("resistor2-widget-container");
const band21 = document.getElementById("band2-1");
const band22 = document.getElementById("band2-2");
const band23 = document.getElementById("band2-3");
const band24 = document.getElementById("band2-4");
const resistor2ColorsTextList = document.getElementById("resistor2-colors-text-list");

const statusMessage = document.getElementById("lbl-status-message");

// --- CONTROLE DE SOUND SPAMMING (RATE LIMITER) ---
let lastSoundTime = 0;
function throttleClickSound() {
    const now = Date.now();
    if (now - lastSoundTime > 120) {
        audio.playClick();
        lastSoundTime = now;
    }
}

// --- FUNÇÕES DE ARREDONDAMENTO/SNAP E24 ---
function snapToE24(val) {
    val = Math.max(1, Math.min(100000, val));
    let closest = e24Values[0];
    let minDiff = Math.abs(e24Values[0] - val);
    for (let i = 1; i < e24Values.length; i++) {
        let diff = Math.abs(e24Values[i] - val);
        if (diff < minDiff) {
            minDiff = diff;
            closest = e24Values[i];
        }
    }
    return closest;
}

function getE24Index(val) {
    let closestIdx = 0;
    let minDiff = Math.abs(e24Values[0] - val);
    for (let i = 1; i < e24Values.length; i++) {
        let diff = Math.abs(e24Values[i] - val);
        if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
        }
    }
    return closestIdx;
}

// --- FUNÇÃO PARA CONVERTER VALOR DE R EM BANDAS DE CORES ---
function getResistorColors(val) {
    let exp = Math.floor(Math.log10(val));
    let digit1, digit2, mult;
    
    if (exp < 1) {
        digit1 = Math.floor(val);
        digit2 = Math.round((val - digit1) * 10);
        mult = "Gold";
    } else {
        let valNorm = val / Math.pow(10, exp - 1);
        digit1 = Math.floor(valNorm / 10);
        digit2 = Math.round(valNorm % 10);
        
        if (digit2 >= 10) {
            digit1 += 1;
            digit2 = 0;
            if (digit1 >= 10) {
                digit1 = 1;
                digit2 = 0;
                exp += 1;
            }
        }
        let multExp = exp - 1;
        const multColors = {
            0: "Black",
            1: "Brown",
            2: "Red",
            3: "Orange",
            4: "Yellow",
            5: "Green",
            6: "Blue"
        };
        mult = multColors[multExp] || "Black";
    }

    const c1 = COLOR_MAP[digit1] || COLOR_MAP[1];
    const c2 = COLOR_MAP[digit2] || COLOR_MAP[0];
    const c3 = MULT_MAP[mult] || MULT_MAP["Black"];
    const c4 = { name: "Ouro", hex: "#D4AF37" }; // Tolerance: 5% gold

    return [
        [c1.hex, c2.hex, c3.hex, c4.hex],
        [c1.name, c2.name, c3.name, c4.name]
    ];
}

// Atualiza o widget de resistores na UI
function updateResistorColorsUI() {
    // Resistor 1
    const [hexs, names] = getResistorColors(state.resistance);
    const [h1, h2, h3, h4] = hexs;
    const [n1, n2, n3, n4] = names;
    band1.style.backgroundColor = h1;
    band2.style.backgroundColor = h2;
    band3.style.backgroundColor = h3;
    band4.style.backgroundColor = h4;
    resistorColorsTextList.textContent = `Cores: ${n1}, ${n2}, ${n3}, ${n4}`;

    // Resistor 2 (apenas paralelo)
    if (state.mode === 'parallel') {
        const [phexs, pnames] = getResistorColors(state.resistance2);
        const [ph1, ph2, ph3, ph4] = phexs;
        const [pn1, pn2, pn3, pn4] = pnames;
        band21.style.backgroundColor = ph1;
        band22.style.backgroundColor = ph2;
        band23.style.backgroundColor = ph3;
        band24.style.backgroundColor = ph4;
        resistor2ColorsTextList.textContent = `Cores: ${pn1}, ${pn2}, ${pn3}, ${pn4}`;
    }
}

// --- CONSTRUTOR DINÂMICO DE CONTROLES DE RESISTÊNCIA ---
function rebuildResistanceControls() {
    if (state.mode === 'series') {
        resistor2WidgetContainer.classList.add("hidden");
        
        const idx = getE24Index(state.resistance);
        resistanceControlContainer.innerHTML = `
            <div class="control-block">
                <div class="block-header">
                    <span class="block-title" style="color: var(--color-resistor);">🛑 RESISTÊNCIA LIMITADORA (E24)</span>
                    <div class="digital-input-wrapper color-resistance">
                        <input type="text" id="input-resistance" value="${formatValue(state.resistance)}" autocomplete="off">
                        <span class="unit">Ω</span>
                    </div>
                </div>
                <input type="range" id="slider-resistance" min="0" max="120" value="${idx}" class="cyber-range range-resistance">
                <span class="block-hint">O resistor reduz a corrente para proteger a lâmpada/motor.</span>
            </div>
        `;

        // Event listeners
        const slider = document.getElementById("slider-resistance");
        const input = document.getElementById("input-resistance");

        slider.addEventListener("input", (e) => {
            state.resistance = e24Values[parseInt(e.target.value)];
            input.value = formatValue(state.resistance);
            throttleClickSound();
            calculateOhm();
        });

        input.addEventListener("change", (e) => {
            let val = parseFloat(e.target.value.replace(/\./g, "").replace(",", "."));
            if (isNaN(val)) val = 10;
            state.resistance = snapToE24(val);
            input.value = formatValue(state.resistance);
            slider.value = getE24Index(state.resistance);
            audio.playClick();
            calculateOhm();
        });

    } else { // parallel
        resistor2WidgetContainer.classList.remove("hidden");
        
        const idx1 = getE24Index(state.resistance);
        const idx2 = getE24Index(state.resistance2);
        
        resistanceControlContainer.innerHTML = `
            <div class="parallel-resistance-controls">
                <div class="control-block">
                    <div class="block-header">
                        <span class="block-title" style="color: var(--color-resistor);">🛑 RAMO 1: R1 (E24)</span>
                        <div class="digital-input-wrapper color-resistance">
                            <input type="text" id="input-resistance" value="${formatValue(state.resistance)}" autocomplete="off">
                            <span class="unit">Ω</span>
                        </div>
                    </div>
                    <input type="range" id="slider-resistance" min="0" max="120" value="${idx1}" class="cyber-range range-resistance">
                </div>
                <div class="control-block" style="margin-top: 0.65rem;">
                    <div class="block-header">
                        <span class="block-title" style="color: var(--color-wire-low);">🛑 RAMO 2: R2 (E24)</span>
                        <div class="digital-input-wrapper color-resistance2">
                            <input type="text" id="input-resistance2" value="${formatValue(state.resistance2)}" autocomplete="off">
                            <span class="unit">Ω</span>
                        </div>
                    </div>
                    <input type="range" id="slider-resistance2" min="0" max="120" value="${idx2}" class="cyber-range range-resistance2">
                </div>
                <span class="block-hint" style="margin-top: 0.35rem; display: block;">Em paralelo, a corrente se divide. Cada ramo tem brilho/corrente independente.</span>
            </div>
        `;

        // Event listeners
        const slider1 = document.getElementById("slider-resistance");
        const input1 = document.getElementById("input-resistance");
        
        const slider2 = document.getElementById("slider-resistance2");
        const input2 = document.getElementById("input-resistance2");

        slider1.addEventListener("input", (e) => {
            state.resistance = e24Values[parseInt(e.target.value)];
            input1.value = formatValue(state.resistance);
            throttleClickSound();
            calculateOhm();
        });

        input1.addEventListener("change", (e) => {
            let val = parseFloat(e.target.value.replace(/\./g, "").replace(",", "."));
            if (isNaN(val)) val = 10;
            state.resistance = snapToE24(val);
            input1.value = formatValue(state.resistance);
            slider1.value = getE24Index(state.resistance);
            audio.playClick();
            calculateOhm();
        });

        slider2.addEventListener("input", (e) => {
            state.resistance2 = e24Values[parseInt(e.target.value)];
            input2.value = formatValue(state.resistance2);
            throttleClickSound();
            calculateOhm();
        });

        input2.addEventListener("change", (e) => {
            let val = parseFloat(e.target.value.replace(/\./g, "").replace(",", "."));
            if (isNaN(val)) val = 20;
            state.resistance2 = snapToE24(val);
            input2.value = formatValue(state.resistance2);
            slider2.value = getE24Index(state.resistance2);
            audio.playClick();
            calculateOhm();
        });
    }
}

// Formatação com separadores de milhar (Ex: 10.000)
function formatValue(val) {
    return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// --- CÁLCULO E SIMULAÇÃO ELÉTRICA ---
function calculateOhm() {
    let prevBurned = state.bulbBurned || state.bulb1Burned || state.bulb2Burned;
    
    if (state.mode === 'series') {
        let rTotal = state.resistance;
        if (state.loadType === 'bulb') rTotal += 10.0;
        else if (state.loadType === 'motor') rTotal += 15.0;

        state.current = state.voltage / rTotal;

        // Check burnout (1.5 A threshold for series bulb)
        if (state.loadType === 'bulb' && state.current > 1.5) {
            state.bulbBurned = true;
            state.current = 0.0;
        } else {
            state.bulbBurned = false;
        }
    } else { // parallel mode
        state.bulbBurned = false;
        
        if (state.loadType === 'bulb') {
            let i1 = state.voltage / (state.resistance + 10.0);
            if (i1 > 1.5) {
                state.bulb1Burned = true;
                i1 = 0.0;
            } else {
                state.bulb1Burned = false;
            }

            let i2 = state.voltage / (state.resistance2 + 10.0);
            if (i2 > 1.5) {
                state.bulb2Burned = true;
                i2 = 0.0;
            } else {
                state.bulb2Burned = false;
            }

            state.current = i1 + i2;
        } else {
            state.bulb1Burned = false;
            state.bulb2Burned = false;
            state.current = (state.voltage / state.resistance) + (state.voltage / state.resistance2);
        }
    }

    // Play warning buzzer if just burned out
    let currentlyBurned = state.bulbBurned || state.bulb1Burned || state.bulb2Burned;
    if (currentlyBurned && !prevBurned) {
        audio.playWarning();
        statusMessage.textContent = "[ ALERTA ] Sobrecarga! Lâmpada queimada devido a corrente excessiva (> 1.5 A).";
        statusMessage.style.color = "var(--color-resistor)";
    } else if (!currentlyBurned && prevBurned) {
        audio.playSuccess();
        statusMessage.textContent = "[ STATUS ] Circuito reestabelecido. Corrente limitada dentro de limites seguros.";
        statusMessage.style.color = "var(--color-battery)";
    } else if (!currentlyBurned) {
        statusMessage.textContent = `[ STATUS ] Simulador ativo. Tensão: ${state.voltage.toFixed(1)}V | Corrente: ${formatCurrent(state.current)}`;
        statusMessage.style.color = "var(--color-text-muted)";
    }

    // Atualiza HUD Amperímetro
    ammeterReadout.textContent = formatCurrent(state.current);

    // Atualiza Fórmulas e Widgets de Resistores
    updateFormulaUI();
    updateResistorColorsUI();
}

function formatCurrent(val) {
    if (val >= 1.0) {
        return `${val.toFixed(2)} A`;
    } else if (val > 0.0001) {
        let ma = val * 1000;
        return ma >= 10 ? `${ma.toFixed(1)} mA` : `${ma.toFixed(2)} mA`;
    } else {
        return "0.00 A";
    }
}

// --- ATUALIZAÇÃO DO VISUALIZADOR DE FÓRMULAS ---
function updateFormulaUI() {
    const isBurned = state.bulbBurned || (state.mode === 'parallel' && state.loadType === 'bulb' && state.bulb1Burned && state.bulb2Burned);
    const isPartialBurned = state.mode === 'parallel' && state.loadType === 'bulb' && (state.bulb1Burned || state.bulb2Burned) && !(state.bulb1Burned && state.bulb2Burned);

    if (isBurned) {
        formulaErrorMsg.classList.remove("hidden");
        formulaMathDisplay.classList.add("hidden");
        formulaDenomLbl.style.visibility = "hidden";
        
        if (state.mode === 'series') {
            formulaCalculationDetails.textContent = "Resistência Total: R (Lâmpada Queimada) = ∞";
        } else {
            formulaCalculationDetails.textContent = "Resistência Total: R1 // R2 (Lâmpadas Queimadas) = ∞";
        }
        return;
    }

    formulaErrorMsg.classList.add("hidden");
    formulaMathDisplay.classList.remove("hidden");
    formulaDenomLbl.style.visibility = "visible";

    // Calcular escalas dinâmicas dos termos da fórmula
    const scaleV = 0.85 + (state.voltage / 24.0) * 0.3;
    const logR = Math.log10(state.resistance);
    const scaleR = 0.85 + (logR / 5.0) * 0.3; // 100k limit gives log10(100k) = 5

    // Ajusta scale do I
    let curVal = state.current;
    if (curVal < 0.0001) curVal = 0.0001;
    const logMin = -4; // 0.1 mA
    const logMax = Math.log10(48.0); // max parallel current
    const logCur = Math.log10(curVal);
    const ratioI = (logCur - logMin) / (logMax - logMin);
    const scaleI = 0.85 + Math.max(0, Math.min(1, ratioI)) * 0.3;

    // Aplicar transformações CSS de escala
    mathVarV.style.transform = `scale(${scaleV})`;
    mathVarR.style.transform = `scale(${scaleR})`;
    mathVarI.style.transform = `scale(${scaleI})`;

    if (state.mode === 'series') {
        formulaTitle.textContent = "📊 LEI DE OHM EM SÉRIE";
        
        let hasLoad = state.loadType !== 'resistor';
        let loadRVal = state.loadType === 'bulb' ? 10.0 : 15.0;
        let loadName = state.loadType === 'bulb' ? "Lâmpada" : "Motor";

        formulaDenomLbl.textContent = hasLoad ? "R + R_L" : "Resistência (R)";
        
        // Renderiza formula matemática em série
        formulaMathDisplay.innerHTML = `
            <div class="math-left"><span id="math-var-i" class="math-var var-i" style="transform: scale(${scaleI})">I</span></div>
            <div class="math-equal">=</div>
            <div class="math-fraction">
                <span id="math-var-v" class="math-var var-v" style="transform: scale(${scaleV})">V</span>
                <div class="fraction-line"></div>
                <span id="math-var-r" class="math-var var-r" style="transform: scale(${scaleR})">${hasLoad ? "R + R_L" : "R"}</span>
            </div>
        `;

        // Detalhes da conta
        if (hasLoad) {
            formulaCalculationDetails.innerHTML = `Total: R (${formatValue(state.resistance)}Ω) + R_L (${loadName}: ${loadRVal}Ω) = ${formatValue(state.resistance + loadRVal)}Ω`;
        } else {
            formulaCalculationDetails.innerHTML = `Total: R = ${formatValue(state.resistance)}Ω`;
        }
    } else { // paralelo
        formulaTitle.textContent = "📊 LEI DE OHM EM PARALELO";
        formulaDenomLbl.textContent = state.loadType === 'bulb' ? "R1+R_L // R2+R_L" : "Req = R1 // R2";

        let denom1 = state.loadType === 'bulb' ? "R_1 + R_L" : "R_1";
        let denom2 = state.loadType === 'bulb' ? "R_2 + R_L" : "R_2";

        const logR2 = Math.log10(state.resistance2);
        const scaleR2 = 0.85 + (logR2 / 5.0) * 0.3;

        // Renderiza formula matemática em paralelo
        formulaMathDisplay.innerHTML = `
            <div class="math-left"><span id="math-var-i" class="math-var var-i" style="transform: scale(${scaleI})">I_t</span></div>
            <div class="math-equal">=</div>
            <div class="math-fraction">
                <span class="math-var var-v" style="transform: scale(${scaleV})">V</span>
                <div class="fraction-line"></div>
                <span class="math-var var-r" style="transform: scale(${scaleR})">${denom1}</span>
            </div>
            <div class="math-equal" style="margin:0 0.4rem;">+</div>
            <div class="math-fraction">
                <span class="math-var var-v" style="transform: scale(${scaleV})">V</span>
                <div class="fraction-line"></div>
                <span class="math-var var-low" style="color:var(--color-wire-low); transform: scale(${scaleR2})">${denom2}</span>
            </div>
        `;

        // Detalhes da conta
        let r1_total = state.resistance + (state.loadType === 'bulb' ? 10.0 : 0);
        let r2_total = state.resistance2 + (state.loadType === 'bulb' ? 10.0 : 0);
        
        let i1 = state.bulb1Burned ? 0.0 : state.voltage / r1_total;
        let i2 = state.bulb2Burned ? 0.0 : state.voltage / r2_total;
        let req = (r1_total * r2_total) / (r1_total + r2_total);

        let details = `Req = ${req.toFixed(2)}Ω | I1 = ${formatCurrent(i1)} | I2 = ${formatCurrent(i2)}`;
        if (state.bulb1Burned) details = `Req1=∞ (Q) | ` + details;
        if (state.bulb2Burned) details = details + ` | Req2=∞ (Q)`;
        
        formulaCalculationDetails.innerHTML = details;
    }
}

// --- CONTROLES DE ABAS ---
tabBtnSeries.addEventListener("click", () => {
    if (state.mode === 'series') return;
    state.mode = 'series';
    tabBtnSeries.classList.add("active");
    tabBtnParallel.classList.remove("active");
    audio.playTab();
    
    rebuildResistanceControls();
    calculateOhm();
});

tabBtnParallel.addEventListener("click", () => {
    if (state.mode === 'parallel') return;
    state.mode = 'parallel';
    tabBtnParallel.classList.add("active");
    tabBtnSeries.classList.remove("active");
    audio.playTab();

    rebuildResistanceControls();
    calculateOhm();
});

// --- CONTROLES DE CARGA (COMPONENTES) ---
loadSelectorGroup.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // Remove active classes
    const buttons = loadSelectorGroup.querySelectorAll("button");
    buttons.forEach(b => b.classList.remove("active"));
    
    btn.classList.add("active");
    state.loadType = btn.dataset.load;
    audio.playClick();

    calculateOhm();
});

// --- CONTROLES DE TENSÃO ---
sliderVoltage.addEventListener("input", (e) => {
    state.voltage = e.target.value / 10.0;
    inputVoltage.value = state.voltage.toFixed(1);
    throttleClickSound();
    calculateOhm();
});

inputVoltage.addEventListener("change", (e) => {
    let val = parseFloat(e.target.value.replace(",", "."));
    if (isNaN(val)) val = 12.0;
    val = Math.max(1.0, Math.min(24.0, val));
    state.voltage = val;
    inputVoltage.value = val.toFixed(1);
    sliderVoltage.value = Math.round(val * 10);
    audio.playClick();
    calculateOhm();
});

// --- ENGINE DE ANIMAÇÃO & RENDERIZAÇÃO DO CANVAS (60 FPS) ---

// Move os elétrons nas fiações
function animateElectrons() {
    if (state.mode === 'series') {
        let speed = state.current * BASE_SPEED_MULTIPLIER;
        if (state.current > 0.0001) {
            speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
        } else {
            speed = 0.0;
        }

        state.electronsSeries = state.electronsSeries.map(d => (d + speed) % 1660);
    } else { // paralelo
        // Branch 1 current
        let i1 = 0.0;
        if (!state.bulb1Burned) {
            i1 = state.voltage / (state.resistance + (state.loadType === 'bulb' ? 10.0 : 0.0));
        }
        let speedB1 = i1 * BASE_SPEED_MULTIPLIER;
        speedB1 = (i1 > 0.0001) ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speedB1)) : 0.0;
        state.electronsParallelB1 = state.electronsParallelB1.map(d => (d + speedB1) % 380);

        // Branch 2 current
        let i2 = 0.0;
        if (!state.bulb2Burned) {
            i2 = state.voltage / (state.resistance2 + (state.loadType === 'bulb' ? 10.0 : 0.0));
        }
        let speedB2 = i2 * BASE_SPEED_MULTIPLIER;
        speedB2 = (i2 > 0.0001) ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speedB2)) : 0.0;
        state.electronsParallelB2 = state.electronsParallelB2.map(d => (d + speedB2) % 520);

        // Main current
        let iTotal = i1 + i2;
        let speedMain = iTotal * BASE_SPEED_MULTIPLIER;
        speedMain = (iTotal > 0.0001) ? Math.max(MIN_SPEED, Math.min(MAX_SPEED, speedMain)) : 0.0;
        state.electronsParallelMain = state.electronsParallelMain.map(d => (d + speedMain) % 1140);
    }

    // Rotação do motor
    if (state.loadType === 'motor' && state.current > 0.0001 && state.mode === 'series') {
        let rotSpeed = state.current * 7.0;
        rotSpeed = Math.max(0.5, Math.min(35.0, rotSpeed));
        state.motorRotation = (state.motorRotation + rotSpeed) % 360;
    }
}

// Mapeamento de posições Série (anti-horário para representar fluxo de elétrons real)
function getPositionSeries(dist) {
    dist = dist % 1660;
    if (dist < 550) {
        return { x: CX + dist, y: CY + CH }; // Fio inferior, movendo para a direita
    } else if (dist < 830) {
        let offset = dist - 550;
        return { x: CX + CW, y: CY + CH - offset }; // Fio direito, subindo
    } else if (dist < 1380) {
        let offset = dist - 830;
        return { x: CX + CW - offset, y: CY }; // Fio superior, movendo para a esquerda
    } else {
        let offset = dist - 1380;
        return { x: CX, y: CY + offset }; // Fio esquerdo, descendo
    }
}

// Mapeamentos de posições Paralelo
function getPositionParallelMain(dist) {
    let d = dist % 1140;
    if (d < 430) {
        return { x: 490 - d, y: CY + CH }; // Fio inferior de retorno
    } else if (d < 710) {
        let offset = d - 430;
        return { x: CX, y: CY + CH - offset }; // Fio esquerdo subindo (bateria)
    } else {
        let offset = d - 710;
        return { x: CX + offset, y: CY }; // Fio superior de ida até a junção
    }
}

function getPositionParallelB1(dist) {
    let d = dist % 380;
    if (d < 50) {
        return { x: 490 + d, y: CY }; // Junção ao ramo 1 (X=540)
    } else if (d < 330) {
        let offset = d - 50;
        return { x: 540, y: CY + offset }; // Descendo o ramo 1
    } else {
        let offset = d - 330;
        return { x: 540 - offset, y: CY + CH }; // Retorno do ramo 1 ao ponto de junção
    }
}

function getPositionParallelB2(dist) {
    let d = dist % 520;
    if (d < 120) {
        return { x: 490 + d, y: CY }; // Junção ao ramo 2 (X=610)
    } else if (d < 400) {
        let offset = d - 120;
        return { x: 610, y: CY + offset }; // Descendo o ramo 2
    } else {
        let offset = d - 400;
        return { x: 610 - offset, y: CY + CH }; // Retorno do ramo 2 ao ponto de junção
    }
}

// Desenha a grade milimetrada tipo CAD
function drawGrid() {
    ctx.strokeStyle = "#0d1321";
    ctx.lineWidth = 0.5;
    const gridSize = 20;

    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// Desenha fiações
function drawWires() {
    let intensity = Math.round(150 + (state.voltage / 24.0) * 105);
    let highColor = `rgb(255, ${intensity}, 0)`;
    let lowColor = "#00bfff";

    ctx.lineCap = "round";
    ctx.lineJoin = "miter";

    // Função interna para desenhar com glow e núcleo
    function drawSegment(path, color, width) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.stroke(path);
    }

    if (state.mode === 'series') {
        let hasTopResistor = state.loadType !== 'resistor';

        // 1. Fiação de Potencial Alto (Laranja)
        let pathHigh = new Path2D();
        // Bateria (+) até o resistor do topo ou direita
        pathHigh.moveTo(CX, CY + CH / 2 - 30);
        pathHigh.lineTo(CX, CY);
        
        if (hasTopResistor) {
            // Gap do Resistor no topo: X=295 a X=375
            pathHigh.lineTo(CX + CW / 2 - 40, CY);
            pathHigh.moveTo(CX + CW / 2 + 40, CY);
        }
        
        pathHigh.lineTo(CX + CW, CY);
        // Desce até a carga principal no lado direito (Y=140)
        pathHigh.lineTo(CX + CW, CY + 90);

        // 2. Fiação de Potencial Baixo (Ciano)
        let pathLow = new Path2D();
        // Saída da carga principal (Y=240) até a bateria (-)
        pathLow.moveTo(CX + CW, CY + 190);
        pathLow.lineTo(CX + CW, CY + CH);
        pathLow.lineTo(CX, CY + CH);
        pathLow.lineTo(CX, CY + CH / 2 + 30);

        // Desenha glow
        ctx.shadowBlur = 10;
        ctx.shadowColor = highColor;
        drawSegment(pathHigh, highColor, 4);

        ctx.shadowColor = lowColor;
        drawSegment(pathLow, lowColor, 4);

        // Desenha núcleo (sem sombra para ficar nítido)
        ctx.shadowBlur = 0;
        drawSegment(pathHigh, "#ffffff", 1.5);
        drawSegment(pathLow, "#ffffff", 1.5);

    } else { // paralelo
        // Fiação comum de potencial alto
        let pathHigh = new Path2D();
        pathHigh.moveTo(CX, CY + CH / 2 - 30);
        pathHigh.lineTo(CX, CY);
        pathHigh.lineTo(490, CY);

        // Fiação comum de potencial baixo
        let pathLow = new Path2D();
        pathLow.moveTo(490, CY + CH);
        pathLow.lineTo(CX, CY + CH);
        pathLow.lineTo(CX, CY + CH / 2 + 30);

        if (state.loadType === 'resistor') {
            // Ramo 1 (inner): split (490) até 540, e desce até R (140)
            pathHigh.lineTo(540, CY);
            pathHigh.lineTo(540, CY + 90);

            pathLow.moveTo(540, CY + 190);
            pathLow.lineTo(540, CY + CH);
            pathLow.lineTo(490, CY + CH);

            // Ramo 2 (outer): split (490) até 610, e desce até R (140)
            pathHigh.moveTo(490, CY);
            pathHigh.lineTo(610, CY);
            pathHigh.lineTo(610, CY + 90);

            pathLow.moveTo(610, CY + 190);
            pathLow.lineTo(610, CY + CH);
            pathLow.lineTo(490, CY + CH);
        } else { // bulb mode in parallel
            // Cada ramo tem um Resistor (Y=80 a 140) e uma Lâmpada (Y=200 a 260)
            
            // Ramo 1:
            pathHigh.moveTo(490, CY);
            pathHigh.lineTo(540, CY);
            pathHigh.lineTo(540, CY + 30); // Fio até topo R1
            
            // Fio intermediário R1-Lâmpada1 (consideramos potencial alto para consistência visual)
            pathHigh.moveTo(540, CY + 90);
            pathHigh.lineTo(540, CY + 150);

            pathLow.moveTo(540, CY + 210); // Saída da Lâmpada 1
            pathLow.lineTo(540, CY + CH);
            pathLow.lineTo(490, CY + CH);

            // Ramo 2:
            pathHigh.moveTo(490, CY);
            pathHigh.lineTo(610, CY);
            pathHigh.lineTo(610, CY + 30); // Fio até topo R2
            
            // Fio intermediário R2-Lâmpada2
            pathHigh.moveTo(610, CY + 90);
            pathHigh.lineTo(610, CY + 150);

            pathLow.moveTo(610, CY + 210); // Saída da Lâmpada 2
            pathLow.lineTo(610, CY + CH);
            pathLow.lineTo(490, CY + CH);
        }

        // Desenha glows
        ctx.shadowBlur = 10;
        ctx.shadowColor = highColor;
        drawSegment(pathHigh, highColor, 4);

        ctx.shadowColor = lowColor;
        drawSegment(pathLow, lowColor, 4);

        // Desenha núcleos
        ctx.shadowBlur = 0;
        drawSegment(pathHigh, "#ffffff", 1.5);
        drawSegment(pathLow, "#ffffff", 1.5);
    }
}

// Desenha a bateria
function drawBattery(x, y, voltage) {
    const w = 40;
    const h = 80;
    const bx = x - w / 2;
    const by = y - h / 2;

    // Glow externo
    ctx.shadowBlur = 10;
    ctx.shadowColor = "rgba(0, 255, 102, 0.4)";
    ctx.strokeStyle = "rgba(0, 255, 102, 0.5)";
    ctx.lineWidth = 4;
    ctx.strokeRect(bx - 2, by - 2, w + 4, h + 4);
    ctx.shadowBlur = 0;

    // Corpo da Bateria
    ctx.fillStyle = "#0c0f18";
    ctx.strokeStyle = "#1b2234";
    ctx.lineWidth = 2.5;
    ctx.fillRect(bx, by, w, h);
    ctx.strokeRect(bx, by, w, h);

    // Carga de energia verde proporcional a tensão
    let pct = voltage / 24.0;
    let chargeH = Math.round(pct * (h - 12));
    if (chargeH > 0) {
        let grad = ctx.createLinearGradient(bx, by + h, bx, by + h - chargeH);
        grad.addColorStop(0, "#008833");
        grad.addColorStop(1, "#00ff66");
        ctx.fillStyle = grad;
        ctx.fillRect(bx + 4, by + h - 4 - chargeH, w - 8, chargeH);
    }

    // Símbolos de polaridade
    ctx.fillStyle = "#ff9d00";
    ctx.font = "bold 14px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("+", x, by + 12);

    ctx.fillStyle = "#00bfff";
    ctx.fillText("-", x, by + h - 12);

    // Display digital interno de Volts
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px JetBrains Mono";
    ctx.fillText(`${voltage.toFixed(1)}V`, x, y);
}

// Desenha Resistor
function drawSchematicResistor(x, y, horizontal, resistance, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    let rFactor = Math.min(1.0, resistance / 100000.0);
    // Transiciona do amarelo/laranja em R baixo para vermelho intenso em R alto
    let red = Math.round(200 + rFactor * 55);
    let green = Math.round(160 - rFactor * 140);
    let blue = Math.round(50 - rFactor * 50);
    let resColor = `rgb(${red}, ${green}, ${blue})`;

    // Desenha glow
    ctx.shadowBlur = 8;
    ctx.shadowColor = resColor;
    ctx.strokeStyle = resColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    if (horizontal) {
        // Zig-zag horizontal (comprimento 80px)
        ctx.moveTo(-40, 0);
        ctx.lineTo(-30, 0);
        ctx.lineTo(-24, -12);
        ctx.lineTo(-16, 12);
        ctx.lineTo(-8, -12);
        ctx.lineTo(0, 12);
        ctx.lineTo(8, -12);
        ctx.lineTo(16, 12);
        ctx.lineTo(24, -12);
        ctx.lineTo(30, 0);
        ctx.lineTo(40, 0);
    } else {
        // Zig-zag vertical (altura 80px)
        ctx.moveTo(0, -40);
        ctx.lineTo(0, -30);
        ctx.lineTo(-12, -24);
        ctx.lineTo(12, -16);
        ctx.lineTo(-12, -8);
        ctx.lineTo(12, 0);
        ctx.lineTo(-12, 8);
        ctx.lineTo(12, 16);
        ctx.lineTo(-12, 24);
        ctx.lineTo(0, 30);
        ctx.lineTo(0, 40);
    }
    ctx.stroke();
    ctx.restore();
}

// Desenha Lâmpada
function drawSchematicBulb(x, y, current, burned, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    let factor = 0;
    if (current > 0.0001 && !burned) {
        factor = Math.min(1.0, Math.pow(current / 1.5, 0.35));
    }

    // 1. Glow radial amarelo proporcional ao brilho
    if (factor > 0.01) {
        let glowRadius = 30 + factor * 65;
        let glowGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGrad.addColorStop(0, `rgba(255, 255, 180, ${factor * 0.8})`);
        glowGrad.addColorStop(0.35, `rgba(255, 190, 50, ${factor * 0.4})`);
        glowGrad.addColorStop(1.0, `rgba(255, 100, 0, 0)`);
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. Vidro externo da Lâmpada
    ctx.strokeStyle = "#1b2234";
    ctx.lineWidth = 2.5;
    if (factor > 0.01) {
        let r = Math.round(13 + factor * (255 - 13));
        let g = Math.round(18 + factor * (240 - 18));
        let b = Math.round(28 + factor * (120 - 28));
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    } else {
        ctx.fillStyle = "#0d121c";
    }

    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. Efeito brilhoso 3D (Reflexo de luz)
    if (factor > 0.01) {
        let innerGrad = ctx.createRadialGradient(-6, -6, 2, -6, -6, 25);
        innerGrad.addColorStop(0.0, `rgba(255, 255, 255, ${factor * 0.9})`);
        innerGrad.addColorStop(0.5, `rgba(255, 230, 80, ${factor * 0.7})`);
        innerGrad.addColorStop(1.0, `rgba(255, 150, 0, ${factor * 0.4})`);
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 27, 0, Math.PI * 2);
        ctx.fill();
    }

    // 4. Filamento em X
    if (burned) {
        // Filamento quebrado: desenha as linhas do X com espaço no meio
        ctx.strokeStyle = "#4f5e75";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, -18); ctx.lineTo(-4, -4);
        ctx.moveTo(4, 4);     ctx.lineTo(18, 18);
        ctx.moveTo(18, -18);  ctx.lineTo(4, -4);
        ctx.moveTo(-4, 4);    ctx.lineTo(-18, 18);
        ctx.stroke();
    } else {
        let filColor = "#444444";
        if (factor > 0.01) {
            let r = Math.round(200 + factor * 55);
            let g = Math.round(80 + factor * 175);
            let b = Math.round(30 + factor * 225);
            filColor = `rgb(${r}, ${g}, ${b})`;
            ctx.shadowBlur = 6;
            ctx.shadowColor = filColor;
        }

        ctx.strokeStyle = filColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-18, -18); ctx.lineTo(18, 18);
        ctx.moveTo(18, -18);  ctx.lineTo(-18, 18);
        ctx.stroke();
    }

    ctx.restore();
}

// Desenha Motor
function drawSchematicMotor(x, y, rotationAngle, scale = 1.0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Carcaça externa
    ctx.strokeStyle = "#1b2234";
    ctx.lineWidth = 2.5;
    ctx.fillStyle = "#1e2536";
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Símbolo do "M" centralizado
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", 0, 0);

    // Anel externo pontilhado em rotação
    ctx.save();
    ctx.rotate((rotationAngle * Math.PI) / 180);
    ctx.strokeStyle = "#6f7d95";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

// Desenha Voltímetros
function drawVoltmeterProbe(x, y, value, colorHex, label) {
    // Ponto de teste no circuito
    ctx.strokeStyle = colorHex;
    ctx.fillStyle = "#07090d";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Linha vertical até a caixa do visor
    let isTop = y < 150;
    let offsetY = isTop ? -35 : 35;
    let destY = y + offsetY;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, destY);
    ctx.stroke();

    // Caixa do display digital
    let boxW = 110;
    let boxH = 24;
    let bx = x - boxW / 2;
    let by = destY - boxH / 2;

    ctx.fillStyle = "rgba(12, 15, 24, 0.85)";
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 1.5;
    ctx.fillRect(bx, by, boxW, boxH);
    ctx.strokeRect(bx, by, boxW, boxH);

    // Valor da Tensão
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px Consolas";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(value, x, destY);

    // Rótulo descritivo
    ctx.fillStyle = "#6f7d95";
    ctx.font = "7px Segoe UI";
    let lblY = destY + (isTop ? -18 : 18);
    ctx.fillText(label, x, lblY);
}

// Desenha sinais gigantes de polaridade (+) e (-) nos cantos
function drawPolaritySigns() {
    ctx.font = "bold 15px Segoe UI";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    function drawNeonSign(char, x, y, colorHex) {
        ctx.shadowBlur = 6;
        ctx.shadowColor = colorHex;
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillText(char, x, y);
        ctx.fillStyle = colorHex;
        ctx.fillText(char, x, y);
        ctx.shadowBlur = 0;
    }

    // Bateria
    drawNeonSign("+", CX - 35, CY + 25, "#ff9d00");
    drawNeonSign("-", CX - 35, CY + CH - 25, "#00bfff");

    // Lado do Consumidor
    if (state.mode === 'series') {
        if (state.loadType === 'resistor') {
            drawNeonSign("+", CX + CW + 35, CY + 25, "#ff9d00");
            drawNeonSign("-", CX + CW + 35, CY + CH - 25, "#00bfff");
        } else {
            drawNeonSign("+", CX + CW / 2 - 80, CY - 25, "#ff9d00");
            drawNeonSign("-", CX + CW + 35, CY + CH - 25, "#00bfff");
        }
    } else {
        drawNeonSign("+", 490, CY - 25, "#ff9d00");
        drawNeonSign("-", 490, CY + CH + 25, "#00bfff");
    }
}

// Desenha partícula de elétron único
function drawElectron(pos) {
    ctx.beginPath();
    let radialGrad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 8);
    radialGrad.addColorStop(0, "rgba(255, 255, 50, 0.9)");
    radialGrad.addColorStop(0.5, "rgba(255, 200, 0, 0.4)");
    radialGrad.addColorStop(1.0, "rgba(255, 100, 0, 0)");
    
    ctx.fillStyle = radialGrad;
    ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
}

// --- LAÇO DE ATUALIZAÇÃO DA TELA (GAMELOOP) ---
function loop() {
    // 1. Limpar Tela
    ctx.fillStyle = "#07090d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Grade de Fundo
    drawGrid();

    // 3. Fiações
    drawWires();

    // 4. Bateria
    drawBattery(CX, CY + CH / 2, state.voltage);

    // 5. Elétrons correndo nas fiações
    if (state.mode === 'series') {
        state.electronsSeries.forEach(d => {
            drawElectron(getPositionSeries(d));
        });
    } else {
        state.electronsParallelMain.forEach(d => {
            drawElectron(getPositionParallelMain(d));
        });
        state.electronsParallelB1.forEach(d => {
            drawElectron(getPositionParallelB1(d));
        });
        state.electronsParallelB2.forEach(d => {
            drawElectron(getPositionParallelB2(d));
        });
    }

    // 6. Desenhar Cargas na Fiação
    if (state.mode === 'series') {
        if (state.loadType === 'resistor') {
            // Apenas Resistor no lado direito
            drawSchematicResistor(CX + CW, CY + CH / 2, false, state.resistance);
        } else {
            // Resistor limitador no topo, Lâmpada/Motor na direita
            drawSchematicResistor(CX + CW / 2, CY, true, state.resistance);

            if (state.loadType === 'bulb') {
                drawSchematicBulb(CX + CW, CY + CH / 2, state.current, state.bulbBurned);
            } else { // motor
                drawSchematicMotor(CX + CW, CY + CH / 2, state.motorRotation);
            }
        }
    } else { // paralelo
        if (state.loadType === 'resistor') {
            // Dois resistores em paralelo
            drawSchematicResistor(540, CY + CH / 2, false, state.resistance);
            drawSchematicResistor(610, CY + CH / 2, false, state.resistance2);
        } else { // lâmpadas + resistores
            // Branch 1: R1 (topo, Y=90, scale=0.7) + Lâmpada 1 (Y=180, scale=0.75)
            let i1 = state.bulb1Burned ? 0.0 : state.voltage / (state.resistance + 10.0);
            drawSchematicResistor(540, CY + 60, false, state.resistance, 0.7);
            drawSchematicBulb(540, CY + 180, i1, state.bulb1Burned, 0.75);

            // Branch 2: R2 (topo, Y=90, scale=0.7) + Lâmpada 2 (Y=180, scale=0.75)
            let i2 = state.bulb2Burned ? 0.0 : state.voltage / (state.resistance2 + 10.0);
            drawSchematicResistor(610, CY + 60, false, state.resistance2, 0.7);
            drawSchematicBulb(610, CY + 180, i2, state.bulb2Burned, 0.75);
        }
    }

    // 7. Desenhar Voltímetros
    if (state.mode === 'series') {
        if (state.loadType === 'resistor') {
            drawVoltmeterProbe(CX + CW - 60, CY, `${state.voltage.toFixed(1)} V`, "#ff9d00", "Ponto A (Entrada)");
            drawVoltmeterProbe(CX + CW - 60, CY + CH, `0.0 V`, "#00bfff", "Ponto B (Saída)");
        } else {
            // Divisor de tensão com 3 medidores
            drawVoltmeterProbe(CX + CW / 2 - 80, CY, `${state.voltage.toFixed(1)} V`, "#ff9d00", "Ponto A (Entrada)");
            
            let loadR = state.loadType === 'bulb' ? 10.0 : 15.0;
            let vMid = state.bulbBurned ? state.voltage : state.current * loadR;
            drawVoltmeterProbe(CX + CW / 2 + 80, CY, `${vMid.toFixed(1)} V`, "#9400D3", "Ponto B (Intermediário)");
            
            drawVoltmeterProbe(CX + CW - 60, CY + CH, `0.0 V`, "#00bfff", "Ponto C (Saída)");
        }
    } else {
        // Paralelo: Queda de tensão é a mesma nas duas pernas
        drawVoltmeterProbe(490 - 40, CY, `${state.voltage.toFixed(1)} V`, "#ff9d00", "Ponto A (Entrada)");
        drawVoltmeterProbe(490 - 40, CY + CH, `0.0 V`, "#00bfff", "Ponto B (Saída)");
    }

    // 8. Sinais de Polaridade
    drawPolaritySigns();

    // 9. Atualiza coordenadas físicas
    animateElectrons();

    requestAnimationFrame(loop);
}

// --- BOOT E INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    initElectrons();
    rebuildResistanceControls();
    calculateOhm();
    audio.playBoot();
    loop();
});
