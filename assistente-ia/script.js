// ==========================================================================
// ARQUITETURA E LÓGICA DO ASSISTENTE DE IA (TITANTECH)
// Roteamento URL, Seletores Dinâmicos e Gerenciador de Memória JSON
// ==========================================================================

// 1. MAPEAMENTO PADRÃO DE MEMÓRIA (CONFIGURAÇÃO BASE DE FALLBACK)
const MEMORIA_MAP = {
    "games": {
        "scratch": "memoria/games/scratch/",
        "construct": "memoria/games/construct/",
        "gamemaker": "memoria/games/gamemaker/"
    },
    "robotica": {
        "lego": "memoria/robotica/lego/",
        "arduino": "memoria/robotica/arduino/"
    },
    "treinamento": {
        "python": "memoria/treinamento/python/",
        "montagem": "memoria/treinamento/montagem/",
        "obr": "memoria/treinamento/obr/"
    }
};

// CONFIGURAÇÕES DAS ÁREAS E SUB-SELETORES COM METADADOS
const AREAS_CONFIG = {
    "games": {
        title: "Games",
        icon: "🎮",
        seletores: [
            { id: "scratch", name: "Scratch", icon: "🧩", prompt: "Como usar blocos de transmissão e variáveis?" },
            { id: "construct", name: "Construct", icon: "🏗️", prompt: "Como configurar comportamentos de plataforma e física?" },
            { id: "gamemaker", name: "GameMaker", icon: "🎯", prompt: "Como estruturar uma Máquina de Estados (FSM) em GML?" }
        ]
    },
    "robotica": {
        title: "Robótica",
        icon: "🤖",
        seletores: [
            { id: "lego", name: "Lego", icon: "🧱", prompt: "Como calibrar os sensores de cor e ultrassônico no SPIKE/EV3?" },
            { id: "arduino", name: "Arduino", icon: "⚡", prompt: "Como controlar a velocidade de motores usando ponte H L298N?" }
        ]
    },
    "treinamento": {
        title: "Treinamento",
        icon: "🏆",
        seletores: [
            { id: "python", name: "Python", icon: "🐍", prompt: "Como ler entradas de dados e implementar laços de repetição?" },
            { id: "montagem", name: "Montagem", icon: "🔧", prompt: "Quais os princípios para engrenagens e redução de torque?" },
            { id: "obr", name: "OBR", icon: "🏆", prompt: "Quais são as melhores regras para alinhamento de linha na OBR?" }
        ]
    }
};

// DIRETRIZES UNIVERSAIS DE ENSINO, SEGURANÇA E ENGAJAMENTO RÁPIDO
const GLOBAL_TEACHING_DIRECTIVES = `
[DIRETRIZES GLOBAIS DE COMPORTAMENTO E SEGURANÇA]:

1. FOCO ESTRITO (ANTI-FUGA): Você é um assistente educacional de tecnologia da Escola de Tecnologias. Se o aluno pedir para gerar músicas, poemas, imagens, redações, piadas ou falar sobre assuntos fora de programação, robótica ou game design, recuse educadamente e redirecione:
"Minha especialidade é tecnologia e desenvolvimento! Vamos voltar para o nosso projeto. O que você quer programar agora?"

2. GUARDA DE ESCOPO (CROSS-TOPIC): Observe o "CONTEXTO DE NAVEGAÇÃO DO ALUNO" informado no sistema. Se o aluno estiver na aba de uma tecnologia (ex: "GameMaker") e fizer perguntas sobre outra (ex: "Scratch", "Arduino", "Python"), NÃO responda a dúvida técnica. Oriente-o educadamente a trocar de aba:
"Você está fazendo uma pergunta sobre [Ferramenta Solicitada], mas estamos na área de [Tecnologia Selecionada]. Por favor, clique na ferramenta correta no menu lateral esquerdo para eu carregar os manuais corretos para você!"

3. PROIBIÇÃO DE TEXTÕES: Seus alunos são crianças e adolescentes. Responda em no máximo 2 a 3 parágrafos curtos. Use Bullet Points (•). Nunca entregue blocos gigantescos de texto teórico desnecessário.

4. PROTOCOLO ANTI-PREGUIÇA E DESAFIO DE LOCALIZAÇÃO:
- 1ª ou 2ª tentativa com aluno travado ou preguiçoso: Forneça a estrutura do código com uma lacuna (Scaffolding / Código Incompleto) para ele preencher o parâmetro principal.
- Se o aluno continuar travado (ou após 2 tentativas curtas/monossilábicas): Forneça a resposta completa do código, mas faça obrigatoriamente o Desafio de Localização:
"Aqui está o código completo! Agora me responda: em QUAL objeto, ator, evento, folha de eventos ou função do seu projeto você vai colar esse código?"

5. LIBERDADE CRIATIVA E COMPATIBILIDADE: Se o aluno pedir uma mecânica nova não presente na memória (ex: novos ataques, IAs de inimigos, combos), crie a lógica do zero usando seu conhecimento nativo na tecnologia, mantendo total compatibilidade com a arquitetura e nomes de variáveis do contexto.

6. CONVERSA CONTÍNUA SEM REPETIÇÕES: Em mensagens continuadas na mesma conversa, NÃO REPITA códigos completos que já foram fornecidos. Envie apenas o novo bloco ou trecho específico a ser adicionado.`;

// CONFIGURAÇÕES DAS PERSONAS E INSTRUÇÕES DO SISTEMA GEMINI (SYSTEM INSTRUCTION)
const PERSONAS_CONFIG = {
    "gamemaker": {
        profileName: "Desenvolvedor Sênior (GameMaker - 6º Ano ao Ensino Médio)",
        systemInstruction: `Você é o Desenvolvedor Sênior & Mentor de GameMaker (GML) para a Escola de Tecnologias.
Seu público varia do 6º ano do Ensino Fundamental ao Ensino Médio (11 a 17 anos).

DIRETRIZES DE RESPOSTA PARA GAMEMAKER (GML):
1. TOM DE VOZ & ESPELHAMENTO DE ESFORÇO: Aja como um Desenvolvedor Sênior orientando um dev junior.
   • Para perguntas detalhadas (Ensino Médio): Forneça explicações arquiteturais avançadas (Enums, FSM, funções, depuração).
   • Para perguntas curtas/preguiçosas (6º/7º ano): Bloqueie a entrega fácil e exija que o aluno mostre o código que já tem.

2. AVISO DE CEGUEIRA (AUDITORIA DE CÓDIGO): Você NÃO enxerga a tela do aluno. Se ele pedir para criar ou expandir uma mecânica (ex: pulo duplo, novo ataque, colisão), PARE e peça o contexto:
   "Eu não consigo ver o seu projeto! Você já tem o movimento/pulo básico funcionando? Cole aqui o código do seu objeto agora para eu adaptar. Se eu te der um código do zero, ele vai dar conflito e quebrar o seu jogo!"

3. MÁQUINAS DE ESTADO FINITOS (FSM) É LEI: Toda a arquitetura da escola é baseada em FSM com switch(state) e enums. NUNCA sugira código solto no Step Event. Instrua o aluno a criar novos estados dentro do switch(state) (ex: case state.attack:).

4. A REGRA DOS EVENTOS (LINHA DO TEMPO GML): Nunca entregue um código sem forçar o aluno a pensar no ciclo de vida do GameMaker:
   "Essa variável que estamos usando nasce no evento CREATE ou roda a cada quadro no STEP?"

5. FIM DA "MAGIA DO CÓDIGO": Lembre sempre o aluno:
   "Esse código não faz mágica sozinho! Se você colar no objeto errado ou fora do switch(state), nada vai acontecer."

6. O MÉTODO SHERLOCK PARA BUGS: Se o aluno disser "deu erro" ou "não funcionou", exija 3 informações obrigatórias antes de responder:
   1. Qual foi a mensagem EXATA do erro?
   2. Em qual OBJETO está o código (ex: obj_player)?
   3. Em qual EVENTO (Create, Step, Draw, etc.) ele foi colocado?`
    },
    "construct": {
        profileName: "Prático (Construct 3 - 4º e 5º Ano)",
        systemInstruction: `Você é o Assistente especialista em Construct 3 para a Escola de Tecnologias.
Seu público são alunos do 4º e 5º ano do Ensino Fundamental (9 a 11 anos).

DIRETRIZES DE RESPOSTA PARA CONSTRUCT 3:
1. TOM LÓGICO & SEM JARGÕES TÉCNICOS: Foco estrito em Causa e Efeito ("Condição" -> "Ação"). Explique mecânicas de forma prática. Se usar o comportamento Sine, não mencione trigonometria; explique que "Magnitude" é a distância da oscilação e "Frequência" é a velocidade. Use contagem de grid de 32px ("bloquinhos x 32") para distâncias.

2. NAVEGAÇÃO ESPACIAL DE INTERFACE: Sempre indique a posição física dos menus no Construct 3:
   • "Na janela de Propriedades (canto esquerdo da tela)..."
   • "Na Árvore de Projetos / Project Bar (canto direito da tela)..."
   • "Na barra de Eventos (no centro da tela)..."

3. PROTOCOLO DE PÂNICO & SOLUÇÕES DE INTERFACE:
   • Janelas Sumiram (Propriedades / Árvore de Projetos): Tranquilize o aluno e guie: "Vá no Menu no canto superior esquerdo > View > Bars e marque a opção que sumiu!"
   • Aba Fechada (Layout ou Event Sheet): "Dê um clique duplo no nome da sua Fase ou Folha de Eventos na Árvore de Projetos (lado direito) para reabrir!"
   • Objeto Deletado da Tela ("Fantasma"): "Calma! Você apagou apenas a cópia da tela. Seu objeto continua salvo na Árvore de Projetos no lado direito. É só clicar nele e arrastar de volta para o jogo!"
   • Fase Congelada / Sem Comandos: "Clique no fundo do seu Layout e, na barra de Propriedades (esquerda), veja se a opção 'Event Sheet' está vinculada à sua Folha de Eventos!"

4. ARQUITETURA DE EVENTOS & REGRA DO EVERY TICK:
   • Sempre desconstrua a lógica: "Primeiro a CONDIÇÃO (gatilho em amarelo) e depois a AÇÃO (o que acontece em azul)".
   • REGRA DO EVERY TICK: NUNCA crie múltiplos eventos "Every tick". Se já existir um "Every tick" no projeto, instrua o aluno a adicionar a nova AÇÃO dentro desse mesmo bloco para evitar travamentos.

5. BEHAVIORS PRIMEIRO & VARIÁVEIS:
   • Sempre prefira Behaviors nativos (Solid, Platform, Bullet, Physics, Flash, 8 Direction) antes de inventar lógicas manuais.
   • Explique a diferença: Variáveis Globais (ficam no topo da Folha de Eventos para o jogo todo, como Pontuação) vs Variáveis de Instância (ficam dentro do próprio Objeto, como Vida do Jogador).`
    },
    "scratch": {
        profileName: "Lúdico & Didático (Scratch 3.0 - 3º e 4º Ano)",
        systemInstruction: `Você é o Assistente Lúdico e Didático de Scratch 3.0 (Scratch Web) para a Escola de Tecnologias.
Seu público são crianças do 3º e 4º ano do Ensino Fundamental (8 a 10 anos).

DIRETRIZES DE RESPOSTA PARA SCRATCH 3.0 (WEB):
1. TOM DE VOZ: Super animado, alegre, encorajador, altamente visual e motivador.
2. REFERÊNCIA EXATA A BLOCOS DO SCRATCH 3.0: Mencione sempre a COR e a CATEGORIA da bolinha do bloco no Scratch 3.0:
   • 💛 Amarelo (Eventos): ex: "Quando a bandeira verde for clicada" ou "Quando a tecla [espaço] for pressionada"
   • 💙 Azul Claro (Movimento): ex: "Mova (10) passos" ou "Vá para x: () y: ()"
   • 💜 Roxo (Aparência): ex: "Mude para o traje [fantasia2]" ou "Diga [Olá!] por (2) seg"
   • 💗 Rosa / Lilás (Som): ex: "Toque o som [Miau] até o fim"
   • 🧡 Laranja (Controle): ex: "Sempre", "Se < > então", "Espere (1) seg"
   • 🟡 Amarelo Claro / Dourado (Sensores): ex: "Tocando em [ponteiro do mouse]?"
   • 🟢 Verde (Operadores): ex: "Número aleatório entre (1) e (10)"
   • 🟧 Laranja Escuro (Variáveis): ex: "Mude [Pontos] por (1)"

3. ALERTA VISUAL DE ATOR (SPRITE): Crianças dessa idade frequentemente colocam códigos no objeto errado. Se a ação envolver um elemento secundário (ex: um laser, inimigo ou moeda), avise com destaque:
   "⚠️ ATENÇÃO! Antes de montar os blocos, dê um clique no desenho do [Nome do Ator] lá embaixo para programar no lugar certo!"

4. FOCO EM REALIZAR A IDEIA DA CRIANÇA: Ajude-a a ver o resultado rapidamente (atirar, trocar de cenário, tocar som de vitória, fazer pontuação).

5. GATILHO RÁPIDO & RECEITA VISUAL: Não force tentativas e erros longos. Se a criança perguntar como fazer algo (ex: "Como eu faço para atirar?"), faça apenas uma pergunta simples de gatilho: "O que você vai apertar para atirar: a barra de espaço ou o clique do mouse?". Assim que ela responder, entregue a receita visual completa dos blocos do Scratch 3.0 sequenciada passo a passo.`
    },
    "lego": {
        profileName: "Maker & Robótica Pedagógica",
        systemInstruction: `Você é o Mentor de Robótica Lego (SPIKE Prime / EV3) para a Escola de Tecnologias.
DIRETRIZES DE RESPOSTA:
1. Use um tom de instrutor maker, prático e investigador.
2. Auxilie na calibração de sensores (Cor, Ultrassom, Giroscópio) e movimentação precisa dos motores.`
    },
    "arduino": {
        profileName: "Engenharia & Eletrônica (Maker)",
        systemInstruction: `Você é o Especialista em Eletrônica e Arduino para a Escola de Tecnologias.
DIRETRIZES DE RESPOSTA:
1. Use um tom de engenheiro/maker prático e atento à segurança dos circuitos.
2. Foque na linguagem C/C++ (setup, loop, pinMode, digitalWrite, analogRead), drivers Ponte H L298N e sensores.`
    },
    "python": {
        profileName: "Analítico & Algoritmos",
        systemInstruction: `Você é o Mentor de Python da Escola de Tecnologias.
DIRETRIZES DE RESPOSTA:
1. Use um tom analítico, moderno e focado em raciocínio algorítmico.
2. Foque em sintaxe limpa, identação, estruturas de dados (listas, dicionários), laços (for, while) e funções.`
    },
    "montagem": {
        profileName: "Mecânica & Design Estrutural",
        systemInstruction: `Você é o Consultor de Engenharia de Montagem Mecânica da Escola de Tecnologias.
DIRETRIZES DE RESPOSTA:
1. Foque em princípios físicos de engrenagens, relação de transmissão (torque vs velocidade), centro de gravidade e travamento estrutural.`
    },
    "obr": {
        profileName: "Estratégico (Competição OBR)",
        systemInstruction: `Você é o Técnico da Equipe OBR (Olimpíada Brasileira de Robótica) da Escola de Tecnologias.
DIRETRIZES DE RESPOSTA:
1. Use um tom focado em competição, estratégia e alto desempenho.
2. Ajude na lógica de alinhamento de linha, detecção de interseções verdes, desvio de obstáculos e área de resgate.`
    }
};

// DEFAULTS SOLICITADOS DE SUB-SELETORES POR ÁREA
const DEFAULT_SUBSELECTORS = {
    "games": "gamemaker",
    "robotica": "arduino",
    "treinamento": "python"
};

// 2. ESTADO GLOBAL DA APLICAÇÃO
const appState = {
    area: 'games',
    subSeletor: 'gamemaker',
    currentMemoryPath: 'memoria/games/gamemaker/',
    currentPersona: PERSONAS_CONFIG['gamemaker'],
    memoriaConfig: MEMORIA_MAP,
    conversationHistory: []
};

// MAPA DE DISPONIBILIDADE DOS SUB-SELETORES / PERSONAS DA IA
// GameMaker e Construct estão 100% ativos; Scratch, Robótica e Treinamento estão temporariamente bloqueados.
const ENABLED_SUBSELECTORS = {
    "gamemaker": true,
    "construct": true,
    "scratch": false,
    "lego": false,
    "arduino": false,
    "python": false,
    "montagem": false,
    "obr": false
};

// 3. INICIALIZAÇÃO AO CARREGAR A PÁGINA
document.addEventListener('DOMContentLoaded', async () => {
    // Tenta carregar memoria.json externo se disponível via servidor
    await loadExternalMemoriaJson();

    // Ler parâmetro ?area= da URL
    const urlParams = new URLSearchParams(window.location.search);
    let areaParam = (urlParams.get('area') || '').toLowerCase();
    let subParam = (urlParams.get('sub') || '').toLowerCase();

    // Validação da área
    if (!AREAS_CONFIG[areaParam]) {
        areaParam = 'games';
    }

    appState.area = areaParam;

    // Selecionar o sub-seletor vindo da URL ou o padrão configurado (GameMaker, Arduino, Python)
    const validSubs = AREAS_CONFIG[appState.area].seletores.map(s => s.id);
    if (subParam && validSubs.includes(subParam)) {
        appState.subSeletor = subParam;
    } else {
        appState.subSeletor = DEFAULT_SUBSELECTORS[appState.area] || validSubs[0];
    }

    // Renderizar a interface inicial
    updateAreaUI();
    renderSubselectors();
    selectSubselector(appState.subSeletor);
    checkApiKeyStatus();

    // Ajustar altura do textarea de forma dinâmica
    setupTextareaAutoResize();
});

// 4. CARREGADOR DE MEMORIA.JSON EXTERNO
async function loadExternalMemoriaJson() {
    try {
        const response = await fetch('memoria.json');
        if (response.ok) {
            const data = await response.json();
            appState.memoriaConfig = data;
            console.log('[Assistente IA] memoria.json carregado com sucesso.');
        }
    } catch (e) {
        console.info('[Assistente IA] Utilizando mapeamento interno de memoria.json.');
    }
}

// 5. RECOLHER / EXPANDIR MENU LATERAL (ESTILO GEMINI)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('sidebar-toggle-icon');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        if (icon) {
            icon.textContent = isCollapsed ? '▶' : '◀';
        }
    }
}

// 6. TROCA DE ÁREA PRINCIPAL (Games, Robótica, Treinamento)
function changeArea(newArea) {
    if (!AREAS_CONFIG[newArea]) return;
    
    appState.area = newArea;
    
    // Seleciona o subseletor padrão configurado para a nova área
    const defaultSub = DEFAULT_SUBSELECTORS[newArea] || AREAS_CONFIG[newArea].seletores[0].id;
    appState.subSeletor = defaultSub;

    updateAreaUI();
    renderSubselectors();
    selectSubselector(defaultSub);

    // Atualiza parâmetro da URL sem recarregar
    updateUrlParams();
}

// 6. ATUALIZA A INTERFACE DA ÁREA
function updateAreaUI() {
    // Atualiza pills de área na sidebar
    document.querySelectorAll('.area-pill').forEach(pill => {
        if (pill.dataset.area === appState.area) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    const areaInfo = AREAS_CONFIG[appState.area];
    document.getElementById('subselector-label').textContent = `Tópicos em ${areaInfo.title}`;
    document.getElementById('breadcrumb-area').textContent = `${areaInfo.icon} ${areaInfo.title}`;
}

// 7. RENDERIZA OS SUB-SELETORES DINAMICAMENTE
function renderSubselectors() {
    const container = document.getElementById('subselector-container');
    container.innerHTML = '';

    const seletores = AREAS_CONFIG[appState.area].seletores;

    seletores.forEach(item => {
        const btn = document.createElement('button');
        btn.className = 'subselector-btn';
        btn.dataset.id = item.id;
        btn.id = `subselector-${item.id}`;
        btn.onclick = () => selectSubselector(item.id);

        const isEnabled = ENABLED_SUBSELECTORS[item.id] === true;
        const lockBadge = isEnabled ? '' : ' <span style="font-size: 0.72rem; opacity: 0.8;" title="Em Manutenção / Em Breve">🔒</span>';

        btn.innerHTML = `
            <span>
                <span class="btn-icon">${item.icon}</span>
                ${item.name}${lockBadge}
            </span>
            <span class="check-indicator"></span>
        `;

        container.appendChild(btn);
    });
}

// 8. SELECIONA UM SUB-SELETOR E ATUALIZA A VARIÁVEL DE MEMÓRIA
function selectSubselector(subId) {
    appState.subSeletor = subId;
    appState.conversationHistory = []; // Limpa o histórico de conversa ao trocar de tecnologia

    const isEnabled = ENABLED_SUBSELECTORS[subId] === true;

    // Atualiza status do cabeçalho e estado do chat (habilitado/desabilitado)
    const statusText = document.getElementById('status-text');
    const statusDot = document.getElementById('status-dot');
    const textarea = document.getElementById('chat-textarea');
    const btnSend = document.getElementById('btn-send');

    if (isEnabled) {
        if (statusText) statusText.textContent = 'Pronto para Gemini 1.5 Flash';
        if (statusDot) {
            statusDot.style.backgroundColor = 'var(--color-green)';
            statusDot.style.boxShadow = '0 0 8px rgba(16, 185, 129, 0.6)';
        }
        if (textarea) {
            textarea.disabled = false;
            textarea.placeholder = 'Digite sua dúvida ou mensagem aqui...';
            textarea.style.opacity = '1';
            textarea.style.cursor = 'text';
        }
        if (btnSend) {
            btnSend.disabled = false;
            btnSend.style.opacity = '1';
            btnSend.style.cursor = 'pointer';
        }
    } else {
        if (statusText) statusText.textContent = '🔒 Indisponível no Momento (Em Breve)';
        if (statusDot) {
            statusDot.style.backgroundColor = '#ff3b30';
            statusDot.style.boxShadow = '0 0 8px rgba(255, 59, 48, 0.6)';
        }
        if (textarea) {
            textarea.disabled = true;
            textarea.placeholder = '🔒 O agente desta tecnologia está em manutenção. Tente GameMaker ou Construct!';
            textarea.style.opacity = '0.6';
            textarea.style.cursor = 'not-allowed';
        }
        if (btnSend) {
            btnSend.disabled = true;
            btnSend.style.opacity = '0.5';
            btnSend.style.cursor = 'not-allowed';
        }
    }

    // Obter o caminho físico do JSON mapeado
    const areaMem = appState.memoriaConfig[appState.area] || {};
    const memoryPath = areaMem[subId] || `/memoria/${appState.area}/${subId}/`;
    
    // Atualiza estado de memória e persona ativa
    appState.currentMemoryPath = memoryPath;
    const personaInfo = PERSONAS_CONFIG[subId] || PERSONAS_CONFIG['gamemaker'];
    appState.currentPersona = personaInfo;

    // === CONSOLE.LOGS DE DEBUG ===
    console.log(`[Assistente IA] Sub-seletor ativo: "${subId}" (Habilitado: ${isEnabled}) | Caminho da memória JSON:`, appState.currentMemoryPath);

    // Destacar botão ativo no DOM
    document.querySelectorAll('.subselector-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.id === subId);
    });

    // Atualizar UI de diagnósticos, persona e breadcrumb
    document.getElementById('debug-area-name').textContent = appState.area;
    document.getElementById('debug-sub-name').textContent = subId;
    document.getElementById('debug-memory-path').textContent = appState.currentMemoryPath;
    document.getElementById('footer-memory-code').textContent = appState.currentMemoryPath;
    
    const debugPersonaEl = document.getElementById('debug-persona-profile');
    if (debugPersonaEl) {
        debugPersonaEl.textContent = personaInfo.profileName;
    }
    
    // Atualizar Breadcrumb
    const subObj = AREAS_CONFIG[appState.area].seletores.find(s => s.id === subId);
    const subName = subObj ? subObj.name : subId;
    document.getElementById('breadcrumb-sub').textContent = subName;

    // Atualizar o cartão de boas-vindas do chat
    updateWelcomeCard(subObj);

    // Atualizar URL
    updateUrlParams();
}

// 9. ATUALIZA O CARTÃO DE BOAS-VINDAS DO CHAT E AS SUGESTÕES
function updateWelcomeCard(subObj) {
    if (!subObj) return;

    const chatHistory = document.getElementById('chat-history');
    if (!chatHistory) return;

    const isEnabled = ENABLED_SUBSELECTORS[subObj.id] === true;

    if (!isEnabled) {
        chatHistory.innerHTML = `
            <div class="welcome-card" style="border: 1px solid rgba(255, 59, 48, 0.4); background: rgba(255, 59, 48, 0.05); text-align: center; padding: 2.5rem 1.5rem; margin-top: 1rem;">
                <div style="font-size: 3rem; margin-bottom: 1rem;">🔒</div>
                <h2 style="color: #ff3b30; font-size: 1.4rem; margin-bottom: 0.6rem; font-weight: 700;">Agente de ${subObj.name} em Atualização</h2>
                <p style="color: var(--color-text-normal); max-width: 600px; margin: 0 auto 1.5rem auto; line-height: 1.6; font-size: 0.95rem;">
                    O Assistente pedagógico especialista em <strong>${subObj.name}</strong> está passando por calibração de manuais. 
                    <br><br>
                    💡 <strong>As personas de GameMaker e Construct 3 já estão 100% ativas!</strong> Clique em GameMaker ou Construct no menu lateral para tirar suas dúvidas com a IA.
                </p>
            </div>
        `;
        return;
    }

    const areaTitle = AREAS_CONFIG[appState.area].title;

    chatHistory.innerHTML = `
        <div class="welcome-card" id="welcome-card">
            <div class="welcome-title-row">
                <div class="welcome-icon" id="welcome-icon">${subObj.icon}</div>
                <div class="welcome-text">
                    <h2 id="welcome-title">Assistente de ${subObj.name} (${areaTitle})</h2>
                    <p id="welcome-subtitle">Estou conectado aos manuais e exemplos da pasta ${appState.currentMemoryPath}. Como posso ajudar no seu aprendizado de ${subObj.name}?</p>
                </div>
            </div>

            <div style="font-size: 0.8rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px;">
                Sugestões de Perguntas Rápidas:
            </div>

            <div class="suggestions-grid" id="suggestions-grid">
                <button class="suggestion-chip" onclick="fillPrompt('${subObj.prompt}')">
                    💡 "${subObj.prompt}"
                </button>
                <button class="suggestion-chip" onclick="fillPrompt('Como depurar um erro comum em ${subObj.name}?')">
                    🛠️ "Como depurar erros comuns em ${subObj.name}?"
                </button>
                <button class="suggestion-chip" onclick="fillPrompt('Me dê um exemplo prático para iniciantes em ${subObj.name}.')">
                    🚀 "Exemplo prático inicial em ${subObj.name}"
                </button>
            </div>
        </div>
    `;
}

// 10. PREENCHER INPUT DE TEXTO COM SUGESTÃO CLICADA
function fillPrompt(text) {
    const textarea = document.getElementById('chat-textarea');
    textarea.value = text;
    textarea.focus();
}

// 11. ATUALIZA PARÂMETROS DA URL DE FORMA TRANSPARENTE
function updateUrlParams() {
    const newUrl = `${window.location.pathname}?area=${appState.area}&sub=${appState.subSeletor}`;
    window.history.replaceState({ path: newUrl }, '', newUrl);
}

// ==========================================================================
// INTEGRADOR DA API GOOGLE GEMINI 1.5 FLASH E GERENCIADOR DE API KEY
// ==========================================================================

const MEMORY_INDEX = {
    "gamemaker": [
        "GM_scripts_Dialogo_VisualNovel.md",
        "GM_scripts_FSM.md",
        "GM_scripts_Metroidvania.md",
        "GM_scripts_Space.md",
        "GM_scripts_TopView.md"
    ],
    "construct": [
        "C3_scripts.md"
    ],
    "scratch": [
        "SB3_scripts.md"
    ],
    "lego": ["exemplo_memoria.txt"],
    "arduino": ["exemplo_memoria.txt"],
    "python": ["exemplo_memoria.txt"],
    "montagem": ["exemplo_memoria.txt"],
    "obr": ["exemplo_memoria.txt"]
};

const STORAGE_API_KEY = 'titan_gemini_api_key';

// === CONFIGURAÇÕES OPCIONAIS DO PROFESSOR (PROXY / SERVIÇO DE TERCEIROS) ===
// Proxy do Cloudflare Worker seguro conectado à API do Gemini
const DEFAULT_TEACHER_PROXY_URL = 'https://assistente-virtual-laboratorio-tecnologias.gabrielsehna.workers.dev/';
const DEFAULT_TEACHER_API_KEY = '';   // Exemplo: 'AIzaSy...' (opcional)

function getSavedApiKey() {
    try {
        return (localStorage.getItem(STORAGE_API_KEY) || '').trim();
    } catch (e) {
        return '';
    }
}

function getEffectiveApiKey() {
    const userKey = getSavedApiKey();
    if (userKey) return userKey;
    return (DEFAULT_TEACHER_API_KEY || '').trim();
}

function checkApiKeyStatus() {
    const userKey = getSavedApiKey();
    const effectiveKey = getEffectiveApiKey();
    const btnLabel = document.getElementById('api-key-status-label');
    const btnKey = document.getElementById('btn-api-key');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');

    if (userKey) {
        if (btnLabel) btnLabel.textContent = 'API Customizada ✓';
        if (btnKey) btnKey.classList.add('active');
        if (statusDot) statusDot.style.background = 'var(--color-green)';
        if (statusText) statusText.textContent = 'Gemini 3.7 Flash (Chave Própria)';
    } else if (DEFAULT_TEACHER_PROXY_URL || DEFAULT_TEACHER_API_KEY) {
        if (btnLabel) btnLabel.textContent = 'API da Escola (Ativa) ✓';
        if (btnKey) btnKey.classList.add('active');
        if (statusDot) statusDot.style.background = 'var(--color-green)';
        if (statusText) statusText.textContent = 'Gemini Conectado (Serviço da Escola)';
    } else {
        if (btnLabel) btnLabel.textContent = 'API Key';
        if (btnKey) btnKey.classList.remove('active');
        if (statusDot) statusDot.style.background = 'var(--color-yellow)';
        if (statusText) statusText.textContent = 'Modo Simulação (Sem Chave API)';
    }
}

function openApiKeyModal() {
    const modal = document.getElementById('api-modal-overlay');
    const input = document.getElementById('input-api-key');
    if (input) input.value = getSavedApiKey();
    if (modal) modal.classList.add('open');
}

function closeApiKeyModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('api-modal-overlay');
    if (modal) modal.classList.remove('open');
}

function saveApiKey() {
    const input = document.getElementById('input-api-key');
    const key = input ? input.value.trim() : '';
    try {
        if (key) {
            localStorage.setItem(STORAGE_API_KEY, key);
        } else {
            localStorage.removeItem(STORAGE_API_KEY);
        }
    } catch (e) {}
    
    checkApiKeyStatus();
    closeApiKeyModal();
}

function togglePasswordVisibility() {
    const input = document.getElementById('input-api-key');
    if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
    }
}

// LER O CONTEÚDO COMPLETO DOS ARQUIVOS DE MEMÓRIA DA PASTA ATIVA (VIA MANIFEST FILES.JSON OU FALLBACK)
async function loadActiveMemoryContext() {
    const subId = appState.subSeletor;
    const basePath = appState.currentMemoryPath;
    let files = [];

    // 1. Tentar buscar dinamicamente o manifest files.json da pasta
    try {
        const manifestUrl = `${basePath}files.json`;
        const resManifest = await fetch(manifestUrl);
        if (resManifest.ok) {
            files = await resManifest.json();
            console.log(`[Assistente IA] Manifest 'files.json' lido com sucesso em ${manifestUrl}:`, files);
        }
    } catch (e) {
        console.info(`[Assistente IA] Sem 'files.json' em ${basePath}, usando fallback padrão.`);
    }

    // 2. Se não encontrou files.json, usa a lista de fallback em MEMORY_INDEX
    if (!files || files.length === 0) {
        files = MEMORY_INDEX[subId] || [];
    }

    let combinedText = "";

    for (const file of files) {
        try {
            const fileUrl = `${basePath}${file}`;
            const res = await fetch(fileUrl);
            if (res.ok) {
                const text = await res.text();
                combinedText += `\n\n=== MEMÓRIA DO PROFESSOR (${file}) ===\n${text}`;
            }
        } catch (err) {
            console.warn(`[Assistente IA] Não foi possível carregar ${file}:`, err);
        }
    }

    return combinedText;
}

// CHAMAR A API REST DO GOOGLE GEMINI (DIRETO OU VIA PROXY DA ESCOLA)
async function callGeminiApi(userPrompt) {
    const userKey = getSavedApiKey();
    const effectiveKey = getEffectiveApiKey();
    const proxyUrl = DEFAULT_TEACHER_PROXY_URL;

    // Modelos oficiais do Google Gemini (Atualizado para Gemini 3.7 Flash v1)
    const preferredModel = 'gemini-3.7-flash';
    const fallbackModel = 'gemini-3.6-flash';

    let endpoint = "";
    if (userKey) {
        endpoint = `https://generativelanguage.googleapis.com/v1/models/${preferredModel}:generateContent?key=${encodeURIComponent(userKey)}`;
    } else if (proxyUrl) {
        endpoint = proxyUrl;
    } else if (effectiveKey) {
        endpoint = `https://generativelanguage.googleapis.com/v1/models/${preferredModel}:generateContent?key=${encodeURIComponent(effectiveKey)}`;
    } else {
        openApiKeyModal();
        throw new Error("Por favor, insira uma Chave de API do Gemini ou configure o Proxy da Escola.");
    }

    // 1. Carrega o contexto dos arquivos .md da memória
    const memoryContext = await loadActiveMemoryContext();

    // 2. Obtém a Instrução do Sistema (Persona + Tópico Ativo + Memória Fixa + Diretrizes Universais)
    const basePersonaInstruction = appState.currentPersona ? appState.currentPersona.systemInstruction : "";
    const activeTopicInfo = `\n📌 CONTEXTO DE NAVEGAÇÃO DO ALUNO:
- Área de Conhecimento Ativa: "${appState.area.toUpperCase()}"
- Tecnologia Selecionada na Interface: "${appState.subSeletor.toUpperCase()}"
- Pasta de Memória Indexada: "${appState.currentMemoryPath}"`;

    const fullPersonaInstruction = `${basePersonaInstruction}\n${activeTopicInfo}\n\n[BASE DE CONHECIMENTO E MANUAIS DO PROFESSOR DISPONÍVEIS DA AULA]:\n${memoryContext || "Nenhum arquivo adicional nesta pasta."}\n\n${GLOBAL_TEACHING_DIRECTIVES}`;

    // 3. Registra o prompt do usuário (a memória fica fixa no System Instruction para pacotes super leves)
    appState.conversationHistory.push({
        role: "user",
        parts: [{ text: userPrompt }]
    });

    // 4. Janela Deslizante (Sliding Window): Retém apenas as últimas 4 mensagens recentes
    const recentContents = appState.conversationHistory.slice(-4);

    const payload = {
        model: preferredModel,
        system_instruction: {
            parts: [{ text: fullPersonaInstruction }]
        },
        contents: recentContents,
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096
        }
    };

    // 5. Configuração de Timeout estendido de 60 segundos com AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let response;
    try {
        response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
    } catch (fetchErr) {
        clearTimeout(timeoutId);
        appState.conversationHistory.pop(); // Remove o prompt falho em caso de erro de rede
        if (fetchErr.name === 'AbortError') {
            throw new Error("A requisição demorou mais de 60 segundos para responder (Timeout). Tente refazer a pergunta.");
        }
        throw new Error(`Não foi possível conectar ao Proxy/API. Caso esteja usando o Cloudflare Worker, certifique-se de configurar os cabeçalhos CORS no Worker ou clique em 🔑 API Key para informar sua chave própria.`);
    }

    const data = await response.json().catch(() => ({}));

    // Se o HTTP retornar erro ou se a resposta contiver um objeto 'error' do Gemini/Worker
    if (!response.ok || data.error) {
        appState.conversationHistory.pop(); // Remove o prompt falho do histórico em erro da API
        const errMsg = data.error?.message || `Erro na API HTTP ${response.status}`;
        
        // Se a chamada for direta com chave do usuário e o modelo preferredModel falhar, tenta o fallbackModel
        if (userKey && (data.error?.code === 404 || response.status === 404) && endpoint.includes(preferredModel)) {
            console.warn(`[Assistente IA] Modelo ${preferredModel} indisponível para esta chave. Tentando ${fallbackModel}...`);
            const fallbackEndpoint = `https://generativelanguage.googleapis.com/v1/models/${fallbackModel}:generateContent?key=${encodeURIComponent(userKey)}`;
            
            const fbController = new AbortController();
            const fbTimeoutId = setTimeout(() => fbController.abort(), 60000);
            
            const fbRes = await fetch(fallbackEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: fbController.signal
            }).catch(() => null);
            clearTimeout(fbTimeoutId);

            if (fbRes && fbRes.ok) {
                const fbData = await fbRes.json().catch(() => ({}));
                if (!fbData.error) {
                    const fbText = fbData.candidates?.[0]?.content?.parts?.[0]?.text || fbData.text || fbData.response;
                    if (fbText) {
                        appState.conversationHistory.push({
                            role: "model",
                            parts: [{ text: fbText }]
                        });
                        return fbText;
                    }
                }
            }
        }
        
        throw new Error(errMsg);
    }

    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || data.response;

    if (!textResult) {
        appState.conversationHistory.pop();
        throw new Error("A API do Gemini não retornou resposta válida.");
    }

    // Registra a resposta da IA no histórico multiturn da conversa
    appState.conversationHistory.push({
        role: "model",
        parts: [{ text: textResult }]
    });

    return textResult;
}

// 12. ENVIO DE MENSAGENS NO CHAT (COM SUPORTE A GEMINI REAL OU SIMULAÇÃO)
async function sendMessage() {
    if (!ENABLED_SUBSELECTORS[appState.subSeletor]) return;

    const textarea = document.getElementById('chat-textarea');
    const text = textarea.value.trim();

    if (!text) return;

    const chatHistory = document.getElementById('chat-history');

    // Remove welcome card se for o primeiro envio
    const welcomeCard = document.getElementById('welcome-card');
    if (welcomeCard && welcomeCard.parentElement) {
        welcomeCard.style.display = 'none';
    }

    // Adiciona Mensagem do Usuário
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `
        <div class="message-bubble">${escapeHtml(text)}</div>
        <div class="message-avatar">🧑‍🎓</div>
    `;
    chatHistory.appendChild(userMsg);

    // Limpa o textarea
    textarea.value = '';
    textarea.style.height = '24px';
    chatHistory.scrollTop = chatHistory.scrollHeight;

    // SE HOUVER API KEY OU PROXY DA ESCOLA CONFIGURADO, EXECUTA A CHAMADA REAL AO GEMINI!
    const effectiveKey = getEffectiveApiKey();
    if (effectiveKey || DEFAULT_TEACHER_PROXY_URL) {
        const loadingMsg = document.createElement('div');
        loadingMsg.className = 'chat-message assistant';
        loadingMsg.id = 'loading-bubble';
        loadingMsg.innerHTML = `
            <div class="message-avatar">✨</div>
            <div class="message-bubble" style="opacity: 0.85">
                <em>Consultando manuais da pasta <code>${appState.currentMemoryPath}</code> e gerando resposta com a persona <strong>${appState.currentPersona?.profileName || ''}</strong>...</em>
            </div>
        `;
        chatHistory.appendChild(loadingMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        try {
            const aiResponseText = await callGeminiApi(text);
            loadingMsg.remove();

            const aiMsg = document.createElement('div');
            aiMsg.className = 'chat-message assistant';
            aiMsg.innerHTML = `
                <div class="message-avatar">✨</div>
                <div class="message-bubble">${formatMarkdownText(aiResponseText)}</div>
            `;
            chatHistory.appendChild(aiMsg);
        } catch (err) {
            loadingMsg.remove();
            const errMsg = document.createElement('div');
            errMsg.className = 'chat-message assistant';
            errMsg.innerHTML = `
                <div class="message-avatar" style="background: var(--color-red)">⚠️</div>
                <div class="message-bubble" style="border-color: rgba(239, 68, 68, 0.4)">
                    <strong>Erro na API do Gemini:</strong> ${escapeHtml(err.message)}<br><br>
                    <small>Clique no botão <strong>🔑 API Key</strong> no topo para conferir sua chave.</small>
                </div>
            `;
            chatHistory.appendChild(errMsg);
        }
        chatHistory.scrollTop = chatHistory.scrollHeight;
        return;
    }

    // MODO SIMULAÇÃO (QUANDO AINDA NÃO HÁ API KEY DIGITADA)
    setTimeout(() => {
        const aiMsg = document.createElement('div');
        aiMsg.className = 'chat-message assistant';
        const personaName = appState.currentPersona ? appState.currentPersona.profileName : 'Padrão';
        aiMsg.innerHTML = `
            <div class="message-avatar">✨</div>
            <div class="message-bubble">
                <strong>[Modo Simulação de Interface]</strong><br>
                Recebi sua dúvida sobre <em>${appState.subSeletor.toUpperCase()}</em>.<br><br>
                🎭 <strong>Persona Ativa (SystemInstruction):</strong> <code>${personaName}</code><br>
                📌 <strong>Memórias Indexadas da Pasta:</strong> <code>${appState.currentMemoryPath}</code><br><br>
                💡 <em>Para obter respostas em tempo real da IA consultando seus arquivos <code>.md</code>, clique no botão <strong>🔑 API Key</strong> no topo e cole sua chave do Google AI Studio.</em>
            </div>
        `;
        chatHistory.appendChild(aiMsg);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 400);
}

// ATALHO PARA ENTER
function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// AJUSTE AUTOMÁTICO DE ALTURA DO TEXTAREA
function setupTextareaAutoResize() {
    const textarea = document.getElementById('chat-textarea');
    if (!textarea) return;
    textarea.addEventListener('input', () => {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    });
}

// FORMATADOR SIMPLES DE MARKDOWN PARA A RESPOSTA DA IA (COM BOTÃO DE COPIAR CÓDIGO)
function formatMarkdownText(text) {
    if (!text) return '';
    let html = escapeHtml(text);

    // Blocos de código ```gml ... ``` com cabeçalho e botão de cópia
    html = html.replace(/```([a-zA-Z0-9_+-]*)\n?([\s\S]*?)```/g, (match, lang, code) => {
        const displayLang = lang.trim() ? lang.trim().toUpperCase() : 'CÓDIGO';
        const cleanCode = code.trim();
        const codeId = 'code-' + Math.random().toString(36).substring(2, 9);
        const encodedCode = btoa(unescape(encodeURIComponent(cleanCode)));

        return `<div class="code-block-container"><div class="code-block-header"><span class="code-lang-tag">💻 ${displayLang}</span><button class="btn-copy-code" onclick="copyCodeToClipboard('${codeId}', '${encodedCode}', this)" title="Copiar código"><span>📋</span> Copiar</button></div><pre><code id="${codeId}">${cleanCode}</code></pre></div>`;
    });

    // Código inline `código`
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.3); padding: 0.15rem 0.4rem; border-radius: 4px; color: #38bdf8; font-family: monospace;">$1</code>');

    // Negrito **texto**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Itálico *texto*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Quebras de linha
    html = html.replace(/\n/g, '<br>');

    return html;
}

// COPIAR BLOCO DE CÓDIGO PARA A ÁREA DE TRANSFERÊNCIA
function copyCodeToClipboard(codeId, encodedCode, btnElement) {
    try {
        const rawCode = decodeURIComponent(escape(atob(encodedCode)));
        
        navigator.clipboard.writeText(rawCode).then(() => {
            if (btnElement) {
                btnElement.classList.add('copied');
                btnElement.innerHTML = '<span>✓</span> Copiado!';
                setTimeout(() => {
                    btnElement.classList.remove('copied');
                    btnElement.innerHTML = '<span>📋</span> Copiar';
                }, 2000);
            }
        }).catch(() => {
            // Fallback caso a API navigator.clipboard esteja bloqueada
            const tempTextarea = document.createElement('textarea');
            tempTextarea.value = rawCode;
            document.body.appendChild(tempTextarea);
            tempTextarea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextarea);

            if (btnElement) {
                btnElement.classList.add('copied');
                btnElement.innerHTML = '<span>✓</span> Copiado!';
                setTimeout(() => {
                    btnElement.classList.remove('copied');
                    btnElement.innerHTML = '<span>📋</span> Copiar';
                }, 2000);
            }
        });
    } catch (e) {
        console.error("Erro ao copiar código:", e);
    }
}

// AUXILIAR DE SEGURANÇA CONTRA XSS
function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
