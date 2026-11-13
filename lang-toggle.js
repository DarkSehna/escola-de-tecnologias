// ==========================================================================
// GERENCIADOR GLOBAL DE IDIOMAS (i18n: PT-BR / EN)
// Escola de Tecnologias - TitanTech
// ==========================================================================

(function () {
    const STORAGE_KEY = 'titanTech_lang';

    // Dicionário bilíngue abrangente para o Portal Inicial e Ferramentas
    const DICTIONARY = {
        pt: {
            // Topbar & Controles
            "lang_name": "PT",
            "lang_btn_aria": "Alternar para Inglês",
            "lang_btn_title": "Mudar idioma para English",
            "theme_dark": "Modo Escuro",
            "theme_light": "Modo Claro",

            // Tela 1: Seleção de Trilha
            "brand_title": "Laboratório de",
            "sub_brand_title": "Tecnologias",
            "select_subtitle": "Selecione sua Trilha de Aprendizado para acessar os simuladores",

            "track_design_title": "Game Lab: Design",
            "track_design_desc": "GDD, Level Design, Pixel Art, matrizes binárias, tilesets e avaliação UX dos seus jogos digitais.",
            "btn_enter_track": "Entrar na Trilha",

            "track_prog_title": "Game Lab: Programação",
            "track_prog_desc": "Lógica de estados (FSM), simulações de física 2D e apoio inteligente para Construct 3 e GameMaker.",

            "track_robot_title": "Robótica",
            "track_robot_desc": "Cinemática de motores, Lei de Ohm com Kit Arduino, lógica binária e comunicação serial física.",

            "track_train_title": "Treinamento Robótica",
            "track_train_desc": "Prepare-se para a OBR e FLL com placar oficial, simulador PID e telemetria multimodal por vídeo.",
            "btn_go_training": "Ir para o Treinamento",

            // Dashboard: Cabeçalho & Trilhas
            "btn_back_to_select": "Voltar ao Início",
            "badge_all_tracks": "Todas as Trilhas",
            "badge_design": "Game Lab: Design",
            "badge_prog": "Game Lab: Programação",
            "badge_robot": "Robótica",
            "badge_train": "Treinamento Robótica",

            // Filtros de Abas
            "tab_all": "Todas",
            "tab_design": "Game Lab: Design",
            "tab_prog": "Game Lab: Programação",
            "tab_robot": "Robótica",
            "tab_train": "Treinamento",

            // Badges de Dispositivo
            "badge_mobile": "📱 Celular & PC",
            "badge_mobile_title": "Compatível e otimizado para celular e computador",
            "badge_desktop": "🖥️ Computador",
            "badge_desktop_title": "Desenvolvido para uso no computador com teclado e mouse",

            // Modal de Proteção Mobile
            "device_modal_title": "Ferramenta projetada para Computador 🖥️",
            "device_modal_desc": "Esta atividade foi desenvolvida para uso com mouse e teclado nos computadores do laboratório. No celular, alguns controles podem ficar apertados.",
            "btn_modal_stay": "Voltar ao Portal",
            "btn_modal_proceed": "Abrir Mesmo Assim ↗️",

            // Rodapé
            "footer_mentors": "Mentores: Prof. Sandro & Prof. Gabriel",
            "footer_copyright": "© 2026 Escola de Tecnologias.",
            "footer_prof_panel": "Painel do Professor",

            // Cards de Ferramentas - Ações Gerais
            "action_open_generator": "Abrir Gerador",
            "action_create_map": "Criar Mapa",
            "action_create_timeline": "Criar Timeline",
            "action_mount_tileset": "Montar Tileset",
            "action_open_lab": "Abrir Laboratório",
            "action_evaluate_game": "Avaliar Jogo",
            "action_enter_lab": "Entrar no Lab",
            "action_start_sim": "Iniciar Simulador",
            "action_open_assistant": "Abrir Assistente",
            "action_open_circuit": "Simular Circuito",
            "action_hacker_mode": "Hacker Mode",
            "action_start_scoreboard": "Iniciar Placar",
            "action_open_board": "Abrir Prancheta",
            "action_analyze_lap": "Analisar Volta",
            "action_open_studio": "Abrir Estúdio",
            "action_balance_stats": "Balancear Jogo",
            "status_in_maintenance": "🔒 Em Manutenção",

            // Cards de Ferramentas - Detalhes
            "card_gdd_tag": "Design • Documentação",
            "card_gdd_title": "Gerador de GDD",
            "card_gdd_desc": "Crie e organize de forma estruturada o Game Design Document do seu jogo. Exporte em JSON ou Markdown localmente.",

            "card_mapas_tag": "Design • Level Design",
            "card_mapas_title": "Gerador de Mapas 2D",
            "card_mapas_desc": "Desenhe níveis de jogos de plataforma em grid interativo. Configure o tamanho e exporte em PNG para o seu GDD ou salve o projeto em JSON.",

            "card_timelines_tag": "Design • Progressão",
            "card_timelines_title": "Criador de Timelines",
            "card_timelines_desc": "Planeje a progressão de fases do seu jogo 2D com termômetro inteligente de escopo. Copie o mapa formatado diretamente para o GDD.",

            "card_tilesets_tag": "Design • Spritesheet",
            "card_tilesets_title": "Montador de Tilesets",
            "card_tilesets_desc": "Junte blocos soltos (.PNG) em uma folha de spritesheet alinhada em grade (16x16, 32x32, 64x64). Remova fundos brancos e exporte para Construct 3 e GameMaker.",

            "card_pixelart_tag": "Design • Pixel Art & Binário",
            "card_pixelart_title": "Imagens Binárias & Matriz",
            "card_pixelart_desc": "Descubra como zeros e uns formam desenhos e cores (1-Bit e 2-Bits), decodifique enigmas e exporte sprites nítidos para o Piskel.",

            "card_feedback_tag": "Design • Avaliação / UX",
            "card_feedback_title": "Feedback de Jogos",
            "card_feedback_desc": "Envie avaliações rápidas e anônimas sobre os jogos de seus colegas ou acompanhe estatísticas consolidadas live.",

            "card_prompts_tag": "Design • IA & ComfyUI",
            "card_prompts_title": "Estúdio de Prompts & ComfyUI ✨",
            "card_prompts_desc": "Monte prompts visuais em português com tradução automática para SDXL, trava SFW e launcher do ComfyUI local.",

            "card_status_tag": "Programação • Balanceamento",
            "card_status_title": "Tabelas de Status & Balanceamento ⚖️",
            "card_status_desc": "Planeje atributos numéricos, simule tempo de combate (TTK), curvas de nível e exporte código pronto em camelCase para Construct 3 e GameMaker.",

            "card_fisica_tag": "Programação • Canvas 2D",
            "card_fisica_title": "Lab de Física 2D",
            "card_fisica_desc": "Simulador interativo de física em tempo real rodando em 60 FPS no Canvas. Ajuste gravidade, colisão e forças físicas.",

            "card_fsm_tag": "Programação • Algoritmos",
            "card_fsm_title": "Simulador FSM",
            "card_fsm_desc": "Crie editores de Máquina de Estados Finitos com nós arrastáveis e veja a transição de estados de forma dinâmica no navegador.",

            "card_ia_games_tag": "✨ IA Ativa (Game Design, GameMaker & Construct)",
            "card_ia_games_title": "Assistente IA - Games ✨",
            "card_ia_games_desc": "Cocrie ideias no Gerador de GDD, avalie projetos (Metacritic) e tire dúvidas de GameMaker e Construct 3 com a IA.",

            "card_giro_tag": "Cinemática",
            "card_giro_title": "Giro de Robô 2D",
            "card_giro_desc": "Estude a cinemática diferencial de robôs com rodas. Simule odometria visual, raio de giro e trajetórias no plano 2D.",

            "card_ohm_tag": "Eletrônica • Kit Arduino",
            "card_ohm_title": "Lei de Ohm",
            "card_ohm_desc": "Visualize e interaja com Tensão, Corrente e Resistência usando peças reais do Kit Arduino em circuitos série e paralelo.",

            "card_lockpicking_tag": "Serial / Hardware",
            "card_lockpicking_title": "Hacker Lockpicking",
            "card_lockpicking_desc": "Jogo cyber-lockpick. Conecte seu hardware Arduino via Web Serial API no navegador ou treine no Simulador Integrado.",

            "card_ia_robot_tag": "🔒 Em Manutenção",
            "card_ia_robot_title": "Assistente IA - Robótica ✨",
            "card_ia_robot_desc": "Tire dúvidas e receba orientação para projetos de Lego, Arduino e Robótica Educacional (Em atualização de agentes).",

            "card_obr_tag": "Competição",
            "card_obr_title": "OBR Placar Treino",
            "card_obr_desc": "Cronômetro e pontuador de treinos oficiais para a Olimpíada Brasileira de Robótica (OBR). Com degradação automática por tentativa.",

            "card_seguidor_tag": "PID & Mecânica",
            "card_seguidor_title": "Seguidor de Linha (PID)",
            "card_seguidor_desc": "Simulador 2D em tempo real para o Torneio de Robótica. Calibre Kp, Ki, Kd, braço de sensor (5-25cm), engrenagens e tempo de volta.",

            "card_fll_tag": "Estratégia",
            "card_fll_title": "Prancheta de Táticas FLL",
            "card_fll_desc": "Carregue a imagem da pista da temporada, planeje rotas e marque o posicionamento de sensores e notas. Exporte em alta definição.",

            "card_telemetria_tag": "🎥 IA Multimodal",
            "card_telemetria_title": "Telemetria & Coaching",
            "card_telemetria_desc": "Diagnóstico automático de voltas do robô por vídeo. Detecte oscilações, perda de fita e receba recomendações diretas de ajuste de Kp, Kd e velocidade.",

            "card_ia_train_tag": "🔒 Em Manutenção",
            "card_ia_train_title": "Assistente IA - Treinamento ✨",
            "card_ia_train_desc": "Suporte inteligente para Python, Montagem de robôs e estratégias competitivas da OBR (Em atualização de agentes)."
        },
        en: {
            // Topbar & Controls
            "lang_name": "EN",
            "lang_btn_aria": "Switch to Portuguese",
            "lang_btn_title": "Mudar idioma para Português",
            "theme_dark": "Dark Mode",
            "theme_light": "Light Mode",

            // Screen 1: Track Selection
            "brand_title": "Technology",
            "sub_brand_title": "Laboratory",
            "select_subtitle": "Select your Learning Track to access the interactive simulators",

            "track_design_title": "Game Lab: Design",
            "track_design_desc": "GDD, Level Design, Pixel Art, binary matrices, tilesets and UX playtesting for your digital games.",
            "btn_enter_track": "Enter Track",

            "track_prog_title": "Game Lab: Programming",
            "track_prog_desc": "Finite State Machines (FSM), 2D physics simulations and smart AI support for Construct 3 and GameMaker.",

            "track_robot_title": "Robotics",
            "track_robot_desc": "Motor kinematics, Ohm's Law with Arduino Kit, binary logic and physical Web Serial communication.",

            "track_train_title": "Robotics Training",
            "track_train_desc": "Train for OBR and FLL competitions with official scoring, PID simulator and multimodal video telemetry.",
            "btn_go_training": "Go to Training",

            // Dashboard: Header & Tracks
            "btn_back_to_select": "Back to Home",
            "badge_all_tracks": "All Tracks",
            "badge_design": "Game Lab: Design",
            "badge_prog": "Game Lab: Programming",
            "badge_robot": "Robotics",
            "badge_train": "Robotics Training",

            // Filter Tabs
            "tab_all": "All",
            "tab_design": "Game Lab: Design",
            "tab_prog": "Game Lab: Programming",
            "tab_robot": "Robotics",
            "tab_train": "Training",

            // Device Badges
            "badge_mobile": "📱 Mobile & PC",
            "badge_mobile_title": "Optimized and fully compatible with mobile and desktop",
            "badge_desktop": "🖥️ Desktop Only",
            "badge_desktop_title": "Designed for computer use with mouse and keyboard",

            // Mobile Protection Modal
            "device_modal_title": "Tool designed for Desktop 🖥️",
            "device_modal_desc": "This activity was built for use with mouse and keyboard on lab computers. On mobile phones, some controls may feel tight.",
            "btn_modal_stay": "Back to Portal",
            "btn_modal_proceed": "Open Anyway ↗️",

            // Footer
            "footer_mentors": "Mentors: Prof. Sandro & Prof. Gabriel",
            "footer_copyright": "© 2026 Escola de Tecnologias.",
            "footer_prof_panel": "Teacher Portal",

            // Tool Cards - General Actions
            "action_open_generator": "Open Generator",
            "action_create_map": "Create Map",
            "action_create_timeline": "Create Timeline",
            "action_mount_tileset": "Build Tileset",
            "action_open_lab": "Open Lab",
            "action_evaluate_game": "Review Game",
            "action_enter_lab": "Enter Lab",
            "action_start_sim": "Start Simulator",
            "action_open_assistant": "Open Assistant",
            "action_open_circuit": "Simulate Circuit",
            "action_hacker_mode": "Hacker Mode",
            "action_start_scoreboard": "Start Scoreboard",
            "action_open_board": "Open Board",
            "action_analyze_lap": "Analyze Lap",
            "action_open_studio": "Open Studio",
            "action_balance_stats": "Balance Stats",
            "status_in_maintenance": "🔒 Under Maintenance",

            // Tool Cards - Details
            "card_gdd_tag": "Design • Documentation",
            "card_gdd_title": "GDD Generator",
            "card_gdd_desc": "Structure and organize your Game Design Document. Export locally to JSON or clean formatted Markdown.",

            "card_mapas_tag": "Design • Level Design",
            "card_mapas_title": "2D Map Generator",
            "card_mapas_desc": "Design platformer game stages on an interactive grid. Configure canvas sizes, export to PNG or save project JSON.",

            "card_timelines_tag": "Design • Progression",
            "card_timelines_title": "Timeline Creator",
            "card_timelines_desc": "Plan 2D game stage progression with smart scope estimation. Copy formatted level charts directly into your GDD.",

            "card_tilesets_tag": "Design • Spritesheet",
            "card_tilesets_title": "Tileset Packer",
            "card_tilesets_desc": "Pack loose PNG tiles into a neat grid spritesheet (16x16, 32x32, 64x64). Remove white backgrounds and export to Construct 3 & GameMaker.",

            "card_pixelart_tag": "Design • Pixel Art & Binary",
            "card_pixelart_title": "Binary Images & Matrix",
            "card_pixelart_desc": "Discover how 0s and 1s create art and colors (1-Bit & 2-Bits), decode binary puzzles and export crisp sprites to Piskel.",

            "card_feedback_tag": "Design • Playtesting / UX",
            "card_feedback_title": "Game Playtest Feedback",
            "card_feedback_desc": "Submit quick anonymous reviews for your classmates' games or follow live consolidated feedback dashboards.",

            "card_prompts_tag": "Design • AI & ComfyUI",
            "card_prompts_title": "Prompt Studio & ComfyUI ✨",
            "card_prompts_desc": "Build visual prompts in Portuguese with automatic SDXL translation, SFW shield and local ComfyUI launcher.",

            "card_status_tag": "Programming • Balancing",
            "card_status_title": "Stat Tables & Game Balancing ⚖️",
            "card_status_desc": "Design numeric entity stats, simulate combat TTK, level curves, and export clean camelCase snippets for Construct 3 and GameMaker.",

            "card_fisica_tag": "Programming • 2D Canvas",
            "card_fisica_title": "2D Physics Lab",
            "card_fisica_desc": "Real-time interactive physics simulator running at 60 FPS in Canvas. Fine-tune gravity, restitution, friction and force vectors.",

            "card_fsm_tag": "Programming • Algorithms",
            "card_fsm_title": "FSM Simulator",
            "card_fsm_desc": "Build Finite State Machine diagrams with draggable nodes and watch state transitions animate in real time.",

            "card_ia_games_tag": "✨ Active AI (Game Design, GameMaker & Construct)",
            "card_ia_games_title": "AI Assistant - Games ✨",
            "card_ia_games_desc": "Brainstorm ideas in GDD Generator, get Metacritic-style critique and troubleshoot GameMaker and Construct 3 code with AI.",

            "card_giro_tag": "Kinematics",
            "card_giro_title": "2D Robot Kinematics",
            "card_giro_desc": "Study differential wheel robot kinematics. Simulate visual odometry, turning radii and 2D planar trajectories.",

            "card_ohm_tag": "Electronics • Arduino Kit",
            "card_ohm_title": "Ohm's Law Simulator",
            "card_ohm_desc": "Interact with Voltage, Current and Resistance using real Arduino kit components across series and parallel circuits.",

            "card_lockpicking_tag": "Serial / Hardware",
            "card_lockpicking_title": "Hacker Lockpicking",
            "card_lockpicking_desc": "Cyber-lockpick minigame. Connect your physical Arduino board via Web Serial API or practice on the built-in simulator.",

            "card_ia_robot_tag": "🔒 Under Maintenance",
            "card_ia_robot_title": "AI Assistant - Robotics ✨",
            "card_ia_robot_desc": "Ask questions and get guided mentorship for Lego, Arduino and Educational Robotics projects (Agents updating).",

            "card_obr_tag": "Competition",
            "card_obr_title": "OBR Training Scoreboard",
            "card_obr_desc": "Official timer and scoresheet for the Brazilian Robotics Olympiad (OBR). Features automatic retry point deductions.",

            "card_seguidor_tag": "PID & Mechanics",
            "card_seguidor_title": "Line Follower (PID)",
            "card_seguidor_desc": "Real-time 2D line following simulator for robotics tourneys. Calibrate Kp, Ki, Kd, sensor arm (5-25cm), gear ratios and lap times.",

            "card_fll_tag": "Strategy",
            "card_fll_title": "FLL Strategy Tactical Board",
            "card_fll_desc": "Load seasonal challenge mat maps, plot autonomous routes, place sensors, attachments and strategy pins. Export in high-res.",

            "card_telemetria_tag": "🎥 Multimodal AI",
            "card_telemetria_title": "Telemetry & AI Coaching",
            "card_telemetria_desc": "Automated lap video diagnostic. Detect oscillations, line departures and receive instant calibration advice for Kp, Kd and speed.",

            "card_ia_train_tag": "🔒 Under Maintenance",
            "card_ia_train_title": "AI Assistant - Training ✨",
            "card_ia_train_desc": "Smart coaching for Python algorithms, robot mechanics and competitive OBR strategies (Agents updating)."
        }
    };

    /**
     * Obtém o idioma salvo na localStorage ou 'pt' por padrão
     */
    function getSavedLanguage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved === 'en' ? 'en' : 'pt';
        } catch (e) {
            return 'pt';
        }
    }

    /**
     * Injeta estilos do botão de alternância de idioma (idêntico ao padrão de tema)
     */
    function injectLangButtonStyles() {
        if (document.getElementById('titan-lang-toggle-styles')) return;
        const style = document.createElement('style');
        style.id = 'titan-lang-toggle-styles';
        style.textContent = `
            .lang-toggle-btn {
                display: inline-flex !important;
                align-items: center !important;
                justify-content: center !important;
                gap: 0.45rem !important;
                padding: 0.45rem 0.85rem !important;
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
            .lang-toggle-btn:hover {
                transform: translateY(-2px) !important;
                background: rgba(255, 255, 255, 0.18) !important;
                border-color: #06b6d4 !important;
                box-shadow: 0 4px 14px rgba(6, 182, 212, 0.3) !important;
                color: #ffffff !important;
            }
            .lang-toggle-btn:active {
                transform: translateY(0) scale(0.97) !important;
            }
            [data-theme="light"] .lang-toggle-btn {
                background: #ffffff !important;
                border: 1.5px solid #cbd5e1 !important;
                color: #0f172a !important;
                box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08) !important;
            }
            [data-theme="light"] .lang-toggle-btn:hover {
                background: #f1f5f9 !important;
                border-color: #3b82f6 !important;
                color: #1e40af !important;
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Traduz uma chave no idioma especificado
     */
    function t(key, lang = null) {
        const activeLang = lang || getSavedLanguage();
        const dict = DICTIONARY[activeLang] || DICTIONARY.pt;
        return dict[key] !== undefined ? dict[key] : (DICTIONARY.pt[key] || key);
    }

    /**
     * Aplica o idioma ativo em todos os elementos com data-i18n
     */
    function applyLanguage(lang) {
        const validLang = lang === 'en' ? 'en' : 'pt';
        document.documentElement.setAttribute('lang', validLang === 'en' ? 'en' : 'pt-BR');

        // Atualiza textos nos elementos marcados
        const elements = document.querySelectorAll('[data-i18n]');
        elements.forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = t(key, validLang);
            if (translation) {
                el.textContent = translation;
            }
        });

        // Atualiza titles/tooltips
        const titledEls = document.querySelectorAll('[data-i18n-title]');
        titledEls.forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            const translation = t(key, validLang);
            if (translation) el.setAttribute('title', translation);
        });

        // Atualiza aria-labels
        const ariaEls = document.querySelectorAll('[data-i18n-aria]');
        ariaEls.forEach(el => {
            const key = el.getAttribute('data-i18n-aria');
            const translation = t(key, validLang);
            if (translation) el.setAttribute('aria-label', translation);
        });

        updateToggleButtonsUI(validLang);
    }

    /**
     * Atualiza a UI dos botões de alternância de idioma
     */
    function updateToggleButtonsUI(lang) {
        const btns = document.querySelectorAll('.lang-toggle-btn');
        btns.forEach(btn => {
            if (lang === 'en') {
                btn.innerHTML = '🇺🇸 <span class="lang-btn-text">EN</span>';
                btn.title = t('lang_btn_title', 'en');
                btn.setAttribute('aria-label', t('lang_btn_aria', 'en'));
            } else {
                btn.innerHTML = '🇧🇷 <span class="lang-btn-text">PT</span>';
                btn.title = t('lang_btn_title', 'pt');
                btn.setAttribute('aria-label', t('lang_btn_aria', 'pt'));
            }
        });
    }

    /**
     * Alterna o idioma entre 'pt' e 'en'
     */
    window.toggleTitanLanguage = function () {
        const currentLang = getSavedLanguage();
        const newLang = currentLang === 'en' ? 'pt' : 'en';
        try {
            localStorage.setItem(STORAGE_KEY, newLang);
        } catch (e) {
            console.warn('Não foi possível salvar o idioma no localStorage', e);
        }
        applyLanguage(newLang);

        // Notifica outros scripts (ex: script.js para atualizar track badges)
        window.dispatchEvent(new CustomEvent('titanLanguageChanged', { detail: { lang: newLang } }));
    };

    /**
     * Define um idioma específico programaticamente
     */
    window.setTitanLanguage = function (newLang) {
        const valid = newLang === 'en' ? 'en' : 'pt';
        try {
            localStorage.setItem(STORAGE_KEY, valid);
        } catch (e) {}
        applyLanguage(valid);
        window.dispatchEvent(new CustomEvent('titanLanguageChanged', { detail: { lang: valid } }));
    };

    // Exporta helper t(key) para escopo global
    window.titanT = t;
    window.getTitanLanguage = getSavedLanguage;

    // Inicialização
    injectLangButtonStyles();

    document.addEventListener('DOMContentLoaded', () => {
        applyLanguage(getSavedLanguage());

        // Delegação de clique global para botões .lang-toggle-btn
        document.body.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-toggle-btn');
            if (btn) {
                e.preventDefault();
                window.toggleTitanLanguage();
            }
        });
    });

    // Sincroniza com outras abas abertas simultaneamente
    window.addEventListener('storage', (e) => {
        if (e.key === STORAGE_KEY) {
            applyLanguage(e.value === 'en' ? 'en' : 'pt');
        }
    });
})();
