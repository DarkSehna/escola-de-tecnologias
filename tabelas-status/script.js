// ==========================================================================
// TABELAS DE STATUS & BALANCEAMENTO - JAVASCRIPT
// Escola de Tecnologias - Colégio Anchieta Porto Alegre
// Convenção Didática: Variáveis entregues aos alunos sempre em camelCase
// ==========================================================================

// MODELOS DE AULA PREDEFINIDOS
const PRESETS = {
    metroidvania: {
        name: 'Plataforma & Metroidvania',
        entities: [
            { id: 'player', name: 'Player', type: 'hero', hp: 100, maxHp: 100, damage: 20, defense: 5, spd: 4.0, scoreValue: 0 },
            { id: 'inimigoPatrulha', name: 'InimigoPatrulha', type: 'enemy', hp: 30, maxHp: 30, damage: 10, defense: 2, spd: 1.5, scoreValue: 25 },
            { id: 'morcegoVoador', name: 'MorcegoVoador', type: 'enemy', hp: 15, maxHp: 15, damage: 15, defense: 0, spd: 3.0, scoreValue: 35 },
            { id: 'chefeFase', name: 'ChefeFase', type: 'boss', hp: 200, maxHp: 200, damage: 35, defense: 10, spd: 2.0, scoreValue: 200 }
        ]
    },
    topview: {
        name: 'TopView / Ação em Eixos',
        entities: [
            { id: 'heroi', name: 'Heroi', type: 'hero', hp: 4, maxHp: 4, damage: 1, defense: 0, spd: 2.5, scoreValue: 0 },
            { id: 'slimeVerde', name: 'SlimeVerde', type: 'enemy', hp: 2, maxHp: 2, damage: 1, defense: 0, spd: 1.0, scoreValue: 10 },
            { id: 'esqueletoEspada', name: 'EsqueletoEspada', type: 'enemy', hp: 4, maxHp: 4, damage: 1, defense: 1, spd: 1.5, scoreValue: 30 },
            { id: 'guardiaoMasmorra', name: 'GuardiaoMasmorra', type: 'boss', hp: 12, maxHp: 12, damage: 2, defense: 1, spd: 1.2, scoreValue: 150 }
        ]
    },
    space: {
        name: 'Space Shooter / Arcade',
        entities: [
            { id: 'naveJogador', name: 'NaveJogador', type: 'hero', hp: 4, maxHp: 4, damage: 1, defense: 0, spd: 5.0, scoreValue: 0 },
            { id: 'droneBatedor', name: 'DroneBatedor', type: 'enemy', hp: 1, maxHp: 1, damage: 1, defense: 0, spd: 4.0, scoreValue: 100 },
            { id: 'cruzadorBlindado', name: 'CruzadorBlindado', type: 'enemy', hp: 6, maxHp: 6, damage: 2, defense: 1, spd: 1.5, scoreValue: 500 },
            { id: 'naveMaeChefe', name: 'NaveMaeChefe', type: 'boss', hp: 25, maxHp: 25, damage: 2, defense: 2, spd: 1.0, scoreValue: 2000 }
        ]
    },
    rpg: {
        name: 'RPG Tático / Turnos',
        entities: [
            { id: 'guerreiro', name: 'Guerreiro', type: 'hero', hp: 120, maxHp: 120, damage: 25, defense: 15, spd: 2.0, scoreValue: 0 },
            { id: 'mago', name: 'Mago', type: 'hero', hp: 70, maxHp: 70, damage: 40, defense: 5, spd: 2.5, scoreValue: 0 },
            { id: 'goblinArqueiro', name: 'GoblinArqueiro', type: 'enemy', hp: 45, maxHp: 45, damage: 18, defense: 4, spd: 3.0, scoreValue: 50 },
            { id: 'dragaoChefe', name: 'DragaoChefe', type: 'boss', hp: 350, maxHp: 350, damage: 50, defense: 25, spd: 1.8, scoreValue: 500 }
        ]
    }
};

// ESTADO GLOBAL DA APLICAÇÃO
const state = {
    currentPreset: 'metroidvania',
    entities: JSON.parse(JSON.stringify(PRESETS.metroidvania.entities)),
    formula: 'simple', // 'simple' | 'rpg'
    attackerId: 'player',
    defenderId: 'inimigoPatrulha',
    progEntityId: 'player',
    progCurve: 'linear', // 'linear' | 'rpg'
    exportTab: 'gamemaker',
    gmStyle: 'create',
    c3Style: 'instance'
};

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    initPresets();
    initTableEvents();
    initTtkControls();
    initProgressionControls();
    initExportTabs();
    initClipboardButtons();
    initJsonFileHandler();

    renderTable();
    updateTtkSelects();
    calculateTtk();
    drawProgressionChart();
    updateCodeOutputs();
});

// ==========================================================================
// 1. PRESETS E MODELOS DE AULA
// ==========================================================================
function initPresets() {
    const buttons = document.querySelectorAll('.btn-preset');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const presetKey = btn.dataset.preset;
            if (!PRESETS[presetKey]) return;

            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            state.currentPreset = presetKey;
            state.entities = JSON.parse(JSON.stringify(PRESETS[presetKey].entities));

            // Sincroniza seletores
            state.attackerId = state.entities[0]?.id || '';
            state.defenderId = state.entities[1]?.id || state.entities[0]?.id || '';
            state.progEntityId = state.entities[0]?.id || '';

            renderTable();
            updateTtkSelects();
            calculateTtk();
            drawProgressionChart();
            updateCodeOutputs();

            showToast(`Preset "${PRESETS[presetKey].name}" carregado!`);
        });
    });

    const btnReset = document.getElementById('btnResetTable');
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            const activePreset = PRESETS[state.currentPreset] || PRESETS.metroidvania;
            state.entities = JSON.parse(JSON.stringify(activePreset.entities));
            renderTable();
            updateTtkSelects();
            calculateTtk();
            drawProgressionChart();
            updateCodeOutputs();
            showToast('Modelo restaurado para os valores padrão!');
        });
    }
}

// ==========================================================================
// 2. TABELA DE ENTIDADES (RENDERIZAÇÃO & EDIÇÃO INLINE)
// ==========================================================================
function initTableEvents() {
    const btnAdd = document.getElementById('btnAddEntity');
    if (btnAdd) {
        btnAdd.addEventListener('click', () => {
            const newIndex = state.entities.length + 1;
            const newId = `entidade${newIndex}`;
            state.entities.push({
                id: newId,
                name: `Inimigo${newIndex}`,
                type: 'enemy',
                hp: 40,
                maxHp: 40,
                damage: 12,
                defense: 3,
                spd: 2.0,
                scoreValue: 50
            });
            renderTable();
            updateTtkSelects();
            calculateTtk();
            drawProgressionChart();
            updateCodeOutputs();
            showToast('Nova entidade adicionada à tabela!');
        });
    }
}

function toCamelCase(str) {
    return str
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[^a-zA-Z0-9 ]/g, '') // remove pontuações
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
            return index === 0 ? word.toLowerCase() : word.toUpperCase();
        }).replace(/\s+/g, '');
}

function renderTable() {
    const tbody = document.getElementById('entitiesTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    state.entities.forEach((entity, index) => {
        const tr = document.createElement('tr');
        tr.dataset.entityId = entity.id;

        tr.innerHTML = `
            <td>
                <input type="text" class="input-table-text" value="${escapeHtml(entity.name)}" data-field="name" data-index="${index}" title="Nome da entidade">
            </td>
            <td>
                <select class="select-type type-${entity.type}" data-field="type" data-index="${index}">
                    <option value="hero" ${entity.type === 'hero' ? 'selected' : ''}>Herói</option>
                    <option value="enemy" ${entity.type === 'enemy' ? 'selected' : ''}>Inimigo</option>
                    <option value="boss" ${entity.type === 'boss' ? 'selected' : ''}>Chefe</option>
                    <option value="tower" ${entity.type === 'tower' ? 'selected' : ''}>Torre</option>
                </select>
            </td>
            <td><input type="number" min="1" max="99999" class="input-table-num" value="${entity.hp}" data-field="hp" data-index="${index}"></td>
            <td><input type="number" min="1" max="99999" class="input-table-num" value="${entity.maxHp}" data-field="maxHp" data-index="${index}"></td>
            <td><input type="number" min="0" max="9999" class="input-table-num" value="${entity.damage}" data-field="damage" data-index="${index}"></td>
            <td><input type="number" min="0" max="9999" class="input-table-num" value="${entity.defense}" data-field="defense" data-index="${index}"></td>
            <td><input type="number" step="0.5" min="0" max="99" class="input-table-num" value="${entity.spd}" data-field="spd" data-index="${index}"></td>
            <td><input type="number" min="0" max="99999" class="input-table-num" value="${entity.scoreValue}" data-field="scoreValue" data-index="${index}"></td>
            <td>
                <div class="row-actions">
                    <button type="button" class="btn-icon-action btn-duplicate" data-index="${index}" title="Duplicar entidade">📑</button>
                    <button type="button" class="btn-icon-action delete btn-delete" data-index="${index}" title="Excluir entidade">🗑️</button>
                </div>
            </td>
        `;

        tbody.appendChild(tr);
    });

    // Anexa ouvintes de alteração em cada input da tabela
    tbody.querySelectorAll('input, select').forEach(element => {
        element.addEventListener('change', handleTableFieldChange);
        element.addEventListener('input', handleTableFieldChange);
    });

    // Ouvintes de duplicação e exclusão
    tbody.querySelectorAll('.btn-duplicate').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            duplicateEntity(idx);
        });
    });

    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = parseInt(e.currentTarget.dataset.index, 10);
            deleteEntity(idx);
        });
    });

    updateSummaryBar();
}

function handleTableFieldChange(e) {
    const idx = parseInt(e.target.dataset.index, 10);
    const field = e.target.dataset.field;
    if (isNaN(idx) || !state.entities[idx]) return;

    let val = e.target.value;
    if (e.target.type === 'number') {
        val = parseFloat(val) || 0;
        if (field === 'hp' && val < 1) val = 1;
        if (field === 'maxHp' && val < 1) val = 1;
    }

    state.entities[idx][field] = val;

    // Se mudou o nome, recalcula ID em camelCase limpo
    if (field === 'name') {
        state.entities[idx].id = toCamelCase(val) || `entidade${idx + 1}`;
    }

    // Se alterou tipo, atualiza cor visual da badge do select
    if (field === 'type') {
        e.target.className = `select-type type-${val}`;
    }

    updateSummaryBar();
    updateTtkSelects();
    calculateTtk();
    drawProgressionChart();
    updateCodeOutputs();
}

function duplicateEntity(index) {
    const source = state.entities[index];
    if (!source) return;

    const copy = JSON.parse(JSON.stringify(source));
    copy.name = `${source.name}Copy`;
    copy.id = toCamelCase(copy.name);

    state.entities.splice(index + 1, 0, copy);
    renderTable();
    updateTtkSelects();
    calculateTtk();
    drawProgressionChart();
    updateCodeOutputs();
    showToast(`Entidade "${copy.name}" duplicada!`);
}

function deleteEntity(index) {
    if (state.entities.length <= 1) {
        showToast('⚠️ É necessário manter pelo menos uma entidade na tabela.');
        return;
    }

    const removed = state.entities.splice(index, 1)[0];
    renderTable();
    updateTtkSelects();
    calculateTtk();
    drawProgressionChart();
    updateCodeOutputs();
    showToast(`Entidade "${removed.name}" removida.`);
}

function updateSummaryBar() {
    const countEl = document.getElementById('summaryEntitiesCount');
    const hpEl = document.getElementById('summaryAvgHp');
    const dmgEl = document.getElementById('summaryAvgDamage');

    const total = state.entities.length;
    if (countEl) countEl.textContent = `${total} entidade${total > 1 ? 's' : ''} cadastrada${total > 1 ? 's' : ''}`;

    if (total > 0) {
        const avgHp = Math.round(state.entities.reduce((acc, cur) => acc + (cur.hp || 0), 0) / total);
        const avgDmg = Math.round(state.entities.reduce((acc, cur) => acc + (cur.damage || 0), 0) / total);
        if (hpEl) hpEl.textContent = `HP médio: ${avgHp}`;
        if (dmgEl) dmgEl.textContent = `Dano médio: ${avgDmg}`;
    }
}

// ==========================================================================
// 3. SIMULADOR DE COMBATE / TIME-TO-KILL (TTK)
// ==========================================================================
function initTtkControls() {
    const formulaButtons = document.querySelectorAll('.formula-btn');
    formulaButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            formulaButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.formula = btn.dataset.formula;
            calculateTtk();
        });
    });

    const selectAttacker = document.getElementById('selectAttacker');
    const selectDefender = document.getElementById('selectDefender');

    if (selectAttacker) {
        selectAttacker.addEventListener('change', () => {
            state.attackerId = selectAttacker.value;
            calculateTtk();
        });
    }

    if (selectDefender) {
        selectDefender.addEventListener('change', () => {
            state.defenderId = selectDefender.value;
            calculateTtk();
        });
    }
}

function updateTtkSelects() {
    const selectAttacker = document.getElementById('selectAttacker');
    const selectDefender = document.getElementById('selectDefender');
    const selectProg = document.getElementById('selectProgEntity');

    if (!selectAttacker || !selectDefender) return;

    const currentAttacker = state.attackerId;
    const currentDefender = state.defenderId;
    const currentProg = state.progEntityId;

    selectAttacker.innerHTML = '';
    selectDefender.innerHTML = '';
    if (selectProg) selectProg.innerHTML = '';

    state.entities.forEach(ent => {
        const opt1 = document.createElement('option');
        opt1.value = ent.id;
        opt1.textContent = `${ent.name} (${getTypeLabel(ent.type)})`;
        selectAttacker.appendChild(opt1);

        const opt2 = document.createElement('option');
        opt2.value = ent.id;
        opt2.textContent = `${ent.name} (${getTypeLabel(ent.type)})`;
        selectDefender.appendChild(opt2);

        if (selectProg) {
            const opt3 = document.createElement('option');
            opt3.value = ent.id;
            opt3.textContent = ent.name;
            selectProg.appendChild(opt3);
        }
    });

    // Preserva seleções válidas
    if (state.entities.some(e => e.id === currentAttacker)) {
        selectAttacker.value = currentAttacker;
    } else {
        state.attackerId = state.entities[0]?.id || '';
    }

    if (state.entities.some(e => e.id === currentDefender)) {
        selectDefender.value = currentDefender;
    } else {
        state.defenderId = state.entities[1]?.id || state.entities[0]?.id || '';
        selectDefender.value = state.defenderId;
    }

    if (selectProg) {
        if (state.entities.some(e => e.id === currentProg)) {
            selectProg.value = currentProg;
        } else {
            state.progEntityId = state.entities[0]?.id || '';
            selectProg.value = state.progEntityId;
        }
    }
}

function getTypeLabel(type) {
    const map = { hero: 'Herói', enemy: 'Inimigo', boss: 'Chefe', tower: 'Torre' };
    return map[type] || type;
}

function calculateTtk() {
    const attacker = state.entities.find(e => e.id === state.attackerId);
    const defender = state.entities.find(e => e.id === state.defenderId);

    const valDmg = document.getElementById('valNetDamage');
    const valHits = document.getElementById('valHitsToKill');
    const valTime = document.getElementById('valTtkTime');
    const alertBox = document.getElementById('ttkPacingAlert');
    const alertTitle = document.getElementById('alertTitle');
    const alertDesc = document.getElementById('alertDesc');

    if (!attacker || !defender) return;

    let netDamage = 0;
    if (state.formula === 'simple') {
        netDamage = Math.max(1, attacker.damage - defender.defense);
    } else {
        // Fórmula clássica de mitigação percentual
        const defFactor = 100 / (100 + Math.max(0, defender.defense));
        netDamage = Math.max(1, Math.round(attacker.damage * defFactor));
    }

    const hitsToKill = Math.ceil(defender.hp / netDamage);

    // Velocidade de ataque aproximada (baseada no atributo spd ou cadência de 1.2s padrão)
    const attacksPerSec = attacker.spd > 0 ? (0.6 + attacker.spd * 0.15) : 0.8;
    const ttkSeconds = Math.max(0.1, (hitsToKill / attacksPerSec)).toFixed(1);

    if (valDmg) valDmg.textContent = `${netDamage} HP`;
    if (valHits) valHits.textContent = `${hitsToKill}x`;
    if (valTime) valTime.textContent = `~${ttkSeconds}s`;

    // Avaliação de Semáforo / Pacing
    if (alertBox && alertTitle && alertDesc) {
        alertBox.className = 'pacing-alert';

        if (attacker.damage <= defender.defense && state.formula === 'simple') {
            alertBox.classList.add('alert-invulnerable');
            alertBox.querySelector('.alert-icon').textContent = '🔴';
            alertTitle.textContent = 'Alerta: Defesa Impenetrável!';
            alertDesc.textContent = `O atacante causa dano mínimo residual (1). Aumente o dano ou reduza a defesa do ${defender.name}.`;
        } else if (hitsToKill <= 2) {
            alertBox.classList.add('alert-fragile');
            alertBox.querySelector('.alert-icon').textContent = '🟡';
            alertTitle.textContent = 'Atenção: Combate Muito Rápido / One-Shot!';
            alertDesc.textContent = `O ${defender.name} é derrotado em ${hitsToKill} golpe(s). Se for um jogador ou chefe, pode causar frustração.`;
        } else if (hitsToKill >= 15) {
            alertBox.classList.add('alert-sponge');
            alertBox.querySelector('.alert-icon').textContent = '🟠';
            alertTitle.textContent = 'Atenção: Inimigo Esponja de Dano!';
            alertDesc.textContent = `São necessários ${hitsToKill} golpes (~${ttkSeconds}s). O combate pode ficar monótono para os alunos.`;
        } else {
            alertBox.classList.add('alert-balanced');
            alertBox.querySelector('.alert-icon').textContent = '🟢';
            alertTitle.textContent = 'Ritmo Equilibrado!';
            alertDesc.textContent = `Combate dura ${hitsToKill} golpes (~${ttkSeconds}s), ideal para ação dinâmica sem ser punitivo.`;
        }
    }
}

// ==========================================================================
// 4. GRÁFICO DE PROGRESSÃO EM CANVAS 2D
// ==========================================================================
function initProgressionControls() {
    const selectProg = document.getElementById('selectProgEntity');
    const selectCurve = document.getElementById('selectProgCurve');

    if (selectProg) {
        selectProg.addEventListener('change', () => {
            state.progEntityId = selectProg.value;
            drawProgressionChart();
        });
    }

    if (selectCurve) {
        selectCurve.addEventListener('change', () => {
            state.progCurve = selectCurve.value;
            drawProgressionChart();
        });
    }

    // Redesenha se mudar tamanho ou tema
    window.addEventListener('resize', drawProgressionChart);
    window.addEventListener('titanThemeChanged', drawProgressionChart);
}

function drawProgressionChart() {
    const canvas = document.getElementById('progressionCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const entity = state.entities.find(e => e.id === state.progEntityId) || state.entities[0];
    if (!entity) return;

    // Resolução nítida para telas de alta densidade (Retina/DPI)
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = (rect.width || 500) * dpr;
    canvas.height = (rect.height || 180) * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width || 500;
    const h = rect.height || 180;
    const padding = { top: 20, right: 30, bottom: 25, left: 45 };

    ctx.clearRect(0, 0, w, h);

    // Calcula os valores de Nível 1 a 10
    const levels = 10;
    const hpValues = [];
    const dmgValues = [];
    const defValues = [];

    for (let lvl = 1; lvl <= levels; lvl++) {
        let mult = 1;
        if (state.progCurve === 'linear') {
            mult = 1 + (lvl - 1) * 0.15; // +15% por nível
        } else {
            mult = Math.pow(1.15, lvl - 1); // Exponencial ^1.15
        }

        hpValues.push(Math.round(entity.hp * mult));
        dmgValues.push(Math.round(entity.damage * mult));
        defValues.push(Math.round(entity.defense * mult));
    }

    const maxVal = Math.max(...hpValues, ...dmgValues, ...defValues, 10);

    // Desenha linhas de grade de fundo
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (i / 4) * (h - padding.top - padding.bottom);
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();

        // Rótulos do eixo Y
        const labelVal = Math.round(maxVal - (i / 4) * maxVal);
        ctx.fillStyle = '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(labelVal.toString(), padding.left - 8, y + 3);
    }

    // Rótulos do eixo X (Níveis 1 a 10)
    ctx.textAlign = 'center';
    for (let lvl = 1; lvl <= levels; lvl++) {
        const x = padding.left + ((lvl - 1) / (levels - 1)) * (w - padding.left - padding.right);
        ctx.fillStyle = '#64748b';
        ctx.fillText(`L${lvl}`, x, h - 8);
    }

    // Função auxiliar para plotar uma curva
    function plotCurve(values, color) {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        values.forEach((val, i) => {
            const x = padding.left + (i / (levels - 1)) * (w - padding.left - padding.right);
            const y = padding.top + (1 - (val / maxVal)) * (h - padding.top - padding.bottom);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        ctx.stroke();

        // Desenha pontos com brilho
        values.forEach((val, i) => {
            const x = padding.left + (i / (levels - 1)) * (w - padding.left - padding.right);
            const y = padding.top + (1 - (val / maxVal)) * (h - padding.top - padding.bottom);

            ctx.beginPath();
            ctx.arc(x, y, 3.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Plota as 3 métricas
    plotCurve(hpValues, '#10b981');   // HP (Verde)
    plotCurve(dmgValues, '#06b6d4');  // Damage (Ciano)
    plotCurve(defValues, '#a855f7');  // Defense (Roxo)
}

// ==========================================================================
// 5. CENTRAL DE EXPORTAÇÃO (CAMELCASE RIGOROSO)
// ==========================================================================
function initExportTabs() {
    const tabButtons = document.querySelectorAll('.export-tab');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => {
                b.classList.remove('active');
                b.setAttribute('aria-selected', 'false');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-selected', 'true');

            state.exportTab = btn.dataset.exportTab;

            document.querySelectorAll('.export-tab-panel').forEach(p => p.classList.remove('active'));
            const targetPanel = document.getElementById(`tabContent${capitalize(state.exportTab)}`);
            if (targetPanel) targetPanel.classList.add('active');

            updateCodeOutputs();
        });
    });

    // Sub-opções GameMaker (Create vs Struct)
    document.querySelectorAll('input[name="gmStyle"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.gmStyle = e.target.value;
            updateCodeOutputs();
        });
    });

    // Sub-opções Construct 3 (Instance vs JSON)
    document.querySelectorAll('input[name="c3Style"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            state.c3Style = e.target.value;
            updateCodeOutputs();
        });
    });
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function updateCodeOutputs() {
    generateGmlOutput();
    generateConstructOutput();
    generateMarkdownOutput();
    generateJsonOutput();
}

/**
 * Gera código GML do GameMaker com variáveis em camelCase
 */
function generateGmlOutput() {
    const codeEl = document.getElementById('codeOutputGml');
    if (!codeEl) return;

    if (state.gmStyle === 'create') {
        let code = `// ============================================================\n`;
        code += `// CÓDIGO GAMEMAKER (GML) - CONVENÇÃO CAMELCASE\n`;
        code += `// Cole este código no Evento CREATE de cada Objeto correspondente:\n`;
        code += `// ============================================================\n\n`;

        state.entities.forEach(ent => {
            const objName = `obj_${capitalize(ent.id)}`;
            code += `// --- Objeto: ${objName} (${getTypeLabel(ent.type)}) ---\n`;
            code += `hp = ${ent.hp};\n`;
            code += `maxHp = ${ent.maxHp};\n`;
            code += `damage = ${ent.damage};\n`;
            code += `defense = ${ent.defense};\n`;
            code += `spd = ${ent.spd};\n`;
            code += `scoreValue = ${ent.scoreValue};\n\n`;
        });

        codeEl.textContent = code.trim();
    } else {
        let code = `// ============================================================\n`;
        code += `// CÓDIGO GAMEMAKER (GML) - STRUCT GLOBAL DE CONSTANTES\n`;
        code += `// Cole no Script de Inicialização ou no objeto de controle:\n`;
        code += `// ============================================================\n\n`;
        code += `global.entityStats = {\n`;

        state.entities.forEach((ent, i) => {
            const isLast = i === state.entities.length - 1;
            code += `    ${ent.id}: {\n`;
            code += `        name: "${ent.name}",\n`;
            code += `        type: "${ent.type}",\n`;
            code += `        hp: ${ent.hp},\n`;
            code += `        maxHp: ${ent.maxHp},\n`;
            code += `        damage: ${ent.damage},\n`;
            code += `        defense: ${ent.defense},\n`;
            code += `        spd: ${ent.spd},\n`;
            code += `        scoreValue: ${ent.scoreValue}\n`;
            code += `    }${isLast ? '' : ','}\n`;
        });

        code += `};\n`;
        codeEl.textContent = code;
    }
}

/**
 * Gera especificações para Construct 3
 */
function generateConstructOutput() {
    const codeEl = document.getElementById('codeOutputC3');
    if (!codeEl) return;

    if (state.c3Style === 'instance') {
        let text = `// ============================================================\n`;
        text += `// GUIA DE VARIÁVEIS DE INSTÂNCIA PARA O CONSTRUCT 3\n`;
        text += `// No painel esquerdo (Properties), crie as variáveis abaixo em camelCase:\n`;
        text += `// ============================================================\n\n`;

        state.entities.forEach(ent => {
            text += `📌 Objeto [ ${ent.name} ] (${getTypeLabel(ent.type)}):\n`;
            text += `   • hp (Number) = ${ent.hp}\n`;
            text += `   • maxHp (Number) = ${ent.maxHp}\n`;
            text += `   • damage (Number) = ${ent.damage}\n`;
            text += `   • defense (Number) = ${ent.defense}\n`;
            text += `   • spd (Number) = ${ent.spd}\n`;
            text += `   • scoreValue (Number) = ${ent.scoreValue}\n\n`;
        });

        text += `💡 Dica de Aula (Evento de Dano):\n`;
        text += `   Ao colidir: [ ${state.entities[1]?.name || 'Inimigo'} ] Subtrair de [ hp ] o valor [ ${state.entities[0]?.name || 'Player'}.damage ]\n`;
        text += `   Se [ hp ] <= 0: Ação [ Destroy ] + [ Spawn Particle/Moeda ]`;

        codeEl.textContent = text;
    } else {
        // Formato nativo Dictionary JSON compatível com AJAX.LoadJSON
        const dictData = {};
        state.entities.forEach(ent => {
            dictData[ent.id] = {
                name: ent.name,
                type: ent.type,
                hp: ent.hp,
                maxHp: ent.maxHp,
                damage: ent.damage,
                defense: ent.defense,
                spd: ent.spd,
                scoreValue: ent.scoreValue
            };
        });

        const c3Json = {
            "c2dictionary": true,
            "data": dictData
        };

        codeEl.textContent = JSON.stringify(c3Json, null, 2);
    }
}

/**
 * Gera Tabela Markdown pronta para o Gerador de GDD
 */
function generateMarkdownOutput() {
    const codeEl = document.getElementById('codeOutputMarkdown');
    if (!codeEl) return;

    let md = `### Tabela de Balanceamento e Atributos das Entidades\n\n`;
    md += `| Entidade | Tipo | HP | Max HP | Dano (damage) | Defesa (defense) | Velocidade (spd) | Recompensa (scoreValue) |\n`;
    md += `|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|\n`;

    state.entities.forEach(ent => {
        md += `| **${ent.name}** | \`${getTypeLabel(ent.type)}\` | ${ent.hp} | ${ent.maxHp} | ${ent.damage} | ${ent.defense} | ${ent.spd} | ${ent.scoreValue} |\n`;
    });

    md += `\n*Tabela gerada no Portal de Tecnologias — Escola de Tecnologias (Padrão didático camelCase).*`;
    codeEl.textContent = md;
}

/**
 * Gera JSON Bruto para backup
 */
function generateJsonOutput() {
    const codeEl = document.getElementById('codeOutputRawJson');
    if (!codeEl) return;

    const exportData = {
        meta: {
            title: "Tabela de Balanceamento - Escola de Tecnologias",
            preset: state.currentPreset,
            convention: "camelCase",
            updatedAt: new Date().toISOString()
        },
        entities: state.entities
    };

    codeEl.textContent = JSON.stringify(exportData, null, 2);
}

// ==========================================================================
// 6. CÓPIA RÁPIDA, DOWNLOAD & UPLOAD DE ARQUIVOS JSON
// ==========================================================================
function initClipboardButtons() {
    setupCopyBtn('btnCopyGml', 'codeOutputGml', '✅ Código GML (GameMaker) copiado!');
    setupCopyBtn('btnCopyC3', 'codeOutputC3', '✅ Código para Construct 3 copiado!');
    setupCopyBtn('btnCopyMarkdown', 'codeOutputMarkdown', '✅ Tabela Markdown copiada! Pronta para colar no GDD.');
    setupCopyBtn('btnCopyRawJson', 'codeOutputRawJson', '✅ JSON copiado com sucesso!');
}

function setupCopyBtn(btnId, targetCodeId, toastMsg) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', () => {
        const text = document.getElementById(targetCodeId)?.textContent || '';
        copyToClipboard(text, toastMsg);
    });
}

async function copyToClipboard(text, toastMsg) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
        showToast(toastMsg);
    } catch (e) {
        showToast('❌ Erro ao copiar. Selecione o código manualmente com Ctrl+C.');
    }
}

function initJsonFileHandler() {
    const btnDownload = document.getElementById('btnDownloadJson');
    const fileInput = document.getElementById('fileInputJson');

    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            const data = {
                meta: {
                    title: "Tabela de Balanceamento - Escola de Tecnologias",
                    preset: state.currentPreset,
                    convention: "camelCase",
                    createdAt: new Date().toISOString()
                },
                entities: state.entities
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tabela_balanceamento_${state.currentPreset}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast('💾 Arquivo JSON baixado com sucesso!');
        });
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const parsed = JSON.parse(event.target.result);
                    if (Array.isArray(parsed.entities)) {
                        state.entities = parsed.entities;
                    } else if (Array.isArray(parsed)) {
                        state.entities = parsed;
                    } else {
                        throw new Error('Formato inválido');
                    }

                    renderTable();
                    updateTtkSelects();
                    calculateTtk();
                    drawProgressionChart();
                    updateCodeOutputs();
                    showToast('📂 Projeto carregado com sucesso!');
                } catch (err) {
                    showToast('❌ Erro: o arquivo selecionado não é um JSON válido de balanceamento.');
                }
            };
            reader.readAsText(file);
            fileInput.value = '';
        });
    }
}

function showToast(message) {
    const toast = document.getElementById('toastFeedback');
    if (!toast) return;

    toast.textContent = message;
    toast.style.display = 'inline-flex';

    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.display = 'none';
    }, 2800);
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
