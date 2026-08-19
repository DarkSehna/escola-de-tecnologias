// ==========================================================================
// GERENCIADOR GLOBAL DE TEMAS (DARK MODE / LIGHT MODE)
// Escola de Tecnologias - TitanTech
// ==========================================================================

(function () {
    const STORAGE_KEY = 'titanTech_theme';

    /**
     * Obter o tema salvo na localStorage ou padrão ('dark')
     */
    function getSavedTheme() {
        try {
            return localStorage.getItem(STORAGE_KEY) || 'dark';
        } catch (e) {
            return 'dark';
        }
    }

    /**
     * Injeta os estilos CSS universais do botão de alternância de tema
     */
    function injectThemeButtonStyles() {
        if (document.getElementById('titan-theme-toggle-styles')) return;
        const style = document.createElement('style');
        style.id = 'titan-theme-toggle-styles';
        style.textContent = `
            .theme-toggle-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 0.5rem !important;
                padding: 0.45rem 0.95rem !important;
                border-radius: 12px !important;
                font-size: 0.85rem !important;
                font-weight: 700 !important;
                cursor: pointer !important;
                background: rgba(255, 255, 255, 0.08) !important;
                border: 1.5px solid rgba(255, 255, 255, 0.18) !important;
                color: #ffffff !important;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important;
                user-select: none !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                font-family: 'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                line-height: 1.2 !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important;
                text-decoration: none !important;
                height: auto !important;
                outline: none !important;
            }
            .theme-toggle-btn:hover {
                transform: translateY(-2px) !important;
                background: rgba(255, 255, 255, 0.18) !important;
                border-color: #06b6d4 !important;
                box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3) !important;
                color: #ffffff !important;
            }
            .theme-toggle-btn:active {
                transform: translateY(0) scale(0.97) !important;
            }
            [data-theme="light"] .theme-toggle-btn {
                background: #ffffff !important;
                border: 1.5px solid #cbd5e1 !important;
                color: #0f172a !important;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08) !important;
            }
            [data-theme="light"] .theme-toggle-btn:hover {
                background: #f1f5f9 !important;
                border-color: #3b82f6 !important;
                color: #1e40af !important;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
            }

            /* Garantia Universal de Legibilidade para Dropdowns de Seleção */
            select option, .cyber-select option {
                background-color: #0d111c !important;
                color: #f8fafc !important;
            }
            [data-theme="light"] select option,
            [data-theme="light"] .cyber-select option {
                background-color: #ffffff !important;
                color: #0f172a !important;
            }
        `;
        document.head.appendChild(style);
    }
    injectThemeButtonStyles();

    /**
     * Aplica o atributo data-theme ao html e ao body
     * @param {string} theme - 'dark' ou 'light'
     */
    function applyTheme(theme) {
        const validTheme = theme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', validTheme);
        document.body.setAttribute('data-theme', validTheme);
        updateToggleButtonsUI(validTheme);
    }

    /**
     * Atualiza o texto e ícone dos botões de alternância de tema
     * @param {string} theme - 'dark' ou 'light'
     */
    function updateToggleButtonsUI(theme) {
        const btns = document.querySelectorAll('.theme-toggle-btn');
        btns.forEach(btn => {
            if (theme === 'light') {
                btn.innerHTML = '☀️ <span class="theme-btn-text">Modo Claro</span>';
                btn.title = 'Alternar para Modo Escuro';
                btn.classList.add('is-light');
                btn.setAttribute('aria-label', 'Alternar para Modo Escuro');
            } else {
                btn.innerHTML = '🌙 <span class="theme-btn-text">Modo Escuro</span>';
                btn.title = 'Alternar para Modo Claro';
                btn.classList.remove('is-light');
                btn.setAttribute('aria-label', 'Alternar para Modo Claro');
            }
        });
    }

    /**
     * Alterna o tema entre 'dark' e 'light' e dispara evento
     */
    window.toggleTitanTheme = function () {
        const currentTheme = getSavedTheme();
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        try {
            localStorage.setItem(STORAGE_KEY, newTheme);
        } catch (e) {
            console.warn('Não foi possível salvar a preferência de tema no localStorage', e);
        }
        applyTheme(newTheme);

        // Notifica componentes e simuladores (ex: redesenhar canvas se necessário)
        window.dispatchEvent(new CustomEvent('titanThemeChanged', { detail: { theme: newTheme } }));
    };

    // Aplicação síncrona imediata para evitar piscar de tela (FOUC)
    const initialTheme = getSavedTheme();
    document.documentElement.setAttribute('data-theme', initialTheme);

    // Quando o DOM estiver carregado
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme(getSavedTheme());

        // Delegação de evento de clique global para botões .theme-toggle-btn
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.theme-toggle-btn');
            if (btn) {
                e.preventDefault();
                window.toggleTitanTheme();
            }
        });
    });

    // Escuta mudanças de tema vindas de outras abas abertas simultaneamente
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            applyTheme(e.value || 'dark');
        }
    });
})();
