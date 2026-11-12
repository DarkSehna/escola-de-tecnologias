// ==========================================================================
// ESTÚDIO DE PROMPTS & LAUNCHER COMFYUI - JAVASCRIPT
// Escola de Tecnologias - Colégio Anchieta Porto Alegre
// ==========================================================================

const COMFYUI_URL = 'http://127.0.0.1:8188';
const PING_INTERVAL_MS = 2000;

// Base rigorosa de proteção SFW escolar
const BASE_SFW_NEGATIVE = 'nsfw, nude, naked, suggestive, explicit, gore, blood, horror, multiple people, 2boys, 2girls, crowd, worst quality, lowres, blurry, watermark, text';
const WHITE_BG_NEGATIVE_EXTRA = 'scenery, background, landscape, floor, shadow';

// Dicionário de Categorias e Chips (Português -> SDXL Inglês)
const PROMPT_DATABASE = [
    {
        id: 'subject',
        name: 'Personagem ou Objeto',
        icon: '🧙‍♂️',
        type: 'single', // seleção única
        options: [
            { id: 'knight', label: 'Cavaleiro', isCharacter: true, en: 'medieval armored knight, brave warrior' },
            { id: 'mage', label: 'Mago', isCharacter: true, en: 'mystic wizard, magic spellcaster, robe' },
            { id: 'archer', label: 'Arqueiro', isCharacter: true, en: 'elven archer, forest ranger, holding bow' },
            { id: 'robot', label: 'Robô', isCharacter: true, en: 'friendly retro robot, cute mechanical bot' },
            { id: 'explorer', label: 'Explorador', isCharacter: true, en: 'intrepid adventurer explorer, archaeology gear' },
            { id: 'slime', label: 'Slime Fofo', isCharacter: true, en: 'cute bouncy slime creature, gelatinous pet' },
            { id: 'dragon', label: 'Dragãozinho', isCharacter: true, en: 'tiny cute baby dragon, small wings, friendly wyrm' },
            { id: 'sword', label: 'Espada Mágica', isCharacter: false, en: 'glowing fantasy crystal sword, magical runic blade, RPG item' },
            { id: 'potion', label: 'Poção', isCharacter: false, en: 'glass alchemy potion flask, glowing colorful liquid, cork stopper' },
            { id: 'coin', label: 'Moeda', isCharacter: false, en: 'gleaming golden game coin, embossed star emblem, shiny treasure currency' },
            { id: 'chest', label: 'Baú', isCharacter: false, en: 'wooden medieval treasure chest, reinforced gold brackets, mystery loot' }
        ]
    },
    {
        id: 'style',
        name: 'Estilo Visual',
        icon: '🎨',
        type: 'single', // seleção única
        options: [
            { id: 'pixelart', label: 'Pixel Art 16-bit', en: '16-bit pixel art style, retro video game sprite, clean pixel clusters, sharp edges' },
            { id: 'game2d', label: 'Arte de Jogo 2D', en: '2D digital game asset, vector illustration style, clean bold outlines, cell shaded' },
            { id: 'chibi', label: 'Chibi / Fofo', en: 'cute chibi proportions, adorable kawaii style, expressive large eyes, soft shading' },
            { id: 'cartoon', label: 'Cartoon Limpo', en: 'clean modern cartoon style, vibrant saturated colors, crisp smooth lines' }
        ]
    },
    {
        id: 'equipment',
        name: 'Equipamento / Detalhes / Cores',
        icon: '🛡️',
        type: 'multiple', // múltipla escolha
        options: [
            { id: 'blue_armor', label: 'Armadura Azul', en: 'wearing polished blue steel armor plate' },
            { id: 'green_cape', label: 'Capa Verde', en: 'wearing a rich green flowing cape' },
            { id: 'wizard_hat', label: 'Chapéu de Mago', en: 'pointed starry wizard hat' },
            { id: 'shield', label: 'Escudo', en: 'carrying a sturdy knightly heraldic shield' },
            { id: 'lantern', label: 'Lanterna', en: 'holding an illuminated brass adventurer lantern' },
            { id: 'backpack', label: 'Mochila', en: 'wearing a rugged leather travel backpack' },
            { id: 'magic_glow', label: 'Brilho Mágico', en: 'subtle glowing aura, floating mystical magical motes' }
        ]
    },
    {
        id: 'framing',
        name: 'Enquadramento & Pose',
        icon: '📐',
        type: 'single', // seleção única
        options: [
            { id: 'fullbody', label: 'Corpo Inteiro (1 isolado)', en: 'full body view, centered framing, standalone subject' },
            { id: 'action', label: 'Pose de Ação', en: 'dynamic action pose, energetic heroic stance' },
            { id: 'portrait', label: 'Retrato / Rosto', en: 'head and shoulders portrait, detailed facial focus' },
            { id: 'item_icon', label: 'Ícone de Item', en: 'centered item icon, inventory asset view, isometric clean display' }
        ]
    },
    {
        id: 'background',
        name: 'Fundo & Cenário',
        icon: '🌄',
        type: 'single', // seleção única
        options: [
            { id: 'white_bg', label: 'Fundo Branco Liso (sem cenário)', en: 'solid pure white background, isolated on white, zero scenery, studio lighting', isWhiteBg: true },
            { id: 'simple_bg', label: 'Fundo Transparente / Simples', en: 'minimalist clean background, soft neutral backdrop, empty space' },
            { id: 'forest', label: 'Floresta Mágica', en: 'fantasy enchanted magical forest background, glowing plants, soft lighting' },
            { id: 'dungeon', label: 'Masmorra', en: 'ancient stone dungeon background, medieval torchlight, atmospheric shadows' }
        ]
    }
];

// Estado atual das escolhas do aluno
const activeSelections = {
    subject: 'knight',      // Padrão amigável inicial
    style: 'pixelart',      // Padrão amigável inicial
    equipment: new Set(['blue_armor']),
    framing: 'fullbody',
    background: 'white_bg'
};

document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
    updatePrompts();
    initClipboardButtons();
    initResetButton();
    startComfyStatusPing();
});

/**
 * Renderiza dinamicamente as categorias e os chips clicáveis
 */
function renderCategories() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    container.innerHTML = '';

    PROMPT_DATABASE.forEach(cat => {
        const groupEl = document.createElement('div');
        groupEl.className = 'category-group';
        groupEl.id = `cat-group-${cat.id}`;

        const headerEl = document.createElement('div');
        headerEl.className = 'category-group-header';

        const titleEl = document.createElement('h3');
        titleEl.className = 'category-title';
        titleEl.innerHTML = `<span>${cat.icon}</span> <span>${cat.name}</span>`;

        const pillEl = document.createElement('span');
        pillEl.className = 'category-mode-pill';
        pillEl.textContent = cat.type === 'multiple' ? 'Múltipla escolha' : '1 escolha';

        headerEl.appendChild(titleEl);
        headerEl.appendChild(pillEl);
        groupEl.appendChild(headerEl);

        const chipsList = document.createElement('div');
        chipsList.className = 'chips-list';

        cat.options.forEach(opt => {
            const chipBtn = document.createElement('button');
            chipBtn.type = 'button';
            chipBtn.className = 'chip-btn';
            chipBtn.id = `chip-${cat.id}-${opt.id}`;
            chipBtn.textContent = opt.label;

            // Marca ativo de acordo com o estado inicial
            if (cat.type === 'single') {
                if (activeSelections[cat.id] === opt.id) chipBtn.classList.add('active');
            } else {
                if (activeSelections[cat.id]?.has(opt.id)) chipBtn.classList.add('active');
            }

            chipBtn.addEventListener('click', () => {
                handleChipClick(cat, opt);
            });

            chipsList.appendChild(chipBtn);
        });

        groupEl.appendChild(chipsList);
        container.appendChild(groupEl);
    });
}

/**
 * Gerencia a seleção de chips respeitando se é única ou múltipla escolha
 */
function handleChipClick(category, option) {
    if (category.type === 'single') {
        // Se clicar no já ativo, permite desmarcar ou trocar
        if (activeSelections[category.id] === option.id) {
            // Em subject, mantemos pelo menos um para o prompt não ficar vazio
            if (category.id !== 'subject') {
                activeSelections[category.id] = null;
            }
        } else {
            activeSelections[category.id] = option.id;
        }
    } else {
        // Múltipla escolha
        if (!activeSelections[category.id]) {
            activeSelections[category.id] = new Set();
        }
        if (activeSelections[category.id].has(option.id)) {
            activeSelections[category.id].delete(option.id);
        } else {
            activeSelections[category.id].add(option.id);
        }
    }

    syncChipsUI();
    updatePrompts();
}

/**
 * Atualiza as classes 'active' em todos os botões de chip
 */
function syncChipsUI() {
    PROMPT_DATABASE.forEach(cat => {
        cat.options.forEach(opt => {
            const chipBtn = document.getElementById(`chip-${cat.id}-${opt.id}`);
            if (!chipBtn) return;

            let isActive = false;
            if (cat.type === 'single') {
                isActive = (activeSelections[cat.id] === opt.id);
            } else {
                isActive = Boolean(activeSelections[cat.id]?.has(opt.id));
            }

            chipBtn.classList.toggle('active', isActive);
        });
    });
}

/**
 * Monta o Prompt Positivo em inglês para SDXL e a Trava Negativa SFW
 */
function updatePrompts() {
    const positiveParts = [];

    // 1. Identifica o sujeito (Personagem vs Item)
    const subjectCat = PROMPT_DATABASE.find(c => c.id === 'subject');
    const selectedSubject = subjectCat?.options.find(o => o.id === activeSelections.subject);

    if (selectedSubject) {
        if (selectedSubject.isCharacter) {
            // Regra SFW anti-alucinação: garante 1 único personagem isolado
            positiveParts.push('solo, single character');
        }
        positiveParts.push(selectedSubject.en);
    }

    // 2. Equipamentos / Cores selecionados
    const equipCat = PROMPT_DATABASE.find(c => c.id === 'equipment');
    if (equipCat && activeSelections.equipment) {
        equipCat.options.forEach(opt => {
            if (activeSelections.equipment.has(opt.id)) {
                positiveParts.push(opt.en);
            }
        });
    }

    // 3. Estilo Visual
    const styleCat = PROMPT_DATABASE.find(c => c.id === 'style');
    const selectedStyle = styleCat?.options.find(o => o.id === activeSelections.style);
    if (selectedStyle) {
        positiveParts.push(selectedStyle.en);
    }

    // 4. Enquadramento
    const frameCat = PROMPT_DATABASE.find(c => c.id === 'framing');
    const selectedFrame = frameCat?.options.find(o => o.id === activeSelections.framing);
    if (selectedFrame) {
        positiveParts.push(selectedFrame.en);
    }

    // 5. Fundo
    const bgCat = PROMPT_DATABASE.find(c => c.id === 'background');
    const selectedBg = bgCat?.options.find(o => o.id === activeSelections.background);
    let isWhiteBackground = false;

    if (selectedBg) {
        positiveParts.push(selectedBg.en);
        if (selectedBg.isWhiteBg) {
            isWhiteBackground = true;
        }
    }

    // Refinamento de Qualidade SDXL no final
    positiveParts.push('masterpiece, best quality, sharp focus, vibrant game asset');

    const finalPositive = positiveParts.join(', ');

    // Construção do Prompt Negativo com a Trava Automática
    let finalNegative = BASE_SFW_NEGATIVE;
    if (isWhiteBackground) {
        finalNegative += ', ' + WHITE_BG_NEGATIVE_EXTRA;
    }

    // Atualização nos elementos DOM
    const positiveBox = document.getElementById('positiveBox');
    const negativeBox = document.getElementById('negativeBox');

    if (positiveBox) positiveBox.textContent = finalPositive;
    if (negativeBox) negativeBox.textContent = finalNegative;
}

/**
 * Inicializa os botões de cópia rápida com feedback visual instantâneo
 */
function initClipboardButtons() {
    const btnPositive = document.getElementById('btnCopyPositive');
    const btnNegative = document.getElementById('btnCopyNegative');

    if (btnPositive) {
        btnPositive.addEventListener('click', () => {
            const text = document.getElementById('positiveBox')?.textContent || '';
            copyToClipboard(text, '✅ Prompt Positivo copiado com sucesso!');
        });
    }

    if (btnNegative) {
        btnNegative.addEventListener('click', () => {
            const text = document.getElementById('negativeBox')?.textContent || '';
            copyToClipboard(text, '✅ Prompt Negativo SFW copiado com sucesso!');
        });
    }
}

/**
 * Copia texto e exibe notificação Toast
 */
async function copyToClipboard(text, toastMsg) {
    try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
        } else {
            // Fallback para ambientes restritos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        showToast(toastMsg);
    } catch (err) {
        showToast('❌ Erro ao copiar. Selecione o texto e use Ctrl+C.');
    }
}

/**
 * Exibe notificação temporária
 */
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

/**
 * Botão para resetar seleções
 */
function initResetButton() {
    const btnReset = document.getElementById('btnResetAll');
    if (!btnReset) return;

    btnReset.addEventListener('click', () => {
        activeSelections.subject = 'knight';
        activeSelections.style = 'pixelart';
        activeSelections.equipment = new Set(['blue_armor']);
        activeSelections.framing = 'fullbody';
        activeSelections.background = 'white_bg';

        syncChipsUI();
        updatePrompts();
        showToast('🔄 Seleções redefinidas para o padrão!');
    });
}

/**
 * Ping periódico para detecção automática do ComfyUI local em 127.0.0.1:8188
 */
function startComfyStatusPing() {
    const statusBadge = document.getElementById('comfyStatus');
    const statusText = document.getElementById('statusText');

    async function checkServer() {
        let isOnline = false;
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 1600);

            // Verifica o endpoint do ComfyUI (system_stats ou raiz)
            const response = await fetch(`${COMFYUI_URL}/system_stats`, {
                method: 'GET',
                mode: 'cors',
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeoutId);

            if (response.ok || response.status === 200 || response.type === 'opaque') {
                isOnline = true;
            }
        } catch (e) {
            // Em caso de falha de CORS ou conexão recusada
            isOnline = false;
        }

        if (statusBadge && statusText) {
            if (isOnline) {
                statusBadge.className = 'status-badge status-online';
                statusBadge.title = 'Servidor ComfyUI conectado e pronto para receber prompts!';
                statusText.textContent = '🟢 ComfyUI Online';
            } else {
                statusBadge.className = 'status-badge status-offline';
                statusBadge.title = 'Servidor ComfyUI offline. Clique em "🚀 Ligar ComfyUI" para iniciar no PC do laboratório.';
                statusText.textContent = '🔴 ComfyUI Offline';
            }
        }
    }

    // Checagem imediata e depois a cada 2 segundos
    checkServer();
    setInterval(checkServer, PING_INTERVAL_MS);
}
