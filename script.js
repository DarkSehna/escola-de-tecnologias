// ==========================================================================
// LÓGICA DE INTERAÇÃO DO PORTAL (HUB UNIFICADO POR TRILHAS & FILTROS)
// Escola de Tecnologias - TitanTech
// ==========================================================================

const state = {
    selectedTrack: null,
    activeTab: 'todas'
};

const VALID_TABS = new Set(['todas', 'design', 'programacao', 'robotica', 'treinamento']);

function normalizeTrackName(trackName) {
    if (trackName === 'games') return 'design';
    return VALID_TABS.has(trackName) ? trackName : 'todas';
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTrack = sessionStorage.getItem('titanTech_selectedTrack');
    const savedTab = sessionStorage.getItem('titanTech_activeTab');

    // Aplica a visibilidade das ferramentas salva pelos professores
    applySavedToolVisibility();

    // Inicializa a proteção de dispositivos para cards de desktop
    initDeviceProtection();

    if (savedTrack) {
        const normalizedTrack = normalizeTrackName(savedTrack);
        const normalizedTab = savedTab ? normalizeTrackName(savedTab) : normalizedTrack;
        state.activeTab = normalizedTab;
        selectTrack(normalizedTrack, false);
        if (normalizedTab !== normalizedTrack) {
            switchTab(normalizedTab);
        }
    }
});

/**
 * Seleciona a trilha ativa e abre o dashboard correspondente
 * @param {string} trackName - 'todas', 'design', 'programacao', 'robotica' ou 'treinamento'
 * @param {boolean} smooth - se deve animar a transição de telas
 */
function selectTrack(trackName, smooth = true) {
    const resolvedTrack = normalizeTrackName(trackName);
    state.selectedTrack = resolvedTrack;
    sessionStorage.setItem('titanTech_selectedTrack', resolvedTrack);

    const screenSelect = document.getElementById('screen-select-teacher');
    const screenDashboard = document.getElementById('screen-dashboard');
    const badgeName = document.getElementById('active-track-name');
    const badge = document.getElementById('active-track-badge');

    const trackMeta = {
        todas: { key: 'badge_all_tracks', defaultLabel: 'Todas as Trilhas', badgeClass: 'teacher-badge color-prog' },
        design: { key: 'badge_design', defaultLabel: 'Game Lab: Design', badgeClass: 'teacher-badge color-gabriel' },
        programacao: { key: 'badge_prog', defaultLabel: 'Game Lab: Programação', badgeClass: 'teacher-badge color-prog' },
        robotica: { key: 'badge_robot', defaultLabel: 'Robótica', badgeClass: 'teacher-badge color-sandro' },
        treinamento: { key: 'badge_train', defaultLabel: 'Treinamento Robótica', badgeClass: 'teacher-badge color-yellow' }
    };

    const meta = trackMeta[resolvedTrack] || trackMeta.todas;
    const label = window.titanT ? window.titanT(meta.key) : meta.defaultLabel;
    badgeName.textContent = label;
    badgeName.setAttribute('data-i18n', meta.key);
    badge.className = meta.badgeClass;

    if (smooth) {
        screenSelect.style.opacity = '0';
        screenSelect.style.transform = 'translateY(-20px)';

        setTimeout(() => {
            screenSelect.classList.remove('active');
            screenSelect.classList.add('hidden');

            screenDashboard.classList.remove('hidden');
            screenDashboard.classList.add('active');
            screenDashboard.style.opacity = '1';
            screenDashboard.style.transform = 'translateY(0)';
        }, 300);
    } else {
        screenSelect.classList.remove('active');
        screenSelect.classList.add('hidden');
        screenDashboard.classList.remove('hidden');
        screenDashboard.classList.add('active');
    }

    switchTab(resolvedTrack);
}

/**
 * Retorna para a tela inicial de seleção de trilha
 */
function backToTrackSelect() {
    state.selectedTrack = null;
    sessionStorage.removeItem('titanTech_selectedTrack');

    const screenSelect = document.getElementById('screen-select-teacher');
    const screenDashboard = document.getElementById('screen-dashboard');

    screenDashboard.style.opacity = '0';
    screenDashboard.style.transform = 'translateY(20px)';

    setTimeout(() => {
        screenDashboard.classList.remove('active');
        screenDashboard.classList.add('hidden');

        screenSelect.classList.remove('hidden');
        screenSelect.classList.add('active');
        screenSelect.style.opacity = '1';
        screenSelect.style.transform = 'translateY(0)';
    }, 300);
}

/**
 * Filtra os cards do HUB por categoria principal e secundária
 * @param {string} tabName - 'todas', 'design', 'programacao', 'robotica' ou 'treinamento'
 */
function switchTab(tabName) {
    const resolvedTab = normalizeTrackName(tabName);
    state.activeTab = resolvedTab;
    sessionStorage.setItem('titanTech_activeTab', resolvedTab);

    const tabTriggers = document.querySelectorAll('.tab-trigger');
    tabTriggers.forEach(btn => btn.classList.remove('active'));

    const selectedBtn = document.getElementById(`tab-btn-${resolvedTab}`);
    if (selectedBtn) selectedBtn.classList.add('active');

    const cards = document.querySelectorAll('#unified-cards-grid .tool-card');
    cards.forEach(card => {
        if (resolvedTab === 'todas') {
            card.classList.remove('hidden-by-filter');
            return;
        }
        const primary = card.dataset.category || '';
        const secondaryList = (card.dataset.secondaryCategory || '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);

        const matches = primary === resolvedTab || secondaryList.includes(resolvedTab);
        card.classList.toggle('hidden-by-filter', !matches);
    });
}

// A visibilidade das ferramentas é controlada a partir do painel na pasta portal-professor/

/**
 * Lê a localStorage e oculta/mostra os cards dos simuladores
 */
function applySavedToolVisibility() {
    let visibilityState = {};
    try {
        const saved = localStorage.getItem('titanTech_tool_visibility');
        if (saved) visibilityState = JSON.parse(saved);
    } catch (e) {}

    const tools = document.querySelectorAll('[data-tool-id]');
    tools.forEach(card => {
        const toolId = card.getAttribute('data-tool-id');
        if (visibilityState[toolId] === false) {
            card.classList.add('hidden-by-teacher');
        } else {
            card.classList.remove('hidden-by-teacher');
        }
    });
}

window.addEventListener('storage', (e) => {
    if (e.key === 'titanTech_tool_visibility') {
        applySavedToolVisibility();
    }
});

/**
 * Detecta se o usuário está acessando em dispositivo móvel ou tela estreita
 */
function isMobileClient() {
    return window.innerWidth <= 768 || ('ontouchstart' in window && window.innerWidth <= 1024);
}

/**
 * Inicializa a interceptação de cliques em ferramentas desenhadas para Desktop
 */
function initDeviceProtection() {
    const modal = document.getElementById('deviceWarningModal');
    const btnStay = document.getElementById('btnDeviceModalStay');
    const btnProceed = document.getElementById('btnDeviceModalProceed');

    if (!modal) return;

    function closeModal() {
        modal.classList.remove('open');
        modal.style.display = 'none';
    }

    if (btnStay) {
        btnStay.addEventListener('click', closeModal);
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });

    // Intercepta o clique em cards exclusivos para Computador quando acessados pelo celular
    document.addEventListener('click', (e) => {
        const card = e.target.closest('a.tool-card');
        if (!card) return;

        // Se estiver oculto ou desativado pelo professor, não faz nada
        if (card.classList.contains('hidden-by-teacher') || card.classList.contains('hidden-by-filter')) return;

        // Se for card em manutenção, não abre o modal de aviso
        const footerText = card.querySelector('.action-label')?.textContent || '';
        if (footerText.includes('Em Manutenção')) return;

        const deviceReq = card.getAttribute('data-device');
        if (deviceReq === 'desktop' && isMobileClient()) {
            e.preventDefault();
            if (btnProceed) {
                btnProceed.href = card.href;
            }
            modal.style.display = 'flex';
            modal.classList.add('open');
        }
    });
}

// Atualiza elementos dependentes de estado ao alternar idioma
window.addEventListener('titanLanguageChanged', () => {
    if (state.selectedTrack) {
        selectTrack(state.selectedTrack, false);
    }
});
