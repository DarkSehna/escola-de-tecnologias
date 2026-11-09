// ==========================================================================
// MONTADOR DE TILESETS & SPRITESHEETS - ESCOLA DE TECNOLOGIAS
// Empacotador Visual 2D + Fatiador Inteligente para Construct 3, GameMaker e Scratch
// ==========================================================================

const state = {
    tileWidth: 32,
    tileHeight: 32,
    padding: 0,
    columnsMode: 'auto', // 'auto' ou número inteiro de colunas
    reserveFirstEmpty: false,
    pixelArtMode: true,
    fitMode: 'contain', // 'contain' | 'stretch'
    showGrid: true,
    showIds: true,
    zoom: '2',
    tiles: [] // Array de { id, name, canvas, width, height }
};

let nextTileUid = 1;
let activeSlicerTileIndex = null;

// Referências do DOM
const canvas = document.getElementById('spritesheet-canvas');
const ctx = canvas.getContext('2d');
const inputTileW = document.getElementById('input-tile-w');
const inputTileH = document.getElementById('input-tile-h');
const selectPadding = document.getElementById('select-padding');
const checkGmEmptyFirst = document.getElementById('check-gm-empty-first');
const checkPixelArt = document.getElementById('check-pixel-art');
const selectFitMode = document.getElementById('select-fit-mode');
const checkShowGrid = document.getElementById('check-show-grid');
const checkShowIds = document.getElementById('check-show-ids');
const selectPreviewZoom = document.getElementById('select-preview-zoom');
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const tilesListEl = document.getElementById('tiles-list');
const inputExportName = document.getElementById('input-export-name');

// Referências do Modal Fatiador Visual (Slicer)
const slicerModalOverlay = document.getElementById('slicer-modal-overlay');
const slicerPreviewCanvas = document.getElementById('slicer-preview-canvas');
const slicerPreviewCtx = slicerPreviewCanvas.getContext('2d');
const selectSlicerMode = document.getElementById('select-slicer-mode');
const slicerGridInputs = document.getElementById('slicer-grid-inputs');
const slicerPixelInputs = document.getElementById('slicer-pixel-inputs');
const inputSliceCols = document.getElementById('input-slice-cols');
const inputSliceRows = document.getElementById('input-slice-rows');
const inputSlicePW = document.getElementById('input-slice-pw');
const inputSlicePH = document.getElementById('input-slice-ph');
const checkSliceSkipEmpty = document.getElementById('check-slice-skip-empty');
const checkSliceRemoveBg = document.getElementById('check-slice-remove-bg');
const checkSliceSyncCols = document.getElementById('check-slice-sync-cols');
const slicerInfoBadge = document.getElementById('slicer-info-badge');

document.addEventListener('DOMContentLoaded', () => {
    bindEvents();
    renderAll();
});

function bindEvents() {
    // 1. Botões de Preset de Tamanho (16x16, 32x32, 64x64)
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const size = parseInt(btn.dataset.size, 10) || 32;
            state.tileWidth = size;
            state.tileHeight = size;
            inputTileW.value = size;
            inputTileH.value = size;
            renderAll();
        });
    });

    // Inputs numéricos customizados de Largura e Altura
    const onCustomSizeChange = () => {
        const w = Math.max(8, Math.min(512, parseInt(inputTileW.value, 10) || 32));
        const h = Math.max(8, Math.min(512, parseInt(inputTileH.value, 10) || 32));
        state.tileWidth = w;
        state.tileHeight = h;

        document.querySelectorAll('.preset-btn').forEach(b => {
            const bSize = parseInt(b.dataset.size, 10);
            b.classList.toggle('active', w === h && bSize === w);
        });
        renderAll();
    };
    inputTileW.addEventListener('input', onCustomSizeChange);
    inputTileH.addEventListener('input', onCustomSizeChange);

    // Espaçamento (Padding)
    selectPadding.addEventListener('change', () => {
        state.padding = parseInt(selectPadding.value, 10) || 0;
        renderAll();
    });

    // 2. Botões de Colunas (Auto, 4, 8, 16)
    document.querySelectorAll('.col-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.columnsMode = btn.dataset.cols === 'auto' ? 'auto' : parseInt(btn.dataset.cols, 10);
            renderAll();
        });
    });

    // 3. Opções Didáticas
    checkGmEmptyFirst.addEventListener('change', () => {
        state.reserveFirstEmpty = checkGmEmptyFirst.checked;
        renderAll();
    });

    checkPixelArt.addEventListener('change', () => {
        state.pixelArtMode = checkPixelArt.checked;
        canvas.style.imageRendering = state.pixelArtMode ? 'pixelated' : 'auto';
        renderAll();
    });

    selectFitMode.addEventListener('change', () => {
        state.fitMode = selectFitMode.value;
        renderAll();
    });

    // 4. Controles da Prévia
    checkShowGrid.addEventListener('change', () => {
        state.showGrid = checkShowGrid.checked;
        renderCanvasPreview();
    });

    checkShowIds.addEventListener('change', () => {
        state.showIds = checkShowIds.checked;
        renderCanvasPreview();
    });

    selectPreviewZoom.addEventListener('change', () => {
        state.zoom = selectPreviewZoom.value;
        applyCanvasZoom();
    });

    // 5. Drag & Drop e Upload de Arquivos
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInput.click();
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            fileInput.value = '';
        }
    });

    // 6. Ações Rápidas (Exemplo, Limpar Fundos, Limpar Tudo)
    document.getElementById('btn-load-demo').addEventListener('click', loadDemoTiles);
    document.getElementById('btn-magic-all').addEventListener('click', removeSolidBgAll);
    document.getElementById('btn-clear-all').addEventListener('click', () => {
        if (state.tiles.length === 0) return;
        state.tiles = [];
        renderAll();
        showToast('Todos os blocos foram removidos.');
    });

    // 7. Eventos do Modal Fatiador Visual (Slicer)
    selectSlicerMode.addEventListener('change', () => {
        const isGrid = selectSlicerMode.value === 'grid';
        slicerGridInputs.style.display = isGrid ? 'flex' : 'none';
        slicerPixelInputs.style.display = isGrid ? 'none' : 'flex';
        renderSlicerPreview();
    });

    [inputSliceCols, inputSliceRows, inputSlicePW, inputSlicePH, checkSliceSkipEmpty, checkSliceRemoveBg].forEach(el => {
        el.addEventListener('input', renderSlicerPreview);
        el.addEventListener('change', renderSlicerPreview);
    });

    document.getElementById('btn-close-slicer').addEventListener('click', closeSlicerModal);
    document.getElementById('btn-cancel-slicer').addEventListener('click', closeSlicerModal);
    document.getElementById('btn-confirm-slicer').addEventListener('click', confirmVisualSlice);
    slicerModalOverlay.addEventListener('click', (e) => {
        if (e.target === slicerModalOverlay) closeSlicerModal();
    });

    // 8. Exportação (PNG e JSON)
    document.getElementById('btn-export-png').addEventListener('click', exportSpritesheetPng);
    document.getElementById('btn-export-json').addEventListener('click', exportMappingJson);
}

// ==========================================================================
// CARREGAMENTO E MANIPULAÇÃO DE IMAGENS
// ==========================================================================
async function handleFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.type.startsWith('image/') || /\.(png|webp|jpg|jpeg|gif)$/i.test(f.name));
    if (files.length === 0) {
        showToast('Selecione imagens válidas (.PNG, .WEBP, .JPG).');
        return;
    }

    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    let addedCount = 0;
    let lastAddedIndex = -1;

    for (const file of files) {
        try {
            const img = await loadImageFromFile(file);
            const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
            const tileCanvas = document.createElement('canvas');
            tileCanvas.width = img.naturalWidth || img.width;
            tileCanvas.height = img.naturalHeight || img.height;
            const tCtx = tileCanvas.getContext('2d');
            tCtx.drawImage(img, 0, 0);

            state.tiles.push({
                id: nextTileUid++,
                name: cleanName || `tile_${state.tiles.length + 1}`,
                canvas: tileCanvas,
                width: tileCanvas.width,
                height: tileCanvas.height
            });
            lastAddedIndex = state.tiles.length - 1;
            addedCount++;
        } catch (err) {
            console.error('Erro ao ler imagem:', file.name, err);
        }
    }

    renderAll();

    // Se o usuário enviou uma imagem grande (ex: folha de tileset da internet > 96x96px),
    // abre automaticamente o Fatiador Visual para ele escolher como recortar os blocos!
    if (addedCount === 1 && lastAddedIndex >= 0) {
        const uploaded = state.tiles[lastAddedIndex];
        if (uploaded.width >= state.tileWidth * 2 && uploaded.height >= state.tileHeight * 2) {
            openSlicerModal(lastAddedIndex);
            showToast('✂️ Folha grande detectada! Ajuste as colunas/linhas para fatiar os blocos.');
            return;
        }
    }

    if (addedCount > 0) {
        showToast(`${addedCount} imagem(ns) carregada(s)! Se for uma folha, clique em "✂️ Fatiar".`);
    }
}

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ==========================================================================
// FATIADOR VISUAL INTELIGENTE (SLICER MODAL)
// ==========================================================================
function gcd(a, b) {
    a = Math.abs(Math.round(a));
    b = Math.abs(Math.round(b));
    while (b) {
        const t = b;
        b = a % b;
        a = t;
    }
    return a || 1;
}

function getExactSquareGridSuggestions(w, h) {
    const g = gcd(w, h);
    const suggestions = [];
    // Procura divisores de g que gerem entre 2 e 32 colunas
    for (let cell = g; cell >= 16; cell--) {
        if (w % cell === 0 && h % cell === 0) {
            const cols = w / cell;
            const rows = h / cell;
            if (cols >= 2 && cols <= 32 && rows >= 1 && rows <= 32) {
                suggestions.push({ cols, rows, cellW: cell, cellH: cell });
            }
        }
    }
    if (suggestions.length === 0) {
        const fallbackCols = Math.max(2, Math.min(16, Math.round(w / 64)));
        const fallbackRows = Math.max(1, Math.min(16, Math.round(h / 64)));
        suggestions.push({
            cols: fallbackCols,
            rows: fallbackRows,
            cellW: Math.floor(w / fallbackCols),
            cellH: Math.floor(h / fallbackRows)
        });
    }
    return suggestions;
}

function guessBestGridForImage(w, h) {
    const suggestions = getExactSquareGridSuggestions(w, h);
    // Prefere uma grade que tenha entre 4 e 12 colunas (típico de folhas da internet)
    const ideal = suggestions.find(s => s.cols >= 4 && s.cols <= 12) || suggestions[0];
    return ideal;
}

function openSlicerModal(index) {
    const item = state.tiles[index];
    if (!item) return;

    activeSlicerTileIndex = index;
    const suggestions = getExactSquareGridSuggestions(item.width, item.height);
    const guess = guessBestGridForImage(item.width, item.height);

    selectSlicerMode.value = 'grid';
    slicerGridInputs.style.display = 'flex';
    slicerPixelInputs.style.display = 'none';

    inputSliceCols.value = guess.cols;
    inputSliceRows.value = guess.rows;
    inputSlicePW.value = guess.cellW;
    inputSlicePH.value = guess.cellH;
    checkSliceRemoveBg.checked = false;

    // Renderiza botões de sugestões exatas detectadas por MDC (GCD)
    const sugContainer = document.getElementById('slicer-suggestions');
    if (sugContainer) {
        sugContainer.innerHTML = '';
        suggestions.slice(0, 5).forEach(sug => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slicer-sug-btn' + (sug.cols === guess.cols && sug.rows === guess.rows ? ' active' : '');
            btn.textContent = `${sug.cols}×${sug.rows} (blocos de ${sug.cellW}px)`;
            btn.addEventListener('click', () => {
                sugContainer.querySelectorAll('.slicer-sug-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                inputSliceCols.value = sug.cols;
                inputSliceRows.value = sug.rows;
                inputSlicePW.value = sug.cellW;
                inputSlicePH.value = sug.cellH;
                renderSlicerPreview();
            });
            sugContainer.appendChild(btn);
        });
    }

    slicerModalOverlay.style.display = 'flex';
    renderSlicerPreview();
}

function closeSlicerModal() {
    slicerModalOverlay.style.display = 'none';
    activeSlicerTileIndex = null;
}

function getWorkingSlicerSourceCanvas(item) {
    const temp = document.createElement('canvas');
    temp.width = item.width;
    temp.height = item.height;
    const tCtx = temp.getContext('2d');
    tCtx.drawImage(item.canvas, 0, 0);

    if (checkSliceRemoveBg.checked) {
        removeBackgroundFromCanvas(temp);
    }
    return temp;
}

function isCellRegionEmpty(srcCtx, x, y, w, h) {
    const safeW = Math.max(1, Math.floor(w));
    const safeH = Math.max(1, Math.floor(h));
    const data = srcCtx.getImageData(Math.floor(x), Math.floor(y), safeW, safeH).data;
    let visiblePixels = 0;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 12) {
            visiblePixels++;
            if (visiblePixels > 4) return false; // Tem conteúdo visível
        }
    }
    return true;
}

function getSlicerParameters(item) {
    const mode = selectSlicerMode.value;
    let cols, rows, cellW, cellH;

    if (mode === 'grid') {
        cols = Math.max(1, Math.min(64, parseInt(inputSliceCols.value, 10) || 4));
        rows = Math.max(1, Math.min(64, parseInt(inputSliceRows.value, 10) || 4));
        cellW = item.width / cols;
        cellH = item.height / rows;
    } else {
        cellW = Math.max(8, Math.min(item.width, parseInt(inputSlicePW.value, 10) || 64));
        cellH = Math.max(8, Math.min(item.height, parseInt(inputSlicePH.value, 10) || 64));
        cols = Math.max(1, Math.floor(item.width / cellW));
        rows = Math.max(1, Math.floor(item.height / cellH));
    }

    return { cols, rows, cellW, cellH };
}

function renderSlicerPreview() {
    if (activeSlicerTileIndex === null) return;
    const item = state.tiles[activeSlicerTileIndex];
    if (!item) return;

    const workCanvas = getWorkingSlicerSourceCanvas(item);
    const workCtx = workCanvas.getContext('2d');
    const { cols, rows, cellW, cellH } = getSlicerParameters(item);

    slicerPreviewCanvas.width = item.width;
    slicerPreviewCanvas.height = item.height;
    slicerPreviewCtx.clearRect(0, 0, item.width, item.height);
    slicerPreviewCtx.drawImage(workCanvas, 0, 0);

    let validBlocks = 0;
    const skipEmpty = checkSliceSkipEmpty.checked;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cx = c * cellW;
            const cy = r * cellH;
            const empty = skipEmpty && isCellRegionEmpty(workCtx, cx, cy, cellW, cellH);

            if (empty) {
                // Marca visualmente as células vazias que serão ignoradas
                slicerPreviewCtx.fillStyle = 'rgba(15, 23, 42, 0.65)';
                slicerPreviewCtx.fillRect(cx, cy, cellW, cellH);
            } else {
                validBlocks++;
            }

            slicerPreviewCtx.strokeStyle = empty ? 'rgba(255, 59, 48, 0.35)' : '#00d2ff';
            slicerPreviewCtx.lineWidth = Math.max(1, Math.round(item.width / 320));
            slicerPreviewCtx.strokeRect(cx, cy, cellW, cellH);
        }
    }

    slicerInfoBadge.textContent = `${validBlocks} blocos (${Math.round(cellW)}×${Math.round(cellH)}px ➔ ${state.tileWidth}×${state.tileHeight}px)`;
}

function confirmVisualSlice() {
    if (activeSlicerTileIndex === null) return;
    const item = state.tiles[activeSlicerTileIndex];
    if (!item) return;

    const workCanvas = getWorkingSlicerSourceCanvas(item);
    const workCtx = workCanvas.getContext('2d');
    const { cols, rows, cellW, cellH } = getSlicerParameters(item);
    const skipEmpty = checkSliceSkipEmpty.checked;
    const tw = state.tileWidth;
    const th = state.tileHeight;

    const newTiles = [];
    let partNum = 1;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const sx = c * cellW;
            const sy = r * cellH;

            if (skipEmpty && isCellRegionEmpty(workCtx, sx, sy, cellW, cellH)) {
                continue;
            }

            // Converte cada fatia diretamente para o tamanho do tile escolhido (ex: 32x32)
            // mantendo a nitidez de Pixel Art!
            const subCanvas = document.createElement('canvas');
            subCanvas.width = tw;
            subCanvas.height = th;
            const sCtx = subCanvas.getContext('2d');
            sCtx.imageSmoothingEnabled = !state.pixelArtMode;
            sCtx.drawImage(workCanvas, sx, sy, cellW, cellH, 0, 0, tw, th);

            newTiles.push({
                id: nextTileUid++,
                name: `${item.name}_${partNum++}`,
                canvas: subCanvas,
                width: tw,
                height: th
            });
        }
    }

    if (newTiles.length === 0) {
        showToast('Nenhum bloco visível encontrado com essa configuração.');
        return;
    }

    // Se o usuário pediu para manter o número de colunas alinhado ao desenho original
    if (checkSliceSyncCols.checked) {
        state.columnsMode = cols;
        document.querySelectorAll('.col-btn').forEach(b => {
            const bCol = b.dataset.cols === 'auto' ? 'auto' : parseInt(b.dataset.cols, 10);
            b.classList.toggle('active', bCol === cols);
        });
    }

    state.tiles.splice(activeSlicerTileIndex, 1, ...newTiles);
    closeSlicerModal();
    renderAll();
    showToast(`✂️ ${newTiles.length} blocos extraídos e convertidos para ${tw}×${th}px!`);
}

// ==========================================================================
// REMOÇÃO DE FUNDO SÓLIDO / BRANCO E ROTAÇÃO
// ==========================================================================
function removeBackgroundFromCanvas(c) {
    const w = c.width;
    const h = c.height;
    const tCtx = c.getContext('2d');
    const imgData = tCtx.getImageData(0, 0, w, h);
    const data = imgData.data;

    let targetR = data[0];
    let targetG = data[1];
    let targetB = data[2];
    const cornerAlpha = data[3];

    if (cornerAlpha === 0) {
        targetR = 255;
        targetG = 255;
        targetB = 255;
    }

    const tolerance = 22;
    let removedPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] === 0) continue;
        const dr = Math.abs(data[i] - targetR);
        const dg = Math.abs(data[i + 1] - targetG);
        const db = Math.abs(data[i + 2] - targetB);
        if (dr <= tolerance && dg <= tolerance && db <= tolerance) {
            data[i + 3] = 0;
            removedPixels++;
        }
    }

    tCtx.putImageData(imgData, 0, 0);
    return removedPixels;
}

function removeBackgroundFromTile(tileObj) {
    return removeBackgroundFromCanvas(tileObj.canvas);
}

function removeSolidBgAll() {
    if (state.tiles.length === 0) {
        showToast('Adicione blocos primeiro para limpar o fundo.');
        return;
    }
    state.tiles.forEach(t => removeBackgroundFromTile(t));
    renderAll();
    showToast('🪄 Fundo sólido/branco removido de todos os blocos!');
}

function rotateTile90(index) {
    const item = state.tiles[index];
    if (!item) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = item.height;
    newCanvas.height = item.width;
    const nCtx = newCanvas.getContext('2d');

    nCtx.translate(newCanvas.width / 2, newCanvas.height / 2);
    nCtx.rotate(Math.PI / 2);
    nCtx.drawImage(item.canvas, -item.width / 2, -item.height / 2);

    item.canvas = newCanvas;
    item.width = newCanvas.width;
    item.height = newCanvas.height;
    renderAll();
}

// ==========================================================================
// GERADOR DE BLOCOS DE EXEMPLO (PARA TESTE EM AULA / LOUSA)
// ==========================================================================
function loadDemoTiles() {
    const tw = state.tileWidth;
    const th = state.tileHeight;

    const demoSpecs = [
        { name: 'grama_topo', bg: '#4e342e', top: '#2ecc71', pattern: 'grass' },
        { name: 'terra_centro', bg: '#5d4037', top: null, pattern: 'dirt' },
        { name: 'pedra_bloco', bg: '#475569', top: '#64748b', pattern: 'brick' },
        { name: 'bloco_moeda', bg: '#f59e0b', top: '#fde047', pattern: 'question' },
        { name: 'lava_perigo', bg: '#dc2626', top: '#fb923c', pattern: 'wave' },
        { name: 'cristal_azul', bg: 'transparent', top: '#00d2ff', pattern: 'gem' },
        { name: 'plataforma_metal', bg: '#334155', top: '#38bdf8', pattern: 'metal' }
    ];

    state.tiles = [];

    demoSpecs.forEach(spec => {
        const c = document.createElement('canvas');
        c.width = tw;
        c.height = th;
        const g = c.getContext('2d');
        g.imageSmoothingEnabled = false;

        if (spec.bg !== 'transparent') {
            g.fillStyle = spec.bg;
            g.fillRect(0, 0, tw, th);
        }

        if (spec.pattern === 'grass') {
            g.fillStyle = spec.top;
            g.fillRect(0, 0, tw, Math.max(4, Math.floor(th * 0.28)));
            for (let x = 2; x < tw; x += 6) {
                g.fillRect(x, Math.floor(th * 0.28), 3, 3);
            }
        } else if (spec.pattern === 'dirt') {
            g.fillStyle = '#3e2723';
            for (let y = 4; y < th; y += 8) {
                for (let x = (y % 16 === 0 ? 4 : 8); x < tw - 4; x += 10) {
                    g.fillRect(x, y, 3, 3);
                }
            }
        } else if (spec.pattern === 'brick') {
            g.strokeStyle = '#1e293b';
            g.lineWidth = Math.max(1, Math.floor(tw / 16));
            g.strokeRect(0, 0, tw, th);
            g.beginPath();
            g.moveTo(0, th / 2);
            g.lineTo(tw, th / 2);
            g.moveTo(tw / 2, 0);
            g.lineTo(tw / 2, th / 2);
            g.moveTo(tw / 4, th / 2);
            g.lineTo(tw / 4, th);
            g.stroke();
        } else if (spec.pattern === 'question') {
            g.strokeStyle = '#78350f';
            g.lineWidth = 2;
            g.strokeRect(1, 1, tw - 2, th - 2);
            g.fillStyle = '#fef08a';
            g.font = `bold ${Math.floor(th * 0.55)}px monospace`;
            g.textAlign = 'center';
            g.textBaseline = 'middle';
            g.fillText('?', tw / 2, th / 2 + 1);
        } else if (spec.pattern === 'wave') {
            g.fillStyle = spec.top;
            g.fillRect(0, 0, tw, Math.max(5, Math.floor(th * 0.25)));
        } else if (spec.pattern === 'gem') {
            g.fillStyle = '#00d2ff';
            g.beginPath();
            g.moveTo(tw / 2, 3);
            g.lineTo(tw - 3, th / 2);
            g.lineTo(tw / 2, th - 3);
            g.lineTo(3, th / 2);
            g.closePath();
            g.fill();
            g.strokeStyle = '#ffffff';
            g.lineWidth = 1.5;
            g.stroke();
        } else if (spec.pattern === 'metal') {
            g.fillStyle = spec.top;
            g.fillRect(0, 0, tw, 4);
            g.strokeStyle = '#0f172a';
            g.strokeRect(1, 1, tw - 2, th - 2);
        }

        state.tiles.push({
            id: nextTileUid++,
            name: spec.name,
            canvas: c,
            width: tw,
            height: th
        });
    });

    renderAll();
    showToast('🎲 7 blocos de exemplo carregados!');
}

// ==========================================================================
// CÁLCULO DE LAYOUT E RENDERIZAÇÃO
// ==========================================================================
function computeGridLayout() {
    const offset = state.reserveFirstEmpty ? 1 : 0;
    const totalSlots = Math.max(1, state.tiles.length + offset);

    let cols;
    if (state.columnsMode === 'auto') {
        cols = Math.max(1, Math.ceil(Math.sqrt(totalSlots)));
    } else {
        cols = Math.max(1, parseInt(state.columnsMode, 10) || 4);
    }

    const rows = Math.max(1, Math.ceil(totalSlots / cols));
    const pad = state.padding;
    const sheetWidth = cols * state.tileWidth + Math.max(0, cols - 1) * pad;
    const sheetHeight = rows * state.tileHeight + Math.max(0, rows - 1) * pad;

    return {
        offset,
        totalSlots,
        cols,
        rows,
        pad,
        sheetWidth,
        sheetHeight
    };
}

function renderAll() {
    renderTilesList();
    renderCanvasPreview();
    updateMetricsUI();
}

function renderTilesList() {
    if (state.tiles.length === 0) {
        tilesListEl.innerHTML = `
            <div class="empty-list-state">
                Nenhum bloco adicionado ainda. Arraste arquivos PNG acima ou clique em <strong>"🎲 Exemplo"</strong> para testar!
            </div>
        `;
        return;
    }

    const offset = state.reserveFirstEmpty ? 1 : 0;
    tilesListEl.innerHTML = '';

    state.tiles.forEach((tile, idx) => {
        const slotIndex = idx + offset;
        const canSlice = (tile.width > state.tileWidth || tile.height > state.tileHeight);

        const row = document.createElement('div');
        row.className = 'tile-item';

        const thumbUrl = tile.canvas.toDataURL('image/png');

        row.innerHTML = `
            <span class="tile-index-badge" title="Índice na folha de spritesheet">#${slotIndex}</span>
            <div class="tile-thumb-wrap">
                <img src="${thumbUrl}" alt="${tile.name}">
            </div>
            <div class="tile-meta">
                <input type="text" class="tile-name-input" value="${tile.name}" aria-label="Nome do bloco">
                <span class="tile-dims">${tile.width}×${tile.height}px ${canSlice ? '• <strong style="color:#ffcc00;">Folha Grande</strong>' : ''}</span>
            </div>
            <div class="tile-actions">
                ${canSlice ? `<button type="button" class="icon-btn slice-btn" title="Abrir Fatiador Visual para recortar esta imagem em blocos">✂️ Fatiar</button>` : ''}
                <button type="button" class="icon-btn btn-magic" title="Remover fundo sólido/branco deste bloco">🪄</button>
                <button type="button" class="icon-btn btn-rotate" title="Girar 90°">🔄</button>
                <button type="button" class="icon-btn btn-up" title="Mover para trás" ${idx === 0 ? 'disabled style="opacity:0.35;cursor:not-allowed;"' : ''}>◀</button>
                <button type="button" class="icon-btn btn-down" title="Mover para frente" ${idx === state.tiles.length - 1 ? 'disabled style="opacity:0.35;cursor:not-allowed;"' : ''}>▶</button>
                <button type="button" class="icon-btn delete-btn" title="Remover bloco">✕</button>
            </div>
        `;

        // Eventos do item
        const nameInput = row.querySelector('.tile-name-input');
        nameInput.addEventListener('change', () => {
            tile.name = nameInput.value.trim() || `tile_${slotIndex}`;
        });

        const sliceBtn = row.querySelector('.slice-btn');
        if (sliceBtn) {
            sliceBtn.addEventListener('click', () => openSlicerModal(idx));
        }

        row.querySelector('.btn-magic').addEventListener('click', () => {
            removeBackgroundFromTile(tile);
            renderAll();
            showToast(`🪄 Fundo limpo em "${tile.name}"!`);
        });

        row.querySelector('.btn-rotate').addEventListener('click', () => rotateTile90(idx));

        row.querySelector('.btn-up').addEventListener('click', () => {
            if (idx > 0) {
                const temp = state.tiles[idx - 1];
                state.tiles[idx - 1] = state.tiles[idx];
                state.tiles[idx] = temp;
                renderAll();
            }
        });

        row.querySelector('.btn-down').addEventListener('click', () => {
            if (idx < state.tiles.length - 1) {
                const temp = state.tiles[idx + 1];
                state.tiles[idx + 1] = state.tiles[idx];
                state.tiles[idx] = temp;
                renderAll();
            }
        });

        row.querySelector('.delete-btn').addEventListener('click', () => {
            state.tiles.splice(idx, 1);
            renderAll();
        });

        tilesListEl.appendChild(row);
    });
}

// Desenha os tiles em um contexto 2D (usado tanto para a prévia quanto para a exportação limpa em PNG)
function drawSpritesheetToContext(targetCtx, layout, includeOverlays = false) {
    const { offset, cols, rows, pad, sheetWidth, sheetHeight } = layout;
    const tw = state.tileWidth;
    const th = state.tileHeight;

    targetCtx.clearRect(0, 0, sheetWidth, sheetHeight);
    targetCtx.imageSmoothingEnabled = !state.pixelArtMode;

    // 1. Desenha cada tile na célula correspondente
    state.tiles.forEach((tile, idx) => {
        const slot = idx + offset;
        const col = slot % cols;
        const row = Math.floor(slot / cols);
        const cellX = col * (tw + pad);
        const cellY = row * (th + pad);

        if (state.fitMode === 'stretch') {
            targetCtx.drawImage(tile.canvas, cellX, cellY, tw, th);
        } else {
            const scale = Math.min(tw / tile.width, th / tile.height);
            const drawW = Math.round(tile.width * scale);
            const drawH = Math.round(tile.height * scale);
            const drawX = cellX + Math.floor((tw - drawW) / 2);
            const drawY = cellY + Math.floor((th - drawH) / 2);
            targetCtx.drawImage(tile.canvas, drawX, drawY, drawW, drawH);
        }
    });

    // 2. Se for apenas para a prévia na tela, desenha grade guia e índices
    if (includeOverlays) {
        const totalCells = cols * rows;
        for (let s = 0; s < totalCells; s++) {
            const col = s % cols;
            const row = Math.floor(s / cols);
            const cellX = col * (tw + pad);
            const cellY = row * (th + pad);

            if (state.showGrid) {
                targetCtx.save();
                targetCtx.strokeStyle = (s === 0 && state.reserveFirstEmpty)
                    ? 'rgba(255, 204, 0, 0.7)'
                    : 'rgba(0, 210, 255, 0.42)';
                targetCtx.lineWidth = 1;
                targetCtx.setLineDash([3, 3]);
                targetCtx.strokeRect(cellX + 0.5, cellY + 0.5, tw - 1, th - 1);
                targetCtx.restore();
            }

            if (state.showIds) {
                const hasTile = (s === 0 && state.reserveFirstEmpty) || (s >= offset && (s - offset) < state.tiles.length);
                if (hasTile) {
                    targetCtx.save();
                    const label = (s === 0 && state.reserveFirstEmpty) ? '0 (Vazio)' : String(s);
                    targetCtx.font = 'bold 9px "JetBrains Mono", monospace';
                    const textW = targetCtx.measureText(label).width + 6;
                    targetCtx.fillStyle = 'rgba(7, 10, 19, 0.78)';
                    targetCtx.fillRect(cellX + 2, cellY + 2, textW, 13);
                    targetCtx.fillStyle = (s === 0 && state.reserveFirstEmpty) ? '#ffcc00' : '#00d2ff';
                    targetCtx.fillText(label, cellX + 5, cellY + 11);
                    targetCtx.restore();
                }
            }
        }
    }
}

function renderCanvasPreview() {
    const layout = computeGridLayout();
    canvas.width = layout.sheetWidth;
    canvas.height = layout.sheetHeight;

    drawSpritesheetToContext(ctx, layout, true);
    applyCanvasZoom();
}

function applyCanvasZoom() {
    if (state.zoom === 'fit') {
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.maxWidth = '100%';
    } else {
        const factor = parseFloat(state.zoom) || 2;
        canvas.style.maxWidth = 'none';
        canvas.style.width = `${canvas.width * factor}px`;
        canvas.style.height = `${canvas.height * factor}px`;
    }
}

function updateMetricsUI() {
    const layout = computeGridLayout();
    document.getElementById('badge-sheet-size').textContent = `Folha: ${layout.sheetWidth} × ${layout.sheetHeight} px`;
    document.getElementById('badge-tile-count').textContent = `${state.tiles.length} bloco(s)`;

    document.getElementById('info-tile-w').textContent = `${state.tileWidth}px`;
    document.getElementById('info-tile-h').textContent = `${state.tileHeight}px`;
    document.getElementById('info-padding').textContent = `${state.padding}px`;
    document.getElementById('info-grid-dims').textContent = `${layout.cols} col × ${layout.rows} lin`;
    document.getElementById('info-img-dims').textContent = `${layout.sheetWidth} × ${layout.sheetHeight} px`;
}

// ==========================================================================
// EXPORTAÇÃO (PNG TRANSPARENTE E MAPEAMENTO JSON)
// ==========================================================================
function getSanitizedBaseName() {
    const raw = (inputExportName.value || 'meu_tileset').trim();
    return raw.replace(/[^a-zA-Z0-9_-]/g, '_') || 'meu_tileset';
}

function exportSpritesheetPng() {
    if (state.tiles.length === 0) {
        showToast('Adicione pelo menos 1 bloco antes de baixar o PNG!');
        return;
    }

    const layout = computeGridLayout();
    const offscreen = document.createElement('canvas');
    offscreen.width = layout.sheetWidth;
    offscreen.height = layout.sheetHeight;
    const offCtx = offscreen.getContext('2d');

    drawSpritesheetToContext(offCtx, layout, false);

    const dataUrl = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${getSanitizedBaseName()}_${state.tileWidth}x${state.tileHeight}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    showToast('💾 Spritesheet PNG transparente baixado com sucesso!');
}

function exportMappingJson() {
    if (state.tiles.length === 0) {
        showToast('Adicione pelo menos 1 bloco antes de exportar o JSON!');
        return;
    }

    const layout = computeGridLayout();
    const tw = state.tileWidth;
    const th = state.tileHeight;
    const pad = layout.pad;
    const baseName = getSanitizedBaseName();

    const tilesArray = [];

    if (state.reserveFirstEmpty) {
        tilesArray.push({
            index: 0,
            nome: 'vazio_gamemaker',
            col: 0,
            row: 0,
            x: 0,
            y: 0,
            largura: tw,
            altura: th,
            vazio: true
        });
    }

    state.tiles.forEach((tile, idx) => {
        const slot = idx + layout.offset;
        const col = slot % layout.cols;
        const row = Math.floor(slot / layout.cols);
        const x = col * (tw + pad);
        const y = row * (th + pad);

        tilesArray.push({
            index: slot,
            nome: tile.name,
            col,
            row,
            x,
            y,
            largura: tw,
            altura: th
        });
    });

    const payload = {
        arquivo_imagem: `${baseName}_${tw}x${th}.png`,
        gerado_em: new Date().toISOString(),
        configuracao_grade: {
            tile_largura: tw,
            tile_altura: th,
            espacamento_px: pad,
            colunas: layout.cols,
            linhas: layout.rows,
            largura_total_px: layout.sheetWidth,
            altura_total_px: layout.sheetHeight,
            primeiro_bloco_vazio_gamemaker: state.reserveFirstEmpty
        },
        tiles: tilesArray
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${baseName}_mapeamento.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('📄 Mapeamento JSON exportado com sucesso!');
}

function showToast(msg) {
    const toast = document.getElementById('tt-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => {
        toast.classList.remove('show');
    }, 2800);
}
