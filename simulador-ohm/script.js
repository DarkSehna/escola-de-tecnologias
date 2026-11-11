// ==========================================================================
// LABORATÓRIO DE FÍSICA: LEI DE OHM & KIT ARDUINO (V2.0)
// Escola de Tecnologias - Layout Fluido, Anti-Aliasing, Push-Button & Kit Real
// ==========================================================================

(() => {
    'use strict';

    // --- 1. SINTETIZADOR WEB AUDIO API (CLICKS, ALERTAS & BUZZER ATIVO 5V) ---
    class SynthAudio {
        constructor() {
            this.ctx = null;
            this.buzzerOsc = null;
            this.buzzerGain = null;
            this.buzzerActive = false;
        }

        isSoundEnabled() {
            const cb = document.getElementById('checkbox-sound');
            return !cb || cb.checked;
        }

        ensureContext() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return null;
                this.ctx = new AudioCtx();
            }
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return this.ctx;
        }

        playTone(freq, type, duration, volume = 0.05) {
            if (!this.isSoundEnabled()) return;
            try {
                const ctx = this.ensureContext();
                if (!ctx) return;

                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = type;
                osc.frequency.setValueAtTime(freq, ctx.currentTime);

                gain.gain.setValueAtTime(volume, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + duration);
            } catch (_) {}
        }

        playClick() {
            this.playTone(860, 'sine', 0.045, 0.04);
        }

        playSwitch(closed) {
            this.playTone(closed ? 740 : 440, 'triangle', 0.06, 0.05);
        }

        playWarning() {
            this.playTone(190, 'sawtooth', 0.28, 0.07);
            setTimeout(() => this.playTone(150, 'sawtooth', 0.28, 0.07), 70);
        }

        setBuzzerState(shouldBeep) {
            const active = Boolean(shouldBeep) && this.isSoundEnabled();
            if (active === this.buzzerActive) return;

            if (active) {
                try {
                    const ctx = this.ensureContext();
                    if (!ctx) return;
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(920, ctx.currentTime);
                    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 0.04);

                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start();

                    this.buzzerOsc = osc;
                    this.buzzerGain = gain;
                    this.buzzerActive = true;
                } catch (_) {}
            } else {
                this.stopBuzzer();
            }
        }

        stopBuzzer() {
            this.buzzerActive = false;
            if (this.buzzerGain && this.ctx) {
                try {
                    this.buzzerGain.gain.setValueAtTime(this.buzzerGain.gain.value, this.ctx.currentTime);
                    this.buzzerGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.04);
                } catch (_) {}
            }
            if (this.buzzerOsc) {
                const oscRef = this.buzzerOsc;
                setTimeout(() => {
                    try { oscRef.stop(); oscRef.disconnect(); } catch (_) {}
                }, 45);
                this.buzzerOsc = null;
                this.buzzerGain = null;
            }
        }
    }

    const audio = new SynthAudio();
    let lastClickSoundTime = 0;
    function throttleClickSound() {
        const now = Date.now();
        if (now - lastClickSoundTime > 120) {
            audio.playClick();
            lastClickSoundTime = now;
        }
    }

    // --- 2. CONSTANTES DE CORES E COMPONENTES DO KIT ARDUINO ---
    const COLOR_MAP = {
        0: { name: 'Preto', hex: '#111827' },
        1: { name: 'Marrom', hex: '#8B4513' },
        2: { name: 'Vermelho', hex: '#EF4444' },
        3: { name: 'Laranja', hex: '#F97316' },
        4: { name: 'Amarelo', hex: '#EAB308' },
        5: { name: 'Verde', hex: '#16A34A' },
        6: { name: 'Azul', hex: '#2563EB' },
        7: { name: 'Violeta', hex: '#7C3AED' },
        8: { name: 'Cinza', hex: '#6B7280' },
        9: { name: 'Branco', hex: '#F8FAFC' }
    };

    const MULT_MAP = {
        Gold: { name: 'Ouro', hex: '#D4AF37' },
        Black: { name: 'Preto', hex: '#111827' },
        Brown: { name: 'Marrom', hex: '#8B4513' },
        Red: { name: 'Vermelho', hex: '#EF4444' },
        Orange: { name: 'Laranja', hex: '#F97316' },
        Yellow: { name: 'Amarelo', hex: '#EAB308' },
        Green: { name: 'Verde', hex: '#16A34A' },
        Blue: { name: 'Azul', hex: '#2563EB' }
    };

    const LED_COLOR_STYLES = {
        red: { label: 'Vermelho', hex: '#ef4444', glow: 'rgba(239, 68, 68, 0.9)' },
        yellow: { label: 'Amarelo', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.9)' },
        green: { label: 'Verde', hex: '#22c55e', glow: 'rgba(34, 197, 94, 0.9)' }
    };

    const KIT_COMPONENTS_SERIES_SLOT1 = [
        { value: 'resistor', icon: '🛑', short: 'Resistor', label: '🛑 Resistor do Kit (330Ω / 1kΩ / 10kΩ / Livre)' },
        { value: 'potentiometer', icon: '🎛️', short: 'Potenc. 10k', label: '🎛️ Potenciômetro 10 kΩ (0–10.000 Ω)' },
        { value: 'ldr', icon: '☀️', short: 'Sensor LDR', label: '☀️ Sensor LDR (Luminosidade)' },
        { value: 'wire', icon: '➖', short: 'Fio Direto', label: '➖ Fio Direto / Jumper (0 Ω)' }
    ];

    const KIT_COMPONENTS_MAIN = [
        { value: 'led', icon: '💡', short: 'LED', label: '💡 LED (Vermelho / Amarelo / Verde)' },
        { value: 'resistor', icon: '🛑', short: 'Resistor', label: '🛑 Resistor do Kit (330Ω / 1kΩ / 10kΩ / Livre)' },
        { value: 'potentiometer', icon: '🎛️', short: 'Potenc. 10k', label: '🎛️ Potenciômetro 10 kΩ (0–10.000 Ω)' },
        { value: 'ldr', icon: '☀️', short: 'Sensor LDR', label: '☀️ Sensor LDR (Luminosidade)' },
        { value: 'buzzer', icon: '🔊', short: 'Buzzer 5V', label: '🔊 Buzzer Ativo 5V (3V a 5V)' },
        { value: 'motor', icon: '⚙️', short: 'Motor DC', label: '⚙️ Motor DC' }
    ];

    // --- 3. GEOMETRIA DO CIRCUITO NO CANVAS (780 x 430) ---
    const CX = 76;
    const CY = 82;
    const CW = 616;
    const CH = 266;
    const SWITCH_X = 225;
    const SWITCH_Y = CY;
    const SPLIT_X = 460;
    const B1_X = 548;
    const B2_X = 692;

    const PERIMETER_SERIES = (CW + CH) * 2; // 1764 px
    const NUM_ELECTRONS_SERIES = 36;
    const SPACING_SERIES = PERIMETER_SERIES / NUM_ELECTRONS_SERIES; // 49 px

    const PARALLEL_MAIN_LEN = (SPLIT_X - CX) * 2 + CH; // 1034 px
    const NUM_ELECTRONS_PMAIN = 22;
    const SPACING_PMAIN = PARALLEL_MAIN_LEN / NUM_ELECTRONS_PMAIN; // 47 px

    const PARALLEL_B1_LEN = (B1_X - SPLIT_X) * 2 + CH; // 442 px
    const NUM_ELECTRONS_B1 = 10;
    const SPACING_B1 = PARALLEL_B1_LEN / NUM_ELECTRONS_B1; // 44.2 px

    const PARALLEL_B2_LEN = (B2_X - SPLIT_X) * 2 + CH; // 730 px
    const NUM_ELECTRONS_B2 = 16;
    const SPACING_B2 = PARALLEL_B2_LEN / NUM_ELECTRONS_B2; // 45.6 px

    const ELECTRON_SPEED_MULTIPLIER = 120.0; // Otimizado para escala de mA a A (com trava anti-aliasing)

    // --- 4. ESTADO GLOBAL DO SIMULADOR ---
    function createSlot(type = 'resistor', resistance = 330) {
        return {
            type,
            resistance,
            potValue: 1000,
            ldrLight: 70, // 0 (escuro = 100k) -> 100 (luz direta = 300)
            ledColor: 'red',
            parallelSeriesR: 330 // resistor protetor opcional em ramos paralelos com LED/Buzzer
        };
    }

    const state = {
        mode: 'series', // 'series' | 'parallel'
        voltage: 5.0,
        switchClosed: true,
        switchMode: 'toggle', // 'toggle' | 'hold'
        isHoldingCanvasSwitch: false,

        slot1: createSlot('resistor', 330),
        slot2: createSlot('led', 1000),

        branch1: createSlot('led', 330),
        branch2: createSlot('buzzer', 1000),

        // Resultados da simulação
        telemetry: {
            currentTotal: 0,
            i1: 0,
            i2: 0,
            v1: 0,
            v2: 0,
            req: 330,
            led1Overload: false,
            led2Overload: false,
            shortCircuit: false,
            buzzerActive: false,
            buzzerOvervolt: false,
            buzzerUndervolt: false
        },

        // Animações
        motor1Rot: 0,
        motor2Rot: 0,
        blinkPhase: 0,
        electronsSeries: [],
        electronsParallelMain: [],
        electronsParallelB1: [],
        electronsParallelB2: []
    };

    // Padrão educativo inicial: Paralelo ramo 1 LED com 330Ω e ramo 2 Buzzer direto em 5V
    state.branch1.parallelSeriesR = 330;
    state.branch2.parallelSeriesR = 0;

    function initElectrons() {
        state.electronsSeries = Array.from({ length: NUM_ELECTRONS_SERIES }, (_, i) => i * SPACING_SERIES);
        state.electronsParallelMain = Array.from({ length: NUM_ELECTRONS_PMAIN }, (_, i) => i * SPACING_PMAIN);
        state.electronsParallelB1 = Array.from({ length: NUM_ELECTRONS_B1 }, (_, i) => i * SPACING_B1);
        state.electronsParallelB2 = Array.from({ length: NUM_ELECTRONS_B2 }, (_, i) => i * SPACING_B2);
    }

    // --- 5. REFERÊNCIAS DA DOM ---
    const canvas = document.getElementById('circuit-canvas');
    const ctx = canvas.getContext('2d');

    const tabBtnSeries = document.getElementById('tab-btn-series');
    const tabBtnParallel = document.getElementById('tab-btn-parallel');

    const btnToggleSwitch = document.getElementById('btn-toggle-switch');
    const switchStatusLabel = document.getElementById('switch-status-label');
    const btnModeToggle = document.getElementById('btn-mode-toggle');
    const btnModeHold = document.getElementById('btn-mode-hold');

    const inputVoltage = document.getElementById('input-voltage');
    const sliderVoltage = document.getElementById('slider-voltage');
    const presetVoltButtons = document.querySelectorAll('.preset-btn');

    const kitSlotsContainer = document.getElementById('kit-slots-container');
    const ammeterTitle = document.getElementById('ammeter-title');
    const ammeterSubtitle = document.getElementById('ammeter-subtitle');
    const hudReqReadout = document.getElementById('hud-req-readout');
    const ammeterReadout = document.getElementById('ammeter-readout');

    const formulaPanelTitle = document.getElementById('formula-panel-title');
    const formulaErrorMsg = document.getElementById('formula-error-msg');
    const warningTitle = document.getElementById('warning-title');
    const warningText = document.getElementById('warning-text');
    const formulaOpenMsg = document.getElementById('formula-open-msg');
    const formulaMathDisplay = document.getElementById('formula-math-display');
    const formulaLblLeft = document.getElementById('formula-lbl-left');
    const formulaNumLbl = document.getElementById('formula-num-lbl');
    const formulaDenomLbl = document.getElementById('formula-denom-lbl');
    const telemetryMiniGrid = document.getElementById('telemetry-mini-grid');
    const formulaCalculationDetails = document.getElementById('formula-calculation-details');

    const resistor1WidgetContainer = document.getElementById('resistor1-widget-container');
    const resistor1WidgetTitle = document.getElementById('resistor1-widget-title');
    const band1 = document.getElementById('band-1');
    const band2 = document.getElementById('band-2');
    const band3 = document.getElementById('band-3');
    const band4 = document.getElementById('band-4');
    const resistorColorsTextList = document.getElementById('resistor-colors-text-list');

    const resistor2WidgetContainer = document.getElementById('resistor2-widget-container');
    const resistor2WidgetTitle = document.getElementById('resistor2-widget-title');
    const band21 = document.getElementById('band2-1');
    const band22 = document.getElementById('band2-2');
    const band23 = document.getElementById('band2-3');
    const band24 = document.getElementById('band2-4');
    const resistor2ColorsTextList = document.getElementById('resistor2-colors-text-list');
    const bandsEmptyNote = document.getElementById('bands-empty-note');

    const statusMessage = document.getElementById('lbl-status-message');
    const checkboxSound = document.getElementById('checkbox-sound');

    // --- 6. FUNÇÕES AUXILIARES DE FÍSICA & FORMATAÇÃO ---
    function ldrLightToResistance(lightPct) {
        const l = Math.max(0, Math.min(100, lightPct));
        const r = 100000 * Math.pow(300 / 100000, l / 100);
        return Math.round(r);
    }

    function getSlotOhmicResistance(slot, isParallelBranch = false) {
        let baseR = 0;
        switch (slot.type) {
            case 'wire':
                baseR = 0;
                break;
            case 'resistor':
                baseR = Math.max(1, slot.resistance);
                break;
            case 'potentiometer':
                baseR = Math.max(0, slot.potValue);
                break;
            case 'ldr':
                baseR = ldrLightToResistance(slot.ldrLight);
                break;
            case 'led':
                baseR = 10; // Resistência dinâmica pequena após vencer Vf = 2.0V
                break;
            case 'buzzer':
                baseR = 200; // Carga típica ~25mA em 5V
                break;
            case 'motor':
                baseR = 15; // Enrolamento DC
                break;
            default:
                baseR = 330;
        }
        if (isParallelBranch && (slot.type === 'led' || slot.type === 'buzzer' || slot.type === 'motor')) {
            baseR += Math.max(0, slot.parallelSeriesR || 0);
        }
        return baseR;
    }

    function getSlotForwardVoltage(slot) {
        return slot.type === 'led' ? 2.0 : 0.0;
    }

    function formatResistance(val) {
        if (!Number.isFinite(val)) return '∞ Ω';
        if (val >= 1000) {
            const k = val / 1000;
            return `${Number.isInteger(k) ? k : k.toFixed(2).replace(/\.?0+$/, '')} kΩ`;
        }
        return `${Math.round(val)} Ω`;
    }

    function formatPlainNumber(val) {
        return Math.round(val).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function formatCurrent(val) {
        if (!Number.isFinite(val) || val <= 0.000005) return '0.00 A';
        if (val >= 1.0) return `${val.toFixed(2)} A`;
        const ma = val * 1000;
        return ma >= 10 ? `${ma.toFixed(1)} mA` : `${ma.toFixed(2)} mA`;
    }

    function getResistorColors(val) {
        const safeVal = Math.max(1, Math.min(100000, Math.round(val)));
        let exp = Math.floor(Math.log10(safeVal));
        let digit1, digit2, mult;

        if (exp < 1) {
            digit1 = Math.floor(safeVal);
            digit2 = 0;
            mult = 'Gold';
        } else {
            const valNorm = safeVal / Math.pow(10, exp - 1);
            digit1 = Math.floor(valNorm / 10);
            digit2 = Math.round(valNorm % 10);
            if (digit2 >= 10) {
                digit1 += 1;
                digit2 = 0;
                if (digit1 >= 10) {
                    digit1 = 1;
                    exp += 1;
                }
            }
            const multColors = {
                0: 'Black',
                1: 'Brown',
                2: 'Red',
                3: 'Orange',
                4: 'Yellow',
                5: 'Green',
                6: 'Blue'
            };
            mult = multColors[exp - 1] || 'Black';
        }

        const c1 = COLOR_MAP[digit1] || COLOR_MAP[1];
        const c2 = COLOR_MAP[digit2] || COLOR_MAP[0];
        const c3 = MULT_MAP[mult] || MULT_MAP.Black;
        const c4 = { name: 'Ouro', hex: '#D4AF37' };

        return [
            [c1.hex, c2.hex, c3.hex, c4.hex],
            [c1.name, c2.name, c3.name, c4.name]
        ];
    }

    // --- 7. SOLUCIONADOR FÍSICO (SÉRIE & PARALELO) ---
    function solveCircuit() {
        const prevLedOverload = state.telemetry.led1Overload || state.telemetry.led2Overload;
        const t = {
            currentTotal: 0,
            i1: 0,
            i2: 0,
            v1: 0,
            v2: 0,
            req: Infinity,
            led1Overload: false,
            led2Overload: false,
            shortCircuit: false,
            buzzerActive: false,
            buzzerOvervolt: false,
            buzzerUndervolt: false
        };

        if (!state.switchClosed) {
            state.telemetry = t;
            audio.setBuzzerState(false);
            updateUIAll();
            return;
        }

        if (state.mode === 'series') {
            const r1 = getSlotOhmicResistance(state.slot1, false);
            const r2 = getSlotOhmicResistance(state.slot2, false);
            const vf1 = getSlotForwardVoltage(state.slot1);
            const vf2 = getSlotForwardVoltage(state.slot2);
            const vfTotal = vf1 + vf2;
            const rOhmicTotal = r1 + r2;

            t.req = rOhmicTotal;

            if (rOhmicTotal < 0.5 && vfTotal === 0) {
                t.shortCircuit = true;
                t.currentTotal = state.voltage / 0.5;
                t.v1 = 0;
                t.v2 = state.voltage;
            } else if (state.voltage <= vfTotal && vfTotal > 0) {
                // LED bloqueado abaixo da tensão direta (~2V)
                t.currentTotal = 0;
                if (vf1 > 0 && vf2 > 0) {
                    t.v1 = state.voltage / 2;
                    t.v2 = state.voltage / 2;
                } else if (vf1 > 0) {
                    t.v1 = state.voltage;
                    t.v2 = 0;
                } else {
                    t.v1 = 0;
                    t.v2 = state.voltage;
                }
            } else {
                const vNet = state.voltage - vfTotal;
                const current = vNet / Math.max(0.5, rOhmicTotal);
                t.currentTotal = current;
                t.v1 = vf1 + current * r1;
                t.v2 = vf2 + current * r2;

                if (state.slot1.type === 'led' && current > 0.03) t.led1Overload = true;
                if (state.slot2.type === 'led' && current > 0.03) t.led2Overload = true;

                // Verifica Buzzer 5V em Série
                if (state.slot2.type === 'buzzer') {
                    if (t.v2 >= 3.0 && t.v2 <= 5.05) t.buzzerActive = true;
                    else if (t.v2 > 5.05) t.buzzerOvervolt = true;
                    else t.buzzerUndervolt = true;
                }
            }
            t.i1 = t.currentTotal;
            t.i2 = t.currentTotal;
        } else {
            // CIRCUITO EM PARALELO: dois ramos recebem V_bat independentemente
            function solveBranch(branch) {
                const r = getSlotOhmicResistance(branch, true);
                const vf = getSlotForwardVoltage(branch);
                let i = 0;
                let ledOver = false;
                let short = false;

                if (r < 0.5 && vf === 0) {
                    short = true;
                    i = state.voltage / 0.5;
                } else if (state.voltage <= vf && vf > 0) {
                    i = 0;
                } else {
                    i = (state.voltage - vf) / Math.max(0.5, r);
                    if (branch.type === 'led' && i > 0.03) {
                        ledOver = true;
                    }
                }

                // Tensão efetiva sobre o componente (descontando resistor protetor no ramo)
                const vSeriesDrop = (branch.type === 'led' || branch.type === 'buzzer' || branch.type === 'motor')
                    ? i * (branch.parallelSeriesR || 0)
                    : 0;
                const vComp = Math.max(0, state.voltage - vSeriesDrop);

                return { i, r, ledOver, short, vComp };
            }

            const b1 = solveBranch(state.branch1);
            const b2 = solveBranch(state.branch2);

            t.i1 = b1.i;
            t.i2 = b2.i;
            t.v1 = state.voltage;
            t.v2 = state.voltage;
            t.currentTotal = b1.i + b2.i;
            t.req = t.currentTotal > 0.00001 ? state.voltage / t.currentTotal : Infinity;
            t.led1Overload = b1.ledOver;
            t.led2Overload = b2.ledOver;
            t.shortCircuit = b1.short || b2.short;

            [
                { br: state.branch1, res: b1 },
                { br: state.branch2, res: b2 }
            ].forEach(({ br, res }) => {
                if (br.type === 'buzzer') {
                    if (res.vComp >= 3.0 && res.vComp <= 5.05) t.buzzerActive = true;
                    else if (res.vComp > 5.05) t.buzzerOvervolt = true;
                    else t.buzzerUndervolt = true;
                }
            });
        }

        state.telemetry = t;

        const nowOverload = t.led1Overload || t.led2Overload;
        if (nowOverload && !prevLedOverload) {
            audio.playWarning();
        }
        audio.setBuzzerState(t.buzzerActive);

        updateUIAll();
    }

    // --- 8. CONSTRUÇÃO DINÂMICA DOS CARDS DO KIT ARDUINO ---
    function getSlotPaletteHTML(slotKey, optionsList, selectedVal) {
        return optionsList
            .map(opt => `
                <button type="button" class="kit-tile-btn ${opt.value === selectedVal ? 'active' : ''}" data-slot="${slotKey}" data-comp-type="${opt.value}" title="${opt.label}">
                    <span class="tile-ico">${opt.icon}</span>
                    <span>${opt.short}</span>
                </button>
            `)
            .join('');
    }

    function buildSlotCardHTML(slotKey, title, badgeClass, slotObj, isSeriesSlot1, isParallel) {
        const optionsList = isSeriesSlot1 ? KIT_COMPONENTS_SERIES_SLOT1 : KIT_COMPONENTS_MAIN;
        let controlsHTML = '';

        if (slotObj.type === 'resistor') {
            const isPreset = [330, 1000, 10000].includes(Math.round(slotObj.resistance));
            controlsHTML = `
                <div class="kit-quick-resistors">
                    <button type="button" class="kit-res-btn ${slotObj.resistance === 330 ? 'active' : ''}" data-slot="${slotKey}" data-res="330">330 Ω</button>
                    <button type="button" class="kit-res-btn ${slotObj.resistance === 1000 ? 'active' : ''}" data-slot="${slotKey}" data-res="1000">1 kΩ</button>
                    <button type="button" class="kit-res-btn ${slotObj.resistance === 10000 ? 'active' : ''}" data-slot="${slotKey}" data-res="10000">10 kΩ</button>
                    <button type="button" class="kit-res-btn ${!isPreset ? 'active' : ''}" data-slot="${slotKey}" data-res="manual">Livre</button>
                </div>
                <div class="kit-subcontrol">
                    <div class="kit-subcontrol-row">
                        <span>Modo Manual Livre:</span>
                        <div class="digital-input-wrapper color-resistance">
                            <input type="number" class="slot-res-input" data-slot="${slotKey}" min="1" max="100000" value="${Math.round(slotObj.resistance)}">
                            <span class="unit">Ω</span>
                        </div>
                    </div>
                    <input type="range" class="cyber-range range-resistance slot-res-slider" data-slot="${slotKey}" min="1" max="10000" step="10" value="${Math.min(10000, Math.round(slotObj.resistance))}">
                </div>
            `;
        } else if (slotObj.type === 'potentiometer') {
            controlsHTML = `
                <div class="kit-subcontrol">
                    <div class="kit-subcontrol-row">
                        <span>🎛️ Curso do Potenciômetro:</span>
                        <strong style="font-family:'JetBrains Mono',monospace;color:#d8b4fe;" id="pot-val-${slotKey}">${formatResistance(slotObj.potValue)}</strong>
                    </div>
                    <input type="range" class="cyber-range range-pot slot-pot-slider" data-slot="${slotKey}" min="0" max="10000" step="50" value="${slotObj.potValue}">
                    <span class="kit-info-pill">Ajuste contínuo de <strong>0 Ω</strong> a <strong>10.000 Ω</strong>.</span>
                </div>
            `;
        } else if (slotObj.type === 'ldr') {
            const rLdr = ldrLightToResistance(slotObj.ldrLight);
            controlsHTML = `
                <div class="kit-subcontrol">
                    <div class="kit-subcontrol-row">
                        <span>☀️ Luminosidade Ambiente:</span>
                        <strong style="font-family:'JetBrains Mono',monospace;color:#fde047;" id="ldr-val-${slotKey}">${slotObj.ldrLight}% (${formatResistance(rLdr)})</strong>
                    </div>
                    <input type="range" class="cyber-range range-ldr slot-ldr-slider" data-slot="${slotKey}" min="0" max="100" step="1" value="${slotObj.ldrLight}">
                    <span class="kit-info-pill">Escuro (0%): <strong>100 kΩ</strong> • Luz direta (100%): <strong>300 Ω</strong>.</span>
                </div>
            `;
        } else if (slotObj.type === 'led') {
            controlsHTML = `
                <div class="kit-subcontrol">
                    <div class="kit-subcontrol-row">
                        <span>Cor do LED (Vf ≈ 2.0V | Máx 30mA):</span>
                    </div>
                    <div class="led-color-pills">
                        <button type="button" class="led-color-btn ${slotObj.ledColor === 'red' ? 'active' : ''}" data-slot="${slotKey}" data-led-color="red">🔴 Vermelho</button>
                        <button type="button" class="led-color-btn ${slotObj.ledColor === 'yellow' ? 'active' : ''}" data-slot="${slotKey}" data-led-color="yellow">🟡 Amarelo</button>
                        <button type="button" class="led-color-btn ${slotObj.ledColor === 'green' ? 'active' : ''}" data-slot="${slotKey}" data-led-color="green">🟢 Verde</button>
                    </div>
                    ${isParallel ? buildParallelSeriesLimiterHTML(slotKey, slotObj) : `<span class="kit-info-pill">Use um resistor em série (ex: <strong>330 Ω</strong>) se a bateria passar de 2.3V!</span>`}
                </div>
            `;
        } else if (slotObj.type === 'buzzer') {
            controlsHTML = `
                <div class="kit-subcontrol">
                    <span class="kit-info-pill">🔊 <strong>Buzzer Ativo 5V:</strong> emite som contínuo suave (Web Audio) quando a tensão nele está entre <strong>3.0V e 5.0V</strong>.</span>
                    ${isParallel ? buildParallelSeriesLimiterHTML(slotKey, slotObj) : ''}
                </div>
            `;
        } else if (slotObj.type === 'motor') {
            controlsHTML = `
                <div class="kit-subcontrol">
                    <span class="kit-info-pill">⚙️ <strong>Motor DC (15 Ω):</strong> velocidade de giro do rotor proporcional à corrente elétrica recebida.</span>
                    ${isParallel ? buildParallelSeriesLimiterHTML(slotKey, slotObj) : ''}
                </div>
            `;
        } else if (slotObj.type === 'wire') {
            controlsHTML = `
                <div class="kit-subcontrol">
                    <span class="kit-info-pill">➖ <strong>Fio Direto (0 Ω):</strong> conecta o próximo componente diretamente na bateria (cuidado com LEDs sem resistor!).</span>
                </div>
            `;
        }

        return `
            <div class="kit-slot-card ${badgeClass}">
                <div class="kit-slot-header">
                    <span class="kit-slot-badge">${title}</span>
                    <span class="kit-slot-telemetry-tag" id="tag-${slotKey}">--</span>
                </div>
                <div class="kit-palette-grid ${optionsList.length === 4 ? 'cols-4' : ''}" role="group" aria-label="${title}">
                    ${getSlotPaletteHTML(slotKey, optionsList, slotObj.type)}
                </div>
                ${controlsHTML}
            </div>
        `;
    }

    function buildParallelSeriesLimiterHTML(slotKey, slotObj) {
        const rProt = slotObj.parallelSeriesR || 0;
        return `
            <div style="margin-top:0.35rem; border-top:1px dashed rgba(148,163,184,0.2); padding-top:0.45rem;">
                <div class="kit-subcontrol-row" style="margin-bottom:0.3rem;">
                    <span>Resistor limitador neste ramo:</span>
                </div>
                <div class="kit-quick-resistors">
                    <button type="button" class="kit-res-btn ${rProt === 0 ? 'active' : ''}" data-slot="${slotKey}" data-par-res="0">0 Ω (Direto)</button>
                    <button type="button" class="kit-res-btn ${rProt === 330 ? 'active' : ''}" data-slot="${slotKey}" data-par-res="330">330 Ω</button>
                    <button type="button" class="kit-res-btn ${rProt === 1000 ? 'active' : ''}" data-slot="${slotKey}" data-par-res="1000">1 kΩ</button>
                </div>
            </div>
        `;
    }

    function rebuildKitSlotsUI() {
        if (state.mode === 'series') {
            kitSlotsContainer.innerHTML =
                buildSlotCardHTML('slot1', '📦 COMPONENTE 1 (TOPO / ENTRADA)', 'slot-1', state.slot1, true, false) +
                buildSlotCardHTML('slot2', '📦 COMPONENTE 2 (CARGA PRINCIPAL)', 'slot-2', state.slot2, false, false);
        } else {
            kitSlotsContainer.innerHTML =
                buildSlotCardHTML('branch1', '🔀 RAMO 1 (PARALELO)', 'slot-1', state.branch1, false, true) +
                buildSlotCardHTML('branch2', '🔀 RAMO 2 (PARALELO)', 'slot-2', state.branch2, false, true);
        }
        updateSlotTelemetryTags();
    }

    function updateSlotTelemetryTags() {
        const t = state.telemetry;
        if (state.mode === 'series') {
            const tag1 = document.getElementById('tag-slot1');
            const tag2 = document.getElementById('tag-slot2');
            if (tag1) tag1.textContent = `V1 = ${t.v1.toFixed(2)} V`;
            if (tag2) tag2.textContent = `V2 = ${t.v2.toFixed(2)} V`;
        } else {
            const tag1 = document.getElementById('tag-branch1');
            const tag2 = document.getElementById('tag-branch2');
            if (tag1) tag1.textContent = `I1 = ${formatCurrent(t.i1)}`;
            if (tag2) tag2.textContent = `I2 = ${formatCurrent(t.i2)}`;
        }
    }

    // Delegação de eventos para os cards do Kit Arduino
    kitSlotsContainer.addEventListener('change', (e) => {
        const numInput = e.target.closest('.slot-res-input');
        if (numInput) {
            const key = numInput.dataset.slot;
            let val = parseFloat(numInput.value);
            if (isNaN(val)) val = 330;
            val = Math.max(1, Math.min(100000, Math.round(val)));
            state[key].resistance = val;
            numInput.value = val;
            audio.playClick();
            rebuildKitSlotsUI();
            solveCircuit();
        }
    });

    kitSlotsContainer.addEventListener('input', (e) => {
        const resSlider = e.target.closest('.slot-res-slider');
        if (resSlider) {
            const key = resSlider.dataset.slot;
            const val = parseInt(resSlider.value, 10) || 1;
            state[key].resistance = val;
            const input = kitSlotsContainer.querySelector(`.slot-res-input[data-slot="${key}"]`);
            if (input) input.value = val;
            resSlider.closest('.kit-slot-card').querySelectorAll('.kit-res-btn').forEach(btn => {
                const isManual = btn.dataset.res === 'manual';
                btn.classList.toggle('active', isManual);
            });
            throttleClickSound();
            solveCircuit();
            return;
        }

        const potSlider = e.target.closest('.slot-pot-slider');
        if (potSlider) {
            const key = potSlider.dataset.slot;
            const val = parseInt(potSlider.value, 10) || 0;
            state[key].potValue = val;
            const lbl = document.getElementById(`pot-val-${key}`);
            if (lbl) lbl.textContent = formatResistance(val);
            throttleClickSound();
            solveCircuit();
            return;
        }

        const ldrSlider = e.target.closest('.slot-ldr-slider');
        if (ldrSlider) {
            const key = ldrSlider.dataset.slot;
            const pct = parseInt(ldrSlider.value, 10) || 0;
            state[key].ldrLight = pct;
            const lbl = document.getElementById(`ldr-val-${key}`);
            if (lbl) lbl.textContent = `${pct}% (${formatResistance(ldrLightToResistance(pct))})`;
            throttleClickSound();
            solveCircuit();
        }
    });

    kitSlotsContainer.addEventListener('click', (e) => {
        const tileBtn = e.target.closest('.kit-tile-btn');
        if (tileBtn) {
            const key = tileBtn.dataset.slot;
            const compType = tileBtn.dataset.compType;
            if (state[key].type !== compType) {
                state[key].type = compType;
                if (compType === 'led' && state.mode === 'parallel' && state[key].parallelSeriesR === undefined) {
                    state[key].parallelSeriesR = 330;
                }
                audio.playClick();
                rebuildKitSlotsUI();
                solveCircuit();
            }
            return;
        }

        const resBtn = e.target.closest('.kit-res-btn');
        if (resBtn) {
            const key = resBtn.dataset.slot;
            if (resBtn.dataset.parRes !== undefined) {
                state[key].parallelSeriesR = parseInt(resBtn.dataset.parRes, 10) || 0;
                audio.playClick();
                rebuildKitSlotsUI();
                solveCircuit();
                return;
            }
            if (resBtn.dataset.res === 'manual') {
                const inp = kitSlotsContainer.querySelector(`.slot-res-input[data-slot="${key}"]`);
                if (inp) { inp.focus(); inp.select(); }
                return;
            }
            const val = parseInt(resBtn.dataset.res, 10) || 330;
            state[key].resistance = val;
            audio.playClick();
            rebuildKitSlotsUI();
            solveCircuit();
            return;
        }

        const ledBtn = e.target.closest('.led-color-btn');
        if (ledBtn) {
            const key = ledBtn.dataset.slot;
            state[key].ledColor = ledBtn.dataset.ledColor;
            audio.playClick();
            rebuildKitSlotsUI();
            solveCircuit();
        }
    });

    // --- 9. ATUALIZAÇÃO DA INTERFACE DIREITA (FÓRMULAS, VOLTÍMETROS & CORES) ---
    function updateUIAll() {
        const t = state.telemetry;

        // Botão da Chave Táctil
        btnToggleSwitch.classList.toggle('is-closed', state.switchClosed);
        btnToggleSwitch.classList.toggle('is-open', !state.switchClosed);
        switchStatusLabel.textContent = state.switchClosed
            ? 'Chave Táctil: FECHADA (Ligado)'
            : 'Chave Táctil: ABERTA (Desligado)';

        // Amperímetro
        ammeterTitle.textContent = state.mode === 'series'
            ? 'AMPERÍMETRO (CORRENTE EM SÉRIE)'
            : 'AMPERÍMETRO CENTRAL (I_total = I1 + I2)';
        ammeterReadout.textContent = formatCurrent(t.currentTotal);
        hudReqReadout.textContent = `Req = ${formatResistance(t.req)}`;

        updateSlotTelemetryTags();
        updateFormulaPanel();
        updateResistorColorBandsPanel();
        updateStatusBar();
    }

    function updateFormulaPanel() {
        const t = state.telemetry;
        const isLedOverload = t.led1Overload || t.led2Overload;

        formulaPanelTitle.textContent = state.mode === 'series'
            ? '📊 LEI DE OHM EM SÉRIE'
            : '📊 LEI DE OHM EM PARALELO';

        if (!state.switchClosed) {
            formulaErrorMsg.classList.add('hidden');
            formulaOpenMsg.classList.remove('hidden');
            formulaMathDisplay.classList.add('hidden');
        } else if (isLedOverload || t.shortCircuit) {
            formulaErrorMsg.classList.remove('hidden');
            formulaOpenMsg.classList.add('hidden');
            formulaMathDisplay.classList.add('hidden');
            if (isLedOverload) {
                warningTitle.textContent = 'LED DANIFICADO POR SOBRECARGA!';
                warningText.textContent = 'Corrente acima de 30 mA detectada! Adicione ou aumente o resistor limitador (ex: 330 Ω) para proteger o LED.';
            } else {
                warningTitle.textContent = 'CURTO-CIRCUITO DETECTADO!';
                warningText.textContent = 'Resistência próxima a 0 Ω direto na bateria. Aumente a resistência do potenciômetro ou adicione um resistor.';
            }
        } else {
            formulaErrorMsg.classList.add('hidden');
            formulaOpenMsg.classList.add('hidden');
            formulaMathDisplay.classList.remove('hidden');

            const scaleV = 0.88 + (state.voltage / 24.0) * 0.25;
            const scaleI = 0.88 + Math.min(1, Math.sqrt(t.currentTotal) * 0.45) * 0.25;
            const rRef = Number.isFinite(t.req) ? Math.max(1, t.req) : 100000;
            const scaleR = 0.88 + (Math.log10(rRef) / 5.0) * 0.25;

            if (state.mode === 'series') {
                const vfTotal = getSlotForwardVoltage(state.slot1) + getSlotForwardVoltage(state.slot2);
                const numLabel = vfTotal > 0 ? `V - ${vfTotal.toFixed(0)}V` : 'V';
                if (formulaLblLeft) formulaLblLeft.textContent = 'Corrente (I)';
                formulaNumLbl.textContent = vfTotal > 0 ? `Tensão Útil (V - V_LED)` : 'Tensão (V)';
                formulaDenomLbl.textContent = 'Req = R1 + R2';

                formulaMathDisplay.innerHTML = `
                    <div class="math-left"><span class="math-var var-i" style="transform:scale(${scaleI})">I</span></div>
                    <div class="math-equal">=</div>
                    <div class="math-fraction">
                        <span class="math-var var-v" style="transform:scale(${scaleV})">${numLabel}</span>
                        <div class="fraction-line"></div>
                        <span class="math-var var-r" style="transform:scale(${scaleR})">R1 + R2</span>
                    </div>
                `;
            } else {
                if (formulaLblLeft) formulaLblLeft.textContent = 'Corrente Total (It)';
                formulaNumLbl.textContent = 'Ramo 1 (I1)';
                formulaDenomLbl.textContent = 'Ramo 2 (I2)';
                formulaMathDisplay.innerHTML = `
                    <div class="math-left"><span class="math-var var-i" style="transform:scale(${scaleI})">It</span></div>
                    <div class="math-equal">=</div>
                    <div class="math-fraction">
                        <span class="math-var var-v" style="transform:scale(${scaleV})">I1</span>
                    </div>
                    <div class="math-equal">+</div>
                    <div class="math-fraction">
                        <span class="math-var var-low" style="transform:scale(${scaleV})">I2</span>
                    </div>
                `;
            }
        }

        // Mini-cards de telemetria
        if (state.mode === 'series') {
            telemetryMiniGrid.innerHTML = `
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Queda V1</span>
                    <span class="tele-mini-val" style="color:var(--color-wire-high);">${t.v1.toFixed(2)} V</span>
                </div>
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Queda V2</span>
                    <span class="tele-mini-val" style="color:var(--color-wire-low);">${t.v2.toFixed(2)} V</span>
                </div>
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Req (R1+R2)</span>
                    <span class="tele-mini-val">${formatResistance(t.req)}</span>
                </div>
            `;
            formulaCalculationDetails.textContent = state.switchClosed
                ? `V1 (${t.v1.toFixed(2)}V) + V2 (${t.v2.toFixed(2)}V) = ${(t.v1 + t.v2).toFixed(2)}V`
                : 'Chave Táctil aberta → V1 = 0.00V | V2 = 0.00V | I = 0.00 A';
        } else {
            telemetryMiniGrid.innerHTML = `
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Corrente I1</span>
                    <span class="tele-mini-val" style="color:var(--color-wire-high);">${formatCurrent(t.i1)}</span>
                </div>
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Corrente I2</span>
                    <span class="tele-mini-val" style="color:var(--color-wire-low);">${formatCurrent(t.i2)}</span>
                </div>
                <div class="tele-mini-card">
                    <span class="tele-mini-lbl">Req Total</span>
                    <span class="tele-mini-val">${formatResistance(t.req)}</span>
                </div>
            `;
            formulaCalculationDetails.textContent = state.switchClosed
                ? `I_total = ${formatCurrent(t.i1)} + ${formatCurrent(t.i2)} = ${formatCurrent(t.currentTotal)}`
                : 'Chave Táctil aberta → I1 = 0.00 A | I2 = 0.00 A | It = 0.00 A';
        }
    }

    function updateResistorColorBandsPanel() {
        const sA = state.mode === 'series' ? state.slot1 : state.branch1;
        const sB = state.mode === 'series' ? state.slot2 : state.branch2;

        const resistorsToShow = [];
        if (sA.type === 'resistor') {
            resistorsToShow.push({ title: state.mode === 'series' ? 'Resistor 1 (Entrada)' : 'Resistor Ramo 1', val: sA.resistance });
        } else if (state.mode === 'parallel' && sA.parallelSeriesR > 0 && (sA.type === 'led' || sA.type === 'buzzer' || sA.type === 'motor')) {
            resistorsToShow.push({ title: 'Limitador Ramo 1', val: sA.parallelSeriesR });
        }

        if (sB.type === 'resistor') {
            resistorsToShow.push({ title: state.mode === 'series' ? 'Resistor 2 (Saída)' : 'Resistor Ramo 2', val: sB.resistance });
        } else if (state.mode === 'parallel' && sB.parallelSeriesR > 0 && (sB.type === 'led' || sB.type === 'buzzer' || sB.type === 'motor')) {
            resistorsToShow.push({ title: 'Limitador Ramo 2', val: sB.parallelSeriesR });
        }

        if (resistorsToShow.length === 0) {
            resistor1WidgetContainer.classList.add('hidden');
            resistor2WidgetContainer.classList.add('hidden');
            bandsEmptyNote.classList.remove('hidden');
            return;
        }

        bandsEmptyNote.classList.add('hidden');
        resistor1WidgetContainer.classList.remove('hidden');

        const r1 = resistorsToShow[0];
        const [hex1, names1] = getResistorColors(r1.val);
        resistor1WidgetTitle.textContent = `${r1.title} — ${formatResistance(r1.val)}`;
        band1.style.backgroundColor = hex1[0];
        band2.style.backgroundColor = hex1[1];
        band3.style.backgroundColor = hex1[2];
        band4.style.backgroundColor = hex1[3];
        resistorColorsTextList.textContent = `Cores: ${names1.join(', ')}`;

        if (resistorsToShow.length > 1) {
            const r2 = resistorsToShow[1];
            const [hex2, names2] = getResistorColors(r2.val);
            resistor2WidgetContainer.classList.remove('hidden');
            resistor2WidgetTitle.textContent = `🎨 ${r2.title} — ${formatResistance(r2.val)}`;
            band21.style.backgroundColor = hex2[0];
            band22.style.backgroundColor = hex2[1];
            band23.style.backgroundColor = hex2[2];
            band24.style.backgroundColor = hex2[3];
            resistor2ColorsTextList.textContent = `Cores: ${names2.join(', ')}`;
        } else {
            resistor2WidgetContainer.classList.add('hidden');
        }
    }

    function updateStatusBar() {
        const t = state.telemetry;
        if (!state.switchClosed) {
            statusMessage.textContent = '[ CHAVE ABERTA ] Circuito interrompido. Corrente = 0.00 A | Carga sem tensão.';
            statusMessage.style.color = '#fca5a5';
        } else if (t.led1Overload || t.led2Overload) {
            statusMessage.textContent = '[ ALERTA DE SOBRECARGA ] LED acima de 30 mA! Adicione ou aumente o resistor limitador.';
            statusMessage.style.color = '#ff4455';
        } else if (t.buzzerOvervolt) {
            statusMessage.textContent = '[ AVISO BUZZER 5V ] Tensão acima de 5.0V no Buzzer! Reduza a fonte ou use resistor.';
            statusMessage.style.color = '#fbbf24';
        } else if (t.buzzerActive) {
            statusMessage.textContent = '[ BUZZER ATIVO 5V ] Faixa ideal atingida (3V–5V) — Buzzer tocando!';
            statusMessage.style.color = '#34d399';
        } else {
            statusMessage.textContent = `[ STATUS ] Fonte: ${state.voltage.toFixed(1)}V | Corrente Total: ${formatCurrent(t.currentTotal)} | Req: ${formatResistance(t.req)}`;
            statusMessage.style.color = 'var(--color-text-muted)';
        }
    }

    // --- 10. EVENTOS DA CHAVE TÁCTIL, TENSÃO E ABAS ---
    function setSwitchState(closed, playAudio = true) {
        if (state.switchClosed === closed) return;
        state.switchClosed = closed;
        if (playAudio) audio.playSwitch(closed);
        solveCircuit();
    }

    btnToggleSwitch.addEventListener('click', () => {
        if (state.switchMode === 'toggle') {
            setSwitchState(!state.switchClosed);
        }
    });

    btnToggleSwitch.addEventListener('pointerdown', () => {
        if (state.switchMode === 'hold') {
            setSwitchState(true);
        }
    });
    window.addEventListener('pointerup', () => {
        if (state.switchMode === 'hold' && state.switchClosed) {
            setSwitchState(false);
        }
        if (state.isHoldingCanvasSwitch) {
            state.isHoldingCanvasSwitch = false;
            if (state.switchMode === 'hold') setSwitchState(false);
        }
    });

    btnModeToggle.addEventListener('click', () => {
        state.switchMode = 'toggle';
        btnModeToggle.classList.add('active');
        btnModeHold.classList.remove('active');
        audio.playClick();
    });

    btnModeHold.addEventListener('click', () => {
        state.switchMode = 'hold';
        btnModeHold.classList.add('active');
        btnModeToggle.classList.remove('active');
        setSwitchState(false);
    });

    // Atalho barra de espaço para testar o Push-Button rapidamente
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            if (state.switchMode === 'hold') {
                if (!e.repeat) setSwitchState(true);
            } else if (!e.repeat) {
                setSwitchState(!state.switchClosed);
            }
        }
    });
    document.addEventListener('keyup', (e) => {
        if (e.code === 'Space' && state.switchMode === 'hold' && !['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            setSwitchState(false);
        }
    });

    // Clique/Toque direto na Chave Táctil desenhada no Canvas
    function getCanvasCoords(ev) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (ev.clientX - rect.left) * scaleX,
            y: (ev.clientY - rect.top) * scaleY
        };
    }

    function isNearPushButton(pt) {
        return Math.abs(pt.x - SWITCH_X) <= 44 && Math.abs(pt.y - SWITCH_Y) <= 32;
    }

    canvas.addEventListener('pointermove', (ev) => {
        const pt = getCanvasCoords(ev);
        canvas.style.cursor = isNearPushButton(pt) ? 'pointer' : 'default';
    });

    canvas.addEventListener('pointerdown', (ev) => {
        const pt = getCanvasCoords(ev);
        if (!isNearPushButton(pt)) return;
        if (state.switchMode === 'hold') {
            state.isHoldingCanvasSwitch = true;
            setSwitchState(true);
        } else {
            setSwitchState(!state.switchClosed);
        }
    });

    // Controle de Tensão e Presets de Bancada
    function syncVoltageUI(newV) {
        state.voltage = Math.max(1.0, Math.min(24.0, newV));
        inputVoltage.value = state.voltage.toFixed(1);
        sliderVoltage.value = Math.round(state.voltage * 10);
        presetVoltButtons.forEach(btn => {
            const pv = parseFloat(btn.dataset.volt);
            btn.classList.toggle('active', Math.abs(pv - state.voltage) < 0.05);
        });
    }

    sliderVoltage.addEventListener('input', (e) => {
        syncVoltageUI(parseInt(e.target.value, 10) / 10.0);
        throttleClickSound();
        solveCircuit();
    });

    inputVoltage.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value.replace(',', '.'));
        if (isNaN(val)) val = 5.0;
        syncVoltageUI(val);
        audio.playClick();
        solveCircuit();
    });

    presetVoltButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const v = parseFloat(btn.dataset.volt);
            syncVoltageUI(v);
            audio.playClick();
            solveCircuit();
        });
    });

    // Abas Série vs Paralelo
    tabBtnSeries.addEventListener('click', () => {
        if (state.mode === 'series') return;
        state.mode = 'series';
        tabBtnSeries.classList.add('active');
        tabBtnParallel.classList.remove('active');
        audio.playClick();
        rebuildKitSlotsUI();
        solveCircuit();
    });

    tabBtnParallel.addEventListener('click', () => {
        if (state.mode === 'parallel') return;
        state.mode = 'parallel';
        tabBtnParallel.classList.add('active');
        tabBtnSeries.classList.remove('active');
        audio.playClick();
        rebuildKitSlotsUI();
        solveCircuit();
    });

    checkboxSound.addEventListener('change', () => {
        if (!checkboxSound.checked) {
            audio.stopBuzzer();
        } else {
            audio.setBuzzerState(state.telemetry.buzzerActive);
        }
    });

    // --- 11. ANIMAÇÃO ANTI-ALIASING E TRAJETÓRIAS DE ELÉTRONS ---
    function computeSafeElectronSpeed(currentAmps, spacingPx) {
        if (!state.switchClosed || currentAmps <= 0.00001) return 0;
        // Fórmula exigida com proteção de Nyquist (< 45% da distância entre partículas)
        const rawSpeed = Math.max(0.32, currentAmps * ELECTRON_SPEED_MULTIPLIER);
        const visualSpeed = Math.min(rawSpeed, spacingPx * 0.45);
        return visualSpeed;
    }

    function animatePhysics() {
        const t = state.telemetry;
        state.blinkPhase = (state.blinkPhase + 0.14) % (Math.PI * 2);

        if (state.mode === 'series') {
            const visualSpeed = computeSafeElectronSpeed(t.currentTotal, SPACING_SERIES);
            if (visualSpeed > 0) {
                state.electronsSeries = state.electronsSeries.map(d => (d + visualSpeed) % PERIMETER_SERIES);
            }
            if (state.switchClosed && state.slot2.type === 'motor' && t.currentTotal > 0.0001) {
                const rotSpd = Math.max(0.6, Math.min(28, t.currentTotal * 28));
                state.motor1Rot = (state.motor1Rot + rotSpd) % 360;
            }
        } else {
            const spdMain = computeSafeElectronSpeed(t.currentTotal, SPACING_PMAIN);
            const spdB1 = computeSafeElectronSpeed(t.i1, SPACING_B1);
            const spdB2 = computeSafeElectronSpeed(t.i2, SPACING_B2);

            if (spdMain > 0) state.electronsParallelMain = state.electronsParallelMain.map(d => (d + spdMain) % PARALLEL_MAIN_LEN);
            if (spdB1 > 0) state.electronsParallelB1 = state.electronsParallelB1.map(d => (d + spdB1) % PARALLEL_B1_LEN);
            if (spdB2 > 0) state.electronsParallelB2 = state.electronsParallelB2.map(d => (d + spdB2) % PARALLEL_B2_LEN);

            if (state.switchClosed && state.branch1.type === 'motor' && t.i1 > 0.0001) {
                state.motor1Rot = (state.motor1Rot + Math.max(0.6, Math.min(28, t.i1 * 28))) % 360;
            }
            if (state.switchClosed && state.branch2.type === 'motor' && t.i2 > 0.0001) {
                state.motor2Rot = (state.motor2Rot + Math.max(0.6, Math.min(28, t.i2 * 28))) % 360;
            }
        }
    }

    function getPositionSeries(dist) {
        const d = dist % PERIMETER_SERIES;
        if (d < CW) return { x: CX + d, y: CY + CH }; // Base -> direita
        if (d < CW + CH) return { x: CX + CW, y: CY + CH - (d - CW) }; // Direita -> cima
        if (d < CW * 2 + CH) return { x: CX + CW - (d - CW - CH), y: CY }; // Topo -> esquerda
        return { x: CX, y: CY + (d - CW * 2 - CH) }; // Esquerda -> baixo
    }

    function getPositionParallelMain(dist) {
        const d = dist % PARALLEL_MAIN_LEN;
        const hLen = SPLIT_X - CX;
        if (d < hLen) return { x: SPLIT_X - d, y: CY + CH };
        if (d < hLen + CH) return { x: CX, y: CY + CH - (d - hLen) };
        return { x: CX + (d - hLen - CH), y: CY };
    }

    function getPositionParallelB1(dist) {
        const d = dist % PARALLEL_B1_LEN;
        const arm = B1_X - SPLIT_X;
        if (d < arm) return { x: SPLIT_X + d, y: CY };
        if (d < arm + CH) return { x: B1_X, y: CY + (d - arm) };
        return { x: B1_X - (d - arm - CH), y: CY + CH };
    }

    function getPositionParallelB2(dist) {
        const d = dist % PARALLEL_B2_LEN;
        const arm = B2_X - SPLIT_X;
        if (d < arm) return { x: SPLIT_X + d, y: CY };
        if (d < arm + CH) return { x: B2_X, y: CY + (d - arm) };
        return { x: B2_X - (d - arm - CH), y: CY + CH };
    }

    // --- 12. RENDERIZAÇÃO DOS COMPONENTES NO CANVAS ---
    function drawGrid() {
        ctx.strokeStyle = '#0d1424';
        ctx.lineWidth = 0.6;
        for (let x = 0; x < canvas.width; x += 24) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 24) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
        }
    }

    function drawWires() {
        const highIntensity = Math.round(145 + (state.voltage / 24.0) * 110);
        const highColor = `rgb(255, ${highIntensity}, 0)`;
        const afterSwitchHigh = state.switchClosed ? highColor : '#475569';
        const lowColor = state.switchClosed ? '#00bfff' : '#475569';

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const drawSeg = (path, color, width, glow = false) => {
            ctx.save();
            if (glow && state.switchClosed) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = color;
            }
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.stroke(path);
            ctx.restore();
        };

        // Fio pré-chave (sempre energizado pela bateria)
        const preSwitchPath = new Path2D();
        preSwitchPath.moveTo(CX, CY + CH / 2 - 42);
        preSwitchPath.lineTo(CX, CY);
        preSwitchPath.lineTo(SWITCH_X - 30, CY);
        drawSeg(preSwitchPath, highColor, 4.5, true);
        drawSeg(preSwitchPath, '#ffffff', 1.4, false);

        // Fio pós-chave (alto potencial quando fechada)
        const postHigh = new Path2D();
        const lowPath = new Path2D();

        if (state.mode === 'series') {
            postHigh.moveTo(SWITCH_X + 30, CY);
            postHigh.lineTo(CX + CW, CY);
            postHigh.lineTo(CX + CW, CY + CH / 2);

            lowPath.moveTo(CX + CW, CY + CH / 2);
            lowPath.lineTo(CX + CW, CY + CH);
            lowPath.lineTo(CX, CY + CH);
            lowPath.lineTo(CX, CY + CH / 2 + 42);
        } else {
            postHigh.moveTo(SWITCH_X + 30, CY);
            postHigh.lineTo(B2_X, CY);
            postHigh.moveTo(B1_X, CY);
            postHigh.lineTo(B1_X, CY + CH / 2);
            postHigh.moveTo(B2_X, CY);
            postHigh.lineTo(B2_X, CY + CH / 2);

            lowPath.moveTo(B1_X, CY + CH / 2);
            lowPath.lineTo(B1_X, CY + CH);
            lowPath.moveTo(B2_X, CY + CH / 2);
            lowPath.lineTo(B2_X, CY + CH);
            lowPath.lineTo(CX, CY + CH);
            lowPath.lineTo(CX, CY + CH / 2 + 42);
        }

        drawSeg(postHigh, afterSwitchHigh, 4.5, true);
        drawSeg(postHigh, state.switchClosed ? '#ffffff' : '#94a3b8', 1.3, false);

        drawSeg(lowPath, lowColor, 4.5, true);
        drawSeg(lowPath, state.switchClosed ? '#ffffff' : '#94a3b8', 1.3, false);
    }

    function drawPushButtonSwitch(x, y, closed) {
        ctx.save();
        ctx.translate(x, y);

        // Fundo da caixa do push-button estilo protoboard
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = closed ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-34, -22, 68, 44, 8);
        ctx.fill();
        ctx.stroke();

        // Terminais metálicos esquerda/direita
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath(); ctx.arc(-24, 0, 4.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(24, 0, 4.5, 0, Math.PI * 2); ctx.fill();

        // Haste da chave (fechada horizontal ou levantada em ângulo)
        ctx.strokeStyle = closed ? '#34d399' : '#fca5a5';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-24, 0);
        if (closed) {
            ctx.lineTo(24, 0);
        } else {
            ctx.lineTo(18, -18);
        }
        ctx.stroke();

        // Botão táctil (tampa superior)
        const btnY = closed ? -8 : -16;
        ctx.fillStyle = closed ? '#10b981' : '#ef4444';
        ctx.fillRect(-10, btnY - 5, 20, 6);

        // Rótulo claro
        ctx.fillStyle = closed ? '#6ee7b7' : '#fca5a5';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText(closed ? 'CHAVE: FECHADA' : 'CHAVE: ABERTA', 0, 34);

        ctx.restore();
    }

    function drawBattery(x, y, voltage) {
        const w = 44;
        const h = 86;
        const bx = x - w / 2;
        const by = y - h / 2;

        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = 'rgba(0, 255, 102, 0.35)';
        ctx.strokeStyle = '#00ff66';
        ctx.lineWidth = 2.5;
        ctx.fillStyle = '#0c111d';
        ctx.beginPath();
        ctx.roundRect(bx, by, w, h, 8);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        const pct = Math.min(1, Math.max(0.05, voltage / 24.0));
        const chargeH = Math.round(pct * (h - 16));
        const grad = ctx.createLinearGradient(bx, by + h, bx, by + h - chargeH);
        grad.addColorStop(0, '#059669');
        grad.addColorStop(1, '#34d399');
        ctx.fillStyle = grad;
        ctx.fillRect(bx + 5, by + h - 6 - chargeH, w - 10, chargeH);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff9d00';
        ctx.font = 'bold 14px Outfit';
        ctx.fillText('+', x, by + 13);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('-', x, by + h - 13);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.fillText(`${voltage.toFixed(1)}V`, x, y);
    }

    function drawElectron(pos) {
        const grad = ctx.createRadialGradient(pos.x, pos.y, 1, pos.x, pos.y, 7.5);
        grad.addColorStop(0, 'rgba(255, 255, 120, 0.95)');
        grad.addColorStop(0.55, 'rgba(255, 210, 0, 0.45)');
        grad.addColorStop(1, 'rgba(255, 120, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.9, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawResistorGraphic(x, y, horizontal, val, scale = 1.0, label = '') {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(horizontal ? -40 : -15, horizontal ? -15 : -40, horizontal ? 80 : 30, horizontal ? 30 : 80);

        const [[h1, h2, h3, h4]] = getResistorColors(val);

        // Corpo bege estilo resistor real com as faixas de cor
        ctx.fillStyle = '#e6d8c3';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        if (horizontal) {
            ctx.beginPath(); ctx.roundRect(-34, -10, 68, 20, 5); ctx.fill(); ctx.stroke();
            ctx.fillStyle = h1; ctx.fillRect(-22, -9.5, 5, 19);
            ctx.fillStyle = h2; ctx.fillRect(-12, -9.5, 5, 19);
            ctx.fillStyle = h3; ctx.fillRect(-2, -9.5, 5, 19);
            ctx.fillStyle = h4; ctx.fillRect(16, -9.5, 5, 19);
        } else {
            ctx.beginPath(); ctx.roundRect(-10, -34, 20, 68, 5); ctx.fill(); ctx.stroke();
            ctx.fillStyle = h1; ctx.fillRect(-9.5, -22, 19, 5);
            ctx.fillStyle = h2; ctx.fillRect(-9.5, -12, 19, 5);
            ctx.fillStyle = h3; ctx.fillRect(-9.5, -2, 19, 5);
            ctx.fillStyle = h4; ctx.fillRect(-9.5, 16, 19, 5);
        }

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 11px JetBrains Mono';
        if (horizontal) {
            ctx.textAlign = 'center';
            ctx.fillText(label || formatResistance(val), 0, -20);
        } else {
            ctx.textAlign = 'right';
            ctx.fillText(label || formatResistance(val), -28, 4);
        }
        ctx.restore();
    }

    function drawPotentiometerGraphic(x, y, horizontal, val, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(-26, -26, 52, 52);

        // Base azul clássica do potenciômetro 10k
        ctx.fillStyle = '#1e3a8a';
        ctx.strokeStyle = '#60a5fa';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Eixo giratório proporcional ao valor (0 a 10k)
        const angle = (-135 + (val / 10000) * 270) * (Math.PI / 180);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.sin(angle) * 16, -Math.cos(angle) * 16);
        ctx.stroke();

        ctx.fillStyle = '#d8b4fe';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = horizontal ? 'center' : 'right';
        ctx.fillText(`POT ${formatResistance(val)}`, horizontal ? 0 : -28, horizontal ? -30 : 4);
        ctx.restore();
    }

    function drawLDRGraphic(x, y, horizontal, lightPct, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(-26, -26, 52, 52);

        // Disco cerâmico marrom-avermelhado do LDR
        ctx.fillStyle = '#7c2d12';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Trilha ondulada
        ctx.strokeStyle = '#fb923c';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-12, -6); ctx.lineTo(12, -6);
        ctx.lineTo(-12, 0); ctx.lineTo(12, 0);
        ctx.lineTo(-12, 6); ctx.lineTo(12, 6);
        ctx.stroke();

        // Raios de luz incidentes proporcionais à luminosidade
        const rayAlpha = 0.15 + (lightPct / 100) * 0.85;
        ctx.strokeStyle = `rgba(250, 204, 21, ${rayAlpha})`;
        ctx.lineWidth = 2.2;
        [[-34, -28], [-22, -34]].forEach(([sx, sy]) => {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + 13, sy + 13);
            ctx.stroke();
        });

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = horizontal ? 'center' : 'right';
        ctx.fillText(`LDR ${lightPct}%`, horizontal ? 0 : -28, horizontal ? -30 : 4);
        ctx.restore();
    }

    function drawLEDGraphic(x, y, ledColorKey, current, overloaded, scale = 1.0) {
        const cfg = LED_COLOR_STYLES[ledColorKey] || LED_COLOR_STYLES.red;
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(-26, -26, 52, 52);

        const activeOn = state.switchClosed && current > 0.0001 && !overloaded;
        const blinkOn = overloaded && Math.sin(state.blinkPhase * 2.5) > 0;
        const brightness = activeOn ? Math.min(1, 0.25 + (current / 0.022) * 0.75) : 0;

        if (activeOn) {
            const rad = 26 + brightness * 34;
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, rad);
            g.addColorStop(0, cfg.glow);
            g.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, rad, 0, Math.PI * 2);
            ctx.fill();
        } else if (overloaded && blinkOn) {
            const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
            g.addColorStop(0, 'rgba(239, 68, 68, 0.95)');
            g.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(0, 0, 46, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cápsula do LED
        ctx.fillStyle = overloaded ? (blinkOn ? '#ef4444' : '#1f2937') : (activeOn ? cfg.hex : '#1e293b');
        ctx.strokeStyle = overloaded ? '#f87171' : cfg.hex;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Símbolo diodo ou X se danificado
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        if (overloaded) {
            ctx.beginPath();
            ctx.moveTo(-9, -9); ctx.lineTo(9, 9);
            ctx.moveTo(9, -9); ctx.lineTo(-9, 9);
            ctx.stroke();
            ctx.fillStyle = '#fca5a5';
            ctx.font = 'bold 10px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText('DANIFICADO!', 0, 32);
        } else {
            ctx.beginPath();
            ctx.moveTo(-7, -7); ctx.lineTo(7, -7);
            ctx.lineTo(0, 5); ctx.closePath();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-8, 6); ctx.lineTo(8, 6);
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawBuzzerGraphic(x, y, isBeeping, isOvervolt, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(-26, -26, 52, 52);

        // Corpo preto cilíndrico do Buzzer 5V
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = isOvervolt ? '#ef4444' : (isBeeping ? '#10b981' : '#64748b');
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Furo acústico central
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.arc(0, 0, 7, 0, Math.PI * 2);
        ctx.fill();

        // Ondas sonoras animadas quando ativo (3V–5V)
        if (isBeeping) {
            const pulse = (Math.sin(state.blinkPhase * 2) + 1) * 0.5;
            ctx.strokeStyle = `rgba(52, 211, 153, ${0.4 + pulse * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, 28 + pulse * 6, -0.7, 0.7); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, 36 + pulse * 8, -0.6, 0.6); ctx.stroke();
        }

        ctx.fillStyle = isOvervolt ? '#fca5a5' : (isBeeping ? '#6ee7b7' : '#94a3b8');
        ctx.font = 'bold 10px JetBrains Mono';
        ctx.textAlign = 'right';
        ctx.fillText(isOvervolt ? 'BUZZER >5V!' : (isBeeping ? 'BUZZER ON' : 'BUZZER 5V'), -28, 4);
        ctx.restore();
    }

    function drawMotorGraphic(x, y, rotDeg, scale = 1.0) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        ctx.fillStyle = '#07090d';
        ctx.fillRect(-28, -28, 56, 56);

        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pás rotativas do Motor DC
        ctx.save();
        ctx.rotate((rotDeg * Math.PI) / 180);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-18, 0); ctx.lineTo(18, 0);
        ctx.moveTo(0, -18); ctx.lineTo(0, 18);
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Outfit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('M', 0, 0);

        ctx.restore();
    }

    function drawComponentAt(slot, x, y, horizontal, current, overloaded, rotDeg, isParallelBranch = false) {
        const scale = isParallelBranch ? 0.85 : 1.0;

        // Em paralelo, se houver resistor protetor em série no ramo, desenha ele no topo do ramo
        if (isParallelBranch && (slot.parallelSeriesR || 0) > 0 && ['led', 'buzzer', 'motor'].includes(slot.type)) {
            drawResistorGraphic(x, CY + 68, false, slot.parallelSeriesR, 0.72, `${formatResistance(slot.parallelSeriesR)}`);
        }

        const compY = (isParallelBranch && (slot.parallelSeriesR || 0) > 0 && ['led', 'buzzer', 'motor'].includes(slot.type))
            ? y + 36
            : y;

        switch (slot.type) {
            case 'wire':
                ctx.save();
                ctx.fillStyle = '#94a3b8';
                ctx.font = 'bold 10px JetBrains Mono';
                ctx.textAlign = 'center';
                ctx.fillText('FIO DIRETO (0Ω)', x, y - 16);
                ctx.restore();
                break;
            case 'resistor':
                drawResistorGraphic(x, compY, horizontal, slot.resistance, scale);
                break;
            case 'potentiometer':
                drawPotentiometerGraphic(x, compY, horizontal, slot.potValue, scale);
                break;
            case 'ldr':
                drawLDRGraphic(x, compY, horizontal, slot.ldrLight, scale);
                break;
            case 'led':
                drawLEDGraphic(x, compY, slot.ledColor, current, overloaded, scale);
                break;
            case 'buzzer': {
                const t = state.telemetry;
                const active = state.switchClosed && t.buzzerActive;
                const over = state.switchClosed && t.buzzerOvervolt;
                drawBuzzerGraphic(x, compY, active, over, scale);
                break;
            }
            case 'motor':
                drawMotorGraphic(x, compY, rotDeg, scale);
                break;
        }
    }

    function drawVoltmeterBadge(x, y, text, sublabel, borderColor, alignAbove = true) {
        ctx.save();
        ctx.strokeStyle = borderColor;
        ctx.fillStyle = '#07090d';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        const destY = alignAbove ? y - 34 : y + 34;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, destY); ctx.stroke();

        const boxW = 120;
        const boxH = 26;
        ctx.fillStyle = 'rgba(10, 15, 28, 0.92)';
        ctx.beginPath();
        ctx.roundRect(x - boxW / 2, destY - boxH / 2, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, destY);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 9.5px Outfit';
        ctx.fillText(sublabel, x, alignAbove ? destY - 21 : destY + 21);
        ctx.restore();
    }

    function drawCircuitMeasurements() {
        const t = state.telemetry;
        if (state.mode === 'series') {
            drawVoltmeterBadge(465, CY + 22, `V1 = ${t.v1.toFixed(2)} V`, 'Queda Slot 1', '#ff9d00', false);
            drawVoltmeterBadge(CX + CW, CY + CH, `GND: 0.0 V`, `V2 = ${t.v2.toFixed(2)} V`, '#00bfff', false);

            // Amperímetro no fio inferior
            ctx.save();
            ctx.fillStyle = 'rgba(10, 15, 28, 0.92)';
            ctx.strokeStyle = '#facc15';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(290, CY + CH - 14, 156, 28, 8); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#fef08a';
            ctx.font = 'bold 11px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`I = ${formatCurrent(t.currentTotal)}`, 368, CY + CH);
            ctx.restore();
        } else {
            drawVoltmeterBadge(SPLIT_X - 45, CY, state.switchClosed ? `${state.voltage.toFixed(1)} V` : '0.0 V (Aberto)', 'Tensão nos Ramos', '#ff9d00', true);
            drawVoltmeterBadge(SPLIT_X - 45, CY + CH, 'GND: 0.0 V', `It = ${formatCurrent(t.currentTotal)}`, '#00bfff', false);

            // Rótulos de corrente em cada ramo
            ctx.save();
            ctx.font = 'bold 11px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fed7aa';
            ctx.fillText(`I1=${formatCurrent(t.i1)}`, B1_X, CY + CH + 20);
            ctx.fillStyle = '#7dd3fc';
            ctx.fillText(`I2=${formatCurrent(t.i2)}`, B2_X, CY + CH + 20);
            ctx.restore();
        }
    }

    function renderLoop() {
        ctx.fillStyle = '#07090d';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        drawGrid();
        drawWires();

        // Elétrons nos fios (desenhados antes da bateria para não cruzarem sobre "5.0V")
        if (state.mode === 'series') {
            state.electronsSeries.forEach(d => drawElectron(getPositionSeries(d)));
        } else {
            state.electronsParallelMain.forEach(d => drawElectron(getPositionParallelMain(d)));
            state.electronsParallelB1.forEach(d => drawElectron(getPositionParallelB1(d)));
            state.electronsParallelB2.forEach(d => drawElectron(getPositionParallelB2(d)));
        }

        drawBattery(CX, CY + CH / 2, state.voltage);

        // Chave Táctil interativa no fio superior
        drawPushButtonSwitch(SWITCH_X, SWITCH_Y, state.switchClosed);

        // Componentes de Carga
        const t = state.telemetry;
        if (state.mode === 'series') {
            drawComponentAt(state.slot1, 465, CY, true, t.currentTotal, t.led1Overload, state.motor1Rot, false);
            drawComponentAt(state.slot2, CX + CW, CY + CH / 2, false, t.currentTotal, t.led2Overload, state.motor1Rot, false);
        } else {
            drawComponentAt(state.branch1, B1_X, CY + CH / 2, false, t.i1, t.led1Overload, state.motor1Rot, true);
            drawComponentAt(state.branch2, B2_X, CY + CH / 2, false, t.i2, t.led2Overload, state.motor2Rot, true);
        }

        drawCircuitMeasurements();
        animatePhysics();

        requestAnimationFrame(renderLoop);
    }

    // --- 13. BOOT ---
    document.addEventListener('DOMContentLoaded', () => {
        initElectrons();
        syncVoltageUI(5.0);
        rebuildKitSlotsUI();
        solveCircuit();
        renderLoop();
    });
})();
