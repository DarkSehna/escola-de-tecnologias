// ==========================================================================
// CORE FLL STRATEGY BOARD (PRANCHETA DE TÁTICAS FLL)
// Escola de Tecnologias - TitanTech
// ==========================================================================

// --- SISTEMA DE ÁUDIO (WEB AUDIO API) ---
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
            console.warn("Web Audio API bloqueada.", e);
        }
    }

    playBoot() {
        this.playTone(440, 'sine', 0.15, 0.06); // A4
        setTimeout(() => this.playTone(554.37, 'sine', 0.15, 0.06), 75); // C#5
        setTimeout(() => this.playTone(659.25, 'sine', 0.25, 0.06), 150); // E5
    }

    playClick() {
        this.playTone(783.99, 'sine', 0.05, 0.08); // G5
    }

    playDraw() {
        this.playTone(880, 'triangle', 0.03, 0.03); // A5
    }

    playSuccess() {
        this.playTone(523.25, 'sine', 0.08, 0.08); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.08, 0.08), 50); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.08, 0.08), 100); // G5
        setTimeout(() => this.playTone(1046.50, 'sine', 0.15, 0.08), 150); // C6
    }

    playWarning() {
        this.playTone(220, 'sawtooth', 0.25, 0.1);
    }

    playClear() {
        this.playTone(392, 'sawtooth', 0.15, 0.08); // G4
        setTimeout(() => this.playTone(261.63, 'sawtooth', 0.2, 0.08), 80); // C4
    }
}

const audio = new SynthAudio();

// --- ESTADO GLOBAL DA PRANCHETA ---
const boardState = {
    // Imagem da pista
    pistaImage: new Image(),
    pistaLoaded: false,
    pistaWidth: 1920,
    pistaHeight: 1080,
    
    // Desenhos (traços)
    // Cada traço: { color, width, mode, points: [{x, y}] } (coordenadas lógicas 0 a 1)
    strokes: [],
    
    // Marcadores (Pins)
    // Cada marcador: { type, x, y, label } (coordenadas lógicas 0 a 1)
    markers: [],
    
    // Anotações de texto flutuantes
    // Cada nota: { text, x, y } (coordenadas lógicas 0 a 1)
    notes: [],

    // Configurações ativas de ferramenta
    activeMode: "free", // "free", "line", "eraser", "move"
    activeTool: null,   // "start", "color", "ultrasonic", "gyro", "mission", "obstacle", "note"
    activeColor: "#ec4899",
    lineWidth: 4,

    // Controle de arraste / desenho temporário
    isDrawing: false,
    draggingItem: null, // Referência ao marcador ou nota sendo arrastado
    draggingType: null, // "marker" ou "note"
    currentStroke: null
};

// --- ELEMENTOS DO DOM ---
const canvas = document.getElementById("tactic-canvas");
const ctx = canvas.getContext("2d");
const canvasContainerBox = document.getElementById("canvas-container-box");
const canvasPlaceholder = document.getElementById("canvas-placeholder");
const canvasStatusBadge = document.getElementById("canvas-status-badge");
const viewportScrollContainer = document.querySelector(".viewport-scroll-container");

const mapUploader = document.getElementById("map-uploader");
const btnImportMap = document.getElementById("btn-import-map");
const btnExportBoard = document.getElementById("btn-export-board");

const btnClearDrawings = document.getElementById("btn-clear-drawings");
const lineWidthSlider = document.getElementById("line-width-slider");
const lblLineWidth = document.getElementById("lbl-line-width");

const lblStatusMessage = document.getElementById("lbl-status-message");

// Modal de anotação
const noteModal = document.getElementById("note-modal");
const txtNoteContent = document.getElementById("txt-note-content");
const btnCancelNote = document.getElementById("btn-cancel-note");
const btnSaveNote = document.getElementById("btn-save-note");
let pendingNoteCoords = null; // Guarda coordenadas lógicas de onde o modal foi aberto

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Escutador de Redimensionamento do Viewport
    window.addEventListener("resize", handleResize);

    // 2. Upload de Pistas
    btnImportMap.addEventListener("click", () => {
        audio.playClick();
        mapUploader.click();
    });
    mapUploader.addEventListener("change", handleMapUpload);

    // 3. Ouvintes de seletores da barra superior
    setupModeSelectors();
    setupColorSelectors();
    lineWidthSlider.addEventListener("input", handleLineWidthChange);

    // 4. Seletor de Marcadores da Barra Lateral
    setupMarkerSelectors();

    // 5. Botões de ação globais
    btnClearDrawings.addEventListener("click", confirmClearDrawings);
    btnExportBoard.addEventListener("click", exportBoardPNG);

    // 6. Configurações de eventos do Canvas
    setupCanvasEvents();

    // 7. Modal de Notas
    btnCancelNote.addEventListener("click", () => {
        noteModal.classList.add("hidden");
        pendingNoteCoords = null;
        audio.playClick();
    });
    btnSaveNote.addEventListener("click", savePendingNote);

    // Inicializa a imagem de fundo
    boardState.pistaImage.onload = () => {
        boardState.pistaLoaded = true;
        boardState.pistaWidth = boardState.pistaImage.naturalWidth;
        boardState.pistaHeight = boardState.pistaImage.naturalHeight;
        
        canvasPlaceholder.classList.add("hidden");
        canvasStatusBadge.className = "status-badge green-online";
        canvasStatusBadge.textContent = `🟢 Pista Online (${boardState.pistaWidth}x${boardState.pistaHeight} px)`;
        
        handleResize();
        audio.playSuccess();
        updateStatus(`[ PISTA ] Carregada com sucesso: ${boardState.pistaWidth}x${boardState.pistaHeight} px`, "var(--color-neon-green)");
    };

    audio.playBoot();
    updateStatus("[ STATUS ] Pronto. Carregue uma imagem de pista para começar.", "var(--color-neon-yellow)");
});

// --- RENDERIZADOR RESPONSIVO (PROPORCIONAL) ---

function handleResize() {
    if (!boardState.pistaLoaded) return;

    // Calcula largura disponível na janela (largura do container de scroll com padding)
    const padding = 48; // 1.5rem de cada lado
    const availableWidth = viewportScrollContainer.clientWidth - padding;
    
    // Proporção original da imagem de fundo
    const aspectRatio = boardState.pistaHeight / boardState.pistaWidth;

    // Define largura física do Canvas (tenta usar o tamanho nativo, sem ultrapassar a largura disponível)
    const targetWidth = Math.min(boardState.pistaWidth, Math.max(800, availableWidth));
    const targetHeight = targetWidth * aspectRatio;

    // Define dimensões do elemento do canvas
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Ajusta o tamanho da box container no DOM
    canvasContainerBox.style.width = `${targetWidth}px`;
    canvasContainerBox.style.height = `${targetHeight}px`;

    // Redesenha a prancheta
    draw();
}

// Redesenha todo o quadro: fundo, linhas, marcadores e notas
function draw() {
    if (!boardState.pistaLoaded) return;

    // Limpa a tela
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenha a pista de fundo
    ctx.drawImage(boardState.pistaImage, 0, 0, canvas.width, canvas.height);

    // Fator de escala atual do Canvas comparado ao tamanho original da imagem
    const scaleFactor = canvas.width / boardState.pistaWidth;

    // 2. Desenha os traços/linhas
    boardState.strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;

        ctx.strokeStyle = stroke.color;
        // Escala a largura da linha de forma proporcional
        ctx.lineWidth = stroke.width * scaleFactor * 1.5;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();
        const startPt = stroke.points[0];
        ctx.moveTo(startPt.x * canvas.width, startPt.y * canvas.height);

        for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            ctx.lineTo(pt.x * canvas.width, pt.y * canvas.height);
        }
        ctx.stroke();
    });

    // 3. Desenha os marcadores (Pins)
    boardState.markers.forEach(marker => {
        const x = marker.x * canvas.width;
        const y = marker.y * canvas.height;
        
        // Define o tamanho visual do Pin proporcional ao tamanho do canvas
        const markerSize = Math.max(24, 32 * scaleFactor);
        
        // Círculo de fundo brilhante
        ctx.beginPath();
        ctx.arc(x, y, markerSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = getMarkerTheme(marker.type).bg;
        ctx.fill();
        ctx.strokeStyle = getMarkerTheme(marker.type).border;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Desenha o emoji correspondente
        ctx.fillStyle = "#ffffff";
        ctx.font = `${markerSize * 0.55}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(getMarkerEmoji(marker.type), x, y);
    });

    // 4. Desenha as anotações/notas de texto flutuantes
    boardState.notes.forEach(note => {
        const x = note.x * canvas.width;
        const y = note.y * canvas.height;

        ctx.font = "12px 'Outfit', sans-serif";
        const textWidth = ctx.measureText(note.text).width;
        const paddingH = 10;
        const paddingV = 6;
        const rectW = textWidth + paddingH * 2;
        const rectH = 26;

        // Caixa de fundo cyberpunk
        ctx.fillStyle = "rgba(11, 15, 25, 0.9)";
        ctx.strokeStyle = "#a855f7"; // Roxo para notas
        ctx.lineWidth = 1.5;
        // Centraliza a caixa abaixo do ponto da nota
        const rx = x - rectW / 2;
        const ry = y + 10; // 10px abaixo do ponto de clique

        ctx.beginPath();
        ctx.roundRect(rx, ry, rectW, rectH, 6);
        ctx.fill();
        ctx.stroke();

        // Pequeno indicador visual (ponto) de âncora da nota
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#a855f7";
        ctx.fill();

        // Texto da nota
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(note.text, x, ry + rectH / 2);
    });
}

// --- CONFIGURAÇÃO E MANIPULAÇÃO DE ENTRADAS ---

function handleMapUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    updateStatus("[ STATUS ] Carregando imagem...", "var(--color-neon-yellow)");

    const reader = new FileReader();
    reader.onload = function(evt) {
        boardState.pistaImage.src = evt.target.result;
    };
    reader.readAsDataURL(file);
}

function setupModeSelectors() {
    const modeButtons = document.querySelectorAll(".mode-btn");
    modeButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            modeButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            boardState.activeMode = btn.dataset.mode;
            boardState.activeTool = null; // Cancela colocação de marcador
            
            // Remove seleções ativas na barra lateral
            document.querySelectorAll(".palette-item").forEach(b => b.classList.remove("active"));
            
            audio.playClick();
            updateStatus(`[ FERRAMENTA ] Modo desenho: ${boardState.activeMode.toUpperCase()}`, "var(--color-neon-yellow)");
        });
    });
}

function setupColorSelectors() {
    const colorButtons = document.querySelectorAll(".color-btn");
    colorButtons.forEach(btn => {
        btn.style.color = btn.dataset.color; // Permite usar currentColor no box shadow
        btn.addEventListener("click", () => {
            colorButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            boardState.activeColor = btn.dataset.color;
            audio.playClick();
        });
    });
}

function handleLineWidthChange(e) {
    const val = parseInt(e.target.value);
    boardState.lineWidth = val;
    lblLineWidth.textContent = `${val}px`;
}

function setupMarkerSelectors() {
    const markerButtons = document.querySelectorAll(".palette-item");
    markerButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            markerButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            boardState.activeTool = btn.dataset.tool;
            
            // Força a barra de ferramentas de modo para desenho/marcação nulo
            document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
            boardState.activeMode = "place-marker"; // Modo de posicionamento

            audio.playClick();
            updateStatus(`[ FERRAMENTA ] Pronto para colocar: ${boardState.activeTool.toUpperCase()}`, "var(--color-neon-yellow)");
        });
    });
}

function confirmClearDrawings() {
    audio.playWarning();
    if (confirm("🚨 Deseja limpar todos os trajetos, marcadores e notas desenhadas por cima da pista?")) {
        boardState.strokes = [];
        boardState.markers = [];
        boardState.notes = [];
        audio.playClear();
        draw();
        showToast("Prancheta Limpa!");
        updateStatus("[ PRANCHETA ] Desenhos apagados.", "var(--color-neon-red)");
    }
}

// --- SISTEMA DE EVENTOS DE MOUSE/TOUCH NO CANVAS (INTERATIVO) ---

function setupCanvasEvents() {
    // Evento PointerDown (Início de ação)
    canvas.addEventListener("pointerdown", (e) => {
        if (!boardState.pistaLoaded) return;
        e.preventDefault();
        canvas.setPointerCapture(e.pointerId);

        // Coordenadas absolutas em relação ao Canvas
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        // Converte para coordenadas lógicas normatizadas (0 a 1)
        const logicalX = clientX / canvas.width;
        const logicalY = clientY / canvas.height;

        // 1. Modo Apagar (Borracha) - Deve ser executado antes de qualquer outra ação para não ser interceptado pelo arraste
        if (boardState.activeMode === "eraser") {
            eraseElementNear(clientX, clientY);
            return;
        }

        // 2. Se estamos no modo "place-marker" (para posicionar marcador)
        if (boardState.activeMode === "place-marker" && boardState.activeTool) {
            if (boardState.activeTool === "note") {
                // Abre o modal para digitar o texto da nota
                pendingNoteCoords = { x: logicalX, y: logicalY };
                txtNoteContent.value = "";
                noteModal.classList.remove("hidden");
                txtNoteContent.focus();
            } else {
                // Insere marcador normal
                boardState.markers.push({
                    type: boardState.activeTool,
                    x: logicalX,
                    y: logicalY,
                    label: ""
                });
                audio.playDraw();
                draw();
                resetToFreeDrawing();
            }
            return;
        }

        // 3. Modo Mover - Só arrasta marcadores/notas se estiver explicitamente neste modo
        if (boardState.activeMode === "move") {
            const markerHit = findMarkerNear(clientX, clientY);
            if (markerHit) {
                boardState.draggingItem = markerHit;
                boardState.draggingType = "marker";
                audio.playClick();
                updateStatus("[ MOVER ] Arrastando marcador...", "var(--color-neon-yellow)");
                return;
            }

            const noteHit = findNoteNear(clientX, clientY);
            if (noteHit) {
                boardState.draggingItem = noteHit;
                boardState.draggingType = "note";
                audio.playClick();
                updateStatus("[ MOVER ] Arrastando nota...", "var(--color-neon-yellow)");
                return;
            }
        }

        // 4. Modo Desenho Livre (Caneta)
        if (boardState.activeMode === "free") {
            boardState.isDrawing = true;
            boardState.currentStroke = {
                color: boardState.activeColor,
                width: boardState.lineWidth,
                mode: "free",
                points: [{ x: logicalX, y: logicalY }]
            };
            boardState.strokes.push(boardState.currentStroke);
            audio.playDraw();
            return;
        }

        // 5. Modo Linha Reta
        if (boardState.activeMode === "line") {
            boardState.isDrawing = true;
            boardState.currentStroke = {
                color: boardState.activeColor,
                width: boardState.lineWidth,
                mode: "line",
                points: [
                    { x: logicalX, y: logicalY }, // Início
                    { x: logicalX, y: logicalY }  // Fim (temporário)
                ]
            };
            boardState.strokes.push(boardState.currentStroke);
            audio.playDraw();
            return;
        }
    });

    // Evento PointerMove (Movimentando cursor)
    canvas.addEventListener("pointermove", (e) => {
        if (!boardState.pistaLoaded) return;
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;

        const logicalX = Math.max(0, Math.min(1, clientX / canvas.width));
        const logicalY = Math.max(0, Math.min(1, clientY / canvas.height));

        // Se estiver arrastando marcador ou nota
        if (boardState.draggingItem) {
            boardState.draggingItem.x = logicalX;
            boardState.draggingItem.y = logicalY;
            draw();
            return;
        }

        // Se estiver desenhando traços
        if (boardState.isDrawing && boardState.currentStroke) {
            if (boardState.currentStroke.mode === "free") {
                boardState.currentStroke.points.push({ x: logicalX, y: logicalY });
            } else if (boardState.currentStroke.mode === "line") {
                // Atualiza apenas o ponto final
                boardState.currentStroke.points[1] = { x: logicalX, y: logicalY };
            }
            draw();
        }
    });

    // Evento PointerUp (Final de ação)
    canvas.addEventListener("pointerup", (e) => {
        if (!boardState.pistaLoaded) return;
        canvas.releasePointerCapture(e.pointerId);

        if (boardState.draggingItem) {
            boardState.draggingItem = null;
            boardState.draggingType = null;
            audio.playSuccess();
            updateStatus("[ MOVER ] Item posicionado com sucesso.", "var(--color-neon-green)");
        }

        boardState.isDrawing = false;
        boardState.currentStroke = null;
    });
}

// Reseta a interface lateral e volta para o modo padrão de caneta
function resetToFreeDrawing() {
    document.querySelectorAll(".palette-item").forEach(b => b.classList.remove("active"));
    boardState.activeTool = null;
    boardState.activeMode = "free";
    const btnFree = document.querySelector('.mode-btn[data-mode="free"]');
    if (btnFree) btnFree.classList.add("active");
    updateStatus("[ STATUS ] Modo caneta livre ativo.", "var(--color-neon-cyan)");
}

// Auxiliar para encontrar marcador sob o clique (limite de 18 pixels físicos)
function findMarkerNear(x, y) {
    const threshold = 18;
    return boardState.markers.find(marker => {
        const mx = marker.x * canvas.width;
        const my = marker.y * canvas.height;
        const dist = Math.hypot(mx - x, my - y);
        return dist <= threshold;
    });
}

// Auxiliar para encontrar nota sob o clique (limite de 18 pixels físicos ou clique dentro da caixa de texto)
function findNoteNear(x, y) {
    const threshold = 18;
    return boardState.notes.find(note => {
        const nx = note.x * canvas.width;
        const ny = note.y * canvas.height;

        // Calcula a largura da caixa de texto da nota
        ctx.font = "12px 'Outfit', sans-serif";
        const textWidth = ctx.measureText(note.text).width;
        const rectW = textWidth + 20; // 10px de padding de cada lado

        // 1. Verifica clique na âncora (ponto de clique original)
        const distToAnchor = Math.hypot(nx - x, ny - y);
        if (distToAnchor <= threshold) return true;

        // 2. Verifica clique dentro do retângulo da caixa de texto flutuante
        const rx = nx - rectW / 2;
        const ry = ny + 10; // offset de Y + 10px
        if (x >= rx && x <= rx + rectW && y >= ry && y <= ry + 26) {
            return true;
        }

        return false;
    });
}

// Lógica da borracha para apagar itens próximos ao clique
function eraseElementNear(x, y) {
    const threshold = 20; // 20px de raio de colisão

    // 1. Tenta apagar marcadores
    const markerIdx = boardState.markers.findIndex(m => {
        const dist = Math.hypot(m.x * canvas.width - x, m.y * canvas.height - y);
        return dist <= threshold;
    });
    if (markerIdx !== -1) {
        boardState.markers.splice(markerIdx, 1);
        audio.playClear();
        draw();
        return;
    }

    // 2. Tenta apagar notas
    const noteIdx = boardState.notes.findIndex(n => {
        const dist = Math.hypot(n.x * canvas.width - x, n.y * canvas.height - y);
        return dist <= threshold;
    });
    if (noteIdx !== -1) {
        boardState.notes.splice(noteIdx, 1);
        audio.playClear();
        draw();
        return;
    }

    // 3. Tenta apagar traços de caneta
    const strokeIdx = boardState.strokes.findIndex(stroke => {
        return stroke.points.some(pt => {
            const dist = Math.hypot(pt.x * canvas.width - x, pt.y * canvas.height - y);
            return dist <= threshold;
        });
    });
    if (strokeIdx !== -1) {
        boardState.strokes.splice(strokeIdx, 1);
        audio.playClear();
        draw();
        return;
    }
}

// Lógica de salvar nota vinda do modal
function savePendingNote() {
    const text = txtNoteContent.value.trim();
    if (text && pendingNoteCoords) {
        boardState.notes.push({
            text: text,
            x: pendingNoteCoords.x,
            y: pendingNoteCoords.y
        });
        audio.playDraw();
        draw();
    }
    noteModal.classList.add("hidden");
    pendingNoteCoords = null;
    resetToFreeDrawing();
}

// --- CONSOLIDAÇÃO E EXPORTAÇÃO PNG EM ALTA DEFINIÇÃO (1:1) ---

function exportBoardPNG() {
    if (!boardState.pistaLoaded) {
        audio.playWarning();
        alert("Carregue uma imagem de pista antes de tentar exportar!");
        return;
    }

    audio.playClick();
    updateStatus("[ CANVAS ] Consolidando desenhos em resolução nativa...", "var(--color-neon-cyan)");

    // 1. Cria canvas temporário com as dimensões NATIVAS da imagem da pista
    const expCanvas = document.createElement("canvas");
    const expCtx = expCanvas.getContext("2d");
    expCanvas.width = boardState.pistaWidth;
    expCanvas.height = boardState.pistaHeight;

    // Fator de escala de renderização nativo (1.0 por definição)
    const originalWidth = boardState.pistaWidth;
    const originalHeight = boardState.pistaHeight;

    // 2. Desenha a pista original em resolução nativa
    expCtx.drawImage(boardState.pistaImage, 0, 0, originalWidth, originalHeight);

    // 3. Desenha todas as linhas na resolução nativa
    boardState.strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;

        expCtx.strokeStyle = stroke.color;
        // A espessura original da linha agora é aplicada de forma 1:1 absoluta
        expCtx.lineWidth = stroke.width * 1.5;
        expCtx.lineCap = "round";
        expCtx.lineJoin = "round";

        expCtx.beginPath();
        const startPt = stroke.points[0];
        expCtx.moveTo(startPt.x * originalWidth, startPt.y * originalHeight);

        for (let i = 1; i < stroke.points.length; i++) {
            const pt = stroke.points[i];
            expCtx.lineTo(pt.x * originalWidth, pt.y * originalHeight);
        }
        expCtx.stroke();
    });

    // 4. Desenha marcadores na resolução nativa
    boardState.markers.forEach(marker => {
        const x = marker.x * originalWidth;
        const y = marker.y * originalHeight;
        
        // Marcadores ficam com 32px absolutos de diâmetro na imagem nativa
        const markerSize = 32;

        expCtx.beginPath();
        expCtx.arc(x, y, markerSize / 2, 0, Math.PI * 2);
        expCtx.fillStyle = getMarkerTheme(marker.type).bg;
        expCtx.fill();
        expCtx.strokeStyle = getMarkerTheme(marker.type).border;
        expCtx.lineWidth = 2.5;
        expCtx.stroke();

        expCtx.fillStyle = "#ffffff";
        expCtx.font = "18px Arial";
        expCtx.textAlign = "center";
        expCtx.textBaseline = "middle";
        expCtx.fillText(getMarkerEmoji(marker.type), x, y);
    });

    // 5. Desenha notas de texto na resolução nativa
    boardState.notes.forEach(note => {
        const x = note.x * originalWidth;
        const y = note.y * originalHeight;

        expCtx.font = "12px Arial";
        const textWidth = expCtx.measureText(note.text).width;
        const paddingH = 10;
        const paddingV = 6;
        const rectW = textWidth + paddingH * 2;
        const rectH = 26;

        const rx = x - rectW / 2;
        const ry = y + 10;

        expCtx.fillStyle = "rgba(11, 15, 25, 0.9)";
        expCtx.strokeStyle = "#a855f7";
        expCtx.lineWidth = 1.5;

        expCtx.beginPath();
        expCtx.roundRect(rx, ry, rectW, rectH, 6);
        expCtx.fill();
        expCtx.stroke();

        expCtx.beginPath();
        expCtx.arc(x, y, 4, 0, Math.PI * 2);
        expCtx.fillStyle = "#a855f7";
        expCtx.fill();

        expCtx.fillStyle = "#ffffff";
        expCtx.textAlign = "center";
        expCtx.textBaseline = "middle";
        expCtx.fillText(note.text, x, ry + rectH / 2);
    });

    // 6. Faz o download do arquivo PNG
    try {
        const link = document.createElement("a");
        const filename = `prancheta_fll_estrategia_${Date.now()}.png`;
        link.download = filename;
        link.href = expCanvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        audio.playSuccess();
        showToast("Prancheta Exportada!");
        updateStatus(`[ EXPORT ] PNG gerado na resolução original: ${originalWidth}x${originalHeight} px`, "var(--color-neon-green)");
    } catch (e) {
        audio.playWarning();
        alert("Erro ao exportar PNG nativo: " + e.message);
        updateStatus("[ ERROR ] Falha ao exportar imagem.", "var(--color-neon-red)");
    }
}

// --- AUXILIARES E MAPS DE ESTILOS DE ELEMENTOS ---

function getMarkerEmoji(type) {
    switch (type) {
        case "start": return "🏁";
        case "color": return "🌈";
        case "ultrasonic": return "🔊";
        case "gyro": return "🔄";
        case "mission": return "🎯";
        case "obstacle": return "🚧";
        case "note": return "📝";
        default: return "📍";
    }
}

function getMarkerTheme(type) {
    switch (type) {
        case "start":
            return { bg: "rgba(255, 255, 255, 0.15)", border: "#ffffff" };
        case "color":
            return { bg: "rgba(0, 240, 255, 0.15)", border: "var(--color-neon-cyan)" };
        case "ultrasonic":
            return { bg: "rgba(236, 72, 153, 0.15)", border: "var(--color-neon-pink)" };
        case "gyro":
            return { bg: "rgba(0, 255, 102, 0.15)", border: "var(--color-neon-green)" };
        case "mission":
            return { bg: "rgba(255, 204, 0, 0.15)", border: "var(--color-neon-yellow)" };
        case "obstacle":
            return { bg: "rgba(255, 51, 51, 0.15)", border: "var(--color-neon-red)" };
        default:
            return { bg: "rgba(168, 85, 247, 0.15)", border: "#a855f7" };
    }
}

function updateStatus(message, color = "var(--color-text-normal)") {
    lblStatusMessage.textContent = message;
    lblStatusMessage.style.color = color;
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
    }, 2500);
}
