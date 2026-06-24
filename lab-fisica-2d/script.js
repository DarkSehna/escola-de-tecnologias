// ==========================================================================
// MOTOR DE FÍSICA E INTERACTION CONTROLLER - LAB DE FÍSICA 2D
// Escola de Tecnologias - TitanTech
// ==========================================================================

// Tamanho do Bloco Físico
const GRID_SIZE = 32;
const COLS = 20;
const ROWS = 15;
const SCREEN_WIDTH = COLS * GRID_SIZE;  // 640
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
        code_template: 
`// --- Variáveis no obj_lifeForm (Pai) ---
grv = {gravity};          // Gravidade
jspd = {jump};         // Força do pulo
maxFallSpeed = {maxFallSpeed}; // Queda limite

// --- Variáveis no obj_player (Filho) ---
moveSpeed = {speed};      // Velocidade máx lateral
accelGround = {accelGround};   // Aceleração no chão
frictionGround = {frictionGround}; // Fricção no chão
accelAir = {accelAir};      // Aceleração no ar
frictionAir = {frictionAir};   // Fricção no ar`
    },
    "Construct 3": {
        title: "Construct 3 (Platform)",
        description: "Variáveis mapeadas para as propriedades nativas do comportamento 'Platform'.",
        gravity: { min: 100.0, max: 5000.0, default: 1080.0, step: 50.0 },
        jump: { min: 100.0, max: 1500.0, default: 420.0, step: 10.0 },
        speed: { min: 50.0, max: 1000.0, default: 240.0, step: 10.0 },
        accelGround: { min: 50.0, max: 5000.0, default: 1260.0, step: 50.0 },
        frictionGround: { min: 50.0, max: 5000.0, default: 540.0, step: 50.0 },
        accelAir: { min: 50.0, max: 5000.0, default: 720.0, step: 50.0 },
        frictionAir: { min: 10.0, max: 2000.0, default: 180.0, step: 10.0 },
        maxFallSpeed: { min: 100.0, max: 2500.0, default: 720.0, step: 50.0 },
        code_template: 
`// Ajuste estas propriedades no comportamento 'Platform' do seu Objeto:
Max Speed = {speed}
Acceleration = {accelGround}
Deceleration = {frictionGround}
Gravity = {gravity}
Jump Strength = {jump}
Max Fall Speed = {maxFallSpeed}`
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
        code_template: 
`// Defina as variáveis no script do seu Ator Jogador:
mude [velocidade_max v] para ({speed})
mude [aceleração_chão v] para ({accelGround})
mude [atrito_chão v] para ({frictionGround})
mude [aceleração_ar v] para ({accelAir})
mude [atrito_ar v] para ({frictionAir})
mude [gravidade v] para ({gravity})
mude [força_pulo v] para ({jump})
mude [queda_maxima v] para ({maxFallSpeed})`
    }
};

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
        
        // Métricas de Salto
        this.isJumping = false;
        this.jumpStartX = 0.0;
        this.jumpPeakY = parseFloat(startY);
        this.jumpLandX = 0.0;
        
        this.arcPoints = [];
        
        // Histórico do último pulo completo
        this.lastJumpPeakY = null;
        this.lastJumpStartX = null;
        this.lastJumpLandX = null;
        this.lastArcPoints = [];
    }

    reset(startX, startY) {
        this.x = parseFloat(startX);
        this.y = parseFloat(startY);
        this.hsp = 0.0;
        this.vsp = 0.0;
        this.isGrounded = false;
        this.isJumping = false;
        this.arcPoints = [];
        
        this.lastJumpPeakY = null;
        this.lastJumpStartX = null;
        this.lastJumpLandX = null;
        this.lastArcPoints = [];
    }

    update(keys, grv_int, jump_int, speed_int, accel_ground_int, fric_ground_int,
           accel_air_int, fric_air_int, max_fall_int, obstacles) {
        
        // Garante que o jogador não caia fora do chão principal
        if (this.y + GRID_SIZE > GROUND_Y) {
            this.y = GROUND_Y - GRID_SIZE;
            this.vsp = 0.0;
            this.isGrounded = true;
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

        // 3. Movimento Vertical
        if (!this.isGrounded) {
            this.vsp += grv_int;
            this.vsp = Math.min(this.vsp, max_fall_int);
        } else {
            this.vsp = 0.0;
            if (keys.jump) {
                this.vsp = jump_int; // Impulso para cima
                this.isGrounded = false;
                
                // Inicia rastreio de pulo
                this.isJumping = true;
                this.jumpStartX = this.x + GRID_SIZE / 2.0;
                this.jumpPeakY = this.y;
                this.arcPoints = [[this.jumpStartX, this.y + GRID_SIZE / 2.0]];
            }
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
                
                if (this.isJumping) {
                    this.isJumping = false;
                    this.jumpLandX = this.x + GRID_SIZE / 2.0;
                    
                    this.lastJumpPeakY = this.jumpPeakY;
                    this.lastJumpStartX = this.jumpStartX;
                    this.lastJumpLandX = this.jumpLandX;
                    this.lastArcPoints = [...this.arcPoints];
                }
            }
            this.vsp = 0.0;
        } else {
            this.y = newY;
        }

        // 7. Checa queda de plataforma
        if (this.isGrounded && !this.placeMeeting(this.x, this.y + 1.0, obstacles)) {
            this.isGrounded = false;
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

    // Binds para as caixas físicas atualizarem o código dinamicamente
    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"];
    inputsList.forEach(key => {
        const input = document.getElementById(`input-${key}`);
        input.addEventListener('input', updateCodeTemplate);
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
    // Converte a coordenada real do clique para o espaço virtual de 640x480
    const clickX = (event.clientX - rect.left) * (SCREEN_WIDTH / rect.width);
    const clickY = (event.clientY - rect.top) * (SCREEN_HEIGHT / rect.height);
    const col = Math.floor(clickX / GRID_SIZE);
    const row = Math.floor(clickY / GRID_SIZE);
    return [col, row];
}

function onMouseDown(event) {
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
    obstacles.clear();
}

function resetPlayer() {
    player.reset(2 * GRID_SIZE, GROUND_Y - 3 * GRID_SIZE);
}

// ==========================================
// CONTROLE DE INPUTS E PRESETS
// ==========================================
function resetToDefault(key) {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    const defaultVal = preset[key].default;

    const input = document.getElementById(`input-${key}`);
    input.classList.remove('error');

    if (engine === "Construct 3") {
        input.value = Math.round(defaultVal);
    } else {
        input.value = defaultVal.toFixed(2);
    }
    updateCodeTemplate();
}

function onEngineChange() {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    lblEngineDesc.textContent = preset.description;

    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"];
    inputsList.forEach(key => {
        const defaultVal = preset[key].default;
        const defaultBtn = document.querySelector(`#row-${key} .default-btn`);
        
        // Atualiza rótulo padrão
        if (engine === "Construct 3") {
            defaultBtn.textContent = `Padrão: ${Math.round(defaultVal)}`;
        } else {
            defaultBtn.textContent = `Padrão: ${defaultVal.toFixed(2)}`;
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
            const rawVal = input.value.trim();
            if (rawVal === "") {
                vals[key] = defaultVal;
                input.classList.remove('error');
            } else {
                const num = parseFloat(rawVal);
                if (isNaN(num)) {
                    vals[key] = defaultVal;
                    input.classList.add('error');
                } else {
                    vals[key] = num;
                    input.classList.remove('error');
                }
            }
        } catch (e) {
            vals[key] = defaultVal;
            input.classList.add('error');
        }
    });

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
        return [grv, jump, speed, accel_g, fric_g, accel_a, fric_a, max_fall];
    } 
    else if (engine === "Construct 3") {
        return [
            grv / 3600.0,
            -jump / 60.0,
            speed / 60.0,
            accel_g / 3600.0,
            fric_g / 3600.0,
            accel_a / 3600.0,
            fric_a / 3600.0,
            max_fall / 60.0
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
            -max_fall / 1.25
        ];
    }

    return [0.3, -7.0, 4.0, 0.35, 0.15, 0.20, 0.05, 12.0];
}

function updateCodeTemplate() {
    const engine = comboEngine.value;
    const preset = ENGINE_PRESETS[engine];
    const inputsList = ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"];
    const vals = {};

    inputsList.forEach(key => {
        const input = document.getElementById(`input-${key}`);
        const defaultVal = preset[key].default;
        const val = parseFloat(input.value.trim());
        vals[key] = isNaN(val) ? defaultVal : val;
    });

    let code = preset.code_template;
    for (const key in vals) {
        let replacement = vals[key];
        if (engine !== "Construct 3") {
            // Scratch e GameMaker mostram duas casas decimais
            replacement = (key === "jump" || key === "speed" || key === "maxFallSpeed") ? replacement.toFixed(1) : replacement.toFixed(2);
        } else {
            replacement = Math.round(replacement);
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
           accel_a_int, fric_a_int, max_fall_int] = getConvertedPhysicsValues();

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
            obstacles
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

    // 1. Desenhar a Grade de Guia (Grid 32x32)
    ctx.strokeStyle = COLOR_GRID;
    ctx.lineWidth = 1;
    for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(c * GRID_SIZE, 0);
        ctx.lineTo(c * GRID_SIZE, SCREEN_HEIGHT);
        ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * GRID_SIZE);
        ctx.lineTo(SCREEN_WIDTH, r * GRID_SIZE);
        ctx.stroke();
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
