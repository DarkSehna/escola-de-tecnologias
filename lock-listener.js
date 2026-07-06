(function() {
    // Pega o nome da pasta da ferramenta a partir do caminho do arquivo (ex: "gerador-gdd")
    const pathParts = window.location.pathname.split('/');
    // Filtragem para pegar o nome da pasta da ferramenta
    let toolId = '';
    for (let i = pathParts.length - 1; i >= 0; i--) {
        const part = pathParts[i];
        if (part && !part.endsWith('.html')) {
            toolId = part;
            break;
        }
    }

    if (!toolId) return;

    // Cria o overlay se não existir
    let lockOverlay = document.createElement('div');
    lockOverlay.id = 'teacher-lock-overlay';
    lockOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(7, 10, 19, 0.96);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        z-index: 999999;
        display: none;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ffffff;
        font-family: 'Outfit', sans-serif;
        text-align: center;
        padding: 2rem;
        transition: all 0.3s ease;
    `;

    lockOverlay.innerHTML = `
        <div style="background: rgba(17, 24, 39, 0.7); border: 1px solid rgba(234, 179, 8, 0.2); padding: 3.5rem 2.5rem; border-radius: 28px; max-width: 500px; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(234, 179, 8, 0.1); backdrop-filter: blur(20px);">
            <div style="font-size: 4.5rem; margin-bottom: 1.5rem; animation: lockPulse 2s infinite; display: inline-block;">🔒</div>
            <h2 style="font-size: 1.75rem; font-weight: 800; color: #eab308; margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.05em; font-family: 'Outfit', sans-serif;">Modo Explicação</h2>
            <p style="color: #9ca3af; font-size: 1rem; line-height: 1.6; margin-bottom: 2rem; font-family: 'Outfit', sans-serif;">
                O mentor pausou as atividades do laboratório neste momento. Preste atenção na explicação do professor na lousa!
            </p>
            <div style="display: inline-block; background: rgba(255, 255, 255, 0.05); padding: 0.5rem 1rem; border-radius: 8px; font-family: 'JetBrains Mono', monospace; font-size: 0.75rem; color: #6b7280; text-transform: uppercase; border: 1px solid rgba(255, 255, 255, 0.05);">
                Acesso Temporariamente Suspenso
            </div>
        </div>
        <style>
            @keyframes lockPulse {
                0% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(234,179,8,0.3)); }
                50% { transform: scale(1.1); filter: drop-shadow(0 0 15px rgba(234,179,8,0.7)); }
                100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(234,179,8,0.3)); }
            }
        </style>
    `;

    document.body.appendChild(lockOverlay);

    function checkVisibility() {
        try {
            const saved = localStorage.getItem('titanTech_tool_visibility');
            if (saved) {
                const visibilityState = JSON.parse(saved);
                if (visibilityState[toolId] === false) {
                    lockOverlay.style.display = 'flex';
                } else {
                    lockOverlay.style.display = 'none';
                }
            }
        } catch (e) {
            console.error("Erro ao verificar trava do professor:", e);
        }
    }

    // Verifica no carregamento inicial
    checkVisibility();

    // Escuta alterações de outras abas em tempo real
    window.addEventListener('storage', (e) => {
        if (e.key === 'titanTech_tool_visibility') {
            checkVisibility();
        }
    });
})();
