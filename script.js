// ==========================================================================
// LOGICA DE INTERAÇÃO DO PORTAL (DASHBOARD)
// Escola de Tecnologias - TitanTech
// ==========================================================================

// Estado do Portal
const state = {
    selectedTeacher: null,
    activeTab: 'games'
};

// Ao carregar o documento
document.addEventListener('DOMContentLoaded', () => {
    // Restaura o estado da sessão se o professor estiver salvo na sessionStorage
    const savedTeacher = sessionStorage.getItem('titanTech_selectedTeacher');
    const savedTab = sessionStorage.getItem('titanTech_activeTab');
    if (savedTeacher) {
        if (savedTab) {
            state.activeTab = savedTab;
        }
        selectTeacher(savedTeacher, false); // Seleciona professor sem animação suave
    }
});

/**
 * Seleciona o professor ativo e abre o dashboard correspondente
 * @param {string} teacherName - 'sandro' ou 'gabriel'
 * @param {boolean} smooth - se deve rolar a transição de forma animada
 */
function selectTeacher(teacherName, smooth = true) {
    state.selectedTeacher = teacherName;
    sessionStorage.setItem('titanTech_selectedTeacher', teacherName);

    const screenSelect = document.getElementById('screen-select-teacher');
    const screenDashboard = document.getElementById('screen-dashboard');
    const badgeName = document.getElementById('active-teacher-name');
    const badge = document.getElementById('active-teacher-badge');

    // Atualiza o nome do professor no cabeçalho
    const formattedName = teacherName === 'sandro' ? 'Prof. Sandro' : 'Prof. Gabriel';
    badgeName.textContent = formattedName;

    // Ajusta a cor e o estilo do badge conforme o professor
    if (teacherName === 'sandro') {
        badge.className = 'teacher-badge color-sandro';
    } else {
        badge.className = 'teacher-badge color-gabriel';
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

    // Seleciona a aba ativa correspondente
    switchTab(state.activeTab);
}

/**
 * Retorna para a tela de seleção de professor
 */
function backToTeacherSelect() {
    state.selectedTeacher = null;
    sessionStorage.removeItem('titanTech_selectedTeacher');

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
