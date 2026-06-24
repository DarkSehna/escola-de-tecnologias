// Configurações Padrões da OBR
const DEFAULT_CONFIG = {
    TABELA_PONTUACAO: {
        obstaculo: 15,
        gap: 10,
        intersecao: 10,
        redutor: 5,
        ladrilhos: 5,
        checkpoint: 5,
        rampa: 10,
        vivas: 0,   // Base como 0 conforme pedido
        mortas: 0   // Base como 0 conforme pedido
    },
    MULTIPLICADORES_TENTATIVA: {
        1: 1.0, // 1ª tentativa = 100% dos pontos
        2: 0.6, // 2ª tentativa = 60%
        3: 0.3  // 3ª tentativa = 30%
    },
    TEMPO_MAXIMO: 300 // 8 minutos em segundos (480) - 5 minutos (300)
};

// Mapeamento de chaves para os IDs do DOM
const KEY_MAP = {
    obstaculo: 'obs',
    gap: 'gap',
    intersecao: 'int',
    redutor: 'red',
    ladrilhos: 'lad',
    checkpoint: 'chk',
    rampa: 'ram'
};

// Estado da Aplicação
let state = {
    pista: {
        obstaculo: { 1: 0, 2: 0, 3: 0 },
        gap: { 1: 0, 2: 0, 3: 0 },
        intersecao: { 1: 0, 2: 0, 3: 0 },
        redutor: { 1: 0, 2: 0, 3: 0 },
        ladrilhos: { 1: 0, 2: 0, 3: 0 },
        checkpoint: { 1: 0, 2: 0, 3: 0 },
        rampa: { 1: 0, 2: 0, 3: 0 }
    },
    resgate: {
        vivas: 0,
        mortas: 0
    },
    multiplicador_saida: 1.0,
    config: JSON.parse(JSON.stringify(DEFAULT_CONFIG)) // Cópia profunda
};

// Variáveis do Cronômetro
let timerInterval = null;
let timeRemaining = 480;
let isTimerRunning = false;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    carregarConfiguracoes();
    inicializarElementos();
    if (!carregarEstado()) {
        zerarRound(true); // Inicializa com os valores zerados silenciosamente se não houver estado salvo
    }
});

// Carregar e Salvar Configurações no LocalStorage
function carregarConfiguracoes() {
    const savedConfig = localStorage.getItem('titantech_obr_config');
    if (savedConfig) {
        try {
            state.config = JSON.parse(savedConfig);
        } catch (e) {
            console.error("Erro ao carregar configurações salvas, usando padrões.", e);
            state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
    } else {
        state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    timeRemaining = state.config.TEMPO_MAXIMO;
}

function salvarConfiguracoes() {
    localStorage.setItem('titantech_obr_config', JSON.stringify(state.config));
}

// Carregar e Salvar Estado da Partida (Round) no LocalStorage
function salvarEstado() {
    const estadoParaSalvar = {
        pista: state.pista,
        resgate: state.resgate,
        multiplicador_saida: state.multiplicador_saida,
        timeRemaining: timeRemaining,
        attempt: getTentativaAtiva()
    };
    localStorage.setItem('titantech_obr_state', JSON.stringify(estadoParaSalvar));
}

function carregarEstado() {
    const savedState = localStorage.getItem('titantech_obr_state');
    if (savedState) {
        try {
            const data = JSON.parse(savedState);
            state.pista = data.pista;
            state.resgate = data.resgate;
            state.multiplicador_saida = data.multiplicador_saida || 1.0;
            timeRemaining = data.timeRemaining !== undefined ? data.timeRemaining : state.config.TEMPO_MAXIMO;
            
            // Restaura o radio button da tentativa
            if (data.attempt) {
                const radio = document.getElementById(`attempt-${data.attempt}`);
                if (radio) radio.checked = true;
            }
            
            // Restaura multiplicador na UI
            setMultiplier(state.multiplicador_saida);
            
            atualizarTimerDisplay();
            recalcularPontuacao();
            return true;
        } catch (e) {
            console.error("Erro ao carregar estado salvo do round", e);
        }
    }
    return false;
}

// Inicializar ouvintes de eventos e botões do DOM
function inicializarElementos() {
    // Abas de Navegação
    window.switchTab = (tabName) => {
        playBeep(600, 0.05);
        triggerHaptic('success');
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

        document.getElementById(`tab-${tabName}`).classList.add('active');
        document.getElementById(`pane-${tabName}`).classList.add('active');
    };

    // Ouvintes do Cronômetro
    document.getElementById('btn-timer-start').addEventListener('click', iniciarCronometro);
    document.getElementById('btn-timer-pause').addEventListener('click', pausarCronometro);
    document.getElementById('btn-timer-reset').addEventListener('click', resetarCronometro);

    // Botão Zerar Tudo (Rodapé)
    document.getElementById('btn-reset-all').addEventListener('click', () => {
        triggerHaptic('warning');
        playBeep(300, 0.2);
        if (confirm("Deseja realmente zerar o round e reiniciar o placar?")) {
            zerarRound(false);
        }
    });

    // Ouvintes de Modais
    const modal = document.getElementById('settings-modal');
    document.getElementById('btn-settings').addEventListener('click', () => {
        abrirConfiguracoes();
    });
    document.getElementById('btn-close-settings').addEventListener('click', () => {
        fecharConfiguracoes();
    });
    document.getElementById('btn-save-settings').addEventListener('click', () => {
        confirmarSalvarConfiguracoes();
    });
    document.getElementById('btn-restore-defaults').addEventListener('click', () => {
        if (confirm("Deseja restaurar as configurações padrão de fábrica?")) {
            restaurarPadroes();
        }
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharConfiguracoes();
        }
    });
}

// Obter tentativa selecionada (1, 2 ou 3)
function getTentativaAtiva() {
    const radio = document.querySelector('input[name="attempt"]:checked');
    return radio ? parseInt(radio.value) : 1;
}

// Feedbacks Sonoros e Táteis
function playBeep(frequency = 800, duration = 0.1) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime); // Volume suave

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
        // Ignora erros de permissão de áudio do navegador
    }
}

function triggerHaptic(type = 'success') {
    if (navigator.vibrate) {
        if (type === 'success') {
            navigator.vibrate(15);
        } else if (type === 'warning') {
            navigator.vibrate(35);
        } else if (type === 'error') {
            navigator.vibrate([20, 50, 20]);
        }
    }
}

// Funções de Incremento e Decremento (Pista)
window.increment = (key) => {
    const tentativa = getTentativaAtiva();
    state.pista[key][tentativa]++;

    playBeep(880, 0.06);
    triggerHaptic('success');
    recalcularPontuacao();
};

window.decrement = (key) => {
    const tentativa = getTentativaAtiva();
    if (state.pista[key][tentativa] > 0) {
        state.pista[key][tentativa]--;
        playBeep(520, 0.08);
        triggerHaptic('warning');
        recalcularPontuacao();
    } else {
        // Se a tentativa selecionada for 0, tenta reduzir de alguma outra tentativa que tenha valor
        let decrementado = false;
        for (let t = 3; t >= 1; t--) {
            if (state.pista[key][t] > 0) {
                state.pista[key][t]--;
                decrementado = true;
                playBeep(520, 0.08);
                triggerHaptic('warning');
                recalcularPontuacao();
                break;
            }
        }
        if (!decrementado) {
            triggerHaptic('error');
        }
    }
};

// Funções de Sala de Resgate (Vítimas)
window.incrementRescue = (key) => {
    state.resgate[key]++;
    playBeep(1000, 0.08);
    triggerHaptic('success');
    recalcularPontuacao();
};

window.decrementRescue = (key) => {
    if (state.resgate[key] > 0) {
        state.resgate[key]--;
        playBeep(520, 0.08);
        triggerHaptic('warning');
        recalcularPontuacao();
    } else {
        triggerHaptic('error');
    }
};

// Definir Multiplicador de Saída
window.setMultiplier = (value) => {
    state.multiplicador_saida = value;

    // Atualizar UI dos botões
    document.querySelectorAll('.mult-pill').forEach(btn => {
        if (parseFloat(btn.innerText) === value) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    playBeep(750, 0.05);
    triggerHaptic('success');
    recalcularPontuacao();
};

// Motor Matemático: Recalcular Placar Total
function recalcularPontuacao() {
    let pistaTotal = 0;

    // 1. Processar Pista
    for (const key in state.pista) {
        const basePoints = state.config.TABELA_PONTUACAO[key] || 0;
        const attempts = state.pista[key];

        // Calcular pontos somados por tentativa com o redutor correspondente
        const p1 = attempts[1] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[1];
        const p2 = attempts[2] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[2];
        const p3 = attempts[3] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[3];

        // Soma os subtotais arredondados de cada tentativa para manter pontos inteiros
        const subtotal = Math.round(p1) + Math.round(p2) + Math.round(p3);
        pistaTotal += subtotal;

        // Atualizar UI individual do cartão
        const prefix = KEY_MAP[key];
        if (prefix) {
            document.getElementById(`val-${prefix}-1`).innerText = attempts[1];
            document.getElementById(`val-${prefix}-2`).innerText = attempts[2];
            document.getElementById(`val-${prefix}-3`).innerText = attempts[3];
            document.getElementById(`total-${prefix}`).innerText = attempts[1] + attempts[2] + attempts[3];
        }
    }

    // 2. Processar Resgate
    const rescueSubtotal = (state.resgate.vivas * state.config.TABELA_PONTUACAO.vivas) +
        (state.resgate.mortas * state.config.TABELA_PONTUACAO.mortas);
    const rescueTotal = Math.round(rescueSubtotal * state.multiplicador_saida);

    // Atualizar UI do Resgate
    document.getElementById('total-vivas').innerText = state.resgate.vivas;
    document.getElementById('total-mortas').innerText = state.resgate.mortas;

    // 3. Soma Total Final
    const finalTotal = pistaTotal + rescueTotal;

    // Atualizar Display do Rodapé
    document.getElementById('score-display').innerText = finalTotal;
    salvarEstado();
}

// Funções do Cronômetro
function iniciarCronometro() {
    if (isTimerRunning) return;

    isTimerRunning = true;
    playBeep(980, 0.15);
    triggerHaptic('success');

    document.getElementById('btn-timer-start').style.display = 'none';
    document.getElementById('btn-timer-pause').style.display = 'flex';

    timerInterval = setInterval(() => {
        if (timeRemaining > 0) {
            timeRemaining--;
            atualizarTimerDisplay();
            salvarEstado();

            // Alertas sonoros em momentos críticos
            if (timeRemaining === 60) {
                // Alerta de 1 minuto
                playBeep(880, 0.1);
                setTimeout(() => playBeep(880, 0.1), 150);
            } else if (timeRemaining === 30) {
                // Alerta de 30 segundos
                playBeep(1000, 0.1);
                setTimeout(() => playBeep(1000, 0.1), 150);
            } else if (timeRemaining === 0) {
                tempoEsgotado();
            }
        } else {
            tempoEsgotado();
        }
    }, 1000);
}

function pausarCronometro() {
    if (!isTimerRunning) return;

    isTimerRunning = false;
    clearInterval(timerInterval);
    playBeep(650, 0.15);
    triggerHaptic('warning');

    document.getElementById('btn-timer-start').style.display = 'flex';
    document.getElementById('btn-timer-pause').style.display = 'none';
    salvarEstado();
}

function resetarCronometro() {
    pausarCronometro();
    playBeep(440, 0.1);
    triggerHaptic('warning');

    if (confirm("Reiniciar o tempo do cronômetro?")) {
        timeRemaining = state.config.TEMPO_MAXIMO;
        atualizarTimerDisplay();
        document.getElementById('timer-display').classList.remove('finished');
        salvarEstado();
    }
}

function tempoEsgotado() {
    pausarCronometro();
    document.getElementById('timer-display').classList.add('finished');

    // Beep longo e alarmante
    playBeep(1200, 0.8);
    triggerHaptic('error');
}

function atualizarTimerDisplay() {
    const mins = Math.floor(timeRemaining / 60);
    const secs = timeRemaining % 60;
    document.getElementById('timer-display').innerText =
        `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Limpar e reiniciar todos os contadores do round
function zerarRound(silencioso = false) {
    // Limpar estados
    for (const key in state.pista) {
        state.pista[key] = { 1: 0, 2: 0, 3: 0 };
    }
    state.resgate.vivas = 0;
    state.resgate.mortas = 0;
    state.multiplicador_saida = 1.0;

    // Resetar botões multiplicadores
    setMultiplier(1.0);

    // Resetar tentativa selecionada para 1ª
    document.getElementById('attempt-1').checked = true;

    // Reiniciar Cronômetro
    isTimerRunning = false;
    clearInterval(timerInterval);
    timeRemaining = state.config.TEMPO_MAXIMO;
    atualizarTimerDisplay();

    document.getElementById('btn-timer-start').style.display = 'flex';
    document.getElementById('btn-timer-pause').style.display = 'none';
    document.getElementById('timer-display').classList.remove('finished');

    recalcularPontuacao();

    if (!silencioso) {
        localStorage.removeItem('titantech_obr_state');
        playBeep(900, 0.25);
        triggerHaptic('success');
    }
}

// Operações de Configurações (Modal)
function abrirConfiguracoes() {
    playBeep(700, 0.05);
    triggerHaptic('success');

    // Preencher campos do formulário
    document.getElementById('cfg-max-time').value = Math.floor(state.config.TEMPO_MAXIMO / 60);

    document.getElementById('cfg-pts-obs').value = state.config.TABELA_PONTUACAO.obstaculo;
    document.getElementById('cfg-pts-gap').value = state.config.TABELA_PONTUACAO.gap;
    document.getElementById('cfg-pts-int').value = state.config.TABELA_PONTUACAO.intersecao;
    document.getElementById('cfg-pts-red').value = state.config.TABELA_PONTUACAO.redutor;
    document.getElementById('cfg-pts-lad').value = state.config.TABELA_PONTUACAO.ladrilhos;
    document.getElementById('cfg-pts-chk').value = state.config.TABELA_PONTUACAO.checkpoint;
    document.getElementById('cfg-pts-ram').value = state.config.TABELA_PONTUACAO.rampa;
    document.getElementById('cfg-pts-viv').value = state.config.TABELA_PONTUACAO.vivas;
    document.getElementById('cfg-pts-mor').value = state.config.TABELA_PONTUACAO.mortas;

    document.getElementById('cfg-mult-t1').value = Math.round(state.config.MULTIPLICADORES_TENTATIVA[1] * 100);
    document.getElementById('cfg-mult-t2').value = Math.round(state.config.MULTIPLICADORES_TENTATIVA[2] * 100);
    document.getElementById('cfg-mult-t3').value = Math.round(state.config.MULTIPLICADORES_TENTATIVA[3] * 100);

    document.getElementById('settings-modal').classList.add('open');
}

function fecharConfiguracoes() {
    playBeep(500, 0.05);
    triggerHaptic('warning');
    document.getElementById('settings-modal').classList.remove('open');
}

function confirmarSalvarConfiguracoes() {
    const maxTimeMin = parseInt(document.getElementById('cfg-max-time').value) || 8;

    state.config.TEMPO_MAXIMO = maxTimeMin * 60;

    state.config.TABELA_PONTUACAO.obstaculo = parseInt(document.getElementById('cfg-pts-obs').value) || 0;
    state.config.TABELA_PONTUACAO.gap = parseInt(document.getElementById('cfg-pts-gap').value) || 0;
    state.config.TABELA_PONTUACAO.intersecao = parseInt(document.getElementById('cfg-pts-int').value) || 0;
    state.config.TABELA_PONTUACAO.redutor = parseInt(document.getElementById('cfg-pts-red').value) || 0;
    state.config.TABELA_PONTUACAO.ladrilhos = parseInt(document.getElementById('cfg-pts-lad').value) || 0;
    state.config.TABELA_PONTUACAO.checkpoint = parseInt(document.getElementById('cfg-pts-chk').value) || 0;
    state.config.TABELA_PONTUACAO.rampa = parseInt(document.getElementById('cfg-pts-ram').value) || 0;
    state.config.TABELA_PONTUACAO.vivas = parseInt(document.getElementById('cfg-pts-viv').value) || 0;
    state.config.TABELA_PONTUACAO.mortas = parseInt(document.getElementById('cfg-pts-mor').value) || 0;

    state.config.MULTIPLICADORES_TENTATIVA[1] = (parseInt(document.getElementById('cfg-mult-t1').value) || 100) / 100;
    state.config.MULTIPLICADORES_TENTATIVA[2] = (parseInt(document.getElementById('cfg-mult-t2').value) || 60) / 100;
    state.config.MULTIPLICADORES_TENTATIVA[3] = (parseInt(document.getElementById('cfg-mult-t3').value) || 30) / 100;

    salvarConfiguracoes();

    // Se o cronômetro não estiver rodando, atualiza a exibição com o novo tempo limite
    if (!isTimerRunning) {
        timeRemaining = state.config.TEMPO_MAXIMO;
        atualizarTimerDisplay();
    }

    recalcularPontuacao();
    fecharConfiguracoes();

    playBeep(1100, 0.1);
    triggerHaptic('success');
}

function restaurarPadroes() {
    state.config = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    salvarConfiguracoes();

    if (!isTimerRunning) {
        timeRemaining = state.config.TEMPO_MAXIMO;
        atualizarTimerDisplay();
    }

    recalcularPontuacao();
    fecharConfiguracoes();

    playBeep(800, 0.2);
    triggerHaptic('success');
}

// Exportação de resultados de treino para arquivo local
window.exportarResultado = () => {
    playBeep(950, 0.1);
    triggerHaptic('success');
    
    const agora = new Date();
    const dataStr = agora.toLocaleDateString('pt-BR');
    const horaStr = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    let totalPista = 0;
    let pistaDetails = "";
    
    for (const key in state.pista) {
        const basePoints = state.config.TABELA_PONTUACAO[key] || 0;
        const attempts = state.pista[key];
        const p1 = Math.round(attempts[1] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[1]);
        const p2 = Math.round(attempts[2] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[2]);
        const p3 = Math.round(attempts[3] * basePoints * state.config.MULTIPLICADORES_TENTATIVA[3]);
        const subtotal = p1 + p2 + p3;
        totalPista += subtotal;
        
        pistaDetails += `- ${key.toUpperCase()}: ${attempts[1]} (1ª), ${attempts[2]} (2ª), ${attempts[3]} (3ª) | Subtotal: ${subtotal} pts\n`;
    }
    
    const rescueSubtotal = (state.resgate.vivas * state.config.TABELA_PONTUACAO.vivas) +
        (state.resgate.mortas * state.config.TABELA_PONTUACAO.mortas);
    const rescueTotal = Math.round(rescueSubtotal * state.multiplicador_saida);
    const finalScore = totalPista + rescueTotal;
    
    const tempoDecorridoMin = Math.floor((state.config.TEMPO_MAXIMO - timeRemaining) / 60);
    const tempoDecorridoSeg = (state.config.TEMPO_MAXIMO - timeRemaining) % 60;
    const tempoDecorridoStr = `${tempoDecorridoMin.toString().padStart(2, '0')}:${tempoDecorridoSeg.toString().padStart(2, '0')}`;
    
    let report = `==================================================\n`;
    report += `          TITANTECH - RELATÓRIO DE TREINO OBR      \n`;
    report += `==================================================\n`;
    report += `Data: ${dataStr}   Hora: ${horaStr}\n`;
    report += `Tempo decorrido de corrida: ${tempoDecorridoStr}\n`;
    report += `--------------------------------------------------\n`;
    report += `PONTUAÇÃO DA PISTA (TENTATIVAS COM DEGRADAÇÃO):\n`;
    report += pistaDetails;
    report += `Subtotal Pista: ${totalPista} pts\n`;
    report += `--------------------------------------------------\n`;
    report += `SALA DE RESGATE:\n`;
    report += `- Vítimas Vivas Resgatadas: ${state.resgate.vivas} (${state.config.TABELA_PONTUACAO.vivas} pts cada)\n`;
    report += `- Vítimas Mortas Resgatadas: ${state.resgate.mortas} (${state.config.TABELA_PONTUACAO.mortas} pts cada)\n`;
    report += `- Multiplicador de Saída: ${state.multiplicador_saida}x\n`;
    report += `Subtotal Resgate (c/ bônus): ${rescueTotal} pts\n`;
    report += `--------------------------------------------------\n`;
    report += `PONTUAÇÃO TOTAL DA RUN: ${finalScore} pts\n`;
    report += `==================================================\n`;
    
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    const filename = `treino_obr_${agora.getFullYear()}${(agora.getMonth()+1).toString().padStart(2,'0')}${agora.getDate().toString().padStart(2,'0')}_${agora.getHours().toString().padStart(2,'0')}${agora.getMinutes().toString().padStart(2,'0')}.txt`;
    
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Tenta copiar para a área de transferência como fallback/comodidade
    try {
        navigator.clipboard.writeText(report).then(() => {
            showToast("Treino exportado e copiado!");
        }).catch(err => {
            showToast("Treino exportado com sucesso!");
        });
    } catch (e) {
        showToast("Treino exportado com sucesso!");
    }
};

// Exibe um alerta Toast moderno na tela
function showToast(message) {
    let toast = document.getElementById('tt-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'tt-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'toast show';
    
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}
