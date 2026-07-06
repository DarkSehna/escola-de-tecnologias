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
const inputObjective = document.getElementById("input-objective");
const inputStory = document.getElementById("input-story");
const inputWorld = document.getElementById("input-world");

const inputHeroName = document.getElementById("input-hero-name");
const inputHeroDesc = document.getElementById("input-hero-desc");
const inputHeroSkills = document.getElementById("input-hero-skills");
const controlsList = document.getElementById("controls-list");
const btnAddControl = document.getElementById("btn-add-control");

const checkboxes = document.querySelectorAll(".cyber-cb");
const inputWorldDesc = document.getElementById("input-world-desc");
const inputMinions = document.getElementById("input-minions");
const inputBosses = document.getElementById("input-bosses");
const inputVictory = document.getElementById("input-victory");
const inputDefeat = document.getElementById("input-defeat");

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
        inputGameName, inputObjective, inputStory, inputWorld,
        inputHeroName, inputHeroDesc, inputHeroSkills,
        inputWorldDesc, inputMinions, inputBosses, inputVictory, inputDefeat
    ];

    allTextInputs.forEach(input => {
        input.addEventListener("input", handleFormUpdate);
    });

    comboGenre.addEventListener("change", handleFormUpdate);
    checkboxes.forEach(cb => {
        cb.addEventListener("change", handleFormUpdate);
    });

    // 3. Ouvinte de Mapeamento de Controles dinâmicos
    btnAddControl.addEventListener("click", () => {
        audio.playClick();
        addControlRow("", "");
        handleFormUpdate();
    });

    // 4. Ações de Arquivo
    btnNewGdd.addEventListener("click", resetDocumentConfirm);
    btnLoadGdd.addEventListener("click", () => {
        audio.playClick();
        fileUploader.click();
    });
    fileUploader.addEventListener("change", loadGddFile);
    btnSaveGdd.addEventListener("click", saveGddFile);
    btnCopyMarkdown.addEventListener("click", copyMarkdownToClipboard);

    // 5. Sons
    audio.playBoot();

    // Carrega controles padrão
    loadDefaultControls();

    // Atualiza status e renderiza inicial
    handleFormUpdate();

    // 6. Inicializa referências de jogos
    initGddReferences();

    // 7. Tenta restaurar rascunho salvo do localStorage
    restoreAutosavedDraft();
});

// --- LÓGICA DE ABAS (TABS) ---
function setupTabSwitching() {
    const tabTriggers = document.querySelectorAll(".tab-trigger");
    const tabPanels = document.querySelectorAll(".tab-panel");

    tabTriggers.forEach(trigger => {
        trigger.addEventListener("click", () => {
            const tabId = trigger.id.replace("tab-btn-", "panel-");
            
            // Remove active classes
            tabTriggers.forEach(btn => btn.classList.remove("active"));
            tabPanels.forEach(panel => panel.classList.remove("active"));

            // Add active classes
            trigger.classList.add("active");
            const activePanel = document.getElementById(tabId);
            if (activePanel) activePanel.classList.add("active");

            audio.playTab();
        });
    });
}

// --- MAPEAMENTO DE CONTROLES (DINÂMICO) ---
function addControlRow(actionText = "", keyText = "") {
    const row = document.createElement("div");
    row.className = "control-row";

    const actInput = document.createElement("input");
    actInput.type = "text";
    actInput.className = "cyber-input";
    actInput.placeholder = "Ação (Ex: Pular)";
    actInput.value = actionText;
    actInput.autocomplete = "off";
    actInput.addEventListener("input", handleFormUpdate);

    const keyInput = document.createElement("input");
    keyInput.type = "text";
    keyInput.className = "cyber-input";
    keyInput.placeholder = "Tecla (Ex: Espaço)";
    keyInput.value = keyText;
    keyInput.autocomplete = "off";
    keyInput.addEventListener("input", handleFormUpdate);

    const delBtn = document.createElement("button");
    delBtn.className = "row-del-btn";
    delBtn.textContent = "✕";
    delBtn.title = "Excluir este comando";
    delBtn.addEventListener("click", () => {
        audio.playRemove();
        row.remove();
        handleFormUpdate();
    });

    row.appendChild(actInput);
    row.appendChild(keyInput);
    row.appendChild(delBtn);

    controlsList.appendChild(row);
}

function clearControls() {
    controlsList.innerHTML = "";
}

function loadDefaultControls() {
    clearControls();
    addControlRow("Mover Esquerda", "Seta Esquerda / A");
    addControlRow("Mover Direita", "Seta Direita / D");
    addControlRow("Pular", "Seta Cima / W / Espaço");
}

// --- CONTROLE DE PROGRESSO E VALIDAÇÃO ---
function handleFormUpdate() {
    // 1. Atualizar Tags de Status dos inputs individuais
    updateInputStatusBadge("input-game-name", "status-game-name", true);
    updateInputStatusBadge("input-objective", "status-objective", false);
    updateInputStatusBadge("input-story", "status-story", false);
    updateInputStatusBadge("input-world", "status-world", false);

    updateInputStatusBadge("input-hero-name", "status-hero-name", false);
    updateInputStatusBadge("input-hero-desc", "status-hero-desc", false);
    updateInputStatusBadge("input-hero-skills", "status-hero-skills", false);

    updateInputStatusBadge("input-world-desc", "status-world-desc", false);
    updateInputStatusBadge("input-minions", "status-minions", false);
    updateInputStatusBadge("input-bosses", "status-bosses", false);
    
    updateInputStatusBadge("input-victory", "status-victory", true);
    updateInputStatusBadge("input-defeat", "status-defeat", true);

    // 2. Calcular completude %
    const filledPercentage = getCompletionPercentage();
    lblXpPercentage.textContent = `QUEST PROGRESS: ${filledPercentage}%`;
    xpBarFill.style.width = `${filledPercentage}%`;

    // 3. Validar se requisitos básicos estão preenchidos para salvar
    const titleFilled = inputGameName.value.trim() !== "";
    const victoryFilled = inputVictory.value.trim() !== "";
    const defeatFilled = inputDefeat.value.trim() !== "";

    if (titleFilled && victoryFilled && defeatFilled) {
        btnSaveGdd.classList.remove("disabled-style");
        btnSaveGdd.textContent = "💾 Salvar GDD (Pronto!)";
        lblStatusMessage.textContent = "[ STATUS ] Requisitos básicos preenchidos. Banco de dados pronto para gravação.";
        lblStatusMessage.style.color = "var(--color-neon-green)";
    } else {
        btnSaveGdd.classList.add("disabled-style");
        btnSaveGdd.textContent = "💾 Salvar GDD (Incompleto)";
        lblStatusMessage.textContent = "[ STATUS ] Preencha Título, Vitória e Derrota para desbloquear gravação.";
        lblStatusMessage.style.color = "var(--color-gray-muted)";
    }

    // 4. Redesenhar Preview na folha
    renderLiveMarkdownPreview();

    // 5. Acionar salvamento automático no localStorage
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
    const totalFields = 14;

    // 12 Campos de texto simples
    const textFields = [
        inputGameName, inputObjective, inputStory, inputWorld,
        inputHeroName, inputHeroDesc, inputHeroSkills,
        inputWorldDesc, inputMinions, inputBosses, inputVictory, inputDefeat
    ];

    textFields.forEach(field => {
        if (field && field.value.trim() !== "") filled++;
    });

    // Listas dinâmicas
    const hasControls = getControlsData().length > 0;
    if (hasControls) filled++;

    const hasCheckboxes = getSelectedMechanics().length > 0;
    if (hasCheckboxes) filled++;

    return Math.round((filled / totalFields) * 100);
}

function getControlsData() {
    const rows = controlsList.querySelectorAll(".control-row");
    const list = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll("input");
        const action = inputs[0].value.trim();
        const key = inputs[1].value.trim();
        if (action || key) {
            list.push({ action, key });
        }
    });
    return list;
}

function getSelectedMechanics() {
    const list = [];
    checkboxes.forEach(cb => {
        if (cb.checked) list.push(cb.value);
    });
    return list;
}

// --- GERAR E RENDERIZAR MARKDOWN (LIVE PREVIEW) ---
function generateGddMarkdown() {
    const gameName = inputGameName.value.trim() || "Jogo Sem Nome";
    const genre = comboGenre.value;
    const objective = inputObjective.value.trim();
    const story = inputStory.value.trim();
    const worldSetting = inputWorld.value.trim();

    const heroName = inputHeroName.value.trim() || "Herói";
    const heroDesc = inputHeroDesc.value.trim();
    const heroSkills = inputHeroSkills.value.trim();
    const controls = getControlsData();

    const worldMechanicsSelected = getSelectedMechanics();
    const worldMechanicsDesc = inputWorldDesc.value.trim();
    const minionsDesc = inputMinions.value.trim();
    const bossesDesc = inputBosses.value.trim();

    const victoryCond = inputVictory.value.trim();
    const defeatCond = inputDefeat.value.trim();

    // Checklist mecânicas
    let mechanicsListStr = "";
    if (worldMechanicsSelected.length > 0) {
        mechanicsListStr = worldMechanicsSelected.map(mech => `- [x] ${mech}`).join("\n");
    } else {
        mechanicsListStr = "*Nenhuma mecânica específica selecionada.*";
    }

    // Tabela de controles
    let controlsTable = "";
    if (controls.length > 0) {
        controlsTable = "| Ação do Jogador | Tecla / Comando |\n| :--- | :--- |\n";
        controls.forEach(ctrl => {
            controlsTable += `| ${ctrl.action} | \`${ctrl.key}\` |\n`;
        });
    } else {
        controlsTable = "*Nenhum controle mapeado ainda.*";
    }

    // Dados estruturados JSON no topo
    const rawData = getFormJSONData();
    const frontmatter = `<!-- GDD_PROJECT_DATA:\n${JSON.stringify(rawData, null, 4)}\n-->\n`;

    return frontmatter + `# 📝 Game Design Document (GDD) - ${gameName}

> Este documento de design de jogo (GDD) serve como guia para a criação, arte e programação do seu jogo em qualquer plataforma ou engine de desenvolvimento.

---

## 🌍 1. Visão Geral e Mundo do Jogo

* **Gênero:** ${genre}
* **Objetivo Geral do Jogo:**
  ${objective ? objective : "*Sem objetivo definido.*"}

### 📖 História e Premissa
${story ? story : "*Sem história definida.*"}

### 🗺️ O Mundo do Jogo (Cenário)
${worldSetting ? worldSetting : "*Sem descrição do mundo.*"}

---

## 👤 2. Protagonista e Controles

* **Nome do Protagonista:** ${heroName}
* **Descrição/Personalidade:**
  ${heroDesc ? heroDesc : "*Sem descrição do protagonista.*"}

* **Mecânicas e Habilidades do Personagem:**
  ${heroSkills ? heroSkills : "*Sem habilidades definidas.*"}

### 🎮 Mapeamento de Controles
${controlsTable}

---

## ⚙️ 3. Mecânicas do Mundo e Inimigos

### 🧱 Elementos Ativos no Mundo
${mechanicsListStr}

### 🛠️ Detalhes das Mecânicas do Mundo
${worldMechanicsDesc ? worldMechanicsDesc : "*Sem descrição de funcionamento das mecânicas do mundo.*"}

### 👾 Inimigos Comuns (Minions)
${minionsDesc ? minionsDesc : "*Sem descrição de inimigos comuns.*"}

### 👑 Chefes (Bosses) e Padrões de Ataque
${bossesDesc ? bossesDesc : "*Sem chefes descritos.*"}

---

## 🏆 4. Regras do Jogo (Fluxo)

### 🥇 Condição de Vitória (Como Ganhar?)
${victoryCond ? victoryCond : "*Sem condição de vitória definida.*"}

### 💀 Condição de Derrota (O que causa Game Over?)
${defeatCond ? defeatCond : "*Sem condição de derrota definida.*"}

---
*GDD gerado automaticamente pelo **Gerador de GDD**.*
`;
}

function getFormJSONData() {
    return {
        game_name: inputGameName.value.trim(),
        genre: comboGenre.value,
        objective: inputObjective.value.trim(),
        story: inputStory.value.trim(),
        world_setting: inputWorld.value.trim(),
        hero_name: inputHeroName.value.trim(),
        hero_desc: inputHeroDesc.value.trim(),
        hero_skills: inputHeroSkills.value.trim(),
        controls: getControlsData(),
        world_mechanics_selected: getSelectedMechanics(),
        world_mechanics_desc: inputWorldDesc.value.trim(),
        minions_desc: inputMinions.value.trim(),
        bosses_desc: inputBosses.value.trim(),
        victory_cond: inputVictory.value.trim(),
        defeat_cond: inputDefeat.value.trim()
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
    // Overview tab
    inputGameName.value = data.game_name || "";
    comboGenre.value = data.genre || "Plataforma";
    inputObjective.value = data.objective || "";
    inputStory.value = data.story || "";
    inputWorld.value = data.world_setting || "";

    // Avatar tab
    inputHeroName.value = data.hero_name || "";
    inputHeroDesc.value = data.hero_desc || "";
    inputHeroSkills.value = data.hero_skills || "";

    // Recompila controles dinâmicos
    clearControls();
    const savedControls = data.controls || [];
    if (savedControls.length > 0) {
        savedControls.forEach(ctrl => {
            addControlRow(ctrl.action, ctrl.key);
        });
    } else {
        loadDefaultControls();
    }

    // Mechanics tab Checkboxes
    const selectedMechs = data.world_mechanics_selected || [];
    checkboxes.forEach(cb => {
        cb.checked = selectedMechs.includes(cb.value);
    });

    inputWorldDesc.value = data.world_mechanics_desc || "";
    inputMinions.value = data.minions_desc || "";
    inputBosses.value = data.bosses_desc || "";
    inputVictory.value = data.victory_cond || "";
    inputDefeat.value = data.defeat_cond || "";

    // Sincroniza visual
    handleFormUpdate();
}

function resetDocumentConfirm() {
    audio.playClick();
    const confirmClear = confirm("Começar um Novo Documento?\n\nIsso irá limpar todos os campos preenchidos atuais e reiniciará a Quest!");
    if (confirmClear) {
        // Limpa campos
        inputGameName.value = "";
        comboGenre.selectedIndex = 0;
        inputObjective.value = "";
        inputStory.value = "";
        inputWorld.value = "";

        inputHeroName.value = "";
        inputHeroDesc.value = "";
        inputHeroSkills.value = "";

        loadDefaultControls();

        checkboxes.forEach(cb => {
            cb.checked = false;
        });

        inputWorldDesc.value = "";
        inputMinions.value = "";
        inputBosses.value = "";
        inputVictory.value = "";
        inputDefeat.value = "";

        // Limpa rascunho automático do localStorage
        localStorage.removeItem("titanTech_gdd_draft");

        // Sincroniza visual e vai para primeira aba
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
        inputGameName.value = selectedReferenceGame.titulo;
        
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
        }

        inputObjective.value = selectedReferenceGame.objetivo;
        inputStory.value = selectedReferenceGame.lore;
        inputWorld.value = selectedReferenceGame.ambiente;
        inputHeroName.value = selectedReferenceGame.heroi_identidade;
        inputHeroDesc.value = selectedReferenceGame.heroi_aparencia;
        inputHeroSkills.value = selectedReferenceGame.heroi_habilidades;
        inputWorldDesc.value = selectedReferenceGame.mecanicas_mundo;
        inputMinions.value = selectedReferenceGame.bestiario;
        inputBosses.value = selectedReferenceGame.chefes;
        inputVictory.value = selectedReferenceGame.condicao_vitoria;
        inputDefeat.value = selectedReferenceGame.condicao_derrota;

        // Limpa e recarrega os controles padrão correspondentes ao jogo
        clearControls();
        if (selectedReferenceGame.id === "pacman") {
            addControlRow("Mover Cima", "Teclas WASD / Setas");
            addControlRow("Mover Baixo", "Teclas WASD / Setas");
            addControlRow("Mover Esquerda", "Teclas WASD / Setas");
            addControlRow("Mover Direita", "Teclas WASD / Setas");
        } else if (selectedReferenceGame.id === "pokemon") {
            addControlRow("Mover Personagem", "Teclas WASD / Setas");
            addControlRow("Confirmar / Interagir", "Tecla Z / Enter");
            addControlRow("Cancelar / Menu", "Tecla X / Esc");
        } else {
            addControlRow("Mover Esquerda", "Seta Esquerda / A");
            addControlRow("Mover Direita", "Seta Direita / D");
            addControlRow("Pular", "Seta Cima / W / Espaço");
            if (selectedReferenceGame.id === "sotn" || selectedReferenceGame.id === "hollow" || selectedReferenceGame.id === "guacamelee") {
                addControlRow("Atacar", "Tecla J / Botão Esquerdo do Mouse");
                addControlRow("Habilidade Especial", "Tecla K / Shift");
            } else if (selectedReferenceGame.id === "celeste") {
                addControlRow("Impulso (Dash)", "Tecla K / Shift");
                addControlRow("Agarrar Paredes", "Tecla J / Ctrl");
            }
        }

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
