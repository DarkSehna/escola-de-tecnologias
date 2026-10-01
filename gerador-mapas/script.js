// ==========================================================================
// CORE LEVEL BUILDER (GERADOR DE MAPAS 2D)
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
            console.warn("Web Audio API bloqueada.", e);
        }
    }

    playBoot() {
        this.playTone(587.33, 'sine', 0.15, 0.06); // D5
        setTimeout(() => this.playTone(783.99, 'sine', 0.15, 0.06), 75); // G5
        setTimeout(() => this.playTone(987.77, 'sine', 0.25, 0.06), 150); // B5
    }

    playClick() {
        this.playTone(880, 'sine', 0.05, 0.08); // A5
    }

    playDraw() {
        // Som curto para dar feedback tátil de desenho
        this.playTone(660, 'triangle', 0.04, 0.03);
    }

    playSuccess() {
        this.playTone(523.25, 'sine', 0.08, 0.08); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.08, 0.08), 50); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.08, 0.08), 100); // G5
        setTimeout(() => this.playTone(1046.50, 'sine', 0.15, 0.08), 150); // C6
    }

    playWarning() {
        this.playTone(220, 'sawtooth', 0.2, 0.1);
    }

    playClear() {
        this.playTone(440, 'sawtooth', 0.15, 0.08);
        setTimeout(() => this.playTone(293.66, 'sawtooth', 0.2, 0.08), 80);
    }
}

const audio = new SynthAudio();

// --- CONFIGURAÇÃO DE ESTADO ---
let gridCols = 32;
let gridRows = 12;
const TILE_SIZE = 32; // Tamanho virtual do tile em pixels

// Matriz de dados do mapa (2D array de strings)
let gridMatrix = [];

// Ferramenta atualmente selecionada na paleta
let activeTool = "wall";

// Estado de arraste do mouse para desenho contínuo
let isDrawing = false;

// --- ELEMENTOS DO DOM ---
const paintGrid = document.getElementById("paint-grid");
const lblStatusMessage = document.getElementById("lbl-status-message");
const dimensionsIndicator = document.getElementById("grid-dimensions-indicator");
const btnClearGrid = document.getElementById("btn-clear-grid");
const btnSaveMap = document.getElementById("btn-save-map");
const btnLoadMap = document.getElementById("btn-load-map");
const jsonUploader = document.getElementById("json-uploader");
const btnExportPng = document.getElementById("btn-export-png");

// Inputs de tamanho customizado
const inputCols = document.getElementById("input-cols");
const inputRows = document.getElementById("input-rows");
const btnResizeCustom = document.getElementById("btn-resize-custom");

// Controles de Zoom
const btnZoomIn = document.getElementById("btn-zoom-in");
const btnZoomOut = document.getElementById("btn-zoom-out");
const selectZoomLevel = document.getElementById("select-zoom-level");
const btnZoomFit = document.getElementById("btn-zoom-fit");

// Checklist de Jogo
const statusChkPlayer = document.getElementById("status-chk-player");
const statusChkGoal = document.getElementById("status-chk-goal");
const countChkCoin = document.getElementById("count-chk-coin");
const countChkEnemy = document.getElementById("count-chk-enemy");

// --- SISTEMA DE ZOOM DINÂMICO ---
const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.5];
let currentZoom = 1.0;

function setZoom(newZoom, isCustom = false) {
    currentZoom = Math.max(0.5, Math.min(2.5, Math.round(newZoom * 100) / 100));

    // Calcula tamanho virtual exibido do tile em pixels
    const displaySize = Math.round(TILE_SIZE * currentZoom);
    paintGrid.style.setProperty("--tile-display-size", `${displaySize}px`);

    // Atualiza template de colunas e linhas
    paintGrid.style.gridTemplateColumns = `repeat(${gridCols}, var(--tile-display-size, 32px))`;
    paintGrid.style.gridTemplateRows = `repeat(${gridRows}, var(--tile-display-size, 32px))`;

    // Atualiza o select de zoom
    if (selectZoomLevel) {
        let matchingOption = Array.from(selectZoomLevel.options).find(opt => Math.abs(parseFloat(opt.value) - currentZoom) < 0.01);
        if (!matchingOption) {
            // Remove opções customizadas anteriores
            const oldCustom = selectZoomLevel.querySelector('option[data-custom="true"]');
            if (oldCustom) oldCustom.remove();

            const customOpt = document.createElement("option");
            customOpt.value = currentZoom;
            customOpt.textContent = `${Math.round(currentZoom * 100)}% (Ajustado)`;
            customOpt.dataset.custom = "true";
            selectZoomLevel.appendChild(customOpt);
            selectZoomLevel.value = currentZoom;
        } else {
            selectZoomLevel.value = matchingOption.value;
        }
    }

    localStorage.setItem("titanTech_map_zoom", currentZoom);
}

function zoomIn() {
    audio.playClick();
    const nextZoom = ZOOM_PRESETS.find(z => z > currentZoom + 0.05) || 2.5;
    setZoom(nextZoom);
    updateStatus(`[ ZOOM ] Zoom aumentado para ${Math.round(currentZoom * 100)}%`, "var(--color-neon-cyan)");
}

function zoomOut() {
    audio.playClick();
    const reversed = [...ZOOM_PRESETS].reverse();
    const prevZoom = reversed.find(z => z < currentZoom - 0.05) || 0.5;
    setZoom(prevZoom);
    updateStatus(`[ ZOOM ] Zoom reduzido para ${Math.round(currentZoom * 100)}%`, "var(--color-neon-cyan)");
}

function fitToScreen() {
    const scrollContainer = document.querySelector(".viewport-scroll-container");
    if (!scrollContainer) return;

    audio.playClick();

    // Dimensões úteis do container visível com margem confortável
    const availableW = scrollContainer.clientWidth - 60;
    const availableH = scrollContainer.clientHeight - 60;

    if (availableW <= 0 || availableH <= 0) return;

    const mapBaseW = gridCols * TILE_SIZE;
    const mapBaseH = gridRows * TILE_SIZE;

    const zoomW = availableW / mapBaseW;
    const zoomH = availableH / mapBaseH;

    let targetZoom = Math.min(zoomW, zoomH);
    targetZoom = Math.max(0.5, Math.min(2.5, targetZoom));
    targetZoom = Math.round(targetZoom * 100) / 100;

    setZoom(targetZoom, true);
    showToast(`Zoom ajustado: ${Math.round(targetZoom * 100)}%`);
    updateStatus(`[ ZOOM ] Grade ajustada à tela (${Math.round(targetZoom * 100)}%)`, "var(--color-neon-green)");
}

// --- CHECKLIST DO JOGO (GAME DESIGN VALIDATOR) ---
function updateLevelChecklist() {
    let hasPlayer = false;
    let hasGoal = false;
    let coinCount = 0;
    let enemyCount = 0;

    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const tile = gridMatrix[r][c];
            if (tile === "player") hasPlayer = true;
            else if (tile === "goal") hasGoal = true;
            else if (tile === "coin") coinCount++;
            else if (tile === "enemy") enemyCount++;
        }
    }

    if (statusChkPlayer) {
        statusChkPlayer.textContent = hasPlayer ? "Definido" : "Faltando";
        statusChkPlayer.className = "chk-status " + (hasPlayer ? "ok" : "missing");
    }
    if (statusChkGoal) {
        statusChkGoal.textContent = hasGoal ? "Definido" : "Faltando";
        statusChkGoal.className = "chk-status " + (hasGoal ? "ok" : "missing");
    }
    if (countChkCoin) {
        countChkCoin.textContent = coinCount;
    }
    if (countChkEnemy) {
        countChkEnemy.textContent = enemyCount;
    }
}

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Carrega tamanho padrão (32x12)
    initMatrix(gridCols, gridRows);
    renderGridUI();

    // 2. Ouvintes da Paleta de Ferramentas
    setupPaletteListeners();

    // 3. Ouvintes de Presets Rápidos
    setupPresetListeners();

    // 4. Ouvinte de Redimensionamento Customizado
    btnResizeCustom.addEventListener("click", handleCustomResize);

    // 5. Controles de Zoom
    if (btnZoomIn) btnZoomIn.addEventListener("click", zoomIn);
    if (btnZoomOut) btnZoomOut.addEventListener("click", zoomOut);
    if (btnZoomFit) btnZoomFit.addEventListener("click", fitToScreen);
    if (selectZoomLevel) {
        selectZoomLevel.addEventListener("change", (e) => {
            audio.playClick();
            setZoom(parseFloat(e.target.value));
        });
    }

    // Zoom via Ctrl + Mouse Wheel
    const scrollContainer = document.querySelector(".viewport-scroll-container");
    if (scrollContainer) {
        scrollContainer.addEventListener("wheel", (e) => {
            if (e.ctrlKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomIn();
                } else {
                    zoomOut();
                }
            }
        }, { passive: false });
    }

    // Restaura zoom salvo ou auto-ajusta
    const savedZoom = localStorage.getItem("titanTech_map_zoom");
    if (savedZoom) {
        setZoom(parseFloat(savedZoom));
    } else {
        setTimeout(() => fitToScreen(), 150);
    }

    // 6. Ações Globais
    btnClearGrid.addEventListener("click", clearGridConfirm);
    btnSaveMap.addEventListener("click", downloadMapJSON);
    btnLoadMap.addEventListener("click", () => {
        audio.playClick();
        jsonUploader.click();
    });
    jsonUploader.addEventListener("change", loadMapJSON);
    btnExportPng.addEventListener("click", exportMapPNG);

    // 7. Monitoramento de arraste do mouse para desenho rápido
    window.addEventListener("mouseup", () => { isDrawing = false; });

    // 8. Controle de Visibilidade da Grade
    const selectGridVis = document.getElementById("select-grid-visibility");
    if (selectGridVis) {
        const savedGridMode = localStorage.getItem("titanTech_map_grid_mode") || "high";
        selectGridVis.value = savedGridMode;
        paintGrid.setAttribute("data-grid-mode", savedGridMode);

        selectGridVis.addEventListener("change", (e) => {
            const mode = e.target.value;
            paintGrid.setAttribute("data-grid-mode", mode);
            localStorage.setItem("titanTech_map_grid_mode", mode);
            audio.playClick();
        });
    }

    // Som de boot
    audio.playBoot();
    updateStatus("[ STATUS ] Editor inicializado. Grid 32x12 pronto para desenho.", "var(--color-neon-cyan)");
});

// --- MOTOR DE MATRIZ DE DADOS ---

// Inicializa a matriz com tamanho fornecido, preenchendo com "empty"
function initMatrix(cols, rows) {
    gridCols = cols;
    gridRows = rows;
    gridMatrix = [];
    for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
            row.push("empty");
        }
        gridMatrix.push(row);
    }
}

// Redimensiona mantendo os dados desenhados no canto superior esquerdo
function resizeMatrix(newCols, newRows) {
    const oldMatrix = gridMatrix;
    const oldCols = gridCols;
    const oldRows = gridRows;

    gridCols = newCols;
    gridRows = newRows;
    gridMatrix = [];

    for (let r = 0; r < newRows; r++) {
        const row = [];
        for (let c = 0; c < newCols; c++) {
            // Copia dados anteriores se existirem dentro dos novos limites
            if (r < oldRows && c < oldCols) {
                row.push(oldMatrix[r][c]);
            } else {
                row.push("empty");
            }
        }
        gridMatrix.push(row);
    }
}

// --- DESENHAR E RENDERIZAR A INTERFACE DO GRID ---

function renderGridUI() {
    // Ajusta a largura e o template de grid CSS dinamicamente com suporte a zoom
    const displaySize = Math.round(TILE_SIZE * currentZoom);
    paintGrid.style.setProperty("--tile-display-size", `${displaySize}px`);
    paintGrid.style.gridTemplateColumns = `repeat(${gridCols}, var(--tile-display-size, 32px))`;
    paintGrid.style.gridTemplateRows = `repeat(${gridRows}, var(--tile-display-size, 32px))`;
    paintGrid.innerHTML = "";

    // Reconstrói as células
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const cell = document.createElement("div");
            cell.className = "grid-cell";
            cell.dataset.col = c;
            cell.dataset.row = r;
            
            // Adiciona marcas para linhas guia 4x4
            if ((c + 1) % 4 === 0) cell.classList.add("grid-cell-major-col");
            if ((r + 1) % 4 === 0) cell.classList.add("grid-cell-major-row");

            // Define o tipo inicial
            const tileType = gridMatrix[r][c];
            cell.dataset.tile = tileType;
            cell.innerHTML = getTileSymbol(tileType);

            // Ouvintes de Clique e Arraste
            cell.addEventListener("mousedown", (e) => {
                e.preventDefault();
                isDrawing = true;
                paintCell(cell, c, r);
            });

            cell.addEventListener("mouseenter", () => {
                if (isDrawing) {
                    paintCell(cell, c, r);
                }
            });

            paintGrid.appendChild(cell);
        }
    }

    // Atualiza indicadores visuais
    const pxWidth = gridCols * TILE_SIZE;
    const pxHeight = gridRows * TILE_SIZE;
    dimensionsIndicator.textContent = `${gridCols} x ${gridRows} (${pxWidth} x ${pxHeight} px)`;
    inputCols.value = gridCols;
    inputRows.value = gridRows;

    // Atualiza checklist do jogo
    updateLevelChecklist();
}

// Retorna os emojis ou caracteres correspondentes a cada ferramenta para exibição na célula
function getTileSymbol(tileType) {
    switch (tileType) {
        case "player": return "👾";
        case "enemy": return "💀";
        case "platform": return "⇄";
        case "spring": return "🌀";
        case "spikes": return "🔺";
        case "goal": return "⭐";
        case "coin": return "🪙";
        case "key": return "🔑";
        case "door": return "🚪";
        case "crate": return "📦";
        case "checkpoint": return "🚩";
        case "secret": return "👻";
        case "lava": return "🌋";
        default: return "";
    }
}

// Executa a pintura lógica e física de uma célula
function paintCell(cellElement, col, row) {
    const currentTile = gridMatrix[row][col];
    
    // Se clicou com o mesmo bloco selecionado, não faz nada para evitar replicação de som
    if (currentTile === activeTool) return;

    // LÓGICA DE UNICIDADE: Apenas 1 jogador e 1 saída por fase
    if (activeTool === "player" || activeTool === "goal") {
        clearUniqueTile(activeTool);
    }

    // Atualiza a matriz de dados
    gridMatrix[row][col] = activeTool;

    // Atualiza o DOM da célula específica
    cellElement.dataset.tile = activeTool;
    cellElement.innerHTML = getTileSymbol(activeTool);

    // Feedback de som
    audio.playDraw();
    
    // Atualiza o checklist do jogo
    updateLevelChecklist();
    
    updateStatus(`[ DESENHAR ] Pintou célula (${col + 1}, ${row + 1}) como: ${activeTool.toUpperCase()}`, "var(--color-neon-cyan)");
}

// Remove todas as ocorrências de um bloco do tipo exclusivo no cenário antes de pintar o novo
function clearUniqueTile(tileType) {
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            if (gridMatrix[r][c] === tileType) {
                gridMatrix[r][c] = "empty";
                // Encontra e atualiza a célula correspondente no DOM
                const matchingCell = paintGrid.querySelector(`.grid-cell[data-col="${c}"][data-row="${r}"]`);
                if (matchingCell) {
                    matchingCell.dataset.tile = "empty";
                    matchingCell.innerHTML = "";
                }
            }
        }
    }
}

// --- PALETA E NAVEGAÇÃO DE FERRAMENTAS ---

function setupPaletteListeners() {
    const paletteButtons = document.querySelectorAll(".palette-item");
    paletteButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            paletteButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            activeTool = btn.dataset.tool;
            audio.playClick();
            updateStatus(`[ FERRAMENTA ] Selecionou: ${activeTool.toUpperCase()}`, "var(--color-neon-cyan)");
        });
    });
}

function setupPresetListeners() {
    const presetButtons = document.querySelectorAll(".preset-btn");
    presetButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const targetCols = parseInt(btn.dataset.cols);
            const targetRows = parseInt(btn.dataset.rows);
            
            presetButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            audio.playClick();
            
            if (confirm(`Deseja mudar o tamanho do mapa para ${targetCols}x${targetRows}?\n\nIsso redimensionará o grid. Desenhos fora do novo limite serão recortados.`)) {
                resizeMatrix(targetCols, targetRows);
                renderGridUI();
                audio.playSuccess();
                updateStatus(`[ REDIMENSIONAR ] Preset aplicado: ${targetCols}x${targetRows}`, "var(--color-neon-green)");
            }
        });
    });
}

function handleCustomResize() {
    const newCols = parseInt(inputCols.value);
    const newRows = parseInt(inputRows.value);

    // Validações
    if (isNaN(newCols) || newCols < 8 || newCols > 120) {
        audio.playWarning();
        alert("Número de colunas inválido! Insira um valor entre 8 e 120.");
        inputCols.focus();
        return;
    }
    if (isNaN(newRows) || newRows < 6 || newRows > 60) {
        audio.playWarning();
        alert("Número de linhas inválido! Insira um valor entre 6 e 60.");
        inputRows.focus();
        return;
    }

    audio.playClick();

    if (confirm(`Deseja redimensionar o mapa para ${newCols}x${newRows}?\n\nDesenhos fora dos limites novos serão recortados.`)) {
        // Desativa a ativação visual dos presets já que é um tamanho customizado
        document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));
        
        resizeMatrix(newCols, newRows);
        renderGridUI();
        audio.playSuccess();
        updateStatus(`[ REDIMENSIONAR ] Tamanho alterado para: ${newCols}x${newRows}`, "var(--color-neon-green)");
    }
}

function clearGridConfirm() {
    audio.playWarning();
    if (confirm("🚨 ATENÇÃO: Deseja apagar todo o desenho do mapa atual?\n\nEssa ação não pode ser desfeita!")) {
        audio.playClear();
        initMatrix(gridCols, gridRows);
        renderGridUI();
        showToast("Mapa limpo!");
        updateStatus("[ MAPA ] Grade limpa com sucesso.", "var(--color-neon-red)");
    }
}

// --- EXPORTAÇÃO E IMPORTAÇÃO JSON (PERSISTÊNCIA) ---

function downloadMapJSON() {
    const data = {
        cols: gridCols,
        rows: gridRows,
        tileSize: TILE_SIZE,
        grid: gridMatrix
    };

    const jsonStr = JSON.stringify(data, null, 4);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    const filename = `mapa_level_${gridCols}x${gridRows}.json`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    audio.playSuccess();
    showToast("JSON Salvo!");
    updateStatus(`[ EXPORT ] Arquivo '${filename}' salvo com sucesso!`, "var(--color-neon-green)");
}

function loadMapJSON(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        try {
            const data = JSON.parse(evt.target.result);

            // Validações básicas de esquema do arquivo
            if (!data.cols || !data.rows || !Array.isArray(data.grid)) {
                throw new Error("Formato de JSON do nível inválido ou corrompido.");
            }

            // Desativa botões de presets ativos
            document.querySelectorAll(".preset-btn").forEach(b => b.classList.remove("active"));

            // Carrega dados na memória do motor
            gridCols = data.cols;
            gridRows = data.rows;
            gridMatrix = data.grid;

            // Renderiza UI
            renderGridUI();
            
            audio.playSuccess();
            showToast("Mapa carregado!");
            updateStatus(`[ IMPORT ] Nível '${file.name}' carregado e montado na tela.`, "var(--color-neon-green)");
        } catch (err) {
            audio.playWarning();
            alert("Erro ao ler JSON de mapa:\n\n" + err.message);
            console.error(err);
        }
    };
    reader.readAsText(file);
    jsonUploader.value = ""; // Permite abrir o mesmo arquivo de novo
}

// --- EXPORTAÇÃO NATIVA PARA IMAGEM (CANVAS PNG) ---

function exportMapPNG() {
    audio.playClick();
    updateStatus("[ CANVAS ] Renderizando imagem nativa...", "var(--color-neon-cyan)");

    // 1. Cria canvas em memória
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Ajusta o tamanho real do canvas com base no número de células
    canvas.width = gridCols * TILE_SIZE;
    canvas.height = gridRows * TILE_SIZE;

    // 2. Loop para desenhar as células
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const tileType = gridMatrix[r][c];
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;

            // Fundo escuro padrão
            ctx.fillStyle = "#090b11";
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

            // Desenha borda sutil da grade para a imagem exportada
            ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

            // Desenha o bloco baseado no tipo
            switch (tileType) {
                case "wall":
                    // Bloco sólido com borda cyan brilhante
                    ctx.fillStyle = "#1e293b";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#00f0ff";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    break;
                case "player":
                    // Círculo verde brilhante + emoji 👾 no centro
                    ctx.fillStyle = "rgba(0, 255, 102, 0.1)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#00ff66";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "👾", x, y);
                    break;
                case "enemy":
                    // Vermelho + emoji 💀
                    ctx.fillStyle = "rgba(255, 51, 51, 0.1)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ff3333";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "💀", x, y);
                    break;
                case "platform":
                    // Amarelo + seta ⇄
                    ctx.fillStyle = "rgba(255, 204, 0, 0.1)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ffcc00";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "⇄", x, y);
                    break;
                case "spring":
                    // Magenta + emoji 🌀
                    ctx.fillStyle = "rgba(255, 0, 255, 0.1)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ff00ff";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🌀", x, y);
                    break;
                case "spikes":
                    // Vermelho + emoji 🔺
                    ctx.fillStyle = "rgba(255, 51, 51, 0.15)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ff3333";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🔺", x, y);
                    break;
                case "goal":
                    // Estrela amarela / dourada ⭐
                    ctx.fillStyle = "rgba(255, 204, 0, 0.15)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ffcc00";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "⭐", x, y);
                    break;
                case "coin":
                    ctx.fillStyle = "rgba(255, 204, 0, 0.12)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ffcc00";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🪙", x, y);
                    break;
                case "key":
                    ctx.fillStyle = "rgba(0, 240, 255, 0.12)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#00f0ff";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🔑", x, y);
                    break;
                case "door":
                    ctx.fillStyle = "rgba(249, 115, 22, 0.15)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#f97316";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🚪", x, y);
                    break;
                case "crate":
                    ctx.fillStyle = "rgba(180, 83, 9, 0.2)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#d97706";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "📦", x, y);
                    break;
                case "checkpoint":
                    ctx.fillStyle = "rgba(0, 255, 102, 0.12)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#00ff66";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🚩", x, y);
                    break;
                case "secret":
                    ctx.fillStyle = "rgba(168, 85, 247, 0.15)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#a855f7";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "👻", x, y);
                    break;
                case "lava":
                    ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
                    ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    ctx.strokeStyle = "#ff3333";
                    ctx.lineWidth = 1.5;
                    ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
                    drawCenteredEmoji(ctx, "🌋", x, y);
                    break;
            }
        }
    }

    // 3. Trigger download do arquivo PNG
    try {
        const link = document.createElement("a");
        const filename = `mapa_nivel_${gridCols}x${gridRows}.png`;
        link.download = filename;
        link.href = canvas.toDataURL("image/png");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        audio.playSuccess();
        showToast("Imagem Exportada!");
        updateStatus(`[ EXPORT ] Imagem '${filename}' gerada com sucesso.`, "var(--color-neon-green)");
    } catch (e) {
        audio.playWarning();
        alert("Erro ao exportar PNG: " + e.message);
        updateStatus("[ ERROR ] Falha ao exportar imagem.", "var(--color-neon-red)");
    }
}

// Auxiliar para desenhar caracteres de texto centralizados no canvas
function drawCenteredEmoji(ctx, emoji, tileX, tileY) {
    ctx.fillStyle = "#ffffff";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, tileX + TILE_SIZE/2, tileY + TILE_SIZE/2);
}

// --- UTILS ---

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
