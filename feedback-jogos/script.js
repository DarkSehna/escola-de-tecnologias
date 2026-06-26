// ==========================================================================
// CLIENT LOGIC - GAME FEEDBACK FORM
// Escola de Tecnologias - TitanTech
// ==========================================================================

// URL DO GOOGLE APPS SCRIPT WEB APP (Substituir pela URL gerada ao publicar o Web App)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwGXz4C9jOUuHABhxPgeGN7K83v4uvf49-7hhLtxtnqUE6R-09Z0aAHvpWD3il5eRHf/exec";

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
    playSelect() { this.playTone(1000, 'sine', 0.08, 0.06); }
    playSuccess() {
        this.playTone(523.25, 'sine', 0.12, 0.05); // C5
        setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.05), 60); // E5
        setTimeout(() => this.playTone(783.99, 'sine', 0.2, 0.05), 120); // G5
    }
    playError() {
        this.playTone(220, 'triangle', 0.25, 0.1);
        setTimeout(() => this.playTone(180, 'triangle', 0.25, 0.1), 80);
    }
}
const audio = new SynthAudio();

// --- ESTADO LOCAL DO FORMULÁRIO ---
const formState = {
    turma: "",
    jogo: "",
    estrelas: 0,
    entendimento: "",
    dificuldade: "",
    ondeParou: "",
    bugs: "",
    pontosFortes: [],
    sugestoesAjuste: [],
    tags: [],
    comentarios: ""
};

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    loadGamesDropdown();
    setupStarRating();
    setupEntendimentoButtons();
    setupDifficultyButtons();
    setupProgressButtons();
    setupBugsButtons();
    setupTagButtons();
    
    const form = document.getElementById("feedback-form");
    form.addEventListener("submit", handleFormSubmit);

    // Salva o estado da aba de volta para o painel
    const backBtn = document.getElementById("link-back-dashboard");
    if (backBtn) {
        backBtn.addEventListener("click", () => {
            // Garantir que a aba de Games esteja ativa ao voltar
            sessionStorage.setItem('titanTech_activeTab', 'games');
        });
    }
});

// Encontra a melhor correspondência para o parâmetro turma recebido via URL
function findBestClassMatch(param, classesList) {
    if (!param) return null;
    const cleanParam = param.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    for (const className of classesList) {
        const cleanClass = className.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
        if (cleanClass.includes(cleanParam) || cleanParam.includes(cleanClass)) {
            return className;
        }
    }
    return null;
}

// Preenche dropdown de jogos a partir da turma selecionada
function populateGames(className, data) {
    const selectGame = document.getElementById("select-game");
    selectGame.innerHTML = '<option value="" disabled selected>Selecione o jogo...</option>';
    
    if (className && data[className]) {
        selectGame.disabled = false;
        data[className].forEach(game => {
            const opt = document.createElement("option");
            opt.value = game;
            opt.textContent = game;
            selectGame.appendChild(opt);
        });
        
        if (formState.jogo && data[className].includes(formState.jogo)) {
            selectGame.value = formState.jogo;
        } else {
            formState.jogo = "";
        }
    } else {
        selectGame.disabled = true;
        selectGame.innerHTML = '<option value="" disabled selected>Selecione a turma primeiro...</option>';
        formState.jogo = "";
    }
}

// Carrega as turmas e jogos do arquivo JSON local
function loadGamesDropdown() {
    const selectClass = document.getElementById("select-class");
    const selectGame = document.getElementById("select-game");
    let gamesData = {};
    
    fetch("jogos_da_semana.json")
        .then(response => {
            if (!response.ok) throw new Error("Erro ao carregar lista de jogos.");
            return response.json();
        })
        .then(data => {
            gamesData = data;
            const classes = Object.keys(data);
            
            // Popula o dropdown de turmas
            classes.forEach(className => {
                const opt = document.createElement("option");
                opt.value = className;
                opt.textContent = className;
                selectClass.appendChild(opt);
            });

            // Verifica parâmetro na URL para pré-seleção automática da turma
            const urlParams = new URLSearchParams(window.location.search);
            const turmaParam = urlParams.get("turma");
            if (turmaParam) {
                const matchedClass = findBestClassMatch(turmaParam, classes);
                if (matchedClass) {
                    selectClass.value = matchedClass;
                    formState.turma = matchedClass;
                    populateGames(matchedClass, gamesData);
                }
            }
        })
        .catch(err => {
            console.error(err);
            showToast("Falha ao carregar lista de jogos.", "pink-toast");
        });

    selectClass.addEventListener("change", (e) => {
        const selectedClass = e.target.value;
        formState.turma = selectedClass;
        audio.playClick();
        populateGames(selectedClass, gamesData);
    });

    selectGame.addEventListener("change", (e) => {
        formState.jogo = e.target.value;
        audio.playClick();
    });
}

// Configura o sistema de estrelas
function setupStarRating() {
    const starInputs = document.querySelectorAll('input[name="stars-rating"]');
    starInputs.forEach(input => {
        input.addEventListener("change", (e) => {
            formState.estrelas = parseInt(e.target.value);
            audio.playSelect();
        });
    });
}

// Configura os botões de entendimento
function setupEntendimentoButtons() {
    const buttons = document.querySelectorAll(".entendimento-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            formState.entendimento = btn.dataset.val;
            audio.playSelect();
        });
    });
}

// Configura os botões de dificuldade
function setupDifficultyButtons() {
    const buttons = document.querySelectorAll(".difficulty-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            formState.dificuldade = btn.dataset.val;
            audio.playSelect();
        });
    });
}

// Configura os botões de progresso (Onde parou?)
function setupProgressButtons() {
    const buttons = document.querySelectorAll(".progress-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            formState.ondeParou = btn.dataset.val;
            audio.playSelect();
        });
    });
}

// Configura os botões de bugs
function setupBugsButtons() {
    const buttons = document.querySelectorAll(".bugs-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            formState.bugs = btn.dataset.val;
            audio.playSelect();
        });
    });
}

// Configura os botões de tags rápidas
function setupTagButtons() {
    const buttons = document.querySelectorAll(".tag-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            const val = btn.dataset.val;
            const isHighlight = btn.classList.contains("highlight-btn");
            const targetArray = isHighlight ? formState.pontosFortes : formState.sugestoesAjuste;
            const index = targetArray.indexOf(val);
            
            if (index > -1) {
                targetArray.splice(index, 1);
                btn.classList.remove("active");
            } else {
                targetArray.push(val);
                btn.classList.add("active");
            }
            audio.playClick();
        });
    });
}

// Manipulador de envio do formulário
function handleFormSubmit(e) {
    e.preventDefault();

    // Validações básicas
    if (!formState.turma) {
        showToast("Selecione a sua turma!");
        audio.playError();
        return;
    }
    if (!formState.jogo) {
        showToast("Selecione qual jogo você jogou!");
        audio.playError();
        return;
    }
    if (formState.estrelas === 0) {
        showToast("Dê uma nota de diversão em estrelas!");
        audio.playError();
        return;
    }
    if (!formState.entendimento) {
        showToast("Selecione se o jogo é fácil de entender!");
        audio.playError();
        return;
    }
    if (!formState.dificuldade) {
        showToast("Selecione o nível de dificuldade!");
        audio.playError();
        return;
    }
    if (!formState.ondeParou) {
        showToast("Selecione onde você parou no jogo!");
        audio.playError();
        return;
    }
    if (!formState.bugs) {
        showToast("Selecione se você encontrou bugs!");
        audio.playError();
        return;
    }

    // Captura comentários se houver
    const commentsInput = document.getElementById("input-comments");
    if (commentsInput) {
        formState.comentarios = commentsInput.value.trim();
    }

    // Mescla os dois tipos de tags no array unificado de tags
    formState.tags = [...formState.pontosFortes, ...formState.sugestoesAjuste];

    const submitBtn = document.getElementById("submit-btn");
    const spinner = document.getElementById("submit-spinner");

    // Desativa controles
    submitBtn.disabled = true;
    spinner.style.display = "inline-block";

    // Envia os dados para a Google Planilha via fetch POST
    fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // Necessário para contornar redirecionamentos de CORS do Apps Script
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(formState)
    })
    .then(() => {
        // Como o modo 'no-cors' não retorna conteúdo da resposta, assumimos sucesso caso a promise resolva.
        audio.playSuccess();
        showToast("Feedback enviado com sucesso! Obrigado!", "cyan-toast");
        resetForm();
    })
    .catch(err => {
        console.error("Erro no envio:", err);
        showToast("Erro ao enviar feedback. Tente novamente.");
        audio.playError();
    })
    .finally(() => {
        submitBtn.disabled = false;
        spinner.style.display = "none";
    });
}

// Reseta os campos do formulário para nova entrada
function resetForm() {
    const form = document.getElementById("feedback-form");
    form.reset();

    // Limpa estado local
    formState.turma = "";
    formState.jogo = "";
    formState.estrelas = 0;
    formState.entendimento = "";
    formState.dificuldade = "";
    formState.ondeParou = "";
    formState.bugs = "";
    formState.pontosFortes = [];
    formState.sugestoesAjuste = [];
    formState.tags = [];
    formState.comentarios = "";

    // Desabilita dropdown de jogo novamente
    const selectGame = document.getElementById("select-game");
    if (selectGame) {
        selectGame.disabled = true;
        selectGame.innerHTML = '<option value="" disabled selected>Selecione a turma primeiro...</option>';
    }

    // Limpa seletores visuais do DOM
    document.querySelectorAll(".entendimento-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".difficulty-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".progress-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".bugs-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tag-btn").forEach(b => b.classList.remove("active"));
}

// Mostra o Toast de notificação
function showToast(message, customClass = "") {
    const toast = document.getElementById("tt-toast");
    toast.className = "toast"; // Reset
    
    // Força reflow do DOM para resetar animação se disparada repetidamente
    void toast.offsetWidth;

    toast.textContent = message;
    toast.className = "toast show" + (customClass ? " " + customClass : "");
    
    setTimeout(() => {
        toast.className = "toast" + (customClass ? " " + customClass : "");
    }, 3500);
}
