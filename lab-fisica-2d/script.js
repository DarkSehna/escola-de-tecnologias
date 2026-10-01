// ==========================================================================
// MOTOR DE FÍSICA E INTERACTION CONTROLLER - LAB DE FÍSICA 2D
// Escola de Tecnologias - TitanTech
// ==========================================================================

// Tamanho do Bloco Físico
const GRID_SIZE = 32;
const COLS = 40; // 40 colunas (Widescreen Panorâmico)
const ROWS = 15;
const SCREEN_WIDTH = COLS * GRID_SIZE;  // 1280
const SCREEN_HEIGHT = ROWS * GRID_SIZE; // 480
const GROUND_ROW = 13;
const GROUND_Y = GROUND_ROW * GRID_SIZE; // 416

// Cores do Canvas
const COLOR_CANVAS_BG = "#0f0f13";
const COLOR_GRID = "#1a1a24";
const COLOR_PLAYER = "#00d2ff";
const COLOR_OBSTACLE = "#4f4f6b";
const COLOR_GROUND = "#1e7e34";
const COLOR_PEAK_LINE = "#ff3b30";
const COLOR_ARC_LINE = "#ffcc00";

// Presets Físicos das Engines de Jogos
const ENGINE_PRESETS = {
    "GameMaker": {
        title: "GameMaker (Física Customizada)",
        description: "Física programada manualmente no obj_player e obj_lifeForm, com aceleração e atritos separados para chão/ar.",
        gravity: { min: 0.05, max: 2.0, default: 0.3, step: 0.05 },
        jump: { min: -20.0, max: -2.0, default: -7.0, step: 0.5 }, // GM usa pulo negativo (para cima)
        speed: { min: 1.0, max: 16.0, default: 4.0, step: 0.5 },
        accelGround: { min: 0.01, max: 2.0, default: 0.35, step: 0.05 },
        frictionGround: { min: 0.01, max: 1.5, default: 0.15, step: 0.05 },
        accelAir: { min: 0.01, max: 2.0, default: 0.20, step: 0.05 },
        frictionAir: { min: 0.01, max: 1.0, default: 0.05, step: 0.01 },
        maxFallSpeed: { min: 2.0, max: 25.0, default: 12.0, step: 1.0 },
        maxJumps: { min: 1, max: 10, default: 1, step: 1 },
        labels: {
            gravity: "Gravidade",
            jump: "Força do Pulo",
            speed: "Velocidade Máxima",
            accelGround: "Aceleração Chão",
            frictionGround: "Atrito Chão",
            accelAir: "Aceleração Ar",
            frictionAir: "Atrito Ar",
            maxFallSpeed: "Vel. Queda Máx",
            maxJumps: "Número de Pulos"
        },
        code_template: 
`// --- Variáveis no obj_lifeForm (Pai) ---
grv = {gravity};          // Gravidade
jspd = {jump};         // Força do pulo
maxFallSpeed = {maxFallSpeed}; // Queda limite
maxJumps = {maxJumps};         // Número de pulos permitidos (1 = padrão, 2 = pulo duplo)

// --- Variáveis no obj_player (Filho) ---
moveSpeed = {speed};      // Velocidade máx lateral
accelGround = {accelGround};   // Aceleração no chão
frictionGround = {frictionGround}; // Fricção no chão
accelAir = {accelAir};      // Aceleração no ar
frictionAir = {frictionAir};   // Fricção no ar`
    },
    "Construct 3": {
        title: "Construct 3 (Platform)",
        description: "Variáveis mapeadas para as propriedades nativas do comportamento 'Plataforma' no Construct 3 em Português.",
        gravity: { min: 100.0, max: 5000.0, default: 1500.0, step: 50.0 },
        jump: { min: 100.0, max: 1500.0, default: 650.0, step: 10.0 },
        speed: { min: 50.0, max: 1000.0, default: 330.0, step: 10.0 },
        accelGround: { min: 50.0, max: 5000.0, default: 1500.0, step: 50.0 },
        frictionGround: { min: 50.0, max: 5000.0, default: 1500.0, step: 50.0 },
        accelAir: { min: 50.0, max: 5000.0, default: 1500.0, step: 50.0 },
        frictionAir: { min: 10.0, max: 2000.0, default: 1500.0, step: 10.0 },
        maxFallSpeed: { min: 100.0, max: 2500.0, default: 1000.0, step: 50.0 },
        doubleJump: { default: false },
        labels: {
            gravity: "Gravidade",
            jump: "Força do pulo",
            speed: "Velocidade máxima",
            accelGround: "Aceleração",
            frictionGround: "Desaceleração",
            accelAir: "Aceleração (Ar)",
            frictionAir: "Desaceleração (Ar)",
            maxFallSpeed: "Velocidade máxima de queda",
            doubleJump: "Pulo duplo"
        },
        code_template: 
`// Ajuste estas propriedades no comportamento 'Plataforma' do seu Objeto:
Velocidade máxima = {speed}
Aceleração = {accelGround}
Desaceleração = {frictionGround}
Força do pulo = {jump}
Gravidade = {gravity}
Velocidade máxima de queda = {maxFallSpeed}
Pulo duplo = {doubleJump}`
    },
    "Scratch": {
        title: "Scratch (Física adaptada)",
        description: "Variáveis expressas em passos por frame (escala típica de scripts escolares).",
        gravity: { min: -5.0, max: -0.1, default: -0.9, step: 0.1 },
        jump: { min: 4.0, max: 25.0, default: 10.5, step: 0.5 },
        speed: { min: 1.0, max: 18.0, default: 7.2, step: 0.5 },
        accelGround: { min: 0.05, max: 2.0, default: 0.7, step: 0.05 },
        frictionGround: { min: 0.50, max: 0.99, default: 0.85, step: 0.01 },
        accelAir: { min: 0.05, max: 2.0, default: 0.4, step: 0.05 },
        frictionAir: { min: 0.50, max: 0.99, default: 0.95, step: 0.01 },
        maxFallSpeed: { min: -25.0, max: -2.0, default: -15.0, step: 1.0 },
        maxJumps: { min: 1, max: 10, default: 1, step: 1 },
        labels: {
            gravity: "Gravidade",
            jump: "Força do Pulo",
            speed: "Velocidade Máxima",
            accelGround: "Aceleração Chão",
            frictionGround: "Atrito Chão",
            accelAir: "Aceleração Ar",
            frictionAir: "Atrito Ar",
            maxFallSpeed: "Queda Máxima",
            maxJumps: "Número de Pulos"
        },
        code_template: 
`// Defina as variáveis no script do seu Ator Jogador:
mude [velocidade_max v] para ({speed})
mude [aceleração_chão v] para ({accelGround})
mude [atrito_chão v] para ({frictionGround})
mude [aceleração_ar v] para ({accelAir})
mude [atrito_ar v] para ({frictionAir})
mude [gravidade v] para ({gravity})
mude [força_pulo v] para ({jump})
mude [queda_maxima v] para ({maxFallSpeed})
mude [numero_pulos v] para ({maxJumps})`
    }
};

// Global Scroll Lock no Navegador
window.addEventListener('keydown', (event) => {
    const k = event.key.toLowerCase();
    if ([" ", "space", "arrowup", "arrowdown", "arrowleft", "arrowright", "pageup", "pagedown"].includes(k)) {
        // Bloqueia rolagem padrão da janela
        event.preventDefault();
    }
}, { passive: false });

// ==========================================
// CLASSE DE FÍSICA DO JOGADOR
// ==========================================
class PlayerPhysics {
    constructor(startX = 64, startY = 320) {
        this.x = parseFloat(startX);
        this.y = parseFloat(startY);
        this.hsp = 0.0;
        this.vsp = 0.0;
        this.isGrounded = false;
        
        // Métricas de Salto e Pulo Duplo
        this.isJumping = false;
        this.jumpStartX = 0.0;
        this.jumpPeakY = parseFloat(startY);
        this.jumpLandX = 0.0;
        this.jumpCount = 0;
        this.jumpKeyWasDown = false;
        
        this.arcPoints = [];
        this.midAirJumpPoints = [];
        
        // Histórico do último pulo completo
        this.lastJumpPeakY = null;
        this.lastJumpStartX = null;
        this.lastJumpLandX = null;
        this.lastArcPoints = [];
        this.lastMidAirJumpPoints = [];
    }

    reset(startX, startY) {
        this.x = parseFloat(startX);
        this.y = parseFloat(startY);
        this.hsp = 0.0;
        this.vsp = 0.0;
        this.isGrounded = false;
        this.isJumping = false;
        this.jumpCount = 0;
        this.jumpKeyWasDown = false;
        this.arcPoints = [];
        this.midAirJumpPoints = [];
        
        this.lastJumpPeakY = null;
        this.lastJumpStartX = null;
        this.lastJumpLandX = null;
        this.lastArcPoints = [];
        this.lastMidAirJumpPoints = [];
    }

    update(keys, grv_int, jump_int, speed_int, accel_ground_int, fric_ground_int,
           accel_air_int, fric_air_int, max_fall_int, obstacles, maxJumpsAllowed = 1) {
        
        // Garante que o jogador não caia fora do chão principal
        if (this.y + GRID_SIZE > GROUND_Y) {
            this.y = GROUND_Y - GRID_SIZE;
            this.vsp = 0.0;
            this.isGrounded = true;
            this.jumpCount = 0;

            if (this.isJumping) {
                this.isJumping = false;
                this.jumpLandX = this.x + GRID_SIZE / 2.0;
                this.lastJumpPeakY = this.jumpPeakY;
                this.lastJumpStartX = this.jumpStartX;
                this.lastJumpLandX = this.jumpLandX;
                this.lastArcPoints = [...this.arcPoints];
                this.lastMidAirJumpPoints = [...this.midAirJumpPoints];
                this.midAirJumpPoints = [];
                if (typeof onJumpCompleted === "function") {
                    onJumpCompleted(this);
                }
            }
        }

        // 1. Constantes com base no estado do jogador
        const accel = this.isGrounded ? accel_ground_int : accel_air_int;
        const fric = this.isGrounded ? fric_ground_int : fric_air_int;

        // 2. Movimento Horizontal
        let move = 0;
        if (keys.right) move += 1;
        if (keys.left) move -= 1;

        if (move !== 0) {
            this.hsp += move * accel;
        } else {
            // Freia por fricção gradativamente
            if (Math.abs(this.hsp) < fric) {
                this.hsp = 0.0;
            } else {
                this.hsp -= Math.sign(this.hsp) * fric;
            }
        }

        // Clampa velocidade
        this.hsp = Math.max(-speed_int, Math.min(this.hsp, speed_int));

        // Reseta contador de pulos no chão
        if (this.isGrounded) {
            this.jumpCount = 0;
        }

        // 3. Movimento Vertical e Pulo / Pulo Duplo
        if (!this.isGrounded) {
            this.vsp += grv_int;
            this.vsp = Math.min(this.vsp, max_fall_int);
        } else {
            this.vsp = 0.0;
        }

        if (keys.jump) {
            if (!this.jumpKeyWasDown) {
                const maxAllowed = typeof maxJumpsAllowed === "number" ? maxJumpsAllowed : (maxJumpsAllowed ? 2 : 1);
                if (this.isGrounded || this.jumpCount < maxAllowed) {
                    this.vsp = jump_int; // Impulso para cima
                    this.isGrounded = false;
                    this.jumpCount++;
                    
                    if (!this.isJumping) {
                        // Primeiro salto a partir do solo ou no ar
                        this.isJumping = true;
                        this.jumpStartX = this.x + GRID_SIZE / 2.0;
                        this.jumpPeakY = this.y;
                        this.arcPoints = [[this.jumpStartX, this.y + GRID_SIZE / 2.0]];
                        this.midAirJumpPoints = [];
                    } else {
                        // Salto adicional no ar (pulo duplo / múltiplo):
                        // NÃO apaga o arco anterior! Mantém a curva contínua e marca o ponto do impulso aéreo
                        const boostPt = [this.x + GRID_SIZE / 2.0, this.y + GRID_SIZE / 2.0];
                        this.arcPoints.push(boostPt);
                        this.midAirJumpPoints.push(boostPt);
                    }
                }
            }
            this.jumpKeyWasDown = true;
        } else {
            this.jumpKeyWasDown = false;
        }

        // 4. Rastreamento de Salto
        if (this.isJumping) {
            if (this.y < this.jumpPeakY) {
                this.jumpPeakY = this.y;
            }
            this.arcPoints.push([this.x + GRID_SIZE / 2.0, this.y + GRID_SIZE / 2.0]);
        }

        // 5. Colisão Horizontal (AABB)
        let newX = this.x + this.hsp;
        if (newX < 0) {
            newX = 0.0;
            this.hsp = 0.0;
        } else if (newX + GRID_SIZE > SCREEN_WIDTH) {
            newX = SCREEN_WIDTH - GRID_SIZE;
            this.hsp = 0.0;
        }

        if (this.placeMeeting(newX, this.y, obstacles)) {
            let step = Math.sign(this.hsp);
            while (!this.placeMeeting(this.x + step, this.y, obstacles)) {
                this.x += step;
            }
            this.hsp = 0.0;
        } else {
            this.x = newX;
        }

        // 6. Colisão Vertical (AABB)
        let newY = this.y + this.vsp;
        if (this.placeMeeting(this.x, newY, obstacles)) {
            let step = Math.sign(this.vsp);
            while (!this.placeMeeting(this.x, this.y + step, obstacles)) {
                this.y += step;
            }

            if (this.vsp > 0) {
                this.isGrounded = true;
                this.jumpCount = 0;
                
                if (this.isJumping) {
                    this.isJumping = false;
                    this.jumpLandX = this.x + GRID_SIZE / 2.0;
                    
                    this.lastJumpPeakY = this.jumpPeakY;
                    this.lastJumpStartX = this.jumpStartX;
                    this.lastJumpLandX = this.jumpLandX;
                    this.lastArcPoints = [...this.arcPoints];
                    this.lastMidAirJumpPoints = [...this.midAirJumpPoints];
                    this.midAirJumpPoints = [];
                    if (typeof onJumpCompleted === "function") {
                        onJumpCompleted(this);
                    }
                }
            }
            this.vsp = 0.0;
        } else {
            this.y = newY;
        }

        // 7. Checa queda de plataforma
        if (this.isGrounded && !this.placeMeeting(this.x, this.y + 1.0, obstacles)) {
            this.isGrounded = false;
            if (this.jumpCount === 0) {
                this.jumpCount = 1;
            }
        }
    }

    placeMeeting(check_x, check_y, obstacles) {
        if (check_y + GRID_SIZE > GROUND_Y) {
            return true;
        }

        const p_left = check_x;
        const p_right = check_x + GRID_SIZE;
        const p_top = check_y;
        const p_bottom = check_y + GRID_SIZE;

        for (const key of obstacles) {
            const [col, row] = key.split(',').map(Number);
            const o_left = col * GRID_SIZE;
            const o_right = (col + 1) * GRID_SIZE;
            const o_top = row * GRID_SIZE;
            const o_bottom = (row + 1) * GRID_SIZE;

            if (p_left < o_right && p_right > o_left &&
                p_top < o_bottom && p_bottom > o_top) {
                return true;
            }
        }

        return false;
    }
}

// ==========================================
// BIND DE CONTROLES E CONFIGURAÇÃO DA JANELA
// ==========================================
const canvasElement = document.getElementById('sim-canvas');
canvasElement.width = SCREEN_WIDTH;
canvasElement.height = SCREEN_HEIGHT;
const ctx = canvasElement.getContext('2d');
const comboEngine = document.getElementById('combo-engine');
const lblEngineDesc = document.getElementById('lbl-engine-desc');
const switchSlow = document.getElementById('switch-slow');
const btnClearCanvas = document.getElementById('btn-clear-canvas');
const btnResetPlayer = document.getElementById('btn-reset-player');
const codeTemplateDisplay = document.getElementById('code-template-display');
const btnCopyCode = document.getElementById('btn-copy-code');

// Estado
const keys = { left: false, right: false, jump: false };
const obstacles = new Set(); // Mapeia coordenadas em strings "col,row"
const player = new PlayerPhysics(2 * GRID_SIZE, GROUND_Y - 3 * GRID_SIZE);
let slowMotionCounter = 0;
let isDrawing = false;
let isErasing = false;
let gridMode = "high";

// Estado de Comparação de Métricas de Pulo
let currentJump = null;
let previousJump = null;
let pinnedReference = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // 1. Registra ouvintes do Teclado (WASD/Setas + Espaço)
    window.addEventListener('keydown', onKeyPress);
    window.addEventListener('keyup', onKeyRelease);

    // 2. Ouvintes de Mouse para Level Design no Canvas
    canvasElement.addEventListener('mousedown', onMouseDown);
    canvasElement.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', () => { isDrawing = false; isErasing = false; });
    
    // Desabilita menu de contexto com o clique direito no canvas
    canvasElement.addEventListener('contextmenu', e => e.preventDefault());

    // 3. Ouvintes dos Controles
    comboEngine.addEventListener('change', onEngineChange);
    btnClearCanvas.addEventListener('click', clearCanvas);
    btnResetPlayer.addEventListener('click', resetPlayer);
    btnCopyCode.addEventListener('click', copyVariablesCode);

    // 4. Controle de Visibilidade e Nitidez da Grade
    const selectGridVis = document.getElementById("select-grid-visibility");
    if (selectGridVis) {
        const savedGridMode = localStorage.getItem("titanTech_physics_grid_mode") || "high";
        selectGridVis.value = savedGridMode;
        gridMode = savedGridMode;

        selectGridVis.addEventListener("change", (e) => {
            gridMode = e.target.value;
            localStorage.setItem("titanTech_physics_grid_mode", gridMode);
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }
        });
    }

    // 5. Controle de Zoom do Canvas (Ajustar, 100%, 125%, 150%)
    const selectZoom = document.getElementById("select-canvas-zoom");
    if (selectZoom) {
        const savedZoom = localStorage.getItem("titanTech_physics_zoom") || "fit";
        selectZoom.value = savedZoom;
        canvasElement.setAttribute("data-zoom", savedZoom);

        selectZoom.addEventListener("change", (e) => {
            const zoomVal = e.target.value;
            canvasElement.setAttribute("data-zoom", zoomVal);
            localStorage.setItem("titanTech_physics_zoom", zoomVal);
            if (document.activeElement && document.activeElement !== document.body) {
                document.activeElement.blur();
            }
        });
    }

    // 6. Botões do HUD de Comparação de Pulo
    const btnPin = document.getElementById("btn-pin-reference");
    if (btnPin) {
        btnPin.addEventListener("click", () => {
            if (pinnedReference) {
                pinnedReference = null;
                showToast("Referência desafixada.");
            } else if (currentJump) {
                pinnedReference = { ...currentJump };
                showToast("Salto atual fixado como referência!");
            } else {
                showToast("Pule pelo menos uma vez para fixar como referência.");
            }
            updateJumpMetricsUI();
        });
    }

    const btnClearMetrics = document.getElementById("btn-clear-metrics");
    if (btnClearMetrics) {
        btnClearMetrics.addEventListener("click", () => {
            currentJump = null;
            previousJump = null;
            pinnedReference = null;
            player.lastJumpPeakY = null;
            player.lastJumpStartX = null;
            player.lastJumpLandX = null;
            player.lastArcPoints = [];
            updateJumpMetricsUI();
            showToast("Métricas de salto resetadas.");
        });
    }

    // Binds para as caixas físicas e checkbox atualizarem o código dinamicamente
    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed", "maxJumps"];
    inputsList.forEach(key => {
        const input = document.getElementById(`input-${key}`);
        if (input) {
            input.addEventListener('input', updateCodeTemplate);
        }
    });

    const inputDoubleJump = document.getElementById('input-doubleJump');
    if (inputDoubleJump) {
        inputDoubleJump.addEventListener('change', updateCodeTemplate);
    }

    // 7. Modal Flutuante de Código de Integração
    const codeModal = document.getElementById("code-modal-overlay");
    const btnOpenModal = document.getElementById("btn-open-code-modal");
    const btnHeaderCode = document.getElementById("btn-header-code");
    const btnCloseModal = document.getElementById("btn-close-code-modal");

    const openCodeModal = () => {
        if (codeModal) {
            updateCodeTemplate();
            codeModal.style.display = "flex";
        }
    };
    const closeCodeModal = () => {
        if (codeModal) {
            codeModal.style.display = "none";
        }
    };

    if (btnOpenModal) btnOpenModal.addEventListener("click", openCodeModal);
    if (btnHeaderCode) btnHeaderCode.addEventListener("click", openCodeModal);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeCodeModal);

    if (codeModal) {
        codeModal.addEventListener("click", (e) => {
            if (e.target === codeModal) closeCodeModal();
        });
    }
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && codeModal && codeModal.style.display === "flex") {
            closeCodeModal();
        }
    });

    // Inicia Engine GM por padrão
    onEngineChange();

    // Inicia Loop de Animação
    requestAnimationFrame(gameLoop);
});

// ==========================================
// LÓGICA DE LEVEL DESIGN (MOUSE ON CANVAS)
// ==========================================
function getGridCoords(event) {
    const rect = canvasElement.getBoundingClientRect();
    // Converte a coordenada real do clique para o espaço virtual de 1280x480
    const clickX = (event.clientX - rect.left) * (SCREEN_WIDTH / rect.width);
    const clickY = (event.clientY - rect.top) * (SCREEN_HEIGHT / rect.height);
    const col = Math.floor(clickX / GRID_SIZE);
    const row = Math.floor(clickY / GRID_SIZE);
    return [col, row];
}

function onMouseDown(event) {
    // Desfoca qualquer caixa de texto ou seletor ativo ao clicar no canvas
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    const [col, row] = getGridCoords(event);
    if (col >= 0 && col < COLS && row >= 0 && row < GROUND_ROW) {
        if (event.button === 0) {
            isDrawing = true;
            obstacles.add(`${col},${row}`);
        } else if (event.button === 2 || event.button === 1) {
            isErasing = true;
            obstacles.delete(`${col},${row}`);
        }
    }
}

function onMouseMove(event) {
    if (!isDrawing && !isErasing) return;
    const [col, row] = getGridCoords(event);
    if (col >= 0 && col < COLS && row >= 0 && row < GROUND_ROW) {
        if (isDrawing) {
            obstacles.add(`${col},${row}`);
        } else if (isErasing) {
            obstacles.delete(`${col},${row}`);
        }
    }
}

function clearCanvas() {
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    obstacles.clear();
}

function resetPlayer() {
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    player.reset(2 * GRID_SIZE, GROUND_Y - 3 * GRID_SIZE);

    // Reinicia métricas guardadas, fixadas e traçados de salto
    currentJump = null;
    previousJump = null;
    pinnedReference = null;
    player.lastJumpPeakY = null;
    player.lastJumpStartX = null;
    player.lastJumpLandX = null;
    player.lastArcPoints = [];
    updateJumpMetricsUI();
    showToast("Bloco e métricas reiniciados.");
}

// ==========================================
// CONTROLE DE INPUTS E PRESETS
// ==========================================
function resetToDefault(key) {
    if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
    }
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    
    if (key === "doubleJump") {
        const input = document.getElementById('input-doubleJump');
        if (input) input.checked = preset.doubleJump ? preset.doubleJump.default : false;
    } else if (key === "maxJumps") {
        const input = document.getElementById('input-maxJumps');
        const defaultVal = preset.maxJumps ? preset.maxJumps.default : 1;
        if (input) {
            input.classList.remove('error');
            input.value = defaultVal;
        }
    } else if (preset[key]) {
        const defaultVal = preset[key].default;
        const input = document.getElementById(`input-${key}`);
        if (input) {
            input.classList.remove('error');
            if (engine === "Construct 3") {
                input.value = Math.round(defaultVal);
            } else {
                input.value = defaultVal.toFixed(2);
            }
        }
    }
    updateCodeTemplate();
}

function onEngineChange() {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    lblEngineDesc.textContent = preset.description;

    // Desfoca o seletor para evitar sequestro de teclas de seta
    comboEngine.blur();

    // Atualiza cabeçalho no modal de código se presente
    const modalBadge = document.getElementById("modal-engine-badge");
    if (modalBadge) {
        modalBadge.textContent = `CÓDIGO DE INTEGRAÇÃO (${engine.toUpperCase()})`;
    }

    // Controle de visibilidade dos campos específicos do motor
    const rowAccelAir = document.getElementById('row-accelAir');
    const rowFrictionAir = document.getElementById('row-frictionAir');
    const rowDoubleJump = document.getElementById('row-doubleJump');
    const rowMaxJumps = document.getElementById('row-maxJumps');

    if (engine === "Construct 3") {
        if (rowAccelAir) rowAccelAir.style.display = 'none';
        if (rowFrictionAir) rowFrictionAir.style.display = 'none';
        if (rowDoubleJump) rowDoubleJump.style.display = 'block';
        if (rowMaxJumps) rowMaxJumps.style.display = 'none';
    } else {
        if (rowAccelAir) rowAccelAir.style.display = 'block';
        if (rowFrictionAir) rowFrictionAir.style.display = 'block';
        if (rowDoubleJump) rowDoubleJump.style.display = 'none';
        if (rowMaxJumps) rowMaxJumps.style.display = 'block';
    }

    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed", "maxJumps", "doubleJump"];
    inputsList.forEach(key => {
        const defaultBtn = document.querySelector(`#row-${key} .default-btn`);
        const labelElem = document.getElementById(`lbl-input-${key}`);

        // Atualiza rótulo em português de acordo com o preset do motor
        if (preset.labels && preset.labels[key] && labelElem) {
            labelElem.textContent = preset.labels[key];
        }
        
        // Atualiza rótulo padrão
        if (defaultBtn) {
            if (key === "doubleJump") {
                defaultBtn.textContent = `Padrão: ${preset.doubleJump && preset.doubleJump.default ? 'Sim' : 'Não'}`;
            } else if (key === "maxJumps") {
                defaultBtn.textContent = `Padrão: ${preset.maxJumps ? preset.maxJumps.default : 1}`;
            } else if (preset[key]) {
                const defaultVal = preset[key].default;
                defaultBtn.textContent = (engine === "Construct 3") ? `Padrão: ${Math.round(defaultVal)}` : `Padrão: ${defaultVal.toFixed(2)}`;
            }
        }

        // Restaura valores de fábrica na caixa
        resetToDefault(key);
    });

    resetPlayer();
}

function getConvertedPhysicsValues() {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"];
    
    const vals = {};

    inputsList.forEach(key => {
        const input = document.getElementById(`input-${key}`);
        const defaultVal = preset[key].default;
        
        try {
            const rawVal = input ? input.value.trim() : "";
            if (rawVal === "") {
                vals[key] = defaultVal;
                if (input) input.classList.remove('error');
            } else {
                const num = parseFloat(rawVal);
                if (isNaN(num)) {
                    vals[key] = defaultVal;
                    if (input) input.classList.add('error');
                } else {
                    vals[key] = num;
                    if (input) input.classList.remove('error');
                }
            }
        } catch (e) {
            vals[key] = defaultVal;
            if (input) input.classList.add('error');
        }
    });

    const inputDoubleJump = document.getElementById('input-doubleJump');
    const inputMaxJumps = document.getElementById('input-maxJumps');

    let maxJumpsAllowed = 1;
    if (engine === "Construct 3") {
        maxJumpsAllowed = (inputDoubleJump && inputDoubleJump.checked) ? 2 : 1;
    } else {
        maxJumpsAllowed = inputMaxJumps ? Math.max(1, parseInt(inputMaxJumps.value, 10) || 1) : 1;
    }

    const grv = vals.gravity;
    const jump = vals.jump;
    const speed = vals.speed;
    const accel_g = vals.accelGround;
    const fric_g = vals.frictionGround;
    const accel_a = vals.accelAir;
    const fric_a = vals.frictionAir;
    const max_fall = vals.maxFallSpeed;

    // Conversão matemática de escalas para a física de ticks do canvas (padrão GameMaker)
    if (engine === "GameMaker") {
        return [grv, jump, speed, accel_g, fric_g, accel_a, fric_a, max_fall, maxJumpsAllowed];
    } 
    else if (engine === "Construct 3") {
        return [
            grv / 3600.0,
            -jump / 60.0,
            speed / 60.0,
            accel_g / 3600.0,
            fric_g / 3600.0,
            accel_g / 3600.0, // Construct 3 usa mesmo aceleração para ar/chão
            fric_g / 3600.0,  // Construct 3 usa mesma desaceleração para ar/chão
            max_fall / 60.0,
            maxJumpsAllowed
        ];
    }
    else if (engine === "Scratch") {
        return [
            -grv / 3.0,
            -jump / 1.5,
            speed / 1.8,
            accel_g / 2.0,
            (1.0 - fric_g) / 0.5,
            accel_a / 2.0,
            (1.0 - fric_a) / 0.5,
            -max_fall / 1.25,
            maxJumpsAllowed
        ];
    }

    return [0.3, -7.0, 4.0, 0.35, 0.15, 0.20, 0.05, 12.0, 1];
}

function updateCodeTemplate() {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"];
    const vals = {};

    inputsList.forEach(key => {
        const input = document.getElementById(`input-${key}`);
        const defaultVal = preset[key].default;
        const val = input ? parseFloat(input.value.trim()) : defaultVal;
        vals[key] = isNaN(val) ? defaultVal : val;
    });

    const inputDoubleJump = document.getElementById('input-doubleJump');
    vals['doubleJump'] = inputDoubleJump ? (inputDoubleJump.checked ? "Habilitado" : "Desabilitado") : "Desabilitado";

    const inputMaxJumps = document.getElementById('input-maxJumps');
    vals['maxJumps'] = inputMaxJumps ? Math.max(1, parseInt(inputMaxJumps.value, 10) || 1) : 1;

    let code = preset.code_template;
    for (const key in vals) {
        let replacement = vals[key];
        if (key === "doubleJump") {
            // mantém formato textual
        } else if (key === "maxJumps") {
            replacement = Math.round(replacement);
        } else {
            if (engine !== "Construct 3") {
                replacement = (key === "jump" || key === "speed" || key === "maxFallSpeed") ? replacement.toFixed(1) : replacement.toFixed(2);
            } else {
                replacement = Math.round(replacement);
            }
        }
        code = code.replace(`{${key}}`, replacement);
    }

    codeTemplateDisplay.textContent = code;
}

function copyVariablesCode() {
    const code = codeTemplateDisplay.textContent;
    try {
        navigator.clipboard.writeText(code).then(() => {
            showToast("Variáveis copiadas com sucesso!");
        }).catch(err => {
            console.error("Erro ao copiar código", err);
        });
    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// RASTREAMENTO E COMPARAÇÃO DE SALTOS (HUD)
// ==========================================
function onJumpCompleted(playerObj) {
    if (playerObj.lastJumpPeakY === null || playerObj.lastJumpStartX === null || playerObj.lastJumpLandX === null) return;

    const heightPixels = Math.max(0, GROUND_Y - (playerObj.lastJumpPeakY + GRID_SIZE));
    const heightBlocks = heightPixels / GRID_SIZE;
    const distPixels = Math.abs(playerObj.lastJumpLandX - playerObj.lastJumpStartX);
    const distBlocks = distPixels / GRID_SIZE;

    // Se já havia um salto anterior registrado e não há referência fixada, o atual passa a ser o anterior
    if (currentJump && !pinnedReference) {
        previousJump = { ...currentJump };
    }

    currentJump = {
        heightPixels,
        heightBlocks,
        distPixels,
        distBlocks,
        arcPoints: [...playerObj.lastArcPoints],
        midAirJumpPoints: [...(playerObj.lastMidAirJumpPoints || [])],
        peakY: playerObj.lastJumpPeakY,
        startX: playerObj.lastJumpStartX,
        landX: playerObj.lastJumpLandX
    };

    updateJumpMetricsUI();
}

function updateJumpMetricsUI() {
    const hudCurrent = document.getElementById('hud-current-metrics');
    const hudPrevious = document.getElementById('hud-previous-metrics');
    const hudDeltaPill = document.getElementById('hud-delta-pill');
    const hudDelta = document.getElementById('hud-delta-metrics');
    const hudRefLabel = document.getElementById('hud-ref-label');
    const btnPin = document.getElementById('btn-pin-reference');

    if (!hudCurrent) return;

    if (currentJump) {
        hudCurrent.innerHTML = `Alt: <strong>${currentJump.heightBlocks.toFixed(2)} bl</strong> (${Math.round(currentJump.heightPixels)}px) | Dist: <strong>${currentJump.distBlocks.toFixed(2)} bl</strong> (${Math.round(currentJump.distPixels)}px)`;
    } else {
        hudCurrent.innerHTML = `Alt: <strong>--</strong> | Dist: <strong>--</strong>`;
    }

    const refTarget = pinnedReference || previousJump;

    if (pinnedReference) {
        hudRefLabel.textContent = "📌 Ref. Fixada:";
        hudPrevious.innerHTML = `Alt: <strong>${pinnedReference.heightBlocks.toFixed(2)} bl</strong> | Dist: <strong>${pinnedReference.distBlocks.toFixed(2)} bl</strong>`;
        if (btnPin) {
            btnPin.textContent = "📍 Desafixar";
            btnPin.classList.add("is-pinned");
        }
    } else if (previousJump) {
        hudRefLabel.textContent = "⏱️ Salto Anterior:";
        hudPrevious.innerHTML = `Alt: <strong>${previousJump.heightBlocks.toFixed(2)} bl</strong> | Dist: <strong>${previousJump.distBlocks.toFixed(2)} bl</strong>`;
        if (btnPin) {
            btnPin.textContent = "📌 Fixar Referência";
            btnPin.classList.remove("is-pinned");
        }
    } else {
        hudRefLabel.textContent = "⏱️ Salto Anterior:";
        hudPrevious.innerHTML = `Alt: <strong>--</strong> | Dist: <strong>--</strong>`;
        if (btnPin) {
            btnPin.textContent = "📌 Fixar Referência";
            btnPin.classList.remove("is-pinned");
        }
    }

    // Calcula Diferença Delta se houver salto atual e referência
    if (currentJump && refTarget && (currentJump !== refTarget)) {
        const dAlt = currentJump.heightBlocks - refTarget.heightBlocks;
        const dDist = currentJump.distBlocks - refTarget.distBlocks;

        const formatDelta = (val) => {
            const sign = val > 0 ? "+" : "";
            const color = val > 0.05 ? "var(--color-neon-green)" : (val < -0.05 ? "var(--color-neon-red)" : "var(--color-neon-blue)");
            return `<span style="color: ${color}; font-weight: 700;">${sign}${val.toFixed(2)} bl</span>`;
        };

        hudDelta.innerHTML = `Δ Alt: ${formatDelta(dAlt)} | Δ Dist: ${formatDelta(dDist)}`;
        hudDeltaPill.style.display = "flex";
    } else {
        hudDeltaPill.style.display = "none";
    }
}

function showToast(message) {
    let toast = document.getElementById('tt-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'tt-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show';
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ==========================================
// TECLADO BINDINGS
// ==========================================
function onKeyPress(event) {
    const key = event.key.toLowerCase();
    
    // Se o elemento ativo for um input, select ou botão, remove o foco quando o usuário tenta mover o personagem
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) {
        if (document.activeElement && document.activeElement !== document.body) {
            document.activeElement.blur();
        }
    }

    // Evita scroll da tela com Space e Arrows nas páginas
    if ([" ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(event.key)) {
        event.preventDefault();
    }

    if (key === "arrowleft" || key === "a") {
        keys.left = true;
    } else if (key === "arrowright" || key === "d") {
        keys.right = true;
    } else if (key === " " || key === "arrowup" || key === "w") {
        keys.jump = true;
    }
}

function onKeyRelease(event) {
    const key = event.key.toLowerCase();
    if (key === "arrowleft" || key === "a") {
        keys.left = false;
    } else if (key === "arrowright" || key === "d") {
        keys.right = false;
    } else if (key === " " || key === "arrowup" || key === "w") {
        keys.jump = false;
    }
}

// ==========================================
// LOOP DE SIMULAÇÃO PRINCIPAL (60 FPS)
// ==========================================
function gameLoop() {
    // 1. Ler e Converter os Parâmetros Físicos Atuais
    const [grv_int, jump_int, speed_int,
           accel_g_int, fric_g_int,
           accel_a_int, fric_a_int, max_fall_int, maxJumpsAllowed] = getConvertedPhysicsValues();

    // 2. Slow Motion (Câmera Lenta roda física 1 vez a cada 4 frames)
    let runPhysics = true;
    if (switchSlow.checked) {
        slowMotionCounter = (slowMotionCounter + 1) % 4;
        runPhysics = (slowMotionCounter === 0);
    }

    if (runPhysics) {
        player.update(
            keys,
            grv_int,
            jump_int,
            speed_int,
            accel_g_int,
            fric_g_int,
            accel_a_int,
            fric_a_int,
            max_fall_int,
            obstacles,
            maxJumpsAllowed
        );
    }

    // 3. Renderização Gráfica do Canvas
    drawFrame(player, obstacles);

    requestAnimationFrame(gameLoop);
}

// ==========================================
// DESENHO GRÁFICO (CANVAS RENDERER)
// ==========================================
function drawFrame(playerPhysics, obstaclesSet) {
    // Limpa tela anterior
    ctx.fillStyle = COLOR_CANVAS_BG;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 1. Desenhar a Grade de Guia (Grid 32x32 com modos de nitidez)
    if (gridMode !== "off") {
        let gridColor = "rgba(255, 255, 255, 0.16)"; // Default: Nítida
        const is4x4 = (gridMode === "grid4x4");

        if (gridMode === "neon") {
            gridColor = "rgba(0, 210, 255, 0.28)";
        } else if (gridMode === "subtle") {
            gridColor = "#1a1a24";
        } else if (gridMode === "grid4x4") {
            gridColor = "rgba(255, 255, 255, 0.08)";
        }

        ctx.lineWidth = 1;
        for (let c = 0; c <= COLS; c++) {
            ctx.beginPath();
            ctx.moveTo(c * GRID_SIZE, 0);
            ctx.lineTo(c * GRID_SIZE, SCREEN_HEIGHT);
            if (is4x4 && c % 4 === 0) {
                ctx.save();
                ctx.strokeStyle = "rgba(0, 210, 255, 0.55)";
                ctx.lineWidth = 1.75;
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.strokeStyle = gridColor;
                ctx.stroke();
            }
        }
        for (let r = 0; r <= ROWS; r++) {
            ctx.beginPath();
            ctx.moveTo(0, r * GRID_SIZE);
            ctx.lineTo(SCREEN_WIDTH, r * GRID_SIZE);
            if (is4x4 && r % 4 === 0) {
                ctx.save();
                ctx.strokeStyle = "rgba(0, 210, 255, 0.55)";
                ctx.lineWidth = 1.75;
                ctx.stroke();
                ctx.restore();
            } else {
                ctx.strokeStyle = gridColor;
                ctx.stroke();
            }
        }
    }

    // 2. Desenhar Chão Sólido Verde
    ctx.fillStyle = COLOR_GROUND;
    ctx.fillRect(0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y);
    ctx.strokeStyle = "#1a1a24";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, GROUND_Y, SCREEN_WIDTH, SCREEN_HEIGHT - GROUND_Y);

    // 3. Desenhar Obstáculos do Usuário
    ctx.fillStyle = COLOR_OBSTACLE;
    for (const key of obstaclesSet) {
        const [col, row] = key.split(',').map(Number);
        ctx.fillRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
        ctx.strokeRect(col * GRID_SIZE, row * GRID_SIZE, GRID_SIZE, GRID_SIZE);
    }

    // 4. Desenhar Métricas do Pulo
    let peakY = null;
    let startX = null;
    let landX = null;
    let arc = [];

    if (playerPhysics.isJumping) {
        peakY = playerPhysics.jumpPeakY;
        startX = playerPhysics.jumpStartX;
        arc = playerPhysics.arcPoints;
    } else if (playerPhysics.lastJumpPeakY !== null) {
        peakY = playerPhysics.lastJumpPeakY;
        startX = playerPhysics.lastJumpStartX;
        landX = playerPhysics.lastJumpLandX;
        arc = playerPhysics.lastArcPoints;
    }

    // A0. Desenhar Arco Fantasma de Referência / Salto Anterior
    const refToDraw = pinnedReference || (playerPhysics.isJumping ? (currentJump || previousJump) : previousJump);
    if (refToDraw && refToDraw.arcPoints && refToDraw.arcPoints.length > 1) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(refToDraw.arcPoints[0][0], refToDraw.arcPoints[0][1]);
        for (let i = 1; i < refToDraw.arcPoints.length; i++) {
            ctx.lineTo(refToDraw.arcPoints[i][0], refToDraw.arcPoints[i][1]);
        }
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = pinnedReference ? "rgba(0, 210, 255, 0.75)" : "rgba(180, 195, 220, 0.45)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Linha de Pico da Referência
        if (refToDraw.peakY !== null) {
            ctx.beginPath();
            ctx.setLineDash([3, 5]);
            ctx.moveTo(0, refToDraw.peakY + GRID_SIZE);
            ctx.lineTo(SCREEN_WIDTH, refToDraw.peakY + GRID_SIZE);
            ctx.strokeStyle = pinnedReference ? "rgba(0, 210, 255, 0.5)" : "rgba(180, 195, 220, 0.25)";
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.font = '600 10px Outfit, sans-serif';
            ctx.fillStyle = pinnedReference ? "#00d2ff" : "#94a3b8";
            ctx.textAlign = 'right';
            const labelRef = pinnedReference 
                ? `[ Ref. Fixada ] Pico: ${refToDraw.heightBlocks.toFixed(2)} bl` 
                : `[ Anterior ] Pico: ${refToDraw.heightBlocks.toFixed(2)} bl`;
            ctx.fillText(labelRef, SCREEN_WIDTH - 15, refToDraw.peakY + GRID_SIZE - 6);
        }

        // Pontos de impulso de pulo duplo na curva fantasma de referência
        if (refToDraw.midAirJumpPoints && refToDraw.midAirJumpPoints.length > 0) {
            for (const bPt of refToDraw.midAirJumpPoints) {
                ctx.beginPath();
                ctx.arc(bPt[0], bPt[1], 4, 0, 2 * Math.PI);
                ctx.fillStyle = pinnedReference ? "rgba(0, 210, 255, 0.7)" : "rgba(180, 195, 220, 0.5)";
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // A. Desenhar Arco do Salto (Pontos conectados)
    if (arc.length > 1) {
        ctx.beginPath();
        ctx.moveTo(arc[0][0], arc[0][1]);
        for (let i = 1; i < arc.length; i++) {
            ctx.lineTo(arc[i][0], arc[i][1]);
        }
        ctx.strokeStyle = COLOR_ARC_LINE;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        
        // Desenha a flecha na ponta final
        const lastPt = arc[arc.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt[0], lastPt[1], 4, 0, 2 * Math.PI);
        ctx.fillStyle = COLOR_ARC_LINE;
        ctx.fill();

        // Marcadores visuais neon nos pontos onde ocorreu o pulo duplo no ar
        const boostPts = playerPhysics.isJumping ? playerPhysics.midAirJumpPoints : (playerPhysics.lastMidAirJumpPoints || []);
        if (boostPts && boostPts.length > 0) {
            ctx.save();
            for (const bPt of boostPts) {
                // Anel neon ciano
                ctx.beginPath();
                ctx.arc(bPt[0], bPt[1], 6, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(0, 210, 255, 0.35)";
                ctx.fill();
                ctx.strokeStyle = "#00d2ff";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Ponto de luz central
                ctx.beginPath();
                ctx.arc(bPt[0], bPt[1], 2.5, 0, 2 * Math.PI);
                ctx.fillStyle = "#ffffff";
                ctx.fill();
            }
            ctx.restore();
        }
    }

    // B. Desenhar Linha de Pico Altura Máxima (Dashed Vermelho)
    if (peakY !== null) {
        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(0, peakY + GRID_SIZE);
        ctx.lineTo(SCREEN_WIDTH, peakY + GRID_SIZE);
        ctx.strokeStyle = COLOR_PEAK_LINE;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]); // Reset dash

        // Calcula altura
        const heightPixels = GROUND_Y - (peakY + GRID_SIZE);
        const heightBlocks = heightPixels / GRID_SIZE;

        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.fillStyle = COLOR_PEAK_LINE;
        ctx.textAlign = 'left';
        ctx.fillText(`Altura Pico: ${heightBlocks.toFixed(2)} blocos (${Math.round(heightPixels)}px)`, 15, peakY + GRID_SIZE - 8);
    }

    // C. Desenhar Medidor de Alcance Horizontal (Amarelo)
    if (startX !== null) {
        const currentX = playerPhysics.isJumping ? (playerPhysics.x + GRID_SIZE / 2.0) : landX;
        
        if (currentX !== null && Math.abs(currentX - startX) > 2) {
            ctx.beginPath();
            ctx.moveTo(startX, GROUND_Y - 6);
            ctx.lineTo(currentX, GROUND_Y - 6);
            ctx.strokeStyle = COLOR_ARC_LINE;
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Círculos nas extremidades
            ctx.beginPath();
            ctx.arc(startX, GROUND_Y - 6, 3, 0, 2 * Math.PI);
            ctx.arc(currentX, GROUND_Y - 6, 3, 0, 2 * Math.PI);
            ctx.fillStyle = COLOR_ARC_LINE;
            ctx.fill();

            const distPixels = Math.abs(currentX - startX);
            const distBlocks = distPixels / GRID_SIZE;

            ctx.font = 'bold 11px Outfit, sans-serif';
            ctx.fillStyle = COLOR_ARC_LINE;
            ctx.textAlign = 'center';
            ctx.fillText(`Alcance: ${distBlocks.toFixed(2)} bl`, (startX + currentX) / 2.0, GROUND_Y - 18);
        }
    }

    // 5. Desenhar Bloco do Jogador (Ciano Brilhante)
    ctx.fillStyle = COLOR_PLAYER;
    ctx.fillRect(playerPhysics.x, playerPhysics.y, GRID_SIZE, GRID_SIZE);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(playerPhysics.x, playerPhysics.y, GRID_SIZE, GRID_SIZE);

    // Desenhar Olhos indicando a direção de movimento
    const eyeY = playerPhysics.y + 9;
    ctx.fillStyle = "#070a13";
    if (playerPhysics.hsp >= 0) {
        ctx.fillRect(playerPhysics.x + 16, eyeY, 4, 6);
        ctx.fillRect(playerPhysics.x + 22, eyeY, 4, 6);
    } else {
        ctx.fillRect(playerPhysics.x + 6, eyeY, 4, 6);
        ctx.fillRect(playerPhysics.x + 12, eyeY, 4, 6);
    }

    // 6. Texto explicativo fixo
    ctx.font = '500 11px Outfit, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText("Setas / WASD: Mover | Espaço / W / Seta Cima: Pular", 12, 20);
    ctx.fillText("Mouse: Clique Esquerdo = Desenhar Obstáculos | Clique Direito = Apagar", 12, 36);
}
