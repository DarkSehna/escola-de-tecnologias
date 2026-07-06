// ==========================================================================
// LOGICA DE INTERAÇÃO DO PORTAL (DASHBOARD)
// Escola de Tecnologias - TitanTech
// ==========================================================================

// Estado do Portal
const state = {
    selectedTrack: null,
    activeTab: 'games'
};

// Ao carregar o documento
document.addEventListener('DOMContentLoaded', () => {
    // 1. Restaura o estado da sessão se a trilha estiver salva na sessionStorage
    const savedTrack = sessionStorage.getItem('titanTech_selectedTrack');
    const savedTab = sessionStorage.getItem('titanTech_activeTab');
    
    // 2. Aplica a visibilidade das ferramentas salva pelos professores
    applySavedToolVisibility();

    if (savedTrack) {
        if (savedTab) {
            state.activeTab = savedTab;
        }
        selectTrack(savedTrack, false); // Seleciona trilha sem animação suave
    }
});

/**
 * Seleciona a trilha ativa e abre o dashboard correspondente
 * @param {string} trackName - 'games', 'robotica' ou 'treinamento'
 * @param {boolean} smooth - se deve rolar a transição de forma animada
 */
function selectTrack(trackName, smooth = true) {
    state.selectedTrack = trackName;
    sessionStorage.setItem('titanTech_selectedTrack', trackName);

    const screenSelect = document.getElementById('screen-select-teacher');
    const screenDashboard = document.getElementById('screen-dashboard');
    const badgeName = document.getElementById('active-track-name');
    const badge = document.getElementById('active-track-badge');

    // Mapeamento de nomes de trilhas
    let formattedName = 'Trilha Games';
    if (trackName === 'robotica') {
        formattedName = 'Trilha Robótica';
    } else if (trackName === 'treinamento') {
        formattedName = 'Treinamento Robótica';
    }
    badgeName.textContent = formattedName;

    // Ajusta a cor e o estilo do badge conforme a trilha selecionada
    if (trackName === 'games') {
        badge.className = 'teacher-badge color-gabriel';
    } else if (trackName === 'robotica') {
        badge.className = 'teacher-badge color-sandro';
    } else {
        badge.className = 'teacher-badge color-yellow';
    }

    // Transição de telas
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

    // Seleciona a aba correspondente à trilha
    switchTab(trackName);
}

/**
 * Retorna para a tela de seleção de trilha
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
 * Alterna entre as abas do dashboard
 * @param {string} tabName - 'games', 'robotica' ou 'treinamento'
 */
function switchTab(tabName) {
    state.activeTab = tabName;
    sessionStorage.setItem('titanTech_activeTab', tabName);

    // 1. Remove classe ativa de todos os botões e painéis
    const tabTriggers = document.querySelectorAll('.tab-trigger');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabTriggers.forEach(btn => btn.classList.remove('active'));
    tabPanels.forEach(panel => panel.classList.remove('active'));

    // 2. Adiciona classe ativa no botão e painel selecionado
    const selectedBtn = document.getElementById(`tab-btn-${tabName}`);
    const selectedPanel = document.getElementById(`panel-${tabName}`);

    if (selectedBtn) selectedBtn.classList.add('active');
    if (selectedPanel) selectedPanel.classList.add('active');
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

// Escuta mudanças de visibilidade em tempo real vindas do Portal do Professor em outra aba
window.addEventListener('storage', (e) => {
    if (e.key === 'titanTech_tool_visibility') {
        applySavedToolVisibility();
    }
});
