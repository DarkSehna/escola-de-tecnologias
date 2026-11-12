(() => {
    'use strict';

    // --- 1. CONSTANTES E PRESETS DE ENIGMA (8x8) ---
    const PUZZLES = [
        {
            id: 'sword',
            emoji: '🗡️',
            name: 'Espada de Pixel',
            rows: [
                '00000011',
                '00000111',
                '00001110',
                '01011100',
                '00111000',
                '01011000',
                '11001000',
                '11000000'
            ]
        },
        {
            id: 'heart',
            emoji: '❤️',
            name: 'Coração',
            rows: [
                '01100110',
                '11111111',
                '11111111',
                '11111111',
                '01111110',
                '00111100',
                '00011000',
                '00000000'
            ]
        },
        {
            id: 'apple',
            emoji: '🍎',
            name: 'Maçã',
            rows: [
                '00001100',
                '00010000',
                '01100110',
                '11111111',
                '11111111',
                '11111111',
                '01111110',
                '00111100'
            ]
        },
        {
            id: 'shield',
            emoji: '🛡️',
            name: 'Escudo',
            rows: [
                '11111111',
                '11100111',
                '11011011',
                '11011011',
                '11100111',
                '01111110',
                '00111100',
                '00011000'
            ]
        },
        {
            id: 'coin',
            emoji: '🪙',
            name: 'Moeda de Ouro',
            rows: [
                '00111100',
                '01100110',
                '11011011',
                '11011011',
                '11011011',
                '11011011',
                '01100110',
                '00111100'
            ]
        },
        {
            id: 'invader',
            emoji: '👾',
            name: 'Space Invader',
            rows: [
                '00100100',
                '01111110',
                '11011011',
                '11111111',
                '01111110',
                '00100100',
                '01011010',
                '10100101'
            ]
        }
    ];

    const TWO_BIT_META = [
        { pair: '00', name: 'Preto', hex: '#000000', previewHex: '#090d16' },
        { pair: '01', name: 'Branco', hex: '#ffffff', previewHex: '#ffffff' },
        { pair: '10', name: 'Vermelho', hex: '#ef4444', previewHex: '#ef4444' },
        { pair: '11', name: 'Amarelo / Dourado', hex: '#facc15', previewHex: '#facc15' }
    ];

    // --- 2. ESTADO DA APLICAÇÃO ---
    function createEmptyGrid(size) {
        return Array.from({ length: size }, () => Array(size).fill(0));
    }

    const state = {
        mode: 'free',          // 'free' | 'puzzle' | 'twobit'
        preferredSize: 8,      // 8 | 16 (usado em free e twobit)
        gridSize: 8,
        grids: {
            free_8: createEmptyGrid(8),
            free_16: createEmptyGrid(16),
            twobit_8: createEmptyGrid(8),
            twobit_16: createEmptyGrid(16),
            puzzle: createEmptyGrid(8)
        },
        activePuzzleIndex: 0,
        solvedPuzzles: new Set(),
        twoBitBrush: 'cycle',  // 'cycle' | '0' | '1' | '2' | '3'
        showDecimal: false,
        hoveredCell: null,     // { r, c } | null
        isDrawing: false,
        dragPaintValue: 1,
        undoStacks: {
            free_8: [],
            free_16: [],
            twobit_8: [],
            twobit_16: [],
            puzzle: []
        }
    };

    function getCurrentGridKey() {
        if (state.mode === 'puzzle') return 'puzzle';
        return `${state.mode}_${state.gridSize}`;
    }

    function getCurrentGrid() {
        return state.grids[getCurrentGridKey()];
    }

    function cloneGrid(grid) {
        return grid.map(row => row.slice());
    }

    function pushUndoSnapshot() {
        const key = getCurrentGridKey();
        const stack = state.undoStacks[key];
        stack.push(cloneGrid(state.grids[key]));
        if (stack.length > 40) stack.shift();
        updateUndoButton();
    }

    // --- 3. REFERÊNCIAS DA DOM ---
    const modeTabs = document.querySelectorAll('.mode-tab');
    const btnSize8 = document.getElementById('btnSize8');
    const btnSize16 = document.getElementById('btnSize16');
    const statusBadge = document.getElementById('statusBadge');

    const ctxFree = document.getElementById('ctxFree');
    const ctxPuzzle = document.getElementById('ctxPuzzle');
    const ctx2Bit = document.getElementById('ctx2Bit');
    const puzzlePresetBar = document.getElementById('puzzlePresetBar');
    const puzzleProgressFill = document.getElementById('puzzleProgressFill');
    const puzzleProgressText = document.getElementById('puzzleProgressText');
    const btnPuzzleHint = document.getElementById('btnPuzzleHint');
    const puzzleVictoryBanner = document.getElementById('puzzleVictoryBanner');
    const victoryEmoji = document.getElementById('victoryEmoji');
    const victoryItemName = document.getElementById('victoryItemName');
    const btnNextPuzzle = document.getElementById('btnNextPuzzle');

    const palette2BitBar = document.getElementById('palette2BitBar');
    const colHeaders = document.getElementById('colHeaders');
    const rowHeaders = document.getElementById('rowHeaders');
    const pixelGrid = document.getElementById('pixelGrid');

    const hoverCoordText = document.getElementById('hoverCoordText');
    const miniPreviewCanvas = document.getElementById('miniPreviewCanvas');
    const miniCtx = miniPreviewCanvas.getContext('2d');
    const btnUndo = document.getElementById('btnUndo');

    const matrixPanelTitle = document.getElementById('matrixPanelTitle');
    const matrixPanelSub = document.getElementById('matrixPanelSub');
    const chkShowDecimal = document.getElementById('chkShowDecimal');
    const binaryMatrixList = document.getElementById('binaryMatrixList');

    const btnClearGrid = document.getElementById('btnClearGrid');
    const btnInvertGrid = document.getElementById('btnInvertGrid');
    const btnCopyText = document.getElementById('btnCopyText');
    const btnCopyJson = document.getElementById('btnCopyJson');

    const chkTransparentBg = document.getElementById('chkTransparentBg');
    const btnExport320 = document.getElementById('btnExport320');
    const btnExport1x1 = document.getElementById('btnExport1x1');
    const lblExport1x1Size = document.getElementById('lblExport1x1Size');

    const toastFeedback = document.getElementById('toastFeedback');
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas.getContext('2d');

    let toastTimer = null;
    function showToast(message) {
        toastFeedback.textContent = message;
        toastFeedback.classList.add('visible');
        if (toastTimer) clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
            toastFeedback.classList.remove('visible');
        }, 2400);
    }

    // --- 4. ÁUDIO SINTÉTICO LEVE (WEB AUDIO API) ---
    let audioCtx = null;
    function playTone(freq, duration = 0.06, type = 'sine', gainVal = 0.04) {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            if (!audioCtx) audioCtx = new AudioCtx();
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (_) {}
    }

    function playVictoryFanfare() {
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
            setTimeout(() => playTone(freq, 0.14, 'triangle', 0.06), idx * 90);
        });
    }

    // --- 5. CONFETE DE CELEBRAÇÃO ---
    let confettiParticles = [];
    let confettiRaf = null;
    function launchConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        const colors = ['#00e5ff', '#a855f7', '#10b981', '#facc15', '#ef4444', '#ffffff'];
        confettiParticles = Array.from({ length: 85 }, () => ({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 140,
            vx: (Math.random() - 0.5) * 5,
            vy: 3 + Math.random() * 4.5,
            size: 6 + Math.random() * 6,
            rot: Math.random() * Math.PI * 2,
            vRot: (Math.random() - 0.5) * 0.2,
            color: colors[Math.floor(Math.random() * colors.length)]
        }));

        if (confettiRaf) cancelAnimationFrame(confettiRaf);
        function step() {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            confettiParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.rot += p.vRot;
                p.vy += 0.06;
                confettiCtx.save();
                confettiCtx.translate(p.x, p.y);
                confettiCtx.rotate(p.rot);
                confettiCtx.fillStyle = p.color;
                confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
                confettiCtx.restore();
            });
            confettiParticles = confettiParticles.filter(p => p.y < confettiCanvas.height + 30);
            if (confettiParticles.length > 0) {
                confettiRaf = requestAnimationFrame(step);
            } else {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
                confettiRaf = null;
            }
        }
        confettiRaf = requestAnimationFrame(step);
    }

    // --- 6. AUXILIARES DE ENIGMA ---
    function getActivePuzzle() {
        return PUZZLES[state.activePuzzleIndex];
    }

    function getPuzzleTargetBit(r, c) {
        return getActivePuzzle().rows[r][c] === '1' ? 1 : 0;
    }

    function isRowSolvedInPuzzle(r) {
        const grid = state.grids.puzzle;
        const targetRow = getActivePuzzle().rows[r];
        for (let c = 0; c < 8; c++) {
            const targetBit = targetRow[c] === '1' ? 1 : 0;
            if (grid[r][c] !== targetBit) return false;
        }
        return true;
    }

    function getPuzzleStats() {
        const grid = state.grids.puzzle;
        const puzzle = getActivePuzzle();
        let totalOnes = 0;
        let revealedOnes = 0;
        let allCorrect = true;

        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                const t = puzzle.rows[r][c] === '1' ? 1 : 0;
                if (t === 1) {
                    totalOnes++;
                    if (grid[r][c] === 1) revealedOnes++;
                }
                if (grid[r][c] !== t) allCorrect = false;
            }
        }
        return { totalOnes, revealedOnes, solved: allCorrect };
    }

    function renderPuzzlePresetBar() {
        puzzlePresetBar.innerHTML = PUZZLES.map((p, idx) => {
            const isActive = idx === state.activePuzzleIndex;
            const isSolved = state.solvedPuzzles.has(p.id);
            return `
                <button type="button" class="preset-chip ${isActive ? 'active' : ''} ${isSolved ? 'solved' : ''}" data-puzzle-idx="${idx}">
                    <span>${p.emoji}</span>
                    <span>${p.name}</span>
                    ${isSolved ? '<span>✅</span>' : ''}
                </button>
            `;
        }).join('');
    }

    // --- 7. RENDERIZAÇÃO DA GRADE E MATRIZ ---
    function buildGridElements() {
        const size = state.gridSize;
        pixelGrid.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        pixelGrid.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        pixelGrid.classList.toggle('size-16', size === 16);

        colHeaders.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        colHeaders.innerHTML = Array.from({ length: size }, (_, c) =>
            `<span class="axis-label" data-col-lbl="${c}">C${c}</span>`
        ).join('');

        rowHeaders.style.gridTemplateRows = `repeat(${size}, 1fr)`;
        rowHeaders.innerHTML = Array.from({ length: size }, (_, r) =>
            `<span class="axis-label" data-row-lbl="${r}">L${r}</span>`
        ).join('');

        const cellsHTML = [];
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                cellsHTML.push(
                    `<button type="button" class="pixel-cell" data-r="${r}" data-c="${c}" data-val="0" aria-label="Linha ${r}, Coluna ${c}"></button>`
                );
            }
        }
        pixelGrid.innerHTML = cellsHTML.join('');
    }

    function syncGridVisuals() {
        const grid = getCurrentGrid();
        const size = state.gridSize;
        const cells = pixelGrid.children;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = cells[r * size + c];
                if (cell) cell.setAttribute('data-val', String(grid[r][c]));
            }
        }
        drawMiniPreview();
        renderBinaryMatrix();
        updatePuzzleProgressUI();
        updateStatusBadge();
    }

    function drawMiniPreview() {
        const grid = getCurrentGrid();
        const size = state.gridSize;
        miniPreviewCanvas.width = size;
        miniPreviewCanvas.height = size;
        miniCtx.clearRect(0, 0, size, size);

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const v = grid[r][c];
                if (state.mode === 'twobit') {
                    miniCtx.fillStyle = TWO_BIT_META[v].previewHex;
                } else {
                    miniCtx.fillStyle = v === 1 ? '#ffffff' : '#090d16';
                }
                miniCtx.fillRect(c, r, 1, 1);
            }
        }
    }

    function renderBinaryMatrix() {
        const size = state.gridSize;
        const grid = getCurrentGrid();
        const isPuzzle = state.mode === 'puzzle';
        const isTwoBit = state.mode === 'twobit';
        const puzzle = isPuzzle ? getActivePuzzle() : null;

        const rowsHTML = [];
        for (let r = 0; r < size; r++) {
            const rowSolved = isPuzzle && isRowSolvedInPuzzle(r);
            const isHoveredRow = state.hoveredCell && state.hoveredCell.r === r;

            let bitsHTML = '';
            let decimalVal = 0;

            for (let c = 0; c < size; c++) {
                const isBitHovered = isHoveredRow && state.hoveredCell.c === c;
                if (isTwoBit) {
                    const val = grid[r][c];
                    const pair = TWO_BIT_META[val].pair;
                    bitsHTML += `<span class="bit-token pair-${pair} ${isBitHovered ? 'is-bit-hovered' : ''}" data-r="${r}" data-c="${c}" title="Linha ${r}, Coluna ${c}: ${pair} (${TWO_BIT_META[val].name})">${pair}</span>`;
                } else {
                    const bit = isPuzzle ? (puzzle.rows[r][c] === '1' ? 1 : 0) : grid[r][c];
                    decimalVal = (decimalVal * 2) + bit;
                    bitsHTML += `<span class="bit-token val-${bit} ${isBitHovered ? 'is-bit-hovered' : ''}" data-r="${r}" data-c="${c}" title="Linha ${r}, Coluna ${c}: ${bit}">${bit}</span>`;
                }
            }

            let metaHTML = '';
            if (!isTwoBit && state.showDecimal) {
                metaHTML += `<span class="row-decimal" title="Valor em base decimal">=${decimalVal}</span>`;
            }
            if (isPuzzle) {
                metaHTML += `<span class="row-check">${rowSolved ? '✅' : '▫️'}</span>`;
            }

            rowsHTML.push(`
                <div class="matrix-row ${isHoveredRow ? 'is-row-hovered' : ''} ${rowSolved ? 'is-row-solved' : ''}" data-matrix-row="${r}">
                    <span class="row-idx">L${r}</span>
                    <div class="row-bits ${size === 16 ? 'mode-16' : ''}">${bitsHTML}</div>
                    ${metaHTML ? `<div class="row-meta">${metaHTML}</div>` : ''}
                </div>
            `);
        }

        binaryMatrixList.innerHTML = rowsHTML.join('');
    }

    function updateHoverHighlights(cellCoord) {
        state.hoveredCell = cellCoord;

        // Limpar destaques anteriores na grade e nos eixos
        pixelGrid.querySelectorAll('.pixel-cell.is-hovered').forEach(el => el.classList.remove('is-hovered'));
        colHeaders.querySelectorAll('.axis-label.is-active').forEach(el => el.classList.remove('is-active'));
        rowHeaders.querySelectorAll('.axis-label.is-active').forEach(el => el.classList.remove('is-active'));
        binaryMatrixList.querySelectorAll('.matrix-row.is-row-hovered').forEach(el => el.classList.remove('is-row-hovered'));
        binaryMatrixList.querySelectorAll('.bit-token.is-bit-hovered').forEach(el => el.classList.remove('is-bit-hovered'));

        if (!cellCoord) {
            hoverCoordText.textContent = 'Passe o mouse ou toque em um quadrado';
            return;
        }

        const { r, c } = cellCoord;
        const size = state.gridSize;
        const cell = pixelGrid.children[r * size + c];
        if (cell) cell.classList.add('is-hovered');

        const colLbl = colHeaders.querySelector(`[data-col-lbl="${c}"]`);
        const rowLbl = rowHeaders.querySelector(`[data-row-lbl="${r}"]`);
        if (colLbl) colLbl.classList.add('is-active');
        if (rowLbl) rowLbl.classList.add('is-active');

        const matrixRow = binaryMatrixList.querySelector(`[data-matrix-row="${r}"]`);
        if (matrixRow) matrixRow.classList.add('is-row-hovered');

        const bitToken = binaryMatrixList.querySelector(`.bit-token[data-r="${r}"][data-c="${c}"]`);
        if (bitToken) bitToken.classList.add('is-bit-hovered');

        const val = getCurrentGrid()[r][c];
        if (state.mode === 'twobit') {
            const meta = TWO_BIT_META[val];
            hoverCoordText.textContent = `Linha ${r}, Coluna ${c} • ${meta.pair} (${meta.name})`;
        } else if (state.mode === 'puzzle') {
            const target = getPuzzleTargetBit(r, c);
            hoverCoordText.textContent = `Linha ${r}, Coluna ${c} • Código da linha pede: ${target}`;
        } else {
            hoverCoordText.textContent = `Linha ${r}, Coluna ${c} • Bit: ${val} (${val === 1 ? 'Branco' : 'Preto'})`;
        }
    }

    function updatePuzzleProgressUI() {
        if (state.mode !== 'puzzle') {
            puzzleVictoryBanner.classList.remove('visible');
            pixelGrid.classList.remove('victory-glow');
            return;
        }

        const puzzle = getActivePuzzle();
        const stats = getPuzzleStats();
        const pct = stats.totalOnes > 0 ? Math.round((stats.revealedOnes / stats.totalOnes) * 100) : 0;
        puzzleProgressFill.style.width = `${pct}%`;
        puzzleProgressText.textContent = `${stats.revealedOnes} / ${stats.totalOnes} pixels`;

        if (stats.solved) {
            const wasAlreadySolved = state.solvedPuzzles.has(puzzle.id);
            state.solvedPuzzles.add(puzzle.id);
            victoryEmoji.textContent = puzzle.emoji;
            victoryItemName.textContent = `Item desbloqueado: ${puzzle.emoji} ${puzzle.name}`;
            puzzleVictoryBanner.classList.add('visible');
            pixelGrid.classList.add('victory-glow');
            renderPuzzlePresetBar();

            if (!wasAlreadySolved) {
                playVictoryFanfare();
                launchConfetti();
            }
        } else {
            puzzleVictoryBanner.classList.remove('visible');
            pixelGrid.classList.remove('victory-glow');
        }
    }

    function updateUndoButton() {
        const stack = state.undoStacks[getCurrentGridKey()];
        btnUndo.disabled = !stack || stack.length === 0;
    }

    function updateStatusBadge() {
        const sizeTxt = `${state.gridSize}×${state.gridSize}`;
        lblExport1x1Size.textContent = sizeTxt;
        if (state.mode === 'free') {
            statusBadge.textContent = `${sizeTxt} • 1-Bit Livre`;
        } else if (state.mode === 'puzzle') {
            statusBadge.textContent = `Enigma • ${state.solvedPuzzles.size}/${PUZZLES.length}`;
        } else {
            statusBadge.textContent = `${sizeTxt} • 2-Bits (4 Cores)`;
        }
    }

    // --- 8. LÓGICA DE PINTURA / INTERAÇÃO ---
    function applyPixelInteraction(r, c, isInitialTap) {
        const grid = getCurrentGrid();
        const size = state.gridSize;
        const cell = pixelGrid.children[r * size + c];
        if (!cell) return;

        // Remove destaque de dica se clicou
        cell.classList.remove('is-hint');

        if (state.mode === 'free') {
            if (isInitialTap) {
                pushUndoSnapshot();
                state.dragPaintValue = grid[r][c] === 1 ? 0 : 1;
            }
            if (grid[r][c] !== state.dragPaintValue) {
                grid[r][c] = state.dragPaintValue;
                playTone(state.dragPaintValue === 1 ? 580 : 340, 0.04, 'sine', 0.03);
                syncGridVisuals();
                updateHoverHighlights({ r, c });
            } else if (isInitialTap) {
                syncGridVisuals();
            }
            return;
        }

        if (state.mode === 'puzzle') {
            const targetBit = getPuzzleTargetBit(r, c);
            if (targetBit === 1) {
                if (grid[r][c] === 0) {
                    if (isInitialTap) pushUndoSnapshot();
                    grid[r][c] = 1;
                    playTone(660 + r * 28, 0.05, 'triangle', 0.04);
                    syncGridVisuals();
                    updateHoverHighlights({ r, c });
                }
            } else if (isInitialTap) {
                // Erro educativo ao clicar em célula cujo código é 0
                cell.classList.remove('is-wrong');
                void cell.offsetWidth;
                cell.classList.add('is-wrong');
                playTone(190, 0.11, 'sawtooth', 0.04);
                showToast(`Ops! Na linha L${r}, coluna C${c}, o código pede 0 (apagado).`);
            }
            return;
        }

        if (state.mode === 'twobit') {
            if (state.twoBitBrush === 'cycle') {
                if (!isInitialTap) return; // No modo ciclar, apenas 1 passo por clique evita pular cores ao mover o dedo
                pushUndoSnapshot();
                const nextVal = (grid[r][c] + 1) % 4;
                grid[r][c] = nextVal;
                playTone(420 + nextVal * 90, 0.05, 'sine', 0.035);
                syncGridVisuals();
                updateHoverHighlights({ r, c });
            } else {
                const targetVal = parseInt(state.twoBitBrush, 10) || 0;
                if (isInitialTap) pushUndoSnapshot();
                if (grid[r][c] !== targetVal) {
                    grid[r][c] = targetVal;
                    playTone(420 + targetVal * 90, 0.04, 'sine', 0.03);
                    syncGridVisuals();
                    updateHoverHighlights({ r, c });
                }
            }
        }
    }

    // Eventos Pointer (suporte fluido a mouse e toque arrastado)
    pixelGrid.addEventListener('pointerdown', (e) => {
        const cell = e.target.closest('.pixel-cell');
        if (!cell) return;
        e.preventDefault();
        state.isDrawing = true;
        const r = parseInt(cell.dataset.r, 10);
        const c = parseInt(cell.dataset.c, 10);
        updateHoverHighlights({ r, c });
        applyPixelInteraction(r, c, true);
    });

    window.addEventListener('pointermove', (e) => {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el ? el.closest('.pixel-cell') : null;

        if (cell && pixelGrid.contains(cell)) {
            const r = parseInt(cell.dataset.r, 10);
            const c = parseInt(cell.dataset.c, 10);
            if (!state.hoveredCell || state.hoveredCell.r !== r || state.hoveredCell.c !== c) {
                updateHoverHighlights({ r, c });
            }
            if (state.isDrawing) {
                applyPixelInteraction(r, c, false);
            }
        } else if (!state.isDrawing && el && !binaryMatrixList.contains(el)) {
            if (state.hoveredCell) updateHoverHighlights(null);
        }
    });

    window.addEventListener('pointerup', () => { state.isDrawing = false; });
    window.addEventListener('pointercancel', () => { state.isDrawing = false; });

    // Clique e hover bidirecional diretamente na Matriz Binária
    binaryMatrixList.addEventListener('pointerover', (e) => {
        const tok = e.target.closest('.bit-token');
        if (!tok) return;
        updateHoverHighlights({ r: parseInt(tok.dataset.r, 10), c: parseInt(tok.dataset.c, 10) });
    });

    binaryMatrixList.addEventListener('pointerleave', () => {
        if (!state.isDrawing) updateHoverHighlights(null);
    });

    binaryMatrixList.addEventListener('click', (e) => {
        const tok = e.target.closest('.bit-token');
        if (!tok) return;
        const r = parseInt(tok.dataset.r, 10);
        const c = parseInt(tok.dataset.c, 10);
        applyPixelInteraction(r, c, true);
    });

    // --- 9. TROCA DE MODO E TAMANHO ---
    function switchMode(newMode) {
        state.mode = newMode;
        modeTabs.forEach(tab => tab.classList.toggle('active', tab.dataset.mode === newMode));

        ctxFree.classList.toggle('active', newMode === 'free');
        ctxPuzzle.classList.toggle('active', newMode === 'puzzle');
        ctx2Bit.classList.toggle('active', newMode === 'twobit');

        if (newMode === 'puzzle') {
            state.gridSize = 8;
            btnSize16.disabled = true;
            btnSize16.title = 'Os enigmas usam a grade 8×8';
            matrixPanelTitle.textContent = 'Código Secreto do Enigma (8×8)';
            matrixPanelSub.textContent = 'Decodifique cada linha (1 = acender pixel branco).';
            btnInvertGrid.disabled = true;
        } else {
            state.gridSize = state.preferredSize;
            btnSize16.disabled = false;
            btnSize16.title = 'Alternar para grade 16×16';
            btnInvertGrid.disabled = false;
            if (newMode === 'twobit') {
                matrixPanelTitle.textContent = 'Matriz de Cores 2-Bits (Pares)';
                matrixPanelSub.textContent = '00=Preto • 01=Branco • 10=Vermelho • 11=Dourado';
            } else {
                matrixPanelTitle.textContent = 'Matriz Binária (Código ↔ Desenho)';
                matrixPanelSub.textContent = 'Clique em qualquer dígito abaixo para alterar o pixel!';
            }
        }

        btnSize8.classList.toggle('active', state.gridSize === 8);
        btnSize16.classList.toggle('active', state.gridSize === 16);
        chkShowDecimal.closest('.decimal-toggle').style.display = newMode === 'twobit' ? 'none' : 'inline-flex';

        buildGridElements();
        renderPuzzlePresetBar();
        syncGridVisuals();
        updateUndoButton();
    }

    function switchSize(size) {
        if (state.mode === 'puzzle') return;
        state.preferredSize = size;
        state.gridSize = size;
        btnSize8.classList.toggle('active', size === 8);
        btnSize16.classList.toggle('active', size === 16);
        buildGridElements();
        syncGridVisuals();
        updateUndoButton();
    }

    modeTabs.forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });

    btnSize8.addEventListener('click', () => switchSize(8));
    btnSize16.addEventListener('click', () => switchSize(16));

    // Presets e Dica do Modo Enigma
    puzzlePresetBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.preset-chip');
        if (!chip) return;
        state.activePuzzleIndex = parseInt(chip.dataset.puzzleIdx, 10) || 0;
        state.grids.puzzle = createEmptyGrid(8);
        state.undoStacks.puzzle = [];
        renderPuzzlePresetBar();
        syncGridVisuals();
        updateUndoButton();
    });

    btnNextPuzzle.addEventListener('click', () => {
        state.activePuzzleIndex = (state.activePuzzleIndex + 1) % PUZZLES.length;
        state.grids.puzzle = createEmptyGrid(8);
        state.undoStacks.puzzle = [];
        renderPuzzlePresetBar();
        syncGridVisuals();
        updateUndoButton();
    });

    btnPuzzleHint.addEventListener('click', () => {
        if (state.mode !== 'puzzle') return;
        const grid = state.grids.puzzle;
        const puzzle = getActivePuzzle();
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (puzzle.rows[r][c] === '1' && grid[r][c] === 0) {
                    const cell = pixelGrid.children[r * 8 + c];
                    if (cell) {
                        cell.classList.add('is-hint');
                        updateHoverHighlights({ r, c });
                        showToast(`💡 Dica: tente a Linha L${r}, Coluna C${c}!`);
                        playTone(740, 0.08, 'sine', 0.04);
                    }
                    return;
                }
            }
        }
        showToast('Todos os pixels do enigma já foram revelados!');
    });

    // Seletor de Pincel 2-Bits
    palette2BitBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.pal-btn');
        if (!btn) return;
        state.twoBitBrush = btn.dataset.brush;
        palette2BitBar.querySelectorAll('.pal-btn').forEach(el => el.classList.toggle('active', el === btn));
    });

    chkShowDecimal.addEventListener('change', (e) => {
        state.showDecimal = e.target.checked;
        renderBinaryMatrix();
    });

    // --- 10. AÇÕES RÁPIDAS & DESFAZER ---
    btnUndo.addEventListener('click', () => {
        const key = getCurrentGridKey();
        const stack = state.undoStacks[key];
        if (!stack || stack.length === 0) return;
        state.grids[key] = stack.pop();
        syncGridVisuals();
        updateUndoButton();
    });

    btnClearGrid.addEventListener('click', () => {
        pushUndoSnapshot();
        state.grids[getCurrentGridKey()] = createEmptyGrid(state.gridSize);
        syncGridVisuals();
        showToast('Grade limpa!');
    });

    btnInvertGrid.addEventListener('click', () => {
        if (state.mode === 'puzzle') return;
        pushUndoSnapshot();
        const grid = getCurrentGrid();
        const size = state.gridSize;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                grid[r][c] = state.mode === 'twobit' ? (3 - grid[r][c]) : (grid[r][c] === 1 ? 0 : 1);
            }
        }
        syncGridVisuals();
        showToast('Cores invertidas (NOT)!');
    });

    async function copyToClipboard(text, successMsg) {
        try {
            await navigator.clipboard.writeText(text);
            showToast(successMsg);
        } catch (_) {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast(successMsg);
        }
    }

    btnCopyText.addEventListener('click', () => {
        const grid = getCurrentGrid();
        const lines = grid.map(row =>
            state.mode === 'twobit'
                ? row.map(v => TWO_BIT_META[v].pair).join(' ')
                : row.join('')
        );
        copyToClipboard(lines.join('\n'), '📋 Matriz copiada em Texto!');
    });

    btnCopyJson.addEventListener('click', () => {
        const grid = getCurrentGrid();
        const payload = state.mode === 'twobit'
            ? grid.map(row => row.map(v => TWO_BIT_META[v].pair))
            : grid;
        const formatted = '[\n' + payload.map(r => '  ' + JSON.stringify(r)).join(',\n') + '\n]';
        copyToClipboard(formatted, '{ } Matriz copiada em JSON!');
    });

    // --- 11. EXPORTAÇÃO PNG NÍTIDA (320x320 E 1:1 PISKEL) ---
    function exportSpritePng(outputPixels) {
        const size = state.gridSize;
        const grid = getCurrentGrid();
        const transparentBg = chkTransparentBg.checked;
        const scale = outputPixels / size;

        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = outputPixels;
        exportCanvas.height = outputPixels;
        const ctx = exportCanvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        if (!transparentBg) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, outputPixels, outputPixels);
        }

        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const v = grid[r][c];
                if (transparentBg && v === 0) continue;

                if (state.mode === 'twobit') {
                    ctx.fillStyle = TWO_BIT_META[v].hex;
                } else {
                    ctx.fillStyle = v === 1 ? '#ffffff' : '#000000';
                }
                ctx.fillRect(c * scale, r * scale, scale, scale);
            }
        }

        const link = document.createElement('a');
        const modeTag = state.mode === 'twobit' ? '2bits' : (state.mode === 'puzzle' ? getActivePuzzle().id : '1bit');
        const scaleTag = outputPixels === size ? 'piskel-1x1' : `${outputPixels}px`;
        link.download = `sprite-${modeTag}-${size}x${size}-${scaleTag}.png`;
        link.href = exportCanvas.toDataURL('image/png');
        link.click();

        showToast(
            outputPixels === size
                ? `👾 Sprite ${size}×${size} salvo! No Piskel, use Import → Browse Image.`
                : `🖼️ Sprite 320×320 (.PNG) baixado com pixels nítidos!`
        );
    }

    btnExport320.addEventListener('click', () => exportSpritePng(320));
    btnExport1x1.addEventListener('click', () => exportSpritePng(state.gridSize));

    // --- 12. INICIALIZAÇÃO ---
    switchMode('free');
})();
