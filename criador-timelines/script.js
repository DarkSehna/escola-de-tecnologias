/* ==========================================================================
   CRIADOR DE TIMELINES DE JOGOS - LÓGICA STANDALONE E GERENCIAMENTO DE ESTADO
   ========================================================================== */

(function () {
    'use strict';

    const STORAGE_KEY = 'criador_timelines_data_v1';

    // ESTADO DA APLICAÇÃO
    let state = {
        phases: []
    };

    // ELEMENTOS DO DOM
    const timelineContainer = document.getElementById('timeline-container');
    const scopeGaugeFillVertical = document.getElementById('scope-gauge-fill-vertical');

    const topScopeStatusBadge = document.getElementById('top-scope-status-badge');
    const scopeStatusBadge = document.getElementById('scope-status-badge');

    const topPhaseCounterText = document.getElementById('top-phase-counter-text');
    const phaseCounterText = document.getElementById('phase-counter-text');

    const scopeFeedbackMsg = document.getElementById('scope-feedback-msg');

    const fabAddPhase = document.getElementById('fab-add-phase');
    const btnCopyMarkdown = document.getElementById('btn-copy-markdown');
    const btnSaveJson = document.getElementById('btn-save-json');
    const btnLoadJson = document.getElementById('btn-load-json');
    const fileJsonLoader = document.getElementById('file-json-loader');
    const btnClearAll = document.getElementById('btn-clear-all');
    const toastNotification = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    // GERADOR DE ID ÚNICO PERMANENTE
    function generateUniqueId() {
        const randomHash = Math.random().toString(36).substring(2, 8);
        return `fase-${randomHash}`;
    }

    // INICIALIZAÇÃO DA APLICAÇÃO
    function init() {
        loadFromStorage();

        // Se não existir nenhuma fase salva, inicializa com a Fase 1 modelo em branco
        if (!state.phases || state.phases.length === 0) {
            state.phases = [createEmptyPhaseObject()];
            saveToStorage();
        }

        setupEventListeners();
        render();
    }

    // CRIAÇÃO DE OBJETO DE FASE EM BRANCO
    function createEmptyPhaseObject() {
        return {
            id: generateUniqueId(),
            scenario: '',
            mechanic: '',
            challenge: '',
            transition: ''
        };
    }

    // PERSISTÊNCIA NO LOCALSTORAGE
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.phases));
        } catch (e) {
            console.error('Erro ao salvar no localStorage:', e);
        }
    }

    function loadFromStorage() {
        try {
            const storedData = localStorage.getItem(STORAGE_KEY);
            if (storedData) {
                state.phases = JSON.parse(storedData);
            }
        } catch (e) {
            console.error('Erro ao carregar do localStorage:', e);
            state.phases = [];
        }
    }

    // ATUALIZAÇÃO DO TERMÔMETRO DE ESCOPO LATERAL (BARRA DE ENERGIA 100% ESTILO GDD)
    function updateScopeMeter() {
        const count = state.phases.length;
        const countText = `${count} ${count === 1 ? 'Fase Planejada' : 'Fases Planejadas'}`;

        topPhaseCounterText.textContent = countText;
        phaseCounterText.textContent = `${count} ${count === 1 ? 'Fase' : 'Fases'}`;

        // Limpa classes anteriores
        const levelClasses = ['level-blue', 'level-green', 'level-yellow', 'level-red'];
        levelClasses.forEach(cls => {
            topScopeStatusBadge.classList.remove(cls);
            scopeStatusBadge.classList.remove(cls);
            if (scopeGaugeFillVertical) scopeGaugeFillVertical.classList.remove(cls);
        });

        let fillPercentage = 0;
        let badgeText = '';
        let activeLevelClass = '';
        let feedbackHTML = '';

        if (count === 1) {
            // Nível 1: Escopo Baixo (Ciano / Azul)
            fillPercentage = 25;
            badgeText = 'Escopo Baixo';
            activeLevelClass = 'level-blue';
            feedbackHTML = `🔷 <strong>Escopo Baixo (Fase Inicial):</strong> O projeto está muito enxuto. Recomendamos planejar 2 ou 3 fases para uma progressão de jogo mais completa!`;
        } else if (count >= 2 && count <= 3) {
            // Nível 2: Escopo Ideal (Verde)
            fillPercentage = count === 2 ? 50 : 65;
            badgeText = 'Escopo Ideal';
            activeLevelClass = 'level-green';
            feedbackHTML = `💚 <strong>Escopo Ideal (Excelente para o semestre):</strong> O projeto está equilibrado com ótimas chances de conclusão e bom polimento!`;
        } else if (count >= 4 && count <= 5) {
            // Nível 3: Escopo Desafiador (Amarelo)
            fillPercentage = count === 4 ? 80 : 90;
            badgeText = 'Escopo Desafiador';
            activeLevelClass = 'level-yellow';
            feedbackHTML = `🟡 <strong>Escopo Desafiador (Exige foco):</strong> Fique atento! Requer disciplina e foco constante para não deixar mecânicas incompletas.`;
        } else {
            // Nível 4: Alerta de Risco (Vermelho - 6+ Fases)
            fillPercentage = 100;
            badgeText = 'Alerta de Risco!';
            activeLevelClass = 'level-red';
            feedbackHTML = `🔴 <strong>Alerta de Risco!</strong> Cuidado para não estourar o prazo da disciplina. Recomendamos simplificar a progressão para até 3 ou 4 fases.`;
        }

        // Aplica estilos e preenchimento vertical na barra lateral
        topScopeStatusBadge.classList.add(activeLevelClass);
        scopeStatusBadge.classList.add(activeLevelClass);
        if (scopeGaugeFillVertical) {
            scopeGaugeFillVertical.classList.add(activeLevelClass);
            scopeGaugeFillVertical.style.height = `${fillPercentage}%`;
        }

        topScopeStatusBadge.textContent = badgeText;
        scopeStatusBadge.textContent = badgeText;

        scopeFeedbackMsg.innerHTML = feedbackHTML;
    }

    // RENDERIZAÇÃO DA TIMELINE E CARDS VERTICAIS
    function render() {
        updateScopeMeter();

        timelineContainer.innerHTML = '';

        state.phases.forEach((phase, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'phase-card';
            cardEl.dataset.index = index;
            cardEl.dataset.id = phase.id;

            const isFirst = index === 0;
            const isLast = index === state.phases.length - 1;

            cardEl.innerHTML = `
                <div class="phase-card-header">
                    <div class="phase-title-badge">
                        <span class="phase-num">FASE ${String(index + 1).padStart(2, '0')}</span>
                        <span class="phase-id-tag">ID: ${phase.id}</span>
                    </div>
                    <div class="phase-card-actions">
                        <button class="icon-btn move-up-btn" title="Mover fase para cima" ${isFirst ? 'disabled' : ''}>
                            ⬆️
                        </button>
                        <button class="icon-btn move-down-btn" title="Mover fase para baixo" ${isLast ? 'disabled' : ''}>
                            ⬇️
                        </button>
                        <button class="icon-btn delete-btn" title="Excluir esta fase">
                            🗑️
                        </button>
                    </div>
                </div>

                <div class="phase-card-body">
                    <div class="input-group">
                        <label class="input-label">
                            <span>🏕️</span> Cenário
                        </label>
                        <input type="text" class="input-field input-scenario" 
                            placeholder="Onde se passa a fase? (Ex: Caverna de Gelo com estalactites)" 
                            value="${escapeHtml(phase.scenario)}">
                    </div>

                    <div class="input-group">
                        <label class="input-label">
                            <span>⚡</span> Mecânica / Desbloqueio
                        </label>
                        <input type="text" class="input-field input-mechanic" 
                            placeholder="Qual habilidade ou item o jogador ganha aqui? (Ex: Pulo Duplo)" 
                            value="${escapeHtml(phase.mechanic)}">
                    </div>

                    <div class="input-group">
                        <label class="input-label">
                            <span>🎯</span> Desafio Principal
                        </label>
                        <input type="text" class="input-field input-challenge" 
                            placeholder="O que testa essa nova habilidade? (Ex: Abismos largos e plataformas móveis)" 
                            value="${escapeHtml(phase.challenge)}">
                    </div>

                    <div class="input-group">
                        <label class="input-label">
                            <span>🚪</span> Transição
                        </label>
                        <input type="text" class="input-field input-transition" 
                            placeholder="Como a fase termina? (Ex: Derrotando o Golem e abrindo a porta)" 
                            value="${escapeHtml(phase.transition)}">
                    </div>
                </div>
            `;

            // EVENT LISTENERS DOS INPUTS DO CARD (AUTO-SAVE EM TEMPO REAL)
            const scenarioInput = cardEl.querySelector('.input-scenario');
            const mechanicInput = cardEl.querySelector('.input-mechanic');
            const challengeInput = cardEl.querySelector('.input-challenge');
            const transitionInput = cardEl.querySelector('.input-transition');

            scenarioInput.addEventListener('input', (e) => {
                state.phases[index].scenario = e.target.value;
                saveToStorage();
            });

            mechanicInput.addEventListener('input', (e) => {
                state.phases[index].mechanic = e.target.value;
                saveToStorage();
            });

            challengeInput.addEventListener('input', (e) => {
                state.phases[index].challenge = e.target.value;
                saveToStorage();
            });

            transitionInput.addEventListener('input', (e) => {
                state.phases[index].transition = e.target.value;
                saveToStorage();
            });

            // EVENT LISTENERS DE BOTÕES DO CARD
            cardEl.querySelector('.move-up-btn').addEventListener('click', () => movePhase(index, -1));
            cardEl.querySelector('.move-down-btn').addEventListener('click', () => movePhase(index, 1));
            cardEl.querySelector('.delete-btn').addEventListener('click', () => deletePhase(index));

            timelineContainer.appendChild(cardEl);
        });
    }

    // MANIPULAÇÃO DE FASES
    function addPhase() {
        state.phases.push(createEmptyPhaseObject());
        saveToStorage();
        render();

        // Rola automaticamente para o novo card criado
        setTimeout(() => {
            const cards = timelineContainer.querySelectorAll('.phase-card');
            if (cards.length > 0) {
                cards[cards.length - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 50);
    }

    function movePhase(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= state.phases.length) return;

        // Troca os elementos de posição
        const temp = state.phases[index];
        state.phases[index] = state.phases[newIndex];
        state.phases[newIndex] = temp;

        saveToStorage();
        render();
    }

    function deletePhase(index) {
        if (state.phases.length <= 1) {
            state.phases[0] = createEmptyPhaseObject();
            showToast('Fase resetada! ✓');
        } else {
            state.phases.splice(index, 1);
            showToast('Fase removida! ✓');
        }
        saveToStorage();
        render();
    }

    function clearAllPhases() {
        if (confirm('Tem certeza que deseja resetar toda a timeline?')) {
            state.phases = [createEmptyPhaseObject()];
            saveToStorage();
            render();
            showToast('Timeline resetada! ✓');
        }
    }

    // EXPORTAÇÃO DE MARKDOWN PARA O GDD
    function copyMarkdownToGDD() {
        if (!state.phases || state.phases.length === 0) {
            showToast('Nenhuma fase para exportar!');
            return;
        }

        let markdown = `### 🗺️ Timeline de Fases & Progressão de Jogo\n\n`;
        markdown += `**Resumo de Escopo:** ${state.phases.length} ${state.phases.length === 1 ? 'fase' : 'fases'} planejas.\n\n`;

        state.phases.forEach((phase, idx) => {
            markdown += `#### 📍 Fase ${idx + 1} (ID: \`${phase.id}\`)\n`;
            markdown += `- **Cenário:** ${phase.scenario.trim() || 'Não especificado'}\n`;
            markdown += `- **Mecânica / Desbloqueio:** ${phase.mechanic.trim() || 'Não especificado'}\n`;
            markdown += `- **Desafio Principal:** ${phase.challenge.trim() || 'Não especificado'}\n`;
            markdown += `- **Transição:** ${phase.transition.trim() || 'Não especificado'}\n\n`;
        });

        navigator.clipboard.writeText(markdown.trim())
            .then(() => {
                showToast('Copiado! ✓ (Pronto para colar no GDD)');
            })
            .catch((err) => {
                console.error('Erro ao copiar markdown:', err);
                showToast('Erro ao copiar para a área de transferência');
            });
    }

    // SALVAR & CARREGAR JSON
    function exportJSON() {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.phases, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `timeline-jogo-${new Date().toISOString().slice(0,10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Projeto JSON exportado! 💾');
    }

    function importJSON(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const parsed = JSON.parse(e.target.result);
                if (Array.isArray(parsed)) {
                    state.phases = parsed.map(item => ({
                        id: item.id || generateUniqueId(),
                        scenario: item.scenario || '',
                        mechanic: item.mechanic || '',
                        challenge: item.challenge || '',
                        transition: item.transition || ''
                    }));
                    saveToStorage();
                    render();
                    showToast('Projeto JSON carregado com sucesso! 📁');
                } else {
                    alert('Formato de arquivo JSON inválido. Certifique-se de usar um arquivo exportado por esta ferramenta.');
                }
            } catch (err) {
                console.error('Erro ao ler JSON:', err);
                alert('Erro ao processar o arquivo JSON.');
            }
            fileJsonLoader.value = '';
        };
        reader.readAsText(file);
    }

    // TOAST NOTIFICATION
    function showToast(message) {
        toastMessage.textContent = message;
        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, 2800);
    }

    // HELPER PARA EVITAR INJEÇÃO HTML
    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // REGISTRO DE EVENT LISTENERS GLOBAIS
    function setupEventListeners() {
        if (fabAddPhase) fabAddPhase.addEventListener('click', addPhase);

        btnCopyMarkdown.addEventListener('click', copyMarkdownToGDD);
        btnSaveJson.addEventListener('click', exportJSON);
        btnLoadJson.addEventListener('click', () => fileJsonLoader.click());
        fileJsonLoader.addEventListener('change', importJSON);
        btnClearAll.addEventListener('click', clearAllPhases);
    }

    // INICIAR APLICAÇÃO AO CARREGAR O DOM
    document.addEventListener('DOMContentLoaded', init);

})();
