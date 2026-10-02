// ==========================================================================
// ADMIN LOGIC - TEACHER DASHBOARD
// Escola de Tecnologias - TitanTech
// ==========================================================================

// URL BASE DA API NO CLOUDFLARE WORKERS + D1
const API_BASE_URL = "https://feedback-api.gabrielsehna.workers.dev/api";

// PINs autorizados: Gabriel (2510) e Sandro (9405)
const ALLOWED_PINS = ["2510", "9405"];

// --- SINTETIZADOR DE ÁUDIO (WEB AUDIO API) ---
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
            console.warn("Web Audio API bloqueada.", e);
        }
    }
    playClick() { this.playTone(880, 'sine', 0.05, 0.06); }
    playSuccess() {
        this.playTone(659.25, 'sine', 0.12, 0.05); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.12, 0.05), 60); // G5
        setTimeout(() => this.playTone(987.77, 'sine', 0.2, 0.05), 120); // B5
    }
    playError() {
        this.playTone(180, 'sawtooth', 0.25, 0.1);
        setTimeout(() => this.playTone(140, 'sawtooth', 0.25, 0.1), 70);
    }
}
const audio = new SynthAudio();

// --- ESTADO DO DASHBOARD ---
const dashboardState = {
    enteredPin: "",
    charts: {
        stars: null,
        difficulty: null,
        progress: null,
        tags: null
    },
    pollingIntervalId: null,
    selectedSemester: "",
    selectedClass: "",
    selectedGame: "",
    hiddenRecordIds: JSON.parse(localStorage.getItem("titanTech_hidden_feedbacks") || "[]"),
    allRecords: [],
    classesData: {}
};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", async () => {
    setupPINPad();
    checkExistingSession();
    await initClassesData();
    populateFilters();
    setupFilterListeners();
    setupClassManagerModal();

    document.getElementById("btn-logout").addEventListener("click", handleLogout);
});

// Verifica se já existe um PIN válido salvo na sessionStorage ou via parâmetro na URL
function checkExistingSession() {
    const urlParams = new URLSearchParams(window.location.search);
    const pinParam = urlParams.get("pin");
    if (pinParam && ALLOWED_PINS.includes(pinParam)) {
        sessionStorage.setItem("titanTech_feedbackPIN", pinParam);
        unlockDashboard();
        return;
    }

    const savedPin = sessionStorage.getItem("titanTech_feedbackPIN");
    if (savedPin && ALLOWED_PINS.includes(savedPin)) {
        unlockDashboard();
    }
}

// Configura o teclado numérico do PIN
function setupPINPad() {
    const keys = document.querySelectorAll(".pin-btn.num");
    keys.forEach(key => {
        key.addEventListener("click", () => {
            if (dashboardState.enteredPin.length < 4) {
                dashboardState.enteredPin += key.dataset.val;
                audio.playClick();
                updatePINDots();
            }
        });
    });

    document.getElementById("btn-pin-clear").addEventListener("click", () => {
        dashboardState.enteredPin = "";
        audio.playClick();
        updatePINDots();
    });

    document.getElementById("btn-pin-enter").addEventListener("click", () => {
        verifyPIN();
    });
}

// Atualiza o display visual das bolinhas do PIN
function updatePINDots() {
    const dots = document.querySelectorAll(".pin-dot");
    dots.forEach((dot, index) => {
        if (index < dashboardState.enteredPin.length) {
            dot.classList.add("filled");
        } else {
            dot.classList.remove("filled");
            dot.classList.remove("error");
        }
    });
}

// Verifica se o PIN digitado é válido
function verifyPIN() {
    const dots = document.querySelectorAll(".pin-dot");
    const container = document.getElementById("lock-screen");

    if (ALLOWED_PINS.includes(dashboardState.enteredPin)) {
        audio.playSuccess();
        sessionStorage.setItem("titanTech_feedbackPIN", dashboardState.enteredPin);

        // Efeito de transição de telas
        container.style.opacity = "0";
        container.style.transform = "translateY(20px)";
        container.style.transition = "all 0.3s ease";

        setTimeout(() => {
            unlockDashboard();
        }, 300);
    } else {
        audio.playError();
        container.classList.add("shake-animation");
        dots.forEach(dot => dot.classList.add("error"));

        showToast("PIN Incorreto! Tente novamente.");

        setTimeout(() => {
            container.classList.remove("shake-animation");
            dashboardState.enteredPin = "";
            updatePINDots();
        }, 1000);
    }
}

// Libera e inicializa o painel do professor
function unlockDashboard() {
    document.getElementById("lock-screen").style.display = "none";

    const content = document.getElementById("dashboard-content");
    content.style.display = "flex";
    content.style.opacity = "0";
    content.style.transition = "opacity 0.4s ease";

    // Força reflow
    void content.offsetWidth;
    content.style.opacity = "1";

    // Inicializa carregamento periódico de dados (cada 6s)
    fetchAndRenderData();
    if (!dashboardState.pollingIntervalId) {
        dashboardState.pollingIntervalId = setInterval(fetchAndRenderData, 6000);
    }
}

// Faz o logout do painel administrativo
function handleLogout() {
    audio.playClick();
    sessionStorage.removeItem("titanTech_feedbackPIN");

    if (dashboardState.pollingIntervalId) {
        clearInterval(dashboardState.pollingIntervalId);
        dashboardState.pollingIntervalId = null;
    }

    // Oculta dashboard e exibe lockscreen
    document.getElementById("dashboard-content").style.display = "none";
    const lock = document.getElementById("lock-screen");
    lock.style.display = "flex";
    lock.style.opacity = "1";
    lock.style.transform = "translateY(0)";

    dashboardState.enteredPin = "";
    updatePINDots();
}

// --- GERENCIAMENTO DE DADOS DE TURMAS & JOGOS (CLOUDFLARE D1 + LOCALSTORAGE + FALLBACK) ---
async function initClassesData() {
    try {
        const res = await fetch(`${API_BASE_URL}/turmas`);
        if (res.ok) {
            const remoteData = await res.json();
            if (remoteData && Object.keys(remoteData).length > 0) {
                dashboardState.classesData = remoteData;
                localStorage.setItem("titanTech_jogos_da_semana", JSON.stringify(remoteData));
                return dashboardState.classesData;
            }
        }
    } catch(err) {
        console.warn("Falha ao carregar turmas do Cloudflare D1:", err);
    }

    const local = localStorage.getItem("titanTech_jogos_da_semana");
    if (local) {
        try {
            dashboardState.classesData = JSON.parse(local);
            return dashboardState.classesData;
        } catch(e) {
            console.error("Erro ao ler turmas salvas no localStorage:", e);
        }
    }
    try {
        const res = await fetch("jogos_da_semana.json");
        if (res.ok) {
            dashboardState.classesData = await res.json();
        } else {
            dashboardState.classesData = {};
        }
    } catch(err) {
        console.warn("Falha ao carregar jogos_da_semana.json:", err);
        dashboardState.classesData = {};
    }
    return dashboardState.classesData;
}

async function saveClassesData(data) {
    dashboardState.classesData = data;
    localStorage.setItem("titanTech_jogos_da_semana", JSON.stringify(data));
    try {
        const res = await fetch(`${API_BASE_URL}/turmas`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "replace_all",
                data: data
            })
        });
        if (!res.ok) throw new Error("Erro na gravação remota de turmas no D1");
        console.log("Turmas sincronizadas com sucesso no Cloudflare D1!");
    } catch(err) {
        console.warn("Falha ao sincronizar turmas na nuvem D1:", err);
    }
}

// Popula os seletores de filtros no cabeçalho
function populateFilters() {
    const selectClass = document.getElementById("filter-class");
    const selectGame = document.getElementById("filter-game");
    if (!selectClass || !selectGame) return;

    const data = dashboardState.classesData || {};
    const classes = Object.keys(data).sort();

    const currentClass = dashboardState.selectedClass;
    const currentGame = dashboardState.selectedGame;

    selectClass.innerHTML = '<option value="">Todas as Turmas</option>';
    classes.forEach(className => {
        const opt = document.createElement("option");
        opt.value = className;
        opt.textContent = `Turma ${className}`;
        if (className === currentClass) opt.selected = true;
        selectClass.appendChild(opt);
    });

    repopulateGameFilter(currentClass, data);
    if (currentGame) {
        selectGame.value = currentGame;
    }
}

function repopulateGameFilter(selectedClass, data) {
    const selectGame = document.getElementById("filter-game");
    if (!selectGame) return;

    selectGame.innerHTML = '<option value="">Todos os Jogos</option>';

    let gamesList = [];
    if (selectedClass && data[selectedClass]) {
        gamesList = data[selectedClass];
    } else {
        const allGames = [];
        Object.values(data).forEach(list => {
            if (Array.isArray(list)) allGames.push(...list);
        });
        gamesList = [...new Set(allGames)].sort();
    }

    gamesList.forEach(game => {
        const opt = document.createElement("option");
        opt.value = game;
        opt.textContent = game;
        selectGame.appendChild(opt);
    });
}

function setupFilterListeners() {
    const selectSemester = document.getElementById("filter-semester");
    const selectClass = document.getElementById("filter-class");
    const selectGame = document.getElementById("filter-game");

    if (selectSemester) {
        selectSemester.addEventListener("change", (e) => {
            dashboardState.selectedSemester = e.target.value;
            audio.playClick();
            processAndRenderFeedbacks(dashboardState.allRecords);
        });
    }

    if (selectClass) {
        selectClass.addEventListener("change", (e) => {
            dashboardState.selectedClass = e.target.value;
            audio.playClick();
            repopulateGameFilter(dashboardState.selectedClass, dashboardState.classesData);
            dashboardState.selectedGame = "";
            if (selectGame) selectGame.value = "";
            processAndRenderFeedbacks(dashboardState.allRecords);
        });
    }

    if (selectGame) {
        selectGame.addEventListener("change", (e) => {
            dashboardState.selectedGame = e.target.value;
            audio.playClick();
            processAndRenderFeedbacks(dashboardState.allRecords);
        });
    }

    const btnRestore = document.getElementById("btn-restore-hidden");
    if (btnRestore) {
        btnRestore.addEventListener("click", () => {
            dashboardState.hiddenRecordIds = [];
            localStorage.removeItem("titanTech_hidden_feedbacks");
            audio.playSuccess();
            showToast("Feedbacks ocultos restaurados no painel!", "cyan-toast");
            processAndRenderFeedbacks(dashboardState.allRecords);
        });
    }

    const btnExportExcel = document.getElementById("btn-export-excel");
    if (btnExportExcel) {
        btnExportExcel.addEventListener("click", () => {
            audio.playClick();
            exportFilteredFeedbacksToCSV();
        });
    }
}

// Exporta a tabela filtrada atual para CSV compatível com Microsoft Excel
function exportFilteredFeedbacksToCSV() {
    let records = (dashboardState.allRecords || []).filter(rec => {
        const recId = getRecordId(rec);
        return !dashboardState.hiddenRecordIds.includes(recId);
    });

    if (dashboardState.selectedSemester) {
        records = records.filter(rec => getRecordSemester(rec) === dashboardState.selectedSemester);
    }
    if (dashboardState.selectedClass) {
        records = records.filter(rec => {
            const cls = rec["Turma"] || rec["turma"] || "";
            return cls.toUpperCase() === dashboardState.selectedClass.toUpperCase();
        });
    }
    if (dashboardState.selectedGame) {
        records = records.filter(rec => {
            const game = rec["Jogo"] || rec["jogo"] || "";
            return game === dashboardState.selectedGame;
        });
    }

    if (records.length === 0) {
        showToast("Nenhum feedback para exportar com os filtros atuais.");
        audio.playError();
        return;
    }

    const headers = ["ID", "Data/Hora", "Semestre", "Turma", "Jogo / Aluno", "Estrelas", "Entendimento", "Dificuldade", "Onde Parou", "Bugs", "Tags", "Comentários"];
    
    function escapeCSV(val) {
        if (val === undefined || val === null) return '""';
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
    }

    const rows = [headers.map(escapeCSV).join(";")];

    records.forEach(rec => {
        const id = rec.id || "";
        const rawDate = rec["timestamp"] || rec["Data/Hora"] || rec["Timestamp"] || rec["data"] || "";
        let dateFormatted = rawDate;
        try {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) {
                dateFormatted = d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
            }
        } catch(e) {}

        const semestre = getRecordSemester(rec);
        const turma = rec["Turma"] || rec["turma"] || "";
        const jogo = rec["Jogo"] || rec["jogo"] || "";
        const estrelas = rec["Estrelas"] || rec["estrelas"] || "";
        const entendimento = rec["Entendimento"] || rec["entendimento"] || "";
        const dificuldade = rec["Dificuldade"] || rec["dificuldade"] || "";
        const ondeParou = rec["onde_parou"] || rec["Onde Parou"] || rec["ondeParou"] || "";
        const bugs = rec["Bugs"] || rec["bugs"] || "";
        let tags = rec["Tags"] || rec["tags"] || "";
        if (Array.isArray(tags)) tags = tags.join(", ");
        const comentarios = rec["Comentários"] || rec["Comentarios"] || rec["comentarios"] || "";

        rows.push([
            escapeCSV(id),
            escapeCSV(dateFormatted),
            escapeCSV(semestre),
            escapeCSV(turma),
            escapeCSV(jogo),
            escapeCSV(estrelas),
            escapeCSV(entendimento),
            escapeCSV(dificuldade),
            escapeCSV(ondeParou),
            escapeCSV(bugs),
            escapeCSV(tags),
            escapeCSV(comentarios)
        ].join(";"));
    });

    const csvContent = "\uFEFF" + rows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const semName = dashboardState.selectedSemester ? `_${dashboardState.selectedSemester}` : "";
    const turmName = dashboardState.selectedClass ? `_Turma_${dashboardState.selectedClass}` : "";
    a.href = url;
    a.download = `feedbacks_jogos${semName}${turmName}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    audio.playSuccess();
    showToast(`Planilha com ${records.length} avaliações exportada com sucesso!`, "cyan-toast");
}

// --- MODAL DE GERENCIAMENTO DE TURMAS & JOGOS ---
function setupClassManagerModal() {
    const modal = document.getElementById("modal-manage-classes");
    const btnOpen = document.getElementById("btn-open-manage-modal");
    const btnClose = document.getElementById("btn-close-modal");
    const btnAddClass = document.getElementById("btn-add-class");
    const inputNewClass = document.getElementById("input-new-class");
    const btnSyncHistory = document.getElementById("btn-sync-history");
    const btnExportJson = document.getElementById("btn-export-json");
    const btnResetClasses = document.getElementById("btn-reset-classes");
    const btnSaveClasses = document.getElementById("btn-save-classes");

    btnOpen.addEventListener("click", () => {
        audio.playClick();
        renderClassesManager();
        modal.style.display = "flex";
    });

    btnClose.addEventListener("click", () => {
        audio.playClick();
        modal.style.display = "none";
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("modal") === "true") {
        renderClassesManager();
        modal.style.display = "flex";
    }

    function handleAddNewClass() {
        const name = inputNewClass.value.trim().toUpperCase();
        if (!name) {
            showToast("Digite o nome da turma (ex: 7M, 4N).");
            return;
        }
        if (dashboardState.classesData[name]) {
            showToast(`A turma "${name}" já existe.`);
            return;
        }
        dashboardState.classesData[name] = [];
        inputNewClass.value = "";
        audio.playSuccess();
        renderClassesManager();
        showToast(`Turma ${name} adicionada!`, "cyan-toast");
    }

    btnAddClass.addEventListener("click", handleAddNewClass);
    inputNewClass.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleAddNewClass();
    });

    // Sincronizar com histórico do Google Sheets (detecta turmas/alunos automaticamente!)
    btnSyncHistory.addEventListener("click", () => {
        audio.playClick();
        if (!dashboardState.allRecords || dashboardState.allRecords.length === 0) {
            showToast("Aguarde os feedbacks carregarem para sincronizar.");
            return;
        }
        let addedClasses = 0;
        let addedStudents = 0;
        dashboardState.allRecords.forEach(rec => {
            const rawTurma = (rec["Turma"] || rec["turma"] || "").trim();
            const rawJogo = (rec["Jogo"] || rec["jogo"] || "").trim();
            if (rawTurma) {
                if (!dashboardState.classesData[rawTurma]) {
                    dashboardState.classesData[rawTurma] = [];
                    addedClasses++;
                }
                if (rawJogo && !dashboardState.classesData[rawTurma].includes(rawJogo)) {
                    dashboardState.classesData[rawTurma].push(rawJogo);
                    addedStudents++;
                }
            }
        });
        renderClassesManager();
        saveClassesData(dashboardState.classesData);
        populateFilters();
        audio.playSuccess();
        showToast(`Sincronizado! +${addedClasses} turmas e +${addedStudents} alunos do histórico.`, "cyan-toast");
    });

    // Baixar arquivo JSON atualizado
    btnExportJson.addEventListener("click", () => {
        audio.playClick();
        const jsonStr = JSON.stringify(dashboardState.classesData, null, 4);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "jogos_da_semana.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Arquivo jogos_da_semana.json gerado!", "cyan-toast");
    });

    // Restaurar lista padrão
    btnResetClasses.addEventListener("click", async () => {
        if (confirm("Deseja restaurar as turmas para o padrão original do arquivo jogos_da_semana.json?")) {
            audio.playClick();
            localStorage.removeItem("titanTech_jogos_da_semana");
            await initClassesData();
            renderClassesManager();
            populateFilters();
            processAndRenderFeedbacks(dashboardState.allRecords);
            showToast("Turmas restauradas para o padrão do arquivo.");
        }
    });

    // Salvar alterações
    btnSaveClasses.addEventListener("click", async () => {
        btnSaveClasses.disabled = true;
        const originalText = btnSaveClasses.innerHTML;
        btnSaveClasses.innerHTML = "Salvando na Nuvem...";
        try {
            await saveClassesData(dashboardState.classesData);
            populateFilters();
            processAndRenderFeedbacks(dashboardState.allRecords);
            audio.playSuccess();
            showToast("Turmas sincronizadas com o Cloudflare D1!", "cyan-toast");
            modal.style.display = "none";
        } catch(err) {
            console.error("Erro ao salvar turmas:", err);
            showToast("Erro ao sincronizar com o Cloudflare D1.");
            audio.playError();
        } finally {
            btnSaveClasses.disabled = false;
            btnSaveClasses.innerHTML = originalText;
        }
    });
}

function renderClassesManager() {
    const container = document.getElementById("classes-manager-container");
    container.innerHTML = "";

    const data = dashboardState.classesData;
    const classes = Object.keys(data).sort();

    if (classes.length === 0) {
        container.innerHTML = `<div class="no-data-msg" style="padding: 2.5rem;">Nenhuma turma cadastrada. Digite o nome no topo para criar a primeira!</div>`;
        return;
    }

    classes.forEach(className => {
        const students = data[className] || [];

        const card = document.createElement("div");
        card.className = "class-item-card";

        // Header do card da turma
        const header = document.createElement("div");
        header.className = "class-item-header";
        header.innerHTML = `
            <div class="class-name-badge">
                <span>🏫 Turma ${className}</span>
                <span class="class-count-tag">(${students.length} ${students.length === 1 ? 'aluno/jogo' : 'alunos/jogos'})</span>
            </div>
            <button class="btn-delete-class" data-class="${className}" title="Excluir Turma">Excluir Turma</button>
        `;
        card.appendChild(header);

        // Chips dos alunos/jogos
        const chipsContainer = document.createElement("div");
        chipsContainer.className = "student-chips-container";

        if (students.length === 0) {
            chipsContainer.innerHTML = `<span style="font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;">Nenhum aluno cadastrado nesta turma ainda.</span>`;
        } else {
            students.forEach((student, sIdx) => {
                const chip = document.createElement("div");
                chip.className = "student-chip";
                chip.innerHTML = `
                    <span>${student}</span>
                    <button class="chip-remove" data-class="${className}" data-index="${sIdx}" title="Remover ${student}">&times;</button>
                `;
                chipsContainer.appendChild(chip);
            });
        }
        card.appendChild(chipsContainer);

        // Input para adicionar alunos
        const addRow = document.createElement("div");
        addRow.className = "add-student-row";
        addRow.innerHTML = `
            <input type="text" class="cyber-input-sm input-add-student" data-class="${className}" placeholder="Nome do aluno (ou cole vários separados por vírgula)..." style="flex: 1;">
            <button class="pin-btn action-btn enter btn-submit-student" data-class="${className}" style="padding: 0.45rem 0.85rem; font-size: 0.75rem;">+ Adicionar</button>
        `;
        card.appendChild(addRow);

        container.appendChild(card);
    });

    // Excluir turma
    container.querySelectorAll(".btn-delete-class").forEach(btn => {
        btn.addEventListener("click", () => {
            const className = btn.dataset.class;
            if (confirm(`Tem certeza que deseja excluir a Turma ${className} e todos os seus alunos?`)) {
                delete dashboardState.classesData[className];
                audio.playClick();
                renderClassesManager();
            }
        });
    });

    // Remover aluno individual
    container.querySelectorAll(".chip-remove").forEach(btn => {
        btn.addEventListener("click", () => {
            const className = btn.dataset.class;
            const index = parseInt(btn.dataset.index);
            if (dashboardState.classesData[className]) {
                dashboardState.classesData[className].splice(index, 1);
                audio.playClick();
                renderClassesManager();
            }
        });
    });

    // Adicionar alunos
    function addStudentsToClass(className, inputEl) {
        const val = inputEl.value.trim();
        if (!val) return;
        const names = val.split(/[,;\n]/).map(n => n.trim()).filter(n => n.length > 0);
        if (names.length === 0) return;

        if (!dashboardState.classesData[className]) {
            dashboardState.classesData[className] = [];
        }

        names.forEach(name => {
            if (!dashboardState.classesData[className].includes(name)) {
                dashboardState.classesData[className].push(name);
            }
        });

        inputEl.value = "";
        audio.playClick();
        renderClassesManager();
    }

    container.querySelectorAll(".btn-submit-student").forEach(btn => {
        btn.addEventListener("click", () => {
            const className = btn.dataset.class;
            const input = container.querySelector(`.input-add-student[data-class="${className}"]`);
            if (input) addStudentsToClass(className, input);
        });
    });

    container.querySelectorAll(".input-add-student").forEach(input => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const className = input.dataset.class;
                addStudentsToClass(className, input);
            }
        });
    });
}

// Auxiliares de Semestre e Identificação de Registro
function getRecordSemester(rec) {
    if (rec["semestre"]) return rec["semestre"];
    const rawDate = rec["Data/Hora"] || rec["Timestamp"] || rec["timestamp"] || rec["data"] || "";
    if (!rawDate) return "2026.1";
    try {
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return "2026.1";
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        // Meses 1 a 7 (até julho): 1º Semestre; Meses 8 a 12: 2º Semestre
        const sem = month <= 7 ? "1" : "2";
        return `${year}.${sem}`;
    } catch(e) {
        return "2026.1";
    }
}

function getRecordId(rec) {
    if (rec.id !== undefined && rec.id !== null) return String(rec.id);
    const rawDate = rec["Data/Hora"] || rec["Timestamp"] || rec["timestamp"] || rec["data"] || "";
    const turma = rec["Turma"] || rec["turma"] || "";
    const jogo = rec["Jogo"] || rec["jogo"] || "";
    const estrelas = rec["Estrelas"] || rec["estrelas"] || "";
    return `${rawDate}_${turma}_${jogo}_${estrelas}`;
}

function updateSemesterFilter(records) {
    const selectSem = document.getElementById("filter-semester");
    if (!selectSem) return;

    const semesters = new Set();
    (records || []).forEach(rec => {
        const sem = getRecordSemester(rec);
        if (sem) semesters.add(sem);
    });

    const sorted = Array.from(semesters).sort().reverse();
    const currentVal = dashboardState.selectedSemester;

    selectSem.innerHTML = '<option value="">Todos os Semestres</option>';
    sorted.forEach(sem => {
        const opt = document.createElement("option");
        opt.value = sem;
        opt.textContent = `${sem} (${sem.endsWith('.1') ? '1º Semestre' : '2º Semestre'})`;
        if (sem === currentVal) opt.selected = true;
        selectSem.appendChild(opt);
    });
}

// --- BUSCA DE DADOS NO BANCO CLOUDFLARE D1 ---
function fetchAndRenderData() {
    fetch(`${API_BASE_URL}/feedbacks`)
        .then(response => {
            if (!response.ok) throw new Error("Erro na conexão da API Cloudflare");
            return response.json();
        })
        .then(data => {
            dashboardState.allRecords = Array.isArray(data) ? data : (data.value || []);
            updateSemesterFilter(dashboardState.allRecords);
            processAndRenderFeedbacks(dashboardState.allRecords);
        })
        .catch(err => {
            console.warn("API indisponível ou CORS bloqueado.", err);
            dashboardState.allRecords = [];
            processAndRenderFeedbacks([]);
            showToast("Aviso: Falha ao carregar dados do Cloudflare D1.");
        });
}

// --- PROCESSAMENTO E RENDERIZAÇÃO DE FEEDBACKS & KPIs ---
function processAndRenderFeedbacks(records) {
    const tableBody = document.getElementById("feedback-table-body");
    tableBody.innerHTML = "";

    // 1. Remove registros ocultados pelo professor
    let filteredRecords = (records || []).filter(rec => {
        const recId = getRecordId(rec);
        return !dashboardState.hiddenRecordIds.includes(recId);
    });

    // 2. Filtra por Semestre
    if (dashboardState.selectedSemester) {
        filteredRecords = filteredRecords.filter(rec => {
            return getRecordSemester(rec) === dashboardState.selectedSemester;
        });
    }

    // 3. Filtra por Turma
    if (dashboardState.selectedClass) {
        filteredRecords = filteredRecords.filter(rec => {
            const className = rec["Turma"] || rec["turma"] || "";
            return className.toUpperCase() === dashboardState.selectedClass.toUpperCase();
        });
    }

    // 4. Filtra por Jogo
    if (dashboardState.selectedGame) {
        filteredRecords = filteredRecords.filter(rec => {
            const gameName = rec["Jogo"] || rec["jogo"] || "";
            return gameName === dashboardState.selectedGame;
        });
    }

    const totalCount = filteredRecords.length;
    const displayRecords = [...filteredRecords].reverse();

    // Contadores para métricas
    let totalStars = 0;
    const starsDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const difficultyDist = { "Muito Fácil": 0, "Na Medida": 0, "Impossível": 0 };
    const progressDist = { "Final": 0, "Raiva": 0, "Quebrou": 0, "Outro": 0 };
    const bugsDist = { "Sem Bugs": 0, "Bugs Leves": 0, "Injogável": 0 };
    const tagsCount = {};

    filteredRecords.forEach(rec => {
        // Estrelas
        const starVal = parseInt(rec["Estrelas"] || rec["estrelas"]) || 0;
        if (starVal >= 1 && starVal <= 5) {
            totalStars += starVal;
            starsDist[starVal]++;
        }

        // Dificuldade
        const diffVal = (rec["Dificuldade"] || rec["dificuldade"] || "").trim();
        if (diffVal.includes("Fácil") || diffVal.includes("Facil")) difficultyDist["Muito Fácil"]++;
        else if (diffVal.includes("Medida")) difficultyDist["Na Medida"]++;
        else if (diffVal.includes("Impossível") || diffVal.includes("Impossivel")) difficultyDist["Impossível"]++;

        // Onde Parou
        const progressVal = (rec["Onde Parou"] || rec["Onde você parou?"] || rec["OndeParou"] || rec["ondeParou"] || "").trim();
        if (progressVal.includes("Final")) progressDist["Final"]++;
        else if (progressVal.includes("Raiva")) progressDist["Raiva"]++;
        else if (progressVal.includes("Quebrou") || progressVal.includes("quebrou")) progressDist["Quebrou"]++;
        else if (progressVal) progressDist["Outro"]++;

        // Bugs
        const bugsVal = (rec["Bugs"] || rec["bugs"] || "").trim();
        if (bugsVal.includes("Sem Bugs") || bugsVal.includes("Nenhum")) bugsDist["Sem Bugs"]++;
        else if (bugsVal.includes("Leves")) bugsDist["Bugs Leves"]++;
        else if (bugsVal.includes("Injogável") || bugsVal.includes("Injogavel")) bugsDist["Injogável"]++;

        // Tags
        let rawTags = rec["Tags"] || rec["tags"] || "";
        if (Array.isArray(rawTags)) rawTags = rawTags.join(", ");
        if (rawTags) {
            rawTags.split(",").forEach(t => {
                const cleanTag = t.trim().replace(/^[\u{1F300}-\u{1F9FF}\?]+\s*/u, "");
                if (cleanTag && cleanTag !== "??" && cleanTag !== "-") {
                    tagsCount[cleanTag] = (tagsCount[cleanTag] || 0) + 1;
                }
            });
        }
    });

    // Médias e Percentuais
    const avgStars = totalCount > 0 ? (totalStars / totalCount).toFixed(1) : "0.0";
    const completionRate = totalCount > 0 ? Math.round((progressDist["Final"] / totalCount) * 100) : 0;
    const bugFreeRate = totalCount > 0 ? Math.round((bugsDist["Sem Bugs"] / totalCount) * 100) : 0;

    // Atualiza KPIs
    const elKpiTotal = document.getElementById("kpi-total-feedbacks");
    const elKpiAvg = document.getElementById("kpi-avg-stars");
    const elKpiComp = document.getElementById("kpi-completion-rate");
    const elKpiBugs = document.getElementById("kpi-bugfree-rate");
    const elTableCount = document.getElementById("table-total-count");

    if (elKpiTotal) elKpiTotal.textContent = totalCount;
    if (elKpiAvg) elKpiAvg.textContent = `${avgStars} ★`;
    if (elKpiComp) elKpiComp.textContent = `${completionRate}%`;
    if (elKpiBugs) elKpiBugs.textContent = `${bugFreeRate}%`;
    if (elTableCount) elTableCount.textContent = `${totalCount} ${totalCount === 1 ? 'feedback' : 'feedbacks'}`;

    // Subtítulos dos gráficos
    const badgeStars = document.getElementById("badge-stars-count");
    const badgeDiff = document.getElementById("badge-diff-status");
    const badgeProg = document.getElementById("badge-progress-status");
    const badgeTags = document.getElementById("badge-tags-count");

    if (badgeStars) badgeStars.textContent = `${avgStars}★ (${totalCount} votos)`;
    if (badgeDiff) {
        const maxDiff = Object.entries(difficultyDist).sort((a,b) => b[1] - a[1])[0];
        badgeDiff.textContent = maxDiff && maxDiff[1] > 0 ? `${maxDiff[0]} (${Math.round(maxDiff[1] / totalCount * 100)}%)` : "Sem dados";
    }
    if (badgeProg) badgeProg.textContent = `${completionRate}% concluíram`;
    if (badgeTags) {
        const topTag = Object.entries(tagsCount).sort((a,b) => b[1] - a[1])[0];
        badgeTags.textContent = topTag ? `Mais votada: ${topTag[0]}` : "Top destaques";
    }

    // Preenche Tabela
    if (displayRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" class="no-data-msg" style="text-align: center; padding: 2.5rem;">Nenhum feedback recebido ainda para os filtros selecionados.</td></tr>`;
    } else {
        displayRecords.forEach(rec => {
            const tr = document.createElement("tr");

            // Formatação de data
            let dateStr = "";
            const rawDate = rec["Data/Hora"] || rec["Timestamp"] || rec["timestamp"] || rec["data"] || "";
            try {
                if (rawDate) {
                    const d = new Date(rawDate);
                    dateStr = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                }
            } catch(e) {
                dateStr = rawDate;
            }
            if (!dateStr) dateStr = rawDate || "-";

            // Dificuldade
            const dVal = (rec["Dificuldade"] || rec["dificuldade"] || "").trim();
            let diffClass = "";
            if (dVal.includes("Fácil") || dVal.includes("Facil")) diffClass = "facil";
            else if (dVal.includes("Medida")) diffClass = "medida";
            else if (dVal.includes("Impossível") || dVal.includes("Impossivel")) diffClass = "impossivel";

            // Progresso / Onde Parou
            const pVal = (rec["Onde Parou"] || rec["Onde você parou?"] || rec["OndeParou"] || rec["ondeParou"] || "").trim();
            let progClass = "";
            let progEmoji = "";
            if (pVal.includes("Final")) { progClass = "final"; progEmoji = "🏆 "; }
            else if (pVal.includes("Raiva")) { progClass = "raiva"; progEmoji = "😡 "; }
            else if (pVal.includes("Quebrou") || pVal.includes("quebrou")) { progClass = "quebrou"; progEmoji = "💥 "; }

            // Bugs / Estabilidade
            const bVal = (rec["Bugs"] || rec["bugs"] || "").trim();
            let bugClass = "";
            let bugEmoji = "";
            if (bVal.includes("Sem Bugs") || bVal.includes("Nenhum")) { bugClass = "nobugs"; bugEmoji = "🛡️ "; }
            else if (bVal.includes("Leves")) { bugClass = "minorbugs"; bugEmoji = "⚠️ "; }
            else if (bVal.includes("Injogável") || bVal.includes("Injogavel")) { bugClass = "gamebreaking"; bugEmoji = "🚫 "; }

            // Tags
            let rawTags = rec["Tags"] || rec["tags"] || "";
            if (Array.isArray(rawTags)) rawTags = rawTags.join(", ");
            const tagsHTML = rawTags.split(",")
                .map(t => t.trim().replace(/^[\u{1F300}-\u{1F9FF}\?]+\s*/u, ""))
                .filter(t => t.length > 0 && t !== "??" && t !== "-")
                .map(t => `<span class="mini-tag">${t}</span>`)
                .join("");

            const className = rec["Turma"] || rec["turma"] || "-";
            const gameName = rec["Jogo"] || rec["jogo"] || "-";
            const numStars = parseInt(rec["Estrelas"] || rec["estrelas"]) || 0;
            const comentariosVal = rec["Comentários"] || rec["Comentarios"] || rec["comentarios"] || "";
            const semVal = getRecordSemester(rec);
            const recId = getRecordId(rec);

            tr.innerHTML = `
                <td style="color: var(--color-text-muted); font-size: 0.78rem;">${dateStr}</td>
                <td><span class="cell-semester-badge">${semVal}</span></td>
                <td><span class="cell-class-pill click-filter-class" data-class="${className}" title="Filtrar por esta turma">${className}</span></td>
                <td><span class="cell-game-pill click-filter-game" data-game="${gameName}" title="Filtrar por este jogo">${gameName}</span></td>
                <td class="cell-stars">${"★".repeat(numStars) || "-"}</td>
                <td class="cell-diff ${diffClass}">${dVal || "-"}</td>
                <td class="cell-progress ${progClass}">${progEmoji}${pVal || "-"}</td>
                <td class="cell-bugs ${bugClass}">${bugEmoji}${bVal || "-"}</td>
                <td class="cell-tags">${tagsHTML || "-"}</td>
                <td style="font-size: 0.78rem; color: var(--color-text-muted); font-style: italic; max-width: 180px; word-wrap: break-word;">${comentariosVal || "-"}</td>
                <td style="text-align: center;"><button class="btn-delete-row" data-id="${recId}" data-student="${gameName}" data-class="${className}" title="Ocultar esta avaliação do painel">🗑️</button></td>
            `;
            tableBody.appendChild(tr);
        });

        // Clique rápido nas pílulas da tabela para filtrar
        tableBody.querySelectorAll(".click-filter-class").forEach(el => {
            el.addEventListener("click", () => {
                const className = el.dataset.class;
                const select = document.getElementById("filter-class");
                if (select) {
                    select.value = className;
                    select.dispatchEvent(new Event("change"));
                }
            });
        });

        tableBody.querySelectorAll(".click-filter-game").forEach(el => {
            el.addEventListener("click", () => {
                const game = el.dataset.game;
                const select = document.getElementById("filter-game");
                if (select) {
                    select.value = game;
                    select.dispatchEvent(new Event("change"));
                }
            });
        });

        // Botão de lixeira para excluir/ocultar feedback individual
        tableBody.querySelectorAll(".btn-delete-row").forEach(btn => {
            btn.addEventListener("click", async (e) => {
                e.stopPropagation();
                const recId = btn.dataset.id;
                const student = btn.dataset.student;
                const cls = btn.dataset.class;
                if (confirm(`Deseja excluir definitivamente a avaliação de "${student}" (Turma ${cls}) do banco de dados?`)) {
                    audio.playClick();
                    // Se for ID numérico (registro do Cloudflare D1), exclui direto no banco
                    if (/^\d+$/.test(recId)) {
                        try {
                            btn.disabled = true;
                            btn.textContent = "⏳";
                            const res = await fetch(`${API_BASE_URL}/feedbacks/${recId}`, {
                                method: "DELETE"
                            });
                            if (!res.ok) throw new Error("Erro ao excluir do banco D1");
                            dashboardState.allRecords = dashboardState.allRecords.filter(r => String(getRecordId(r)) !== String(recId));
                            processAndRenderFeedbacks(dashboardState.allRecords);
                            audio.playSuccess();
                            showToast(`Avaliação de ${student} excluída do banco com sucesso!`, "cyan-toast");
                            return;
                        } catch(err) {
                            console.error("Falha ao deletar no D1:", err);
                            showToast("Falha ao excluir no banco de dados.");
                            audio.playError();
                        } finally {
                            btn.disabled = false;
                            btn.textContent = "🗑️";
                        }
                    }
                    // Fallback para ocultação local (caso seja registro legado ou offline)
                    dashboardState.hiddenRecordIds.push(recId);
                    localStorage.setItem("titanTech_hidden_feedbacks", JSON.stringify(dashboardState.hiddenRecordIds));
                    showToast(`Avaliação de ${student} ocultada do painel.`);
                    processAndRenderFeedbacks(dashboardState.allRecords);
                }
            });
        });
    }

    // Atualiza botão de restaurar feedbacks ocultos
    const btnRestore = document.getElementById("btn-restore-hidden");
    if (btnRestore) {
        if (dashboardState.hiddenRecordIds && dashboardState.hiddenRecordIds.length > 0) {
            btnRestore.style.display = "inline-block";
            btnRestore.textContent = `Restaurar Ocultos (${dashboardState.hiddenRecordIds.length})`;
        } else {
            btnRestore.style.display = "none";
        }
    }

    // Renderiza os 4 Gráficos
    renderCharts(avgStars, starsDist, difficultyDist, progressDist, tagsCount);
}

// --- RENDERIZAÇÃO DOS 4 GRÁFICOS NO CHART.JS ---
function renderCharts(avgStars, starsDist, difficultyDist, progressDist, tagsCount) {
    // 1. CHART STARS (DISTRIBUIÇÃO DE NOTAS 1★ A 5★)
    const ctxStars = document.getElementById("chart-stars").getContext("2d");
    if (dashboardState.charts.stars) {
        dashboardState.charts.stars.destroy();
    }
    dashboardState.charts.stars = new Chart(ctxStars, {
        type: 'bar',
        data: {
            labels: ['5★', '4★', '3★', '2★', '1★'],
            datasets: [{
                data: [starsDist[5], starsDist[4], starsDist[3], starsDist[2], starsDist[1]],
                backgroundColor: [
                    'rgba(0, 240, 255, 0.45)',  // 5★ Cyan
                    'rgba(57, 255, 20, 0.45)',   // 4★ Green
                    'rgba(255, 234, 0, 0.45)',   // 3★ Yellow
                    'rgba(255, 153, 0, 0.45)',   // 2★ Orange
                    'rgba(255, 51, 102, 0.45)'   // 1★ Red
                ],
                borderColor: ['#00f0ff', '#39ff14', '#ffea00', '#ff9900', '#ff3366'],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { ticks: { color: '#8ba2c0', font: { size: 11, weight: 'bold' } }, grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8ba2c0', precision: 0, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.03)' }
                }
            }
        }
    });

    // 2. CHART DIFFICULTY (BAR)
    const ctxDiff = document.getElementById("chart-difficulty").getContext("2d");
    if (dashboardState.charts.difficulty) {
        dashboardState.charts.difficulty.destroy();
    }
    dashboardState.charts.difficulty = new Chart(ctxDiff, {
        type: 'bar',
        data: {
            labels: ['Muito Fácil', 'Na Medida', 'Impossível'],
            datasets: [{
                data: [
                    difficultyDist["Muito Fácil"],
                    difficultyDist["Na Medida"],
                    difficultyDist["Impossível"]
                ],
                backgroundColor: [
                    'rgba(57, 255, 20, 0.45)',
                    'rgba(0, 240, 255, 0.45)',
                    'rgba(255, 51, 102, 0.45)'
                ],
                borderColor: ['#39ff14', '#00f0ff', '#ff3366'],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8ba2c0', font: { size: 10 } }, grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8ba2c0', precision: 0, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.03)' }
                }
            }
        }
    });

    // 3. CHART PROGRESS / ONDE PAROU (BAR)
    const ctxProg = document.getElementById("chart-progress").getContext("2d");
    if (dashboardState.charts.progress) {
        dashboardState.charts.progress.destroy();
    }
    dashboardState.charts.progress = new Chart(ctxProg, {
        type: 'bar',
        data: {
            labels: ['Zerou 🏆', 'Raiva 😡', 'Quebrou 💥', 'Outro ⏳'],
            datasets: [{
                data: [
                    progressDist["Final"],
                    progressDist["Raiva"],
                    progressDist["Quebrou"],
                    progressDist["Outro"]
                ],
                backgroundColor: [
                    'rgba(57, 255, 20, 0.45)',
                    'rgba(255, 51, 102, 0.45)',
                    'rgba(255, 234, 0, 0.45)',
                    'rgba(139, 162, 192, 0.35)'
                ],
                borderColor: ['#39ff14', '#ff3366', '#ffea00', '#8ba2c0'],
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8ba2c0', font: { size: 10 } }, grid: { display: false } },
                y: {
                    beginAtZero: true,
                    ticks: { color: '#8ba2c0', precision: 0, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.03)' }
                }
            }
        }
    });

    // 4. CHART TAGS (HORIZONTAL BAR)
    const ctxTags = document.getElementById("chart-tags").getContext("2d");
    if (dashboardState.charts.tags) {
        dashboardState.charts.tags.destroy();
    }

    const sortedTags = Object.entries(tagsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const tagLabels = sortedTags.map(item => item[0]);
    const tagValues = sortedTags.map(item => item[1]);

    dashboardState.charts.tags = new Chart(ctxTags, {
        type: 'bar',
        data: {
            labels: tagLabels.length > 0 ? tagLabels : ['Sem Tags Marcadas'],
            datasets: [{
                data: tagValues.length > 0 ? tagValues : [0],
                backgroundColor: 'rgba(255, 0, 127, 0.45)',
                borderColor: '#ff007f',
                borderWidth: 2,
                borderRadius: 6
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#8ba2c0', precision: 0, stepSize: 1 },
                    grid: { color: 'rgba(255,255,255,0.03)' }
                },
                y: { ticks: { color: '#8ba2c0', font: { size: 10 } }, grid: { display: false } }
            }
        }
    });
}

// Mostra o Toast de notificação
function showToast(message, customClass = "") {
    const toast = document.getElementById("tt-toast");
    if (!toast) return;

    toast.className = "toast";
    void toast.offsetWidth;

    toast.textContent = message;
    toast.className = "toast show" + (customClass ? " " + customClass : "");

    setTimeout(() => {
        toast.className = "toast" + (customClass ? " " + customClass : "");
    }, 3200);
}
