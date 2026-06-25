// ==========================================================================
// CORE FSM SIMULATOR AND VISUAL NODE EDITOR
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

    playTone(freq, type, duration, volume = 0.1) {
        try {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            // Envelope de volume (evita cliques secos nas caixas de som)
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

    playClick() {
        this.playTone(880, 'sine', 0.08, 0.08);
    }

    playSuccess() {
        this.playTone(1046.50, 'sine', 0.12, 0.1); // C6
        setTimeout(() => this.playTone(1318.51, 'sine', 0.15, 0.1), 80); // E6
    }

    playActive() {
        this.playTone(1174.66, 'triangle', 0.2, 0.08); // D6
    }

    playError() {
        this.playTone(180, 'triangle', 0.25, 0.15);
        setTimeout(() => this.playTone(150, 'triangle', 0.25, 0.15), 50);
    }
}

const audio = new SynthAudio();

// --- ESTADOS INICIAIS E PERSISTÊNCIA ---
const CANVAS_WIDTH = 5000;
const CANVAS_HEIGHT = 5000;
const GRID_SNAP = 16;

const DEFAULT_PROJECT_STATES = ["GROUND", "AIR", "DASH", "ATTACK", "HURT", "DEAD"];

const DEFAULT_CONNECTIONS = {
    "GROUND": { "AIR": "SPACE", "DASH": "SHIFT", "ATTACK": "X", "HURT": "H", "DEAD": "K" },
    "AIR": { "GROUND": "DOWN", "DASH": "SHIFT", "HURT": "H", "DEAD": "K" },
    "DASH": { "GROUND": "NONE", "AIR": "NONE", "HURT": "H", "DEAD": "K" },
    "ATTACK": { "GROUND": "NONE", "AIR": "NONE", "HURT": "H", "DEAD": "K" },
    "HURT": { "GROUND": "NONE", "AIR": "NONE", "DEAD": "K" },
    "DEAD": { "AIR": "SPACE" }
};

const DEFAULT_NODE_POSITIONS = {
    "GROUND": { x: 2200, y: 2400 },
    "AIR": { x: 2600, y: 2400 }
};

// Carregar ou Inicializar Modelo FSM
let fsmData = {
    states: [...DEFAULT_PROJECT_STATES],
    connections: JSON.parse(JSON.stringify(DEFAULT_CONNECTIONS)),
    nodes: JSON.parse(JSON.stringify(DEFAULT_NODE_POSITIONS)),
    activeState: "GROUND"
};

function loadFSMFromStorage() {
    const saved = localStorage.getItem("titan_tech_fsm");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (parsed.states && parsed.connections && parsed.nodes) {
                fsmData = parsed;
            }
        } catch (e) {
            console.error("Erro ao ler localStorage", e);
        }
    }
}

function saveFSMToStorage() {
    localStorage.setItem("titan_tech_fsm", JSON.stringify(fsmData));
}

// --- VARIÁVEIS DO EDITOR VISUAL ---
let panX = -1700; // Inicia centralizado na tela
let panY = -1700;
let zoomScale = 1.0;

let isPanning = false;
let startPanX = 0;
let startPanY = 0;

let draggedNode = null;
let nodeDragOffset = { x: 0, y: 0 };

let isConnecting = false;
let connSource = null;

let selectedTransition = null; // { source, target }
let selectedNode = null; // stateName

let isRecordingTrigger = false;
let stateTimerId = null;

// Elementos DOM
const viewport = document.getElementById("fsm-workspace");
const container = document.getElementById("fsm-canvas-container");
const nodesLayer = document.getElementById("nodes-layer");
const svgOverlay = document.getElementById("fsm-svg-overlay");
const svgPathsGroup = document.getElementById("svg-paths-group");
const tempPath = document.getElementById("temp-svg-path");
const activeStateVal = document.getElementById("active-state-val");

// Binds de Controles Laterais
const inputStateName = document.getElementById("input-state-name");
const btnCreateState = document.getElementById("btn-create-state");
const projectStatesList = document.getElementById("project-states-list");
const transConfigPanel = document.getElementById("transition-config-panel");
const lblTransPath = document.getElementById("lbl-trans-path");
const lblCurrentTrigger = document.getElementById("lbl-current-trigger");
const btnRecordTrigger = document.getElementById("btn-record-trigger");
const comboTimer = document.getElementById("combo-timer");
const comboExportEngine = document.getElementById("combo-export-engine");
const codeTemplateDisplay = document.getElementById("code-template-display");
const btnCopyCode = document.getElementById("btn-copy-code");
const btnClearCanvas = document.getElementById("btn-clear-canvas");
const btnResetView = document.getElementById("btn-reset-view");

// Console Logs
const btnToggleConsole = document.getElementById("btn-toggle-console");
const consoleToggleIcon = document.getElementById("console-toggle-icon");
const consoleOutput = document.getElementById("console-output");

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    loadFSMFromStorage();

    // 1. Ouvintes de Panning e Zoom do Canvas
    viewport.addEventListener("pointerdown", onViewportPointerDown);
    viewport.addEventListener("pointermove", onViewportPointerMove);
    viewport.addEventListener("pointerup", onViewportPointerUp);
    viewport.addEventListener("wheel", onViewportWheel, { passive: false });

    // 2. Drag & Drop nativo dos Estados na Barra Lateral
    setupSidebarList();

    // 3. Ouvintes dos Controles
    btnCreateState.addEventListener("click", handleCreateState);
    inputStateName.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleCreateState();
    });

    btnRecordTrigger.addEventListener("click", startRecordingMode);
    comboTimer.addEventListener("change", handleTimerSelectChange);
    comboExportEngine.addEventListener("change", updateCodeTemplate);
    btnCopyCode.addEventListener("click", copyVariablesCode);

    btnClearCanvas.addEventListener("click", clearCanvasWorkspace);
    btnResetView.addEventListener("click", centerView);

    // 4. Console logs toggle
    btnToggleConsole.addEventListener("click", toggleConsole);

    // 5. Cliques em áreas vazias para deseleção
    viewport.addEventListener("click", (e) => {
        if (e.target === viewport) {
            deselectAll();
            audio.playClick();
        }
    });

    // 6. Delete para remover itens selecionados
    window.addEventListener("keydown", handleGlobalKeyDown);

    // Inicializar visualizações
    centerView();
    renderAllNodes();
    drawConnections();
    updateSidebarList();
    updateActiveStateHUD();
    updateCodeTemplate();
    
    // Log de Inicialização
    logMessage("Sistema FSM inicializado.", "info");
    logMessage("Use Duplo Clique nos nós para transicionar manualmente.", "info");
    logMessage("Use Botão Direito + Arrastar para conectar nós.", "info");

    // Iniciar temporizador se o estado ativo inicial tiver timer
    checkAndStartStateTimer(fsmData.activeState);
});

// --- LÓGICA DE PAN E ZOOM (CAMERA) ---
function centerView() {
    // Calcula o pan ideal para centralizar a área de trabalho
    const rect = viewport.getBoundingClientRect();
    panX = (rect.width / 2) - (CANVAS_WIDTH / 2 * zoomScale);
    panY = (rect.height / 2) - (CANVAS_HEIGHT / 2 * zoomScale);
    // Caso seja a inicialização antes de renderizar
    if (isNaN(panX)) {
        panX = -1700;
        panY = -1700;
    }
    updateTransform();
}

function updateTransform() {
    container.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomScale})`;
}

function onViewportPointerDown(e) {
    // Panning com clique do meio, clique direito no espaço vazio, ou segurando Espaço + clique esquerdo
    const isMiddleClick = (e.button === 1);
    const isRightClickEmpty = (e.button === 2 && e.target === viewport);
    const isSpaceDrag = (e.button === 0 && e.shiftKey); // Shift + Click Esquerdo serve como alternativa

    if (isMiddleClick || isRightClickEmpty || isSpaceDrag) {
        isPanning = true;
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
        viewport.setPointerCapture(e.pointerId);
        e.preventDefault();
    }
}

function onViewportPointerMove(e) {
    if (isPanning) {
        panX = e.clientX - startPanX;
        panY = e.clientY - startPanY;
        updateTransform();
    } else if (isConnecting && connSource) {
        // Desenha a linha temporária durante o arraste de conexão
        const rect = viewport.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left - panX) / zoomScale;
        const mouseY = (e.clientY - rect.top - panY) / zoomScale;

        const sourcePos = fsmData.nodes[connSource];
        if (sourcePos) {
            const startX = sourcePos.x + 55; // Metade do tamanho do nó (110x54)
            const startY = sourcePos.y + 27;
            tempPath.setAttribute("d", `M ${startX} ${startY} L ${mouseX} ${mouseY}`);
            tempPath.style.display = "block";
        }
    }
}

function onViewportPointerUp(e) {
    if (isPanning) {
        isPanning = false;
        viewport.releasePointerCapture(e.pointerId);
    } else if (isConnecting) {
        isConnecting = false;
        tempPath.style.display = "none";

        // Verifica se soltou sobre um nó diferente
        const targetNodeEl = document.elementFromPoint(e.clientX, e.clientY);
        const nodeEl = targetNodeEl ? targetNodeEl.closest(".state-node") : null;
        
        if (nodeEl) {
            const targetName = nodeEl.dataset.name;
            if (targetName && targetName !== connSource) {
                createFSMTransition(connSource, targetName);
            } else if (targetName === connSource) {
                logMessage("Auto-transições não são permitidas.", "error");
                audio.playError();
            }
        }
        connSource = null;
    }
}

function onViewportWheel(e) {
    e.preventDefault();

    const zoomIntensity = 0.08;
    const rect = viewport.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const prevZoom = zoomScale;
    if (e.deltaY < 0) {
        zoomScale = Math.min(2.0, zoomScale + zoomIntensity);
    } else {
        zoomScale = Math.max(0.4, zoomScale - zoomIntensity);
    }

    // Zoom centrado na posição do cursor
    panX = mouseX - (mouseX - panX) * (zoomScale / prevZoom);
    panY = mouseY - (mouseY - panY) * (zoomScale / prevZoom);

    updateTransform();
}

// --- CRIAR / CONTROLAR NÓS (ESTADOS) ---
function renderAllNodes() {
    nodesLayer.innerHTML = "";
    for (const name in fsmData.nodes) {
        createVisualNode(name, fsmData.nodes[name].x, fsmData.nodes[name].y);
    }
}

function createVisualNode(name, x, y) {
    const node = document.createElement("div");
    node.className = "state-node";
    node.className += (name === fsmData.activeState) ? " active" : "";
    node.dataset.name = name;
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;

    const title = document.createElement("span");
    title.className = "state-node-title";
    title.textContent = name;
    node.appendChild(title);

    // Eventos de Pointer para arraste do Nó
    node.addEventListener("pointerdown", (e) => {
        // Botão esquerdo arrasta o nó
        if (e.button === 0 && !e.shiftKey) {
            draggedNode = name;
            const rect = node.getBoundingClientRect();
            // Offset em escala real do nó
            nodeDragOffset.x = (e.clientX - rect.left) / zoomScale;
            nodeDragOffset.y = (e.clientY - rect.top) / zoomScale;
            node.setPointerCapture(e.pointerId);
            selectNode(name);
            e.stopPropagation();
        } 
        // Botão direito inicia conexão
        else if (e.button === 2) {
            isConnecting = true;
            connSource = name;
            e.stopPropagation();
            e.preventDefault();
        }
    });

    node.addEventListener("pointermove", (e) => {
        if (draggedNode === name) {
            const rect = viewport.getBoundingClientRect();
            let newX = (e.clientX - rect.left - panX) / zoomScale - nodeDragOffset.x;
            let newY = (e.clientY - rect.top - panY) / zoomScale - nodeDragOffset.y;

            // Clampa no Canvas e aplica Grid Snapping (Grade de 16px)
            newX = Math.max(50, Math.min(CANVAS_WIDTH - 180, Math.round(newX / GRID_SNAP) * GRID_SNAP));
            newY = Math.max(50, Math.min(CANVAS_HEIGHT - 100, Math.round(newY / GRID_SNAP) * GRID_SNAP));

            fsmData.nodes[name].x = newX;
            fsmData.nodes[name].y = newY;

            node.style.left = `${newX}px`;
            node.style.top = `${newY}px`;

            drawConnections();
        }
    });

    node.addEventListener("pointerup", (e) => {
        if (draggedNode === name) {
            draggedNode = null;
            node.releasePointerCapture(e.pointerId);
            saveFSMToStorage();
        }
    });

    node.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        tryManualTransition(name);
    });

    // Desabilita menu de contexto no clique do botão direito
    node.addEventListener("contextmenu", e => e.preventDefault());

    nodesLayer.appendChild(node);
}

function handleCreateState() {
    const text = inputStateName.value.trim().toUpperCase();
    if (!text) {
        logMessage("O nome do estado não pode ser vazio.", "error");
        audio.playError();
        return;
    }

    if (fsmData.states.includes(text)) {
        logMessage(`O estado '${text}' já existe no projeto.`, "error");
        audio.playError();
        return;
    }

    // Adiciona na lógica
    fsmData.states.push(text);
    if (!fsmData.connections[text]) {
        fsmData.connections[text] = {};
    }

    inputStateName.value = "";
    updateSidebarList();
    saveFSMToStorage();
    logMessage(`Estado '${text}' criado. Arraste-o para o Canvas!`, "info");
    audio.playTone(800, 'sine', 0.08, 0.08);
}

function instantiateNodeOnCanvas(name) {
    if (fsmData.nodes[name]) {
        // Já está no canvas, centraliza nele
        const pos = fsmData.nodes[name];
        const rect = viewport.getBoundingClientRect();
        panX = (rect.width / 2) - (pos.x + 55) * zoomScale;
        panY = (rect.height / 2) - (pos.y + 27) * zoomScale;
        updateTransform();
        selectNode(name);
        logMessage(`Estado '${name}' já está no canvas.`, "info");
        audio.playClick();
        return;
    }

    // Instancia na coordenada central visível do Viewport
    const rect = viewport.getBoundingClientRect();
    let cx = (rect.width / 2 - panX) / zoomScale - 55;
    let cy = (rect.height / 2 - panY) / zoomScale - 27;

    // Clampa coordenadas
    cx = Math.max(100, Math.min(CANVAS_WIDTH - 200, Math.round(cx / GRID_SNAP) * GRID_SNAP));
    cy = Math.max(100, Math.min(CANVAS_HEIGHT - 100, Math.round(cy / GRID_SNAP) * GRID_SNAP));

    fsmData.nodes[name] = { x: cx, y: cy };
    createVisualNode(name, cx, cy);
    drawConnections();
    saveFSMToStorage();
    selectNode(name);
    logMessage(`Estado '${name}' posicionado no canvas.`, "success");
    audio.playTone(950, 'sine', 0.08, 0.08);
}

function deleteNodeFromProject(name) {
    // 1. Remove da FSM
    const idx = fsmData.states.indexOf(name);
    if (idx !== -1) {
        fsmData.states.splice(idx, 1);
    }
    
    // 2. Deleta as conexões de saída
    if (fsmData.connections[name]) {
        delete fsmData.connections[name];
    }

    // 3. Deleta conexões que apontavam para este nó
    for (const src in fsmData.connections) {
        if (fsmData.connections[src][name]) {
            delete fsmData.connections[src][name];
        }
    }

    // 4. Remove posição
    if (fsmData.nodes[name]) {
        delete fsmData.nodes[name];
    }

    // 5. Ajusta estado ativo
    if (fsmData.activeState === name) {
        fsmData.activeState = fsmData.states.length > 0 ? fsmData.states[0] : "";
    }

    deselectAll();
    renderAllNodes();
    drawConnections();
    updateSidebarList();
    updateActiveStateHUD();
    updateCodeTemplate();
    saveFSMToStorage();
    logMessage(`Estado '${name}' removido do projeto.`, "info");
    audio.playTone(300, 'triangle', 0.15, 0.1);
}

// --- DESENHAR CONEXÕES (SVG BEZIER) ---
function drawConnections() {
    svgPathsGroup.innerHTML = "";

    // Remove todos os rótulos de transição antigos do canvas
    const oldLabels = container.querySelectorAll(".transition-label");
    oldLabels.forEach(el => el.remove());

    const offsetCurveBase = 30;

    for (const src in fsmData.connections) {
        const sourcePos = fsmData.nodes[src];
        if (!sourcePos) continue;

        const connectionsMap = fsmData.connections[src];
        for (const tgt in connectionsMap) {
            const targetPos = fsmData.nodes[tgt];
            if (!targetPos) continue;

            const cond = connectionsMap[tgt];

            // Coordenadas Centrais dos Nós (110x54)
            const x1 = sourcePos.x + 55;
            const y1 = sourcePos.y + 27;
            const x2 = targetPos.x + 55;
            const y2 = targetPos.y + 27;

            // Determinar se há uma conexão bidirecional
            const isBidirectional = fsmData.connections[tgt] && fsmData.connections[tgt][src];

            // Ponto médio da reta
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;

            // Vetor diretor e vetor normal
            const dx = x2 - x1;
            const dy = y2 - y1;
            const dist = Math.sqrt(dx * dx + dy * dy);

            let cx = mx;
            let cy = my;

            // Calcula a curva se for bidirecional ou se quisermos um visual suave
            if (dist > 10) {
                const nx = -dy / dist;
                const ny = dx / dist;

                const curveVal = isBidirectional ? offsetCurveBase : 12;
                cx = mx + nx * curveVal;
                cy = my + ny * curveVal;
            }

            // Calcula a interseção para encurtar a ponta da flecha e não entrar no nó
            // Ajuste de offset da borda da cápsula (aproximadamente 34px)
            const radius = 34;
            const tdx = x2 - cx;
            const tdy = y2 - cy;
            const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
            
            let x2_edge = x2;
            let y2_edge = y2;
            
            if (tdist > 5) {
                x2_edge = x2 - (tdx / tdist) * radius;
                y2_edge = y2 - (tdy / tdist) * radius;
            }

            const sdx = x1 - cx;
            const sdy = y1 - cy;
            const sdist = Math.sqrt(sdx * sdx + sdy * sdy);
            
            let x1_edge = x1;
            let y1_edge = y1;
            
            if (sdist > 5) {
                x1_edge = x1 - (sdx / sdist) * radius;
                y1_edge = y1 - (sdy / sdist) * radius;
            }

            // Desenhar caminho Bézier Quadrático: M x1 y1 Q cx cy x2 y2
            const pathD = `M ${x1_edge} ${y1_edge} Q ${cx} ${cy} ${x2_edge} ${y2_edge}`;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", pathD);
            path.setAttribute("class", "transition-path");
            
            // Marker arrowhead customizado conforme status
            let markerId = "arrowhead";
            
            const isSelected = selectedTransition && selectedTransition.source === src && selectedTransition.target === tgt;
            const isActiveTrans = (fsmData.activeState === src);

            if (isSelected) {
                path.classList.add("selected");
                markerId = "arrowhead-selected";
            } else if (isActiveTrans) {
                path.classList.add("active");
                markerId = "arrowhead-active";
            }

            path.setAttribute("marker-end", `url(#${markerId})`);

            // Evento de seleção da transição ao clicar na linha
            path.addEventListener("click", (e) => {
                e.stopPropagation();
                selectTransition(src, tgt);
            });

            svgPathsGroup.appendChild(path);

            // Criar Rótulo Flutuante (HTML absolute div no centro do arco)
            // O centro real de uma curva Bézier quadrática na metade do caminho (t=0.5)
            // P = 0.25*P1 + 0.5*C + 0.25*P2
            const labelX = 0.25 * x1_edge + 0.5 * cx + 0.25 * x2_edge;
            const labelY = 0.25 * y1_edge + 0.5 * cy + 0.25 * y2_edge;

            const labelEl = document.createElement("div");
            labelEl.className = "transition-label";
            labelEl.textContent = cond === "NONE" ? "AUTO" : cond;
            labelEl.style.left = `${labelX}px`;
            labelEl.style.top = `${labelY}px`;

            if (isSelected) labelEl.classList.add("selected");
            if (isActiveTrans) labelEl.classList.add("active");

            labelEl.addEventListener("click", (e) => {
                e.stopPropagation();
                selectTransition(src, tgt);
            });

            container.appendChild(labelEl);
        }
    }
}

// --- CRIAR TRANSIÇÕES NA FSM ---
function createFSMTransition(source, target) {
    if (fsmData.connections[source] && fsmData.connections[source][target]) {
        logMessage(`Transição de '${source}' para '${target}' já existe.`, "error");
        audio.playError();
        return;
    }

    fsmData.connections[source][target] = "NONE";
    drawConnections();
    updateCodeTemplate();
    saveFSMToStorage();
    selectTransition(source, target);
    logMessage(`Transição criada: ${source} ➔ ${target}`, "success");
    audio.playTone(900, 'sine', 0.1, 0.08);
}

// --- SELEÇÃO DE ELEMENTOS ---
function selectNode(name) {
    deselectAll();
    selectedNode = name;
    
    // Pinta visualmente
    const nodeEl = nodesLayer.querySelector(`.state-node[data-name="${name}"]`);
    if (nodeEl) nodeEl.classList.add("selected");

    // Mostra HUD ativo
    audio.playClick();
}

function selectTransition(source, target) {
    deselectAll();
    selectedTransition = { source, target };
    
    // Atualiza classes do overlay
    drawConnections();

    // Exibe painel de configuração lateral
    lblTransPath.textContent = `De: ${source} ➔ Para: ${target}`;
    
    const condition = fsmData.connections[source][target];
    lblCurrentTrigger.textContent = `GATILHO: ${condition}`;

    // Atualiza combobox do timer
    const isTime = condition.toLowerCase().endsWith("s") && !isNaN(parseFloat(condition));
    if (isTime) {
        comboTimer.value = condition;
    } else {
        comboTimer.value = "NONE";
    }

    transConfigPanel.style.display = "flex";
    audio.playClick();
}

function deselectAll() {
    selectedNode = null;
    selectedTransition = null;

    const selectedNodes = nodesLayer.querySelectorAll(".state-node.selected");
    selectedNodes.forEach(el => el.classList.remove("selected"));

    transConfigPanel.style.display = "none";
    
    // Redesenha para limpar glows azuis das setas
    drawConnections();
}

// --- GRAVAÇÃO DE GATILHOS (TECLADO / MOUSE) ---
function startRecordingMode() {
    if (!selectedTransition) return;
    isRecordingTrigger = true;
    btnRecordTrigger.classList.add("recording");
    btnRecordTrigger.textContent = "[ PRESSIONE QUALQUER TECLA / CLIQUE... ]";
    logMessage("Aguardando entrada: Pressione uma tecla ou clique na tela...", "info");
    audio.playTone(1000, 'sine', 0.1, 0.08);

    // Registra listener de gravação única
    window.addEventListener("keydown", recordKeyHandler, true);
    viewport.addEventListener("pointerdown", recordMouseHandler, true);
}

function stopRecordingMode() {
    isRecordingTrigger = false;
    btnRecordTrigger.classList.remove("recording");
    btnRecordTrigger.textContent = "⌨️ GRAVAR TECLA / CLIQUE";
    window.removeEventListener("keydown", recordKeyHandler, true);
    viewport.removeEventListener("pointerdown", recordMouseHandler, true);
}

function recordKeyHandler(e) {
    e.stopPropagation();
    e.preventDefault();

    if (e.key === "Escape") {
        stopRecordingMode();
        logMessage("Gravação de gatilho cancelada.", "info");
        audio.playTone(400, 'sine', 0.1, 0.08);
        return;
    }

    const keyName = getCleanKeyName(e.key);
    if (keyName) {
        updateTransitionCondition(keyName);
    }
    stopRecordingMode();
}

function recordMouseHandler(e) {
    e.stopPropagation();
    e.preventDefault();

    const mouseTrigger = (e.button === 0) ? "MOUSE_LEFT" : "MOUSE_RIGHT";
    updateTransitionCondition(mouseTrigger);
    stopRecordingMode();
}

function getCleanKeyName(key) {
    if (key === " ") return "SPACE";
    if (key === "ArrowDown") return "DOWN";
    if (key === "ArrowUp") return "UP";
    if (key === "ArrowLeft") return "LEFT";
    if (key === "ArrowRight") return "RIGHT";
    if (key === "Shift") return "SHIFT";
    if (key === "Control") return "CTRL";
    if (key === "Alt") return "ALT";
    if (key === "Enter") return "ENTER";
    
    // Letras normais em maiúsculas
    if (key.length === 1) return key.toUpperCase();
    return key.toUpperCase();
}

function updateTransitionCondition(condition) {
    if (!selectedTransition) return;
    const { source, target } = selectedTransition;

    fsmData.connections[source][target] = condition;
    lblCurrentTrigger.textContent = `GATILHO: ${condition}`;
    
    // Desativa timer se definiu uma tecla
    comboTimer.value = "NONE";

    drawConnections();
    updateCodeTemplate();
    saveFSMToStorage();
    logMessage(`Gatilho de '${source} ➔ ${target}' alterado para [${condition}]`, "success");
    audio.playTone(950, 'sine', 0.08, 0.08);

    // Se o estado ativo for o de origem, reinspecciona temporizadores
    if (source === fsmData.activeState) {
        checkAndStartStateTimer(source);
    }
}

function handleTimerSelectChange() {
    if (!selectedTransition) return;
    const { source, target } = selectedTransition;
    
    const val = comboTimer.value;
    fsmData.connections[source][target] = val;
    lblCurrentTrigger.textContent = `GATILHO: ${val}`;

    drawConnections();
    updateCodeTemplate();
    saveFSMToStorage();
    logMessage(`Gatilho de '${source} ➔ ${target}' alterado para tempo [${val}]`, "success");
    audio.playTone(950, 'sine', 0.08, 0.08);

    if (source === fsmData.activeState) {
        checkAndStartStateTimer(source);
    }
}

// --- ENGINE DE SIMULAÇÃO INTERATIVA (TECLADO / TIMERS) ---
// Transição manual acionada por Duplo Clique
function tryManualTransition(targetName) {
    // Bloqueia se o nó de destino não estiver no canvas
    if (!fsmData.nodes[targetName]) {
        logMessage(`Transição bloqueada: O nó '${targetName}' não existe no canvas.`, "error");
        audio.playError();
        return;
    }

    const active = fsmData.activeState;
    if (active === targetName) return;

    // Checa se há uma transição de saída direta mapeada
    const hasConnection = fsmData.connections[active] && fsmData.connections[active][targetName];
    if (hasConnection) {
        executeStateTransition(targetName, `Duplo Clique`);
    } else {
        // Falha: pisca nó em vermelho
        const nodeEl = nodesLayer.querySelector(`.state-node[data-name="${targetName}"]`);
        if (nodeEl) {
            nodeEl.classList.add("error-flash");
            setTimeout(() => nodeEl.classList.remove("error-flash"), 800);
        }
        logMessage(`Transição inválida: Não há conexão de '${active}' para '${targetName}'.`, "error");
        audio.playError();
    }
}

// Captura de eventos de tecla para transições interativas
window.addEventListener("keydown", (e) => {
    // Ignora se estiver gravando tecla ou focando em caixa de entrada de texto
    if (isRecordingTrigger || document.activeElement === inputStateName) {
        return;
    }

    // Evita scroll da tela
    if ([" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
    }

    const keyName = getCleanKeyName(e.key);
    const active = fsmData.activeState;
    if (!active) return;

    const connectionsMap = fsmData.connections[active];
    if (!connectionsMap) return;

    // Encontra transições do estado ativo que correspondam à tecla pressionada
    let targetState = null;
    for (const tgt in connectionsMap) {
        if (connectionsMap[tgt] === keyName) {
            // Garante que o nó de destino esteja no canvas para transicionar
            if (fsmData.nodes[tgt]) {
                targetState = tgt;
                break;
            }
        }
    }

    if (targetState) {
        executeStateTransition(targetState, `Teclado [${keyName}]`);
    }
});

// Captura de cliques do mouse para simulação de MOUSE_LEFT/MOUSE_RIGHT
viewport.addEventListener("pointerdown", (e) => {
    if (isRecordingTrigger || isPanning || isConnecting || e.target !== viewport) return;

    const clickTrigger = (e.button === 0) ? "MOUSE_LEFT" : "MOUSE_RIGHT";
    const active = fsmData.activeState;
    if (!active) return;

    const connectionsMap = fsmData.connections[active];
    if (!connectionsMap) return;

    let targetState = null;
    for (const tgt in connectionsMap) {
        if (connectionsMap[tgt] === clickTrigger) {
            if (fsmData.nodes[tgt]) {
                targetState = tgt;
                break;
            }
        }
    }

    if (targetState) {
        executeStateTransition(targetState, `Mouse [${clickTrigger}]`);
    }
});

function executeStateTransition(targetState, sourceDesc) {
    const oldState = fsmData.activeState;
    fsmData.activeState = targetState;

    // Remove classe ativa do anterior
    const oldNodeEl = nodesLayer.querySelector(`.state-node[data-name="${oldState}"]`);
    if (oldNodeEl) oldNodeEl.classList.remove("active");

    // Adiciona classe ativa ao novo
    const newNodeEl = nodesLayer.querySelector(`.state-node[data-name="${targetState}"]`);
    if (newNodeEl) newNodeEl.classList.add("active");

    updateActiveStateHUD();
    drawConnections(); // Redesenha com fluxo verde na conexão de origem
    saveFSMToStorage();
    
    logMessage(`Transição: '${oldState}' ➔ '${targetState}' via ${sourceDesc}`, "success");
    audio.playActive();

    // Reinspecciona temporizadores no novo estado
    checkAndStartStateTimer(targetState);
}

function checkAndStartStateTimer(stateName) {
    // Para timers rodando
    if (stateTimerId) {
        clearTimeout(stateTimerId);
        stateTimerId = null;
    }

    const connectionsMap = fsmData.connections[stateName];
    if (!connectionsMap) return;

    // Procura transições temporizadas de saída
    let timerTarget = null;
    let secondsVal = 0;

    for (const tgt in connectionsMap) {
        const cond = connectionsMap[tgt];
        const isTime = cond.toLowerCase().endswith("s") && !isNaN(parseFloat(cond));
        if (isTime) {
            // Verifica se o nó de destino está colocado
            if (fsmData.nodes[tgt]) {
                timerTarget = tgt;
                secondsVal = parseFloat(cond);
                break;
            }
        }
    }

    if (timerTarget && secondsVal > 0) {
        const ms = secondsVal * 1000;
        logMessage(`Timer ativado: '${stateName}' irá transicionar para '${timerTarget}' em ${secondsVal}s.`, "info");
        stateTimerId = setTimeout(() => {
            // Garante que o estado ainda seja o mesmo ao expirar
            if (fsmData.activeState === stateName) {
                logMessage(`Timer de ${secondsVal}s esgotado!`, "info");
                executeStateTransition(timerTarget, `Temporizador`);
            }
        }, ms);
    }
}

// Para o timer prototype endswith
String.prototype.endswith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// --- CONFIGURAÇÃO DA BARRA LATERAL E DRAG & DROP ---
function updateSidebarList() {
    projectStatesList.innerHTML = "";
    fsmData.states.forEach(name => {
        const li = document.createElement("li");
        li.className = "state-list-item";
        li.dataset.name = name;
        li.draggable = true;

        const nameSpan = document.createElement("span");
        nameSpan.className = "state-item-name";
        nameSpan.textContent = name;
        li.appendChild(nameSpan);

        const btnDel = document.createElement("button");
        btnDel.className = "btn-del-state";
        btnDel.textContent = "✕";
        btnDel.title = "Excluir estado permanentemente";
        btnDel.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm(`Deseja excluir o estado '${name}' permanentemente?`)) {
                deleteNodeFromProject(name);
            }
        });
        li.appendChild(btnDel);

        // Clique para instanciar ou focar no canvas
        li.addEventListener("click", () => {
            instantiateNodeOnCanvas(name);
        });

        // Eventos de Drag and Drop
        li.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", name);
            audio.playClick();
        });

        projectStatesList.appendChild(li);
    });
}

function setupSidebarList() {
    // Permite que o workspace aceite drag over
    viewport.addEventListener("dragover", (e) => {
        e.preventDefault();
    });

    viewport.addEventListener("drop", (e) => {
        e.preventDefault();
        const name = e.dataTransfer.getData("text/plain");
        if (name && fsmData.states.includes(name)) {
            // Solta na coordenada correta do workspace
            const rect = viewport.getBoundingClientRect();
            let clickX = (e.clientX - rect.left - panX) / zoomScale - 55;
            let clickY = (e.clientY - rect.top - panY) / zoomScale - 27;

            clickX = Math.max(50, Math.min(CANVAS_WIDTH - 200, Math.round(clickX / GRID_SNAP) * GRID_SNAP));
            clickY = Math.max(50, Math.min(CANVAS_HEIGHT - 100, Math.round(clickY / GRID_SNAP) * GRID_SNAP));

            if (!fsmData.nodes[name]) {
                fsmData.nodes[name] = { x: clickX, y: clickY };
                createVisualNode(name, clickX, clickY);
                drawConnections();
                saveFSMToStorage();
                logMessage(`Estado '${name}' posicionado via Drag & Drop.`, "success");
            } else {
                fsmData.nodes[name] = { x: clickX, y: clickY };
                const nodeEl = nodesLayer.querySelector(`.state-node[data-name="${name}"]`);
                if (nodeEl) {
                    nodeEl.style.left = `${clickX}px`;
                    nodeEl.style.top = `${clickY}px`;
                }
                drawConnections();
                saveFSMToStorage();
                logMessage(`Nó '${name}' reposicionado no canvas.`, "info");
            }
            selectNode(name);
            audio.playTone(900, 'sine', 0.08, 0.08);
        }
    });
}

function updateActiveStateHUD() {
    if (fsmData.activeState) {
        activeStateVal.textContent = `[ ${fsmData.activeState} ]`;
        activeStateVal.className = "has-active";
    } else {
        activeStateVal.textContent = "< NENHUM >";
        activeStateVal.className = "";
    }
}

// --- DELETAR ELEMENTOS COM DELETE KEY ---
function handleGlobalKeyDown(e) {
    if (e.key === "Delete" || e.key === "Backspace") {
        // Ignora se estiver digitando na caixa
        if (document.activeElement === inputStateName) return;

        if (selectedNode) {
            // Deleta nó do canvas apenas (mantém no projeto)
            const name = selectedNode;
            if (confirm(`Deseja remover o nó '${name}' do Canvas? Ele continuará salvo no projeto.`)) {
                removeNodeFromCanvas(name);
            }
        } else if (selectedTransition) {
            const { source, target } = selectedTransition;
            if (confirm(`Deseja excluir a transição '${source} ➔ ${target}'?`)) {
                removeTransitionFromFSM(source, target);
            }
        }
    }
}

function removeNodeFromCanvas(name) {
    // Limpa conexões associadas no canvas e na lógica
    if (fsmData.connections[name]) {
        fsmData.connections[name] = {};
    }
    for (const src in fsmData.connections) {
        if (fsmData.connections[src][name]) {
            delete fsmData.connections[src][name];
        }
    }

    if (fsmData.nodes[name]) {
        delete fsmData.nodes[name];
    }

    if (fsmData.activeState === name) {
        fsmData.activeState = fsmData.states.length > 0 ? fsmData.states[0] : "";
    }

    deselectAll();
    renderAllNodes();
    drawConnections();
    updateActiveStateHUD();
    updateCodeTemplate();
    saveFSMToStorage();
    logMessage(`Nó '${name}' removido do canvas (permanece na lista lateral).`, "info");
    audio.playTone(400, 'triangle', 0.15, 0.1);
}

function removeTransitionFromFSM(source, target) {
    if (fsmData.connections[source] && fsmData.connections[source][target]) {
        delete fsmData.connections[source][target];
    }
    deselectAll();
    drawConnections();
    updateCodeTemplate();
    saveFSMToStorage();
    logMessage(`Conexão '${source} ➔ ${target}' removida.`, "info");
    audio.playTone(400, 'triangle', 0.15, 0.1);

    if (source === fsmData.activeState) {
        checkAndStartStateTimer(source);
    }
}

// --- LIMPAR WORKSPACE COMPLETAMENTE ---
function clearCanvasWorkspace() {
    if (confirm("Deseja limpar todo o Canvas? Os estados continuarão na lista do projeto.")) {
        fsmData.nodes = {};
        for (const src in fsmData.connections) {
            fsmData.connections[src] = {};
        }
        fsmData.activeState = fsmData.states.length > 0 ? fsmData.states[0] : "";
        deselectAll();
        renderAllNodes();
        drawConnections();
        updateActiveStateHUD();
        updateCodeTemplate();
        saveFSMToStorage();
        logMessage("Canvas limpo com sucesso.", "info");
        audio.playTone(300, 'sine', 0.2, 0.1);
    }
}

// --- GERADOR DE CÓDIGO (TEMPLATES) ---
function updateCodeTemplate() {
    const engine = comboExportEngine.value;
    let code = "";

    if (engine === "GameMaker") {
        code += `// --- SCRIPT DE ESTADOS - obj_player ---
// Executado no Step Event

switch (state) {\n`;
        
        fsmData.states.forEach(state => {
            code += `    case state.${state.toLowerCase()}:\n`;
            
            // Adiciona transições de saída
            const conn = fsmData.connections[state];
            let hasOutputs = false;
            for (const target in conn) {
                const cond = conn[target];
                hasOutputs = true;
                
                if (cond === "NONE") {
                    code += `        // Transição Automática\n`;
                    code += `        state = state.${target.toLowerCase()};\n`;
                } else if (cond.endsWith("s")) {
                    code += `        if (state_timer >= ${parseFloat(cond) * 60}) { // 60 FPS\n`;
                    code += `            state = state.${target.toLowerCase()};\n`;
                    code += `            state_timer = 0;\n`;
                    code += `        }\n`;
                } else if (cond.startsWith("MOUSE_")) {
                    const button = cond === "MOUSE_LEFT" ? "mb_left" : "mb_right";
                    code += `        if (mouse_check_button_pressed(${button})) {\n`;
                    code += `            state = state.${target.toLowerCase()};\n`;
                    code += `        }\n`;
                } else {
                    code += `        if (keyboard_check_pressed(vk_${cond.toLowerCase()})) {\n`;
                    code += `            state = state.${target.toLowerCase()};\n`;
                    code += `        }\n`;
                }
            }
            if (!hasOutputs) {
                code += `        // Estado sem saídas\n`;
            }
            code += `        break;\n\n`;
        });
        
        code += `}`;
    } 
    
    else if (engine === "C++") {
        code += `// --- MÁQUINA DE ESTADOS C++ ---
// Enum de estados
enum State {
`;
        fsmData.states.forEach(state => {
            code += `  STATE_${state},\n`;
        });
        code += `};

State currentState = STATE_${fsmData.activeState || "GROUND"};

void updateFSM() {
  switch (currentState) {
`;
        fsmData.states.forEach(state => {
            code += `    case STATE_${state}:\n`;
            const conn = fsmData.connections[state];
            let hasOutputs = false;
            for (const target in conn) {
                const cond = conn[target];
                hasOutputs = true;
                if (cond === "NONE") {
                    code += `      currentState = STATE_${target};\n`;
                } else if (cond.endsWith("s")) {
                    code += `      if (checkTimer(${parseFloat(cond) * 1000})) {\n`;
                    code += `        currentState = STATE_${target};\n`;
                    code += `      }\n`;
                } else if (cond.startsWith("MOUSE_")) {
                    code += `      if (isMouseClicked()) {\n`;
                    code += `        currentState = STATE_${target};\n`;
                    code += `      }\n`;
                } else {
                    code += `      if (isKeyPressed('${cond}')) {\n`;
                    code += `        currentState = STATE_${target};\n`;
                    code += `      }\n`;
                }
            }
            if (!hasOutputs) {
                code += `      // Estado Terminal\n`;
            }
            code += `      break;\n\n`;
        });
        code += `  }
}`;
    } 
    
    else if (engine === "JSON") {
        code = JSON.stringify({
            activeState: fsmData.activeState,
            states: fsmData.states,
            connections: fsmData.connections
        }, null, 2);
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

// --- CONSOLE LOGGING SYSTEM ---
function logMessage(text, type = "info") {
    const line = document.createElement("span");
    line.className = `console-line ${type}`;
    
    const time = new Date().toLocaleTimeString();
    line.textContent = `[${time}] >> ${text}`;
    
    consoleOutput.appendChild(line);
    // Auto-scroll para o final
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function toggleConsole() {
    const isVisible = consoleOutput.style.display !== "none";
    if (isVisible) {
        consoleOutput.style.display = "none";
        consoleToggleIcon.textContent = "[+] ABRIR";
    } else {
        consoleOutput.style.display = "flex";
        consoleToggleIcon.textContent = "[-] FECHAR";
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    }
}
