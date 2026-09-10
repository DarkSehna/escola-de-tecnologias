// ==========================================================================
// CORE GDD GENERATOR AND LIVE PREVIEWER
// Escola de Tecnologias - TitanTech
// ==========================================================================

// --- SISTEMA DE SINTETIZADOR DE ÁUDIO (WEB AUDIO API) ---
class SynthAudio {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, volume = 0.08) {
        const checkboxSound = document.getElementById("checkbox-sound");
        if (checkboxSound && !checkboxSound.checked) return;

        try {
            this.init();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            
            gain.gain.setValueAtTime(volume, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn("Web Audio API bloqueada ou indisponível.", e);
        }
    }

    playBoot() {
        this.playTone(523.25, 'sine', 0.15, 0.06); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.06), 70); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.06), 140); // G5
    }

    playClick() {
        this.playTone(880, 'sine', 0.06, 0.08); // A5
    }

    playTab() {
        this.playTone(698.46, 'triangle', 0.12, 0.05); // F5
    }

    playSuccess() {
        this.playTone(783.99, 'sine', 0.1, 0.08); // G5
        setTimeout(() => this.playTone(987.77, 'sine', 0.1, 0.08), 60); // B5
        setTimeout(() => this.playTone(1174.66, 'sine', 0.12, 0.08), 120); // D6
        setTimeout(() => this.playTone(1567.98, 'sine', 0.2, 0.08), 180); // G6
    }

    playWarning() {
        this.playTone(220, 'sawtooth', 0.25, 0.12);
        setTimeout(() => this.playTone(190, 'sawtooth', 0.25, 0.12), 60);
    }

    playRemove() {
        this.playTone(440, 'triangle', 0.1, 0.06);
        setTimeout(() => this.playTone(330, 'triangle', 0.15, 0.06), 50);
    }
}

const audio = new SynthAudio();

// --- MAPEAMENTO DOS ELEMENTOS DO FORMULÁRIO ---
const inputGameName = document.getElementById("input-game-name");
const comboGenre = document.getElementById("combo-genre");
const wrapperGenreOther = document.getElementById("wrapper-genre-other");
const inputGenreOther = document.getElementById("input-genre-other");

const inputCoreLoop = document.getElementById("input-core-loop");
const inputObjective = document.getElementById("input-objective");
const inputStory = document.getElementById("input-story");
const inputStageCount = document.getElementById("input-stage-count");
const inputLevelMap = document.getElementById("input-level-map");

const inputHeroName = document.getElementById("input-hero-name");
const inputHeroDesc = document.getElementById("input-hero-desc");
const inputBasicMovement = document.getElementById("input-basic-movement");
const inputActionsAttacks = document.getElementById("input-actions-attacks");

const checkboxes = document.querySelectorAll(".cyber-cb");
const cbOtherMechanics = document.getElementById("cb-other-mechanics");
const wrapperOtherMechanics = document.getElementById("wrapper-other-mechanics");
const inputOtherMechanics = document.getElementById("input-other-mechanics");

const inputWorldDesc = document.getElementById("input-world-desc");
const inputMinions = document.getElementById("input-minions");
const inputBosses = document.getElementById("input-bosses");
const inputVictory = document.getElementById("input-victory");
const inputDefeat = document.getElementById("input-defeat");
const inputExtraSystems = document.getElementById("input-extra-systems");

// Botões da Toolbar
const btnNewGdd = document.getElementById("btn-new-gdd");
const btnLoadGdd = document.getElementById("btn-load-gdd");
const fileUploader = document.getElementById("file-uploader");
const btnSaveGdd = document.getElementById("btn-save-gdd");

// XP e Status
const lblXpPercentage = document.getElementById("lbl-xp-percentage");
const xpBarFill = document.getElementById("xp-bar-fill");
const lblStatusMessage = document.getElementById("lbl-status-message");

// Preview
const btnCopyMarkdown = document.getElementById("btn-copy-markdown");
const gddDocumentSheet = document.getElementById("gdd-document-sheet");

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    // 1. Ouvintes de Abas
    setupTabSwitching();

    // 2. Ouvintes de Eventos para inputs do formulário
    const allTextInputs = [
        inputGameName, inputGenreOther, inputCoreLoop, inputObjective, inputStory,
        inputStageCount, inputLevelMap, inputHeroName, inputHeroDesc,
        inputBasicMovement, inputActionsAttacks, inputOtherMechanics,
        inputWorldDesc, inputMinions, inputBosses, inputVictory, inputDefeat, inputExtraSystems
    ];

    allTextInputs.forEach(input => {
        if (input) {
            input.addEventListener("input", handleFormUpdate);
        }
    });

    if (comboGenre) {
        comboGenre.addEventListener("change", () => {
            updateConditionalFields();
            handleFormUpdate();
        });
    }

    checkboxes.forEach(cb => {
        cb.addEventListener("change", () => {
            updateConditionalFields();
            handleFormUpdate();
        });
    });

    // 3. Ações de Arquivo
    if (btnNewGdd) btnNewGdd.addEventListener("click", resetDocumentConfirm);
    if (btnLoadGdd) {
        btnLoadGdd.addEventListener("click", () => {
            audio.playClick();
            if (fileUploader) fileUploader.click();
        });
    }
    if (fileUploader) fileUploader.addEventListener("change", loadGddFile);
    if (btnSaveGdd) btnSaveGdd.addEventListener("click", saveGddFile);
    if (btnCopyMarkdown) btnCopyMarkdown.addEventListener("click", copyMarkdownToClipboard);

    // 4. Sons
    audio.playBoot();

    // 5. Inicializa referências de jogos
    initGddReferences();

    // 6. Atualiza visibilidade de campos condicionais
    updateConditionalFields();

    // 7. Atualiza status e renderiza inicial
    handleFormUpdate();

    // 8. Tenta restaurar rascunho salvo do localStorage
    restoreAutosavedDraft();
});

// --- CONTROLE DE CAMPOS CONDICIONAIS ---
function updateConditionalFields() {
    if (wrapperGenreOther && comboGenre) {
        wrapperGenreOther.style.display = (comboGenre.value === "Outro") ? "flex" : "none";
    }
    if (wrapperOtherMechanics && cbOtherMechanics) {
        wrapperOtherMechanics.style.display = cbOtherMechanics.checked ? "flex" : "none";
    }
}

// --- LÓGICA DE ABAS (TABS) E TRILHA GAMIFICADA ---
function setupTabSwitching() {
    const tabTriggers = document.querySelectorAll(".tab-trigger");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            const tabKey = trigger.id.replace("tab-btn-", "");
            switchTab(tabKey);
        });
    });
}

function switchTab(tabKey) {
    const tabTriggers = document.querySelectorAll(".tab-trigger");
    const tabPanels = document.querySelectorAll(".tab-panel");

    const targetTrigger = document.getElementById(`tab-btn-${tabKey}`);
    const targetPanel = document.getElementById(`panel-${tabKey}`);

    if (targetTrigger && targetPanel) {
        tabTriggers.forEach(btn => btn.classList.remove("active"));
        tabPanels.forEach(panel => panel.classList.remove("active"));

        targetTrigger.classList.add("active");
        targetPanel.classList.add("active");

        audio.playTab();
        updateRailNodes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function updateRailNodes() {
    const p1 = document.getElementById("panel-overview");
    const p2 = document.getElementById("panel-character");
    const p3 = document.getElementById("panel-mechanics");

    const r1 = document.getElementById("checkpoint-step-1");
    const r2 = document.getElementById("checkpoint-step-2");
    const r3 = document.getElementById("checkpoint-step-3");

    const s1 = document.getElementById("node-status-1");
    const s2 = document.getElementById("node-status-2");
    const s3 = document.getElementById("node-status-3");

    const titleOk = inputGameName && inputGameName.value.trim() !== "";
    const victoryOk = inputVictory && inputVictory.value.trim() !== "";
    const defeatOk = inputDefeat && inputDefeat.value.trim() !== "";
    const heroOk = (inputHeroName && inputHeroName.value.trim() !== "") || 
                   (inputBasicMovement && inputBasicMovement.value.trim() !== "") || 
                   (inputActionsAttacks && inputActionsAttacks.value.trim() !== "");

    // Step 1 status
    if (titleOk) {
        if (r1) r1.classList.add("completed");
        if (s1) s1.textContent = "[ ✓ OK ]";
    } else {
        if (r1) r1.classList.remove("completed");
        if (s1) s1.textContent = "[ PENDENTE ]";
    }

    // Step 2 status
    if (heroOk) {
        if (r2) r2.classList.add("completed");
        if (s2) s2.textContent = "[ ✓ OK ]";
    } else {
        if (r2) r2.classList.remove("completed");
        if (s2) s2.textContent = "[ PENDENTE ]";
    }

    // Step 3 status
    if (victoryOk && defeatOk) {
        if (r3) r3.classList.add("completed");
        if (s3) s3.textContent = "[ ✓ OK ]";
    } else {
        if (r3) r3.classList.remove("completed");
        if (s3) s3.textContent = "[ PENDENTE ]";
    }

    // Active tab in rail
    [r1, r2, r3].forEach(r => r && r.classList.remove("active"));
    if (p1 && p1.classList.contains("active") && r1) r1.classList.add("active");
    if (p2 && p2.classList.contains("active") && r2) r2.classList.add("active");
    if (p3 && p3.classList.contains("active") && r3) r3.classList.add("active");

    // Tab Badges
    const b1 = document.getElementById("badge-tab-overview");
    const b2 = document.getElementById("badge-tab-character");
    const b3 = document.getElementById("badge-tab-mechanics");

    if (b1) {
        b1.textContent = titleOk ? "✓" : "!";
        b1.className = titleOk ? "tab-badge success" : "tab-badge warning";
    }
    if (b2) {
        b2.textContent = heroOk ? "✓" : "-";
        b2.className = heroOk ? "tab-badge success" : "tab-badge warning";
    }
    if (b3) {
        b3.textContent = (victoryOk && defeatOk) ? "✓" : "!";
        b3.className = (victoryOk && defeatOk) ? "tab-badge success" : "tab-badge warning";
    }
}

// --- CONTROLE DA GAVETA LATERAL FLUTUANTE (OFF-CANVAS GDD DRAWER) ---
function openPreviewDrawer() {
    const drawer = document.getElementById("gdd-preview-drawer");
    const overlay = document.getElementById("gdd-preview-overlay");
    if (drawer) drawer.classList.add("open");
    if (overlay) overlay.classList.add("open");
    renderLiveMarkdownPreview();
    audio.playClick();
}

function closePreviewDrawer() {
    const drawer = document.getElementById("gdd-preview-drawer");
    const overlay = document.getElementById("gdd-preview-overlay");
    if (drawer) drawer.classList.remove("open");
    if (overlay) overlay.classList.remove("open");
}

function togglePreviewDrawer() {
    const drawer = document.getElementById("gdd-preview-drawer");
    if (drawer && drawer.classList.contains("open")) {
        closePreviewDrawer();
    } else {
        openPreviewDrawer();
    }
}

function saveCurrentGddProject() {
    const titleFilled = inputGameName && inputGameName.value.trim() !== "";
    const victoryFilled = inputVictory && inputVictory.value.trim() !== "";
    const defeatFilled = inputDefeat && inputDefeat.value.trim() !== "";

    if (!titleFilled || !victoryFilled || !defeatFilled) {
        showToast("⚠️ Preencha os campos obrigatórios (Título, Vitória e Derrota) antes de salvar!");
        audio.playWarning();
        return;
    }
    saveGddFile();
}

// --- CONTROLE DE PROGRESSO E VALIDAÇÃO ---
function handleFormUpdate() {
    // 1. Atualizar Tags de Status dos inputs individuais
    updateInputStatusBadge("input-game-name", "status-game-name", true);
    updateInputStatusBadge("input-genre-other", "status-genre-other", false);
    updateInputStatusBadge("input-core-loop", "status-core-loop", false);
    updateInputStatusBadge("input-objective", "status-objective", false);
    updateInputStatusBadge("input-story", "status-story", false);
    updateInputStatusBadge("input-stage-count", "status-stage-count", false);
    updateInputStatusBadge("input-level-map", "status-level-map", false);

    updateInputStatusBadge("input-hero-name", "status-hero-name", false);
    updateInputStatusBadge("input-hero-desc", "status-hero-desc", false);
    updateInputStatusBadge("input-basic-movement", "status-basic-movement", false);
    updateInputStatusBadge("input-actions-attacks", "status-actions-attacks", false);

    updateInputStatusBadge("input-other-mechanics", "status-other-mechanics", false);
    updateInputStatusBadge("input-world-desc", "status-world-desc", false);
    updateInputStatusBadge("input-minions", "status-minions", false);
    updateInputStatusBadge("input-bosses", "status-bosses", false);
    
    updateInputStatusBadge("input-victory", "status-victory", true);
    updateInputStatusBadge("input-defeat", "status-defeat", true);
    updateInputStatusBadge("input-extra-systems", "status-extra-systems", false);

    // 2. Calcular completude %
    const filledPercentage = getCompletionPercentage();
    if (lblXpPercentage) lblXpPercentage.textContent = `${filledPercentage}% CONCLUÍDO`;
    if (xpBarFill) xpBarFill.style.height = `${filledPercentage}%`;

    const fabBadge = document.getElementById("fab-xp-badge");
    if (fabBadge) fabBadge.textContent = `${filledPercentage}%`;

    // 3. Validar se requisitos básicos estão preenchidos para salvar
    const titleFilled = inputGameName && inputGameName.value.trim() !== "";
    const victoryFilled = inputVictory && inputVictory.value.trim() !== "";
    const defeatFilled = inputDefeat && inputDefeat.value.trim() !== "";

    const btnDrawerSave = document.getElementById("btn-drawer-save");

    if (titleFilled && victoryFilled && defeatFilled) {
        if (btnSaveGdd) {
            btnSaveGdd.classList.remove("disabled-style");
            btnSaveGdd.textContent = "💾 Salvar GDD (Pronto!)";
        }
        if (btnDrawerSave) {
            btnDrawerSave.classList.remove("disabled-style");
            btnDrawerSave.textContent = "💾 Baixar Documento (.md)";
        }
        if (lblStatusMessage) {
            lblStatusMessage.textContent = "[ STATUS ] Requisitos básicos preenchidos. Banco de dados pronto para gravação.";
            lblStatusMessage.style.color = "var(--color-neon-green)";
        }
    } else {
        if (btnSaveGdd) {
            btnSaveGdd.classList.add("disabled-style");
            btnSaveGdd.textContent = "💾 Salvar GDD (Incompleto)";
        }
        if (btnDrawerSave) {
            btnDrawerSave.classList.add("disabled-style");
            btnDrawerSave.textContent = "💾 Preencha Título, Vitória e Derrota";
        }
        if (lblStatusMessage) {
            lblStatusMessage.textContent = "[ STATUS ] Preencha Título, Vitória e Derrota para desbloquear gravação.";
            lblStatusMessage.style.color = "var(--color-gray-muted)";
        }
    }

    // 4. Atualizar nós da trilha gamificada e badges das abas
    updateRailNodes();

    // 5. Redesenhar Preview na folha
    renderLiveMarkdownPreview();

    // 6. Acionar salvamento automático no localStorage
    triggerAutosave();
}

function updateInputStatusBadge(inputId, badgeId, isObligatory) {
    const input = document.getElementById(inputId);
    const badge = document.getElementById(badgeId);
    if (!input || !badge) return;

    const hasValue = input.value.trim() !== "";

    if (hasValue) {
        badge.textContent = "[ OK ]";
        badge.className = "status-badge status-success";
    } else {
        if (isObligatory) {
            badge.textContent = "[ ! ]";
            badge.className = "status-badge status-warning";
        } else {
            badge.textContent = "[ - ]";
            badge.className = "status-badge status-muted";
        }
    }
}

function getCompletionPercentage() {
    let filled = 0;
    const totalFields = 16;

    const textFields = [
        inputGameName, inputCoreLoop, inputObjective, inputStory, inputStageCount, inputLevelMap,
        inputHeroName, inputHeroDesc, inputBasicMovement, inputActionsAttacks,
        inputWorldDesc, inputMinions, inputBosses, inputVictory, inputDefeat, inputExtraSystems
    ];

    textFields.forEach(field => {
        if (field && field.value.trim() !== "") filled++;
    });

    if (comboGenre && comboGenre.value === "Outro" && inputGenreOther && inputGenreOther.value.trim() !== "") {
        filled++;
    }

    const hasCheckboxes = getSelectedMechanics().length > 0;
    if (hasCheckboxes) filled++;

    return Math.min(100, Math.round((filled / totalFields) * 100));
}

function getSelectedMechanics() {
    const list = [];
    checkboxes.forEach(cb => {
        if (cb.checked) {
            if (cb.value === "Outros" && inputOtherMechanics && inputOtherMechanics.value.trim() !== "") {
                list.push(`Outros: ${inputOtherMechanics.value.trim()}`);
            } else {
                list.push(cb.value);
            }
        }
    });
    return list;
}

// --- GERAR E RENDERIZAR MARKDOWN (LIVE PREVIEW) ---
function generateGddMarkdown() {
    const gameName = inputGameName ? inputGameName.value.trim() || "Jogo Sem Nome" : "Jogo Sem Nome";
    
    let genreStr = comboGenre ? comboGenre.value : "Plataforma";
    if (genreStr === "Outro" && inputGenreOther && inputGenreOther.value.trim() !== "") {
        genreStr = `Outro (${inputGenreOther.value.trim()})`;
    }

    const coreLoop = inputCoreLoop ? inputCoreLoop.value.trim() : "";
    const objective = inputObjective ? inputObjective.value.trim() : "";
    const story = inputStory ? inputStory.value.trim() : "";
    const stageCount = inputStageCount ? inputStageCount.value.trim() : "";
    const levelMap = inputLevelMap ? inputLevelMap.value.trim() : "";

    const heroName = inputHeroName ? inputHeroName.value.trim() || "Herói" : "Herói";
    const heroDesc = inputHeroDesc ? inputHeroDesc.value.trim() : "";
    const basicMovement = inputBasicMovement ? inputBasicMovement.value.trim() : "";
    const actionsAttacks = inputActionsAttacks ? inputActionsAttacks.value.trim() : "";

    const worldMechanicsSelected = getSelectedMechanics();
    const worldMechanicsDesc = inputWorldDesc ? inputWorldDesc.value.trim() : "";
    const minionsDesc = inputMinions ? inputMinions.value.trim() : "";
    const bossesDesc = inputBosses ? inputBosses.value.trim() : "";

    const victoryCond = inputVictory ? inputVictory.value.trim() : "";
    const defeatCond = inputDefeat ? inputDefeat.value.trim() : "";
    const extraSystems = inputExtraSystems ? inputExtraSystems.value.trim() : "";

    // Checklist mecânicas
    let mechanicsListStr = "";
    if (worldMechanicsSelected.length > 0) {
        mechanicsListStr = worldMechanicsSelected.map(mech => `- [x] ${mech}`).join("\n");
    } else {
        mechanicsListStr = "*Nenhuma mecânica específica selecionada.*";
    }

    // Dados estruturados JSON no topo
    const rawData = getFormJSONData();
    const frontmatter = `<!-- GDD_PROJECT_DATA:\n${JSON.stringify(rawData, null, 4)}\n-->\n`;

    return frontmatter + `# 📝 Game Design Document (GDD) - ${gameName}

> Este documento de design de jogo (GDD) serve como guia para a criação, arte e programação do seu jogo em qualquer plataforma ou engine de desenvolvimento.

---

## 🌍 1. Visão Geral e Diretrizes do Sistema

* **Gênero:** ${genreStr}
* **Ciclo Principal (Core Loop):**
  ${coreLoop ? coreLoop : "*Sem ciclo principal definido.*"}

* **Objetivo Geral do Jogo:**
  ${objective ? objective : "*Sem objetivo definido.*"}

### 📖 História e Premissa (Lore)
${story ? story : "*Sem história definida.*"}

### 🗺️ Estrutura de Fases & Mapa do Jogo
* **Quantidade de Fases:** ${stageCount ? stageCount : "*Não especificada.*"}
* **Descrição do Mapa/Temas:**
  ${levelMap ? levelMap : "*Sem descrição de mapa.*"}

---

## 👤 2. Avatar & Habilidades

* **Nome do Protagonista:** ${heroName}
* **Visual e História:**
  ${heroDesc ? heroDesc : "*Sem descrição do protagonista.*"}

### 🏃 Movimentação Básica
${basicMovement ? basicMovement : "*Sem movimentação descrita.*"}

### ⚔️ Ações e Ataques
${actionsAttacks ? actionsAttacks : "*Sem ações e ataques descritos.*"}

---

## ⚙️ 3. Regras, Ameaças & Sistemas

### 🧱 Elementos e Obstáculos Ativos
${mechanicsListStr}

### 🛠️ Funcionamento Prático das Armadilhas e Obstáculos
${worldMechanicsDesc ? worldMechanicsDesc : "*Sem descrição do funcionamento de armadilhas.*"}

### 👾 Inimigos Comuns (Minions)
${minionsDesc ? minionsDesc : "*Sem descrição de inimigos comuns.*"}

### 👑 Chefões (Bosses) e Padrões de Ataque
${bossesDesc ? bossesDesc : "*Sem chefões descritos.*"}

---

## 🏆 4. Regras do Jogo (Progresso)

### 🥇 Condição de Avanço (Próxima Fase)
${victoryCond ? victoryCond : "*Sem condição de avanço definida.*"}

### 💀 Penalidade por Falha (Punição / Game Over)
${defeatCond ? defeatCond : "*Sem penalidade por falha definida.*"}

${extraSystems ? `\n--- \n\n## 🛠️ 5. Sistemas Extras e Variáveis\n${extraSystems}\n` : ""}
---
*GDD gerado automaticamente pelo **Gerador de GDD**.*
`;
}

function getFormJSONData() {
    return {
        game_name: inputGameName ? inputGameName.value.trim() : "",
        genre: comboGenre ? comboGenre.value : "Plataforma",
        genre_other: inputGenreOther ? inputGenreOther.value.trim() : "",
        core_loop: inputCoreLoop ? inputCoreLoop.value.trim() : "",
        objective: inputObjective ? inputObjective.value.trim() : "",
        story: inputStory ? inputStory.value.trim() : "",
        stage_count: inputStageCount ? inputStageCount.value.trim() : "",
        level_map: inputLevelMap ? inputLevelMap.value.trim() : "",
        hero_name: inputHeroName ? inputHeroName.value.trim() : "",
        hero_desc: inputHeroDesc ? inputHeroDesc.value.trim() : "",
        basic_movement: inputBasicMovement ? inputBasicMovement.value.trim() : "",
        actions_attacks: inputActionsAttacks ? inputActionsAttacks.value.trim() : "",
        world_mechanics_selected: getSelectedMechanics(),
        other_mechanics: inputOtherMechanics ? inputOtherMechanics.value.trim() : "",
        world_mechanics_desc: inputWorldDesc ? inputWorldDesc.value.trim() : "",
        minions_desc: inputMinions ? inputMinions.value.trim() : "",
        bosses_desc: inputBosses ? inputBosses.value.trim() : "",
        victory_cond: inputVictory ? inputVictory.value.trim() : "",
        defeat_cond: inputDefeat ? inputDefeat.value.trim() : "",
        extra_systems: inputExtraSystems ? inputExtraSystems.value.trim() : ""
    };
}

// Renderiza a visualização HTML do Markdown de forma procedural
function renderLiveMarkdownPreview() {
    const rawMarkdown = generateGddMarkdown();
    
    // Remove o bloco frontmatter de comentário JSON para visualização limpa
    const cleanMarkdown = rawMarkdown.replace(/<!--[\s\S]*?-->/g, "").trim();

    // Parser simples de Markdown aprimorado para HTML
    let html = cleanMarkdown
        // H1
        .replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
        // H2
        .replace(/^##\s+(.+)$/gm, "<h2>$1</h2>")
        // H3
        .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>")
        // Dividers
        .replace(/^---$/gm, "<hr>")
        // Blockquotes
        .replace(/^>\s+(.+)$/gm, "<blockquote><p>$1</p></blockquote>")
        // Checkboxes ativos
        .replace(/^- \[x\]\s+(.+)$/gm, "<li><span class='cb-tick'>✓</span> $1</li>")
        // Listas comuns
        .replace(/^\*\s+(.+)$/gm, "<li>$1</li>")
        // Negritos (parciais)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        // Inline code
        .replace(/`(.*?)`/g, "<code>$1</code>");

    // Parser para tabelas markdown básicas
    // Procura por blocos de tabela iniciados por '|' e reconstrói estruturalmente
    const lines = html.split("\n");
    let inTable = false;
    let tableHtml = "";

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("|")) {
            if (!inTable) {
                inTable = true;
                tableHtml = "<table>";
            }
            
            // Pula a linha separadora de colunas (contém ---)
            if (line.includes("---")) {
                continue;
            }

            const cols = line.split("|").slice(1, -1).map(c => c.trim());
            const rowTag = tableHtml.includes("<th>") ? "td" : "th";
            
            tableHtml += "<tr>";
            cols.forEach(c => {
                tableHtml += `<${rowTag}>${c}</${rowTag}>`;
            });
            tableHtml += "</tr>";

            lines[i] = ""; // Apaga a linha original no array
        } else {
            if (inTable) {
                inTable = false;
                tableHtml += "</table>";
                // Insere a tabela na linha anterior
                lines[i - 1] += tableHtml;
            }
        }
    }

    // Junta linhas restantes e remove vazios duplicados
    html = lines.join("\n").replace(/\n{2,}/g, "<br>");

    // Transforma listas agrupadas em <ul>
    html = html.replace(/(<li>.*?<\/li>)/gs, "<ul>$1</ul>");
    // Limpa tags <ul> adjacentes criadas incorretamente no replace global
    html = html.replace(/<\/ul>\s*<ul>/g, "");

    gddDocumentSheet.innerHTML = html;
}

// --- COPIAR MARKDOWN ---
function copyMarkdownToClipboard() {
    const mdText = generateGddMarkdown();
    try {
        navigator.clipboard.writeText(mdText).then(() => {
            audio.playSuccess();
            showToast("GDD copiado em Markdown!");
        }).catch(err => {
            console.error("Falha ao copiar markdown", err);
        });
    } catch (e) {
        console.error(e);
    }
}

// --- AÇÕES DE SALVAR E CARREGAR ---
function saveGddFile() {
    const data = getFormJSONData();

    // Validações obrigatórias
    if (!data.game_name) {
        audio.playWarning();
        alert("O Título do Projeto é obrigatório!");
        document.getElementById("tab-btn-overview").click();
        inputGameName.focus();
        return;
    }

    if (!data.victory_cond) {
        audio.playWarning();
        alert("A Condição de Vitória do herói é obrigatória!");
        document.getElementById("tab-btn-mechanics").click();
        inputVictory.focus();
        return;
    }

    if (!data.defeat_cond) {
        audio.playWarning();
        alert("A Condição de Derrota (Game Over) é obrigatória!");
        document.getElementById("tab-btn-mechanics").click();
        inputDefeat.focus();
        return;
    }

    // Compila conteúdo final
    const mdContent = generateGddMarkdown();

    // Trigger de download nativo (Blob API)
    const blob = new Blob([mdContent], { type: "text/markdown;charset=utf-8" });
    const link = document.createElement("a");
    const filename = `GDD_${data.game_name.replace(/\s+/g, "_")}.md`;

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    audio.playSuccess();
    lblStatusMessage.textContent = `[ STATUS ] Documento '${filename}' gravado com sucesso!`;
    lblStatusMessage.style.color = "var(--color-neon-green)";
    showToast("GDD exportado com sucesso!");
}

function loadGddFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(evt) {
        const content = evt.target.result;
        
        try {
            let data = null;
            const ext = file.name.split(".").pop().toLowerCase();

            // 1. Arquivos JSON direto
            if (ext === "json") {
                data = JSON.parse(content);
            } 
            // 2. Arquivos Markdown Híbridos
            else {
                const startMarker = "<!-- GDD_PROJECT_DATA:";
                const endMarker = "-->";

                const startIdx = content.indexOf(startMarker);
                if (startIdx === -1) {
                    throw new Error("Este arquivo não contém metadados de projeto para o Gerador de GDD.");
                }

                const jsonStart = startIdx + startMarker.length;
                const endIdx = content.indexOf(endMarker, jsonStart);

                if (endIdx === -1) {
                    throw new Error("Estrutura de metadados de carregamento corrompida.");
                }

                const jsonStr = content.substring(jsonStart, endIdx).trim();
                data = JSON.parse(jsonStr);
            }

            if (data) {
                populateFormWithData(data);
                
                // Retorna para a primeira aba
                document.getElementById("tab-btn-overview").click();
                
                audio.playSuccess();
                lblStatusMessage.textContent = `[ STATUS ] Documento '${file.name}' carregado com sucesso!`;
                lblStatusMessage.style.color = "var(--color-neon-green)";
                showToast("Projeto GDD restaurado!");
            }
        } catch (err) {
            audio.playWarning();
            alert("Erro ao abrir arquivo GDD:\n\n" + err.message);
            console.error(err);
        }
    };
    reader.readAsText(file);
    // Limpa valor para permitir carregar o mesmo arquivo consecutivamente
    fileUploader.value = "";
}

function populateFormWithData(data) {
    if (!data) return;

    // Overview tab
    if (inputGameName) inputGameName.value = data.game_name || "";
    if (comboGenre) comboGenre.value = data.genre || "Plataforma";
    if (inputGenreOther) inputGenreOther.value = data.genre_other || "";
    if (inputCoreLoop) inputCoreLoop.value = data.core_loop || "";
    if (inputObjective) inputObjective.value = data.objective || "";
    if (inputStory) inputStory.value = data.story || "";
    if (inputStageCount) inputStageCount.value = data.stage_count || "";
    if (inputLevelMap) inputLevelMap.value = data.level_map || data.world_setting || "";

    // Avatar tab
    if (inputHeroName) inputHeroName.value = data.hero_name || "";
    if (inputHeroDesc) inputHeroDesc.value = data.hero_desc || "";
    if (inputBasicMovement) inputBasicMovement.value = data.basic_movement || data.hero_skills || "";
    if (inputActionsAttacks) inputActionsAttacks.value = data.actions_attacks || "";

    // Mechanics tab Checkboxes
    const selectedMechs = data.world_mechanics_selected || [];
    checkboxes.forEach(cb => {
        if (cb.value === "Outros") {
            cb.checked = selectedMechs.some(m => typeof m === "string" && m.startsWith("Outros"));
        } else {
            cb.checked = selectedMechs.includes(cb.value);
        }
    });

    if (inputOtherMechanics) inputOtherMechanics.value = data.other_mechanics || "";
    if (inputWorldDesc) inputWorldDesc.value = data.world_mechanics_desc || "";
    if (inputMinions) inputMinions.value = data.minions_desc || "";
    if (inputBosses) inputBosses.value = data.bosses_desc || "";
    if (inputVictory) inputVictory.value = data.victory_cond || "";
    if (inputDefeat) inputDefeat.value = data.defeat_cond || "";
    if (inputExtraSystems) inputExtraSystems.value = data.extra_systems || "";

    // Sincroniza visibilidade condicional e estado visual
    updateConditionalFields();
    handleFormUpdate();
}

function resetDocumentConfirm() {
    audio.playClick();
    const confirmClear = confirm("Começar um Novo Documento?\n\nIsso irá limpar todos os campos preenchidos atuais e reiniciará a Quest!");
    if (confirmClear) {
        // Limpa campos da Aba 1
        if (inputGameName) inputGameName.value = "";
        if (comboGenre) comboGenre.selectedIndex = 0;
        if (inputGenreOther) inputGenreOther.value = "";
        if (inputCoreLoop) inputCoreLoop.value = "";
        if (inputObjective) inputObjective.value = "";
        if (inputStory) inputStory.value = "";
        if (inputStageCount) inputStageCount.value = "";
        if (inputLevelMap) inputLevelMap.value = "";

        // Limpa campos da Aba 2
        if (inputHeroName) inputHeroName.value = "";
        if (inputHeroDesc) inputHeroDesc.value = "";
        if (inputBasicMovement) inputBasicMovement.value = "";
        if (inputActionsAttacks) inputActionsAttacks.value = "";

        // Limpa campos da Aba 3
        checkboxes.forEach(cb => {
            cb.checked = false;
        });

        if (inputOtherMechanics) inputOtherMechanics.value = "";
        if (inputWorldDesc) inputWorldDesc.value = "";
        if (inputMinions) inputMinions.value = "";
        if (inputBosses) inputBosses.value = "";
        if (inputVictory) inputVictory.value = "";
        if (inputDefeat) inputDefeat.value = "";
        if (inputExtraSystems) inputExtraSystems.value = "";

        // Limpa rascunho automático do localStorage
        localStorage.removeItem("titanTech_gdd_draft");

        // Sincroniza visual, campos condicionais e vai para primeira aba
        updateConditionalFields();
        document.getElementById("tab-btn-overview").click();
        handleFormUpdate();

        audio.playBoot();
        showToast("Novo GDD iniciado.");
    }
}

// --- UTILS ---
function showToast(message) {
    let toast = document.getElementById("tt-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "tt-toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = "toast show";
    
    setTimeout(() => {
        toast.className = "toast";
    }, 3000);
}

// --- SISTEMA DE INSPIRAÇÃO / REFERÊNCIAS DE JOGOS ---
let selectedReferenceGame = null;

function initGddReferences() {
    const selectRef = document.getElementById("select-reference-game");
    const drawer = document.getElementById("reference-drawer");
    const btnCloseDrawer = document.getElementById("btn-close-drawer");
    const btnMerge = document.getElementById("btn-merge-reference");
    const refTitle = document.getElementById("ref-game-title");
    const refContent = document.getElementById("ref-drawer-content");

    if (!selectRef || !drawer) return;

    // 1. Carrega as referências a partir da base global referencias_jogos.js
    if (typeof referencesDatabase !== "undefined" && Array.isArray(referencesDatabase)) {
        referencesDatabase.forEach(game => {
            const opt = document.createElement("option");
            opt.value = game.id;
            opt.textContent = `${game.titulo} (${game.genero})`;
            selectRef.appendChild(opt);
        });
    } else {
        console.error("Banco de dados 'referencesDatabase' não carregado.");
    }

    // 2. Escuta a mudança de seleção no dropdown
    selectRef.addEventListener("change", (e) => {
        const gameId = e.target.value;
        if (!gameId) {
            drawer.classList.remove("open");
            selectedReferenceGame = null;
            return;
        }

        selectedReferenceGame = referencesDatabase.find(g => g.id === gameId);
        if (selectedReferenceGame) {
            audio.playClick();
            // Atualiza os dados da gaveta
            refTitle.textContent = selectedReferenceGame.titulo;
            
            // Renderiza as seções
            refContent.innerHTML = `
                <div class="ref-section">
                    <h4>Gênero</h4>
                    <p>${selectedReferenceGame.genero}</p>
                </div>
                <div class="ref-section">
                    <h4>Objetivo Principal</h4>
                    <p>${selectedReferenceGame.objetivo}</p>
                </div>
                <div class="ref-section">
                    <h4>Premissa / História</h4>
                    <p>${selectedReferenceGame.lore}</p>
                </div>
                <div class="ref-section">
                    <h4>Ambiente / Cenário</h4>
                    <p>${selectedReferenceGame.ambiente}</p>
                </div>
                <div class="ref-section">
                    <h4>Herói (Nome)</h4>
                    <p>${selectedReferenceGame.heroi_identidade}</p>
                </div>
                <div class="ref-section">
                    <h4>Herói (Aparência)</h4>
                    <p>${selectedReferenceGame.heroi_aparencia}</p>
                </div>
                <div class="ref-section">
                    <h4>Habilidades do Herói</h4>
                    <p>${selectedReferenceGame.heroi_habilidades}</p>
                </div>
                <div class="ref-section">
                    <h4>Mecânicas do Mundo</h4>
                    <p>${selectedReferenceGame.mecanicas_mundo}</p>
                </div>
                <div class="ref-section">
                    <h4>Bestiário (Inimigos)</h4>
                    <p>${selectedReferenceGame.bestiario}</p>
                </div>
                <div class="ref-section">
                    <h4>Chefes (Bosses)</h4>
                    <p>${selectedReferenceGame.chefes}</p>
                </div>
                <div class="ref-section">
                    <h4>Condição de Vitória</h4>
                    <p>${selectedReferenceGame.condicao_vitoria}</p>
                </div>
                <div class="ref-section">
                    <h4>Condição de Derrota</h4>
                    <p>${selectedReferenceGame.condicao_derrota}</p>
                </div>
            `;

            // Abre a gaveta lateral
            drawer.classList.add("open");
        }
    });

    // 3. Botão Fechar Gaveta
    btnCloseDrawer.addEventListener("click", () => {
        audio.playClick();
        drawer.classList.remove("open");
        selectRef.value = ""; // Reseta seleção do dropdown
        selectedReferenceGame = null;
    });

    // 4. Botão de Mesclar Referência no Formulário
    btnMerge.addEventListener("click", () => {
        if (!selectedReferenceGame) return;

        const confirmMerge = confirm(`Deseja preencher o GDD com o modelo do jogo "${selectedReferenceGame.titulo}"?\n\nIsso substituirá os dados atuais.`);
        if (!confirmMerge) return;

        audio.playSuccess();

        // Insere as informações nos campos
        if (inputGameName) inputGameName.value = selectedReferenceGame.titulo || "";
        
        // Trata o Gênero select
        if (selectedReferenceGame.genero.includes("Metroidvania")) {
            comboGenre.value = "Metroidvania";
        } else if (selectedReferenceGame.genero.includes("Plataforma")) {
            comboGenre.value = "Plataforma";
        } else if (selectedReferenceGame.genero.includes("Top-Down")) {
            comboGenre.value = "Top-Down (RPG / Aventura)";
        } else if (selectedReferenceGame.genero.includes("Puzzle")) {
            comboGenre.value = "Puzzle";
        } else if (selectedReferenceGame.genero.includes("Shooter")) {
            comboGenre.value = "Shooter / Shooter 2D";
        } else {
            comboGenre.value = "Outro";
            if (inputGenreOther) inputGenreOther.value = selectedReferenceGame.genero;
        }

        if (inputCoreLoop) inputCoreLoop.value = selectedReferenceGame.core_loop || selectedReferenceGame.objetivo || "";
        if (inputObjective) inputObjective.value = selectedReferenceGame.objetivo || "";
        if (inputStory) inputStory.value = selectedReferenceGame.lore || "";
        if (inputStageCount) inputStageCount.value = selectedReferenceGame.fases || "3 Fases";
        if (inputLevelMap) inputLevelMap.value = selectedReferenceGame.ambiente || "";

        if (inputHeroName) inputHeroName.value = selectedReferenceGame.heroi_identidade || "";
        if (inputHeroDesc) inputHeroDesc.value = selectedReferenceGame.heroi_aparencia || "";
        if (inputBasicMovement) inputBasicMovement.value = selectedReferenceGame.movimentacao || selectedReferenceGame.heroi_habilidades || "";
        if (inputActionsAttacks) inputActionsAttacks.value = selectedReferenceGame.acoes_ataques || selectedReferenceGame.heroi_habilidades || "";

        if (inputWorldDesc) inputWorldDesc.value = selectedReferenceGame.mecanicas_mundo || "";
        if (inputMinions) inputMinions.value = selectedReferenceGame.bestiario || "";
        if (inputBosses) inputBosses.value = selectedReferenceGame.chefes || "";
        if (inputVictory) inputVictory.value = selectedReferenceGame.condicao_vitoria || "";
        if (inputDefeat) inputDefeat.value = selectedReferenceGame.condicao_derrota || "";
        if (inputExtraSystems) inputExtraSystems.value = selectedReferenceGame.sistemas_extras || "";

        // Reseta as checkboxes
        checkboxes.forEach(cb => {
            cb.checked = false;
        });

        // Tenta pré-selecionar as mecânicas com base na referência
        checkboxes.forEach(cb => {
            const val = cb.value.toLowerCase();
            if (val === "armadilhas" && (selectedReferenceGame.id === "sotn" || selectedReferenceGame.id === "hollow" || selectedReferenceGame.id === "celeste" || selectedReferenceGame.id === "mario")) {
                cb.checked = true;
            }
            if (val === "paredes falsas" && (selectedReferenceGame.id === "sotn" || selectedReferenceGame.id === "hollow" || selectedReferenceGame.id === "mario")) {
                cb.checked = true;
            }
            if (val === "plataformas móveis" && (selectedReferenceGame.id === "sotn" || selectedReferenceGame.id === "mario" || selectedReferenceGame.id === "celeste")) {
                cb.checked = true;
            }
            if (val === "limite de tempo" && (selectedReferenceGame.id === "mario" || selectedReferenceGame.id === "pacman" || selectedReferenceGame.id === "minecraft")) {
                cb.checked = true;
            }
        });

        // Fecha a gaveta lateral
        drawer.classList.remove("open");
        selectRef.value = "";
        selectedReferenceGame = null;

        // Atualiza a visualização do GDD e o Quest Tracker
        handleFormUpdate();
        showToast("Referência mesclada no GDD!");
    });
}

// --- SALVAMENTO AUTOMÁTICO (LOCALSTORAGE AUTO-SAVE) ---
let autosaveTimeout = null;

function triggerAutosave() {
    // 1. Coleta dados
    const data = getFormJSONData();
    
    // 2. Só salva se houver algum conteúdo preenchido (não em branco)
    const hasAnyContent = Object.values(data).some(val => {
        if (typeof val === "string") return val.trim() !== "";
        if (Array.isArray(val)) return val.length > 0;
        return false;
    });

    if (!hasAnyContent) return;

    // 3. Salva no localStorage
    localStorage.setItem("titanTech_gdd_draft", JSON.stringify(data));

    // 4. Mostra indicador visual "Auto-salvo" temporário
    const lblAutosave = document.getElementById("lbl-autosave-status");
    if (lblAutosave) {
        lblAutosave.textContent = "[ Rascunho Auto-salvo ]";
        lblAutosave.classList.add("visible");
        
        if (autosaveTimeout) clearTimeout(autosaveTimeout);
        autosaveTimeout = setTimeout(() => {
            lblAutosave.classList.remove("visible");
        }, 1500);
    }
}

function restoreAutosavedDraft() {
    try {
        const savedDraft = localStorage.getItem("titanTech_gdd_draft");
        if (savedDraft) {
            const data = JSON.parse(savedDraft);
            
            // Só restaura se o usuário tiver algo realmente salvo
            if (data && (data.game_name || data.objective || data.story || data.victory_cond)) {
                populateFormWithData(data);
                showToast("Rascunho anterior recuperado!");
                const lblStatus = document.getElementById("lbl-status-message");
                if (lblStatus) {
                    lblStatus.textContent = "[ STATUS ] Rascunho anterior recuperado do armazenamento local.";
                    lblStatus.style.color = "var(--color-neon-cyan)";
                }
            }
        }
    } catch (e) {
        console.warn("Falha ao restaurar rascunho automático:", e);
    }
}
