// ==========================================================================
// ADMIN LOGIC - TEACHER DASHBOARD
// Escola de Tecnologias - TitanTech
// ==========================================================================

// URL DO GOOGLE APPS SCRIPT WEB APP (Substituir pela URL real gerada no Sheets)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGXz4C9jOUuHABhxPgeGN7K83v4uvf49-7hhLtxtnqUE6R-09Z0aAHvpWD3il5eRHf/exec";

// PINs autorizados: O primeiro para você (Gabriel) e o segundo para seu colega (Sandro)
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
        tags: null
    },
    pollingIntervalId: null,
    selectedClass: "",
    selectedGame: "",
    allRecords: []
};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    setupPINPad();
    checkExistingSession();
    loadFilterGames();

    document.getElementById("btn-logout").addEventListener("click", handleLogout);
});

// Verifica se já existe um PIN válido salvo na sessionStorage
function checkExistingSession() {
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
        // Erro: vibra a tela e mostra bolinhas vermelhas
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

    // Inicializa carregamento periódico de dados (cada 5s)
    fetchAndRenderData();
    dashboardState.pollingIntervalId = setInterval(fetchAndRenderData, 5000);
}

// Faz o log out do painel administrativo
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

// Carrega as turmas e os nomes dos jogos nos filtros a partir do arquivo JSON local
function loadFilterGames() {
    const selectClass = document.getElementById("filter-class");
    const selectGame = document.getElementById("filter-game");
    if (!selectClass || !selectGame) return;

    let gamesData = {};

    fetch("jogos_da_semana.json")
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar lista de jogos.");
            return response.json();
        })
        .then(data => {
            gamesData = data;
            const classes = Object.keys(data);
            
            // Popula turmas
            selectClass.innerHTML = '<option value="">Todas as Turmas</option>';
            classes.forEach(className => {
                const opt = document.createElement("option");
                opt.value = className;
                opt.textContent = className;
                selectClass.appendChild(opt);
            });

            // Popula jogos (inicialmente mostra todos os jogos de todas as turmas)
            repopulateGameFilter(null, data);
        })
        .catch(err => {
            console.error("Falha ao carregar jogos no filtro:", err);
        });

    // Ouvinte para mudança de turma
    selectClass.addEventListener("change", (e) => {
        dashboardState.selectedClass = e.target.value;
        audio.playClick();
        
        // Repopula o filtro de jogos de acordo com a turma
        repopulateGameFilter(dashboardState.selectedClass, gamesData);
        
        // Quando a turma muda, o filtro de jogo é resetado para evitar inconsistência
        dashboardState.selectedGame = "";
        selectGame.value = "";

        if (dashboardState.allRecords && dashboardState.allRecords.length > 0) {
            processAndRenderFeedbacks(dashboardState.allRecords);
        }
    });

    // Ouvinte para mudança de jogo
    selectGame.addEventListener("change", (e) => {
        dashboardState.selectedGame = e.target.value;
        audio.playClick();
        if (dashboardState.allRecords && dashboardState.allRecords.length > 0) {
            processAndRenderFeedbacks(dashboardState.allRecords);
        }
    });
}

// Repopula o seletor de jogos baseado na turma selecionada
function repopulateGameFilter(selectedClass, data) {
    const selectGame = document.getElementById("filter-game");
    selectGame.innerHTML = '<option value="">Todos os Jogos</option>';
    
    let gamesList = [];
    if (selectedClass) {
        gamesList = data[selectedClass] || [];
    } else {
        // Pega todos os jogos de todas as turmas e remove duplicatas
        const allGames = [];
        Object.values(data).forEach(list => allGames.push(...list));
        gamesList = [...new Set(allGames)];
    }

    gamesList.forEach(game => {
        const opt = document.createElement("option");
        opt.value = game;
        opt.textContent = game;
        selectGame.appendChild(opt);
    });
}

// Puxa os dados da API Google Sheets e atualiza os gráficos e tabela
function fetchAndRenderData() {
    fetch(APPS_SCRIPT_URL)
        .then(response => {
            if (!response.ok) throw new Error("Erro na conexão da API");
            return response.json();
        })
        .then(data => {
            dashboardState.allRecords = data || [];
            processAndRenderFeedbacks(dashboardState.allRecords);
        })
        .catch(err => {
            console.warn("API indisponível ou CORS bloqueado.", err);
            // Renderiza estado vazio se falhar, sem usar mock data
            dashboardState.allRecords = [];
            processAndRenderFeedbacks([]);
            showToast("Erro ao conectar com a planilha. Verifique a URL do Apps Script.");
        });
}

// Processa o array de feedbacks e plota nos gráficos/tabela
function processAndRenderFeedbacks(records) {
    const tableBody = document.getElementById("feedback-table-body");
    tableBody.innerHTML = "";

    // Filtra registros por turma e por jogo
    let filteredRecords = records || [];
    if (dashboardState.selectedClass) {
        filteredRecords = filteredRecords.filter(rec => {
            const className = rec["Turma"] || rec["turma"] || "";
            return className === dashboardState.selectedClass;
        });
    }
    if (dashboardState.selectedGame) {
        filteredRecords = filteredRecords.filter(rec => {
            const gameName = rec["Jogo"] || rec["jogo"] || "";
            return gameName === dashboardState.selectedGame;
        });
    }

    // Inverte a ordem para exibir os feedbacks mais recentes primeiro na tabela
    const displayRecords = [...filteredRecords].reverse();

    // Contadores para estatísticas
    let totalStars = 0;
    const starsDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const difficultyDist = { "Muito Fácil": 0, "Na Medida": 0, "Impossível": 0 };
    const tagsCount = {};

    filteredRecords.forEach(rec => {
        // Diversão (Estrelas)
        const starVal = parseInt(rec["Estrelas"] || rec["estrelas"]) || 0;
        if (starVal >= 1 && starVal <= 5) {
            totalStars += starVal;
            starsDist[starVal]++;
        }

        // Dificuldade
        const diffVal = rec["Dificuldade"] || rec["dificuldade"];
        if (diffVal && difficultyDist[diffVal] !== undefined) {
            difficultyDist[diffVal]++;
        }

        // Tags (string ou array de tags)
        let tagsString = rec["Tags"] || rec["tags"] || "";
        if (Array.isArray(tagsString)) {
            tagsString = tagsString.join(", ");
        }
        if (tagsString) {
            tagsString.split(",").forEach(t => {
                const cleanTag = t.trim();
                if (cleanTag) {
                    tagsCount[cleanTag] = (tagsCount[cleanTag] || 0) + 1;
                }
            });
        }
    });

    // Calcula média de estrelas com base nos dados FILTRADOS
    const avgStars = filteredRecords.length > 0 ? (totalStars / filteredRecords.length).toFixed(1) : "0.0";

    // Preenche tabela de feedbacks recentes
    if (displayRecords.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="8" class="no-data-msg">Nenhum feedback recebido ainda para esta seleção.</td></tr>`;
    } else {
        displayRecords.forEach(rec => {
            const tr = document.createElement("tr");

            // Formata data
            let dateStr = "";
            const rawDate = rec["Data/Hora"] || rec["dataHora"] || rec["timestamp"] || rec["date"] || rec["data"] || "";
            try {
                if (rawDate) {
                    const d = new Date(rawDate);
                    dateStr = d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
                }
            } catch(e) {
                dateStr = rawDate;
            }
            if (!dateStr) dateStr = rawDate || "-";

            // Mapeamento de classe de dificuldade
            let diffClass = "";
            const dVal = rec["Dificuldade"] || rec["dificuldade"] || "";
            if (dVal === "Muito Fácil") diffClass = "facil";
            else if (dVal === "Na Medida") diffClass = "medida";
            else if (dVal === "Impossível") diffClass = "impossivel";

            // Onde Parou
            const ondeParouVal = rec["Onde Parou"] || rec["Onde você parou?"] || rec["OndeParou"] || rec["ondeParou"] || "";
            let progClass = "";
            let progEmoji = "";
            if (ondeParouVal.includes("Final")) {
                progClass = "facil";
                progEmoji = "🏆 ";
            } else if (ondeParouVal.includes("Raiva")) {
                progClass = "impossivel";
                progEmoji = "😡 ";
            } else if (ondeParouVal.includes("Quebrou") || ondeParouVal.includes("quebrou")) {
                progClass = "cell-yellow";
                progEmoji = "💥 ";
            }

            // Comentários
            const comentariosVal = rec["Comentários"] || rec["Comentarios"] || rec["comentarios"] || "";

            // Transforma tags em mini badges
            let rawTags = rec["Tags"] || rec["tags"] || "";
            if (Array.isArray(rawTags)) {
                rawTags = rawTags.join(", ");
            }
            const tagsHTML = rawTags.split(",")
                .map(t => t.trim())
                .filter(t => t.length > 0)
                .map(t => `<span class="mini-tag">${t}</span>`)
                .join("");

            const className = rec["Turma"] || rec["turma"] || "-";
            const gameName = rec["Jogo"] || rec["jogo"] || "";
            const numStars = parseInt(rec["Estrelas"] || rec["estrelas"]) || 0;

            tr.innerHTML = `
                <td>${dateStr}</td>
                <td style="font-weight: 700; cursor: pointer; color: var(--color-neon-cyan);" class="click-filter-class" data-class="${className}" title="Filtrar por esta turma">${className}</td>
                <td style="font-weight: 700; cursor: pointer; color: var(--color-neon-cyan);" class="click-filter-game" data-game="${gameName}" title="Filtrar por este jogo">${gameName}</td>
                <td class="cell-stars">${"★".repeat(numStars) || "-"}</td>
                <td class="cell-diff ${diffClass}">${dVal || "-"}</td>
                <td class="${progClass}">${progEmoji}${ondeParouVal || "-"}</td>
                <td class="cell-tags">${tagsHTML || "-"}</td>
                <td style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic; max-width: 180px; word-wrap: break-word; white-space: normal;">${comentariosVal || "-"}</td>
            `;
            tableBody.appendChild(tr);
        });

        // Adiciona evento de clique para filtrar por turma diretamente ao clicar na tabela
        document.querySelectorAll(".click-filter-class").forEach(el => {
            el.addEventListener("click", () => {
                const className = el.dataset.class;
                const select = document.getElementById("filter-class");
                if (select) {
                    select.value = className;
                    select.dispatchEvent(new Event("change"));
                }
            });
        });

        // Adiciona evento de clique para filtrar por jogo diretamente ao clicar na tabela
        document.querySelectorAll(".click-filter-game").forEach(el => {
            el.addEventListener("click", () => {
                const game = el.dataset.game;
                const select = document.getElementById("filter-game");
                if (select) {
                    select.value = game;
                    select.dispatchEvent(new Event("change"));
                }
            });
        });
    }

    // Renderiza ou Atualiza os gráficos do Chart.js
    renderCharts(avgStars, starsDist, difficultyDist, tagsCount);
}

// Renderização de Gráficos usando Chart.js
function renderCharts(avgStars, starsDist, difficultyDist, tagsCount) {
    const textStyle = { color: '#8ba2c0', font: { family: 'Outfit', size: 11 } };

    // 1. CHART STARS (DOUGHNUT)
    const ctxStars = document.getElementById("chart-stars").getContext("2d");
    if (dashboardState.charts.stars) {
        dashboardState.charts.stars.destroy();
    }
    dashboardState.charts.stars = new Chart(ctxStars, {
        type: 'doughnut',
        data: {
            labels: ['1★', '2★', '3★', '4★', '5★'],
            datasets: [{
                data: [starsDist[1], starsDist[2], starsDist[3], starsDist[4], starsDist[5]],
                backgroundColor: ['#ff3333', '#ff9900', '#ffea00', '#39ff14', '#00f0ff'],
                borderColor: '#0b0f19',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#8ba2c0', font: { family: 'Outfit', size: 10 } } },
                title: {
                    display: true,
                    text: `Média: ${avgStars}★`,
                    color: '#ffea00',
                    font: { family: 'Outfit', size: 14, weight: 'bold' },
                    padding: { top: 0, bottom: 10 }
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
                data: [difficultyDist["Muito Fácil"], difficultyDist["Na Medida"], difficultyDist["Impossível"]],
                backgroundColor: ['rgba(57, 255, 20, 0.45)', 'rgba(0, 240, 255, 0.45)', 'rgba(255, 51, 51, 0.45)'],
                borderColor: ['#39ff14', '#00f0ff', '#ff3333'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8ba2c0' }, grid: { display: false } },
                y: { ticks: { color: '#8ba2c0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.03)' } }
            }
        }
    });

    // 3. CHART TAGS (HORIZONTAL BAR)
    const ctxTags = document.getElementById("chart-tags").getContext("2d");
    if (dashboardState.charts.tags) {
        dashboardState.charts.tags.destroy();
    }

    // Filtra e organiza as tags por contagem descendente
    const sortedTags = Object.entries(tagsCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5); // Mostra no máximo as 5 mais frequentes

    const tagLabels = sortedTags.map(item => item[0]);
    const tagValues = sortedTags.map(item => item[1]);

    dashboardState.charts.tags = new Chart(ctxTags, {
        type: 'bar',
        data: {
            labels: tagLabels.length > 0 ? tagLabels : ['Nenhuma Tag'],
            datasets: [{
                data: tagValues.length > 0 ? tagValues : [0],
                backgroundColor: 'rgba(255, 0, 127, 0.45)',
                borderColor: '#ff007f',
                borderWidth: 2
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { ticks: { color: '#8ba2c0', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.03)' } },
                y: { ticks: { color: '#8ba2c0' }, grid: { display: false } }
            }
        }
    });
}

// Mostra o Toast de notificação
function showToast(message, customClass = "") {
    const toast = document.getElementById("tt-toast");
    toast.className = "toast"; // Reset

    // Força reflow
    void toast.offsetWidth;

    toast.textContent = message;
    toast.className = "toast show" + (customClass ? " " + customClass : "");

    setTimeout(() => {
        toast.className = "toast" + (customClass ? " " + customClass : "");
    }, 3000);
}
