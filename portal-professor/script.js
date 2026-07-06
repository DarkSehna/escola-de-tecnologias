// ==========================================================================
// CONTROLADOR DO PORTAL DO PROFESSOR (TITANTECH)
// Escola de Tecnologias - Laboratório de Tecnologias
// ==========================================================================

const TEACHER_PINS = {
    GABRIEL: '2510',
    SANDRO: '9876'
};

document.addEventListener('DOMContentLoaded', () => {
    initAdminPortal();
});

function initAdminPortal() {
    const loginSection = document.getElementById('login-section');
    const adminSection = document.getElementById('admin-section');
    
    const inputPin = document.getElementById('teacher-pin');
    const btnSubmit = document.getElementById('btn-submit-pin');
    const loginError = document.getElementById('login-error-msg');
    
    const adminBadge = document.getElementById('admin-badge-name');
    const panelGabriel = document.getElementById('panel-gabriel');
    const panelSandro = document.getElementById('panel-sandro');
    const btnLogout = document.getElementById('btn-logout');

    // Escuta evento de clique no botão de entrar
    btnSubmit.addEventListener('click', handleLogin);
    inputPin.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    function handleLogin() {
        const pin = inputPin.value.trim();
        loginError.classList.add('hidden');

        if (pin === TEACHER_PINS.GABRIEL) {
            // Abre Gabriel (exibindo ambas as áreas)
            loginSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            adminBadge.textContent = "Área do Prof. Gabriel";
            adminBadge.className = "admin-badge badge-gabriel";
            panelGabriel.classList.remove('hidden');
            panelSandro.classList.remove('hidden');
            syncCheckboxes();
        } else if (pin === TEACHER_PINS.SANDRO) {
            // Abre Sandro (exibindo ambas as áreas)
            loginSection.classList.add('hidden');
            adminSection.classList.remove('hidden');
            adminBadge.textContent = "Área do Prof. Sandro";
            adminBadge.className = "admin-badge badge-sandro";
            panelGabriel.classList.remove('hidden');
            panelSandro.classList.remove('hidden');
            syncCheckboxes();
        } else {
            loginError.classList.remove('hidden');
            inputPin.value = '';
            inputPin.focus();
        }
    }

    // Botão de Logout
    btnLogout.addEventListener('click', () => {
        adminSection.classList.add('hidden');
        loginSection.classList.remove('hidden');
        inputPin.value = '';
        inputPin.focus();
    });

    // Configura os ouvintes de clique em cada checkbox (visibilidade)
    const checkboxes = document.querySelectorAll('[data-visibility-tool]');
    checkboxes.forEach(box => {
        box.addEventListener('change', (e) => {
            const toolId = e.target.getAttribute('data-visibility-tool');
            const isVisible = e.target.checked;
            saveToolVisibility(toolId, isVisible);
        });
    });
}

/**
 * Grava a visibilidade na localStorage para compartilhamento de origem
 */
function saveToolVisibility(toolId, isVisible) {
    let visibilityState = {};
    try {
        const saved = localStorage.getItem('titanTech_tool_visibility');
        if (saved) visibilityState = JSON.parse(saved);
    } catch (e) {}

    visibilityState[toolId] = isVisible;
    localStorage.setItem('titanTech_tool_visibility', JSON.stringify(visibilityState));
}

/**
 * Lê a localStorage e atualiza os checkboxes da tela administrativa
 */
function syncCheckboxes() {
    let visibilityState = {};
    try {
        const saved = localStorage.getItem('titanTech_tool_visibility');
        if (saved) visibilityState = JSON.parse(saved);
    } catch (e) {}

    const checkboxes = document.querySelectorAll('[data-visibility-tool]');
    checkboxes.forEach(box => {
        const toolId = box.getAttribute('data-visibility-tool');
        if (visibilityState[toolId] !== undefined) {
            box.checked = visibilityState[toolId];
        } else {
            box.checked = true; // Visível por padrão se não configurado
        }
    });
}
