// ==========================================================================
// CONTROLADOR LOGICO - HACKER LOCKPICKING
// Escola de Tecnologias - TitanTech
// ==========================================================================

// Elementos da Interface
const canvas = document.getElementById('dial-canvas');
const ctx = canvas.getContext('2d');
const led = document.getElementById('led-indicator');
const statusText = document.getElementById('status-text');
const btnConnect = document.getElementById('btn-connect');
const selectBaud = document.getElementById('baud-rate');
const browserWarning = document.getElementById('browser-warning');
const serialPanel = document.getElementById('serial-panel');
const statusBar = document.getElementById('display-status-bar');
const terminalLog = document.getElementById('terminal-log');
const btnReset = document.getElementById('btn-reset');
const btnGuide = document.getElementById('btn-guide');
const btnCloseModal = document.getElementById('btn-close-modal');
const guideModal = document.getElementById('guide-modal');
const btnClearConsole = document.getElementById('btn-clear-console');

// Controles da Simulação
const scaleSim = document.getElementById('scale-sim');
const simDialVal = document.getElementById('sim-dial-val');
const simulationBody = document.getElementById('simulation-body');
const simulationToggleIcon = document.getElementById('simulation-toggle-icon');

// Estado do Jogo
let dialValue = 0;
let slotValues = [null, null, null];
let feedbackBlocked = false; // Bloqueia leitura até reiniciar
let isConnected = false;

// Estado da Conexão Serial
let port = null;
let reader = null;
let keepReading = true;
let serialBuffer = "";

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verifica suporte à Web Serial API
    if ('serial' in navigator) {
        browserWarning.classList.add('hidden');
        serialPanel.style.display = 'flex';
    } else {
        browserWarning.classList.remove('hidden');
        serialPanel.style.display = 'none';
        logToTerminal('API Serial não suportada por este navegador. Use o painel de simulação.', 'system');
    }

    // 2. Ouvintes de Eventos
    btnConnect.addEventListener('click', toggleSerialConnection);
    btnReset.addEventListener('click', resetCofre);
    btnGuide.addEventListener('click', () => guideModal.classList.add('open'));
    btnCloseModal.addEventListener('click', () => guideModal.classList.remove('open'));
    btnClearConsole.addEventListener('click', () => {
        terminalLog.innerHTML = '';
        logToTerminal('Console limpo.', 'system');
    });

    // Ouvintes da Simulação Virtual
    scaleSim.addEventListener('input', (e) => {
        const val = e.target.value;
        simDialVal.textContent = val;
        
        if (feedbackBlocked) return;
        dialValue = parseInt(val);
        drawDial(dialValue);
        logToTerminal(`[Simulador] Dial girado para: ${dialValue}`, 'simulated');
    });

    // Renderiza Dial Inicial
    drawDial(0);
});

// ==========================================
// RENDERIZADOR CANVAS DO DIAL ANALÓGICO
// ==========================================
function drawDial(value) {
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const radius = 100;

    // Limpa o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Desenhar Anel de Fundo (Pista do Dial)
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 8;
    ctx.stroke();

    // 2. Desenhar Graduações (Marcas de Ticks 0 a 9)
    for (let i = 0; i < 10; i++) {
        const angle = (i * 36 - 90) * (Math.PI / 180); // 36° por tick
        const tickStartX = cx + (radius - 12) * Math.cos(angle);
        const tickStartY = cy + (radius - 12) * Math.sin(angle);
        const tickEndX = cx + (radius + 2) * Math.cos(angle);
        const tickEndY = cy + (radius + 2) * Math.sin(angle);

        ctx.beginPath();
        ctx.moveTo(tickStartX, tickStartY);
        ctx.lineTo(tickEndX, tickEndY);
        
        // Destaque para o valor atualmente selecionado
        if (i === value) {
            ctx.strokeStyle = '#00f5d4';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(0, 245, 212, 0.5)';
        } else {
            ctx.strokeStyle = '#4b5563';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 0;
        }
        ctx.stroke();

        // Desenhar Números fora do anel
        const textX = cx + (radius + 22) * Math.cos(angle);
        const textY = cy + (radius + 22) * Math.sin(angle) + 5; // Ajuste vertical
        
        ctx.font = i === value ? 'bold 13px JetBrains Mono' : '11px JetBrains Mono';
        ctx.fillStyle = i === value ? '#00f5d4' : '#6b7280';
        ctx.textAlign = 'center';
        ctx.fillText(i, textX, textY);
    }

    // 3. Desenhar Ponteiro Central
    const pointerAngle = (value * 36 - 90) * (Math.PI / 180);
    const ptrEndX = cx + (radius - 15) * Math.cos(pointerAngle);
    const ptrEndY = cy + (radius - 15) * Math.sin(pointerAngle);

    ctx.shadowBlur = 0; // Reseta sombra
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ptrEndX, ptrEndY);
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Centro do Ponteiro
    ctx.beginPath();
    ctx.arc(cx, cy, 14, 0, 2 * Math.PI);
    ctx.fillStyle = '#111827';
    ctx.fill();
    ctx.strokeStyle = '#00ff66';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 4. Desenhar Visor Digital Central
    ctx.font = 'bold 36px JetBrains Mono';
    ctx.fillStyle = feedbackBlocked && statusBar.classList.contains('unlocked') ? '#00ff66' : 
                    feedbackBlocked && statusBar.classList.contains('denied') ? '#ff2a5f' : '#00f5d4';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value, cx, cy - 1);
}

// ==========================================
// GERENCIADOR DE CONEXÃO SERIAL
// ==========================================
async function toggleSerialConnection() {
    if (isConnected) {
        // Desconectar
        disconnectSerial();
    } else {
        // Conectar
        connectSerial();
    }
}

async function connectSerial() {
    try {
        port = await navigator.serial.requestPort();
        const baud = parseInt(selectBaud.value);
        await port.open({ baudRate: baud });

        isConnected = true;
        keepReading = true;
        
        btnConnect.textContent = 'DESCONECTAR';
        btnConnect.classList.add('connected');
        led.className = 'led connected';
        statusText.textContent = 'CONECTADO';
        logToTerminal(`[Serial] Conectado com sucesso a 9600 baud.`, 'success');

        // Loop de leitura rodando em paralelo
        readSerialLoop();
    } catch (err) {
        console.error(err);
        logToTerminal(`[Erro] Falha ao abrir porta serial: ${err.message}`, 'danger');
        disconnectSerial();
    }
}

async function disconnectSerial() {
    keepReading = false;
    
    if (reader) {
        try {
            await reader.cancel();
        } catch (e) {}
    }

    if (port) {
        try {
            await port.close();
        } catch (e) {}
        port = null;
    }

    isConnected = false;
    btnConnect.textContent = 'CONECTAR ARDUINO';
    btnConnect.classList.remove('connected');
    led.className = 'led disconnected';
    statusText.textContent = 'DESCONECTADO';
    logToTerminal(`[Serial] Conexão encerrada.`, 'system');
}

async function readSerialLoop() {
    while (port && port.readable && keepReading) {
        try {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
            reader = textDecoder.readable.getReader();

            while (true) {
                const { value, done } = await reader.read();
                if (done) {
                    break;
                }
                if (value) {
                    parseIncomingBuffer(value);
                }
            }
        } catch (err) {
            console.error(err);
            logToTerminal(`[Erro] Conexão perdida com o dispositivo.`, 'danger');
            disconnectSerial();
            break;
        }
    }
}

// Acumulador de dados seriais para quebrar por linha (\n)
function parseIncomingBuffer(textChunk) {
    serialBuffer += textChunk;
    let lines = serialBuffer.split('\n');
    serialBuffer = lines.pop(); // Mantém pedaço incompleto no buffer

    for (let line of lines) {
        line = line.trim();
        if (line) {
            processMessage(line, false);
        }
    }
}

// ==========================================
// PROCESSADOR DE INSTRUÇÕES (HARDWARE / VIRTUAL)
// ==========================================
function processMessage(msg, isSimulated = false) {
    if (feedbackBlocked) {
        // Se o cofre já disparou sucesso/falha, ignora comandos até resetar
        return;
    }

    const logStyle = isSimulated ? 'simulated' : 'incoming';
    const logPrefix = isSimulated ? '[Simulador]' : '[Serial]';

    logToTerminal(`${logPrefix} ${msg}`, logStyle);

    // 1. Mensagem de Visor (Dial): "Visor: 4"
    if (msg.startsWith('Visor:')) {
        const valStr = msg.split(':')[1].trim();
        const val = parseInt(valStr);
        if (!isNaN(val) && val >= 0 && val <= 9) {
            dialValue = val;
            drawDial(dialValue);
            // Sincroniza slider virtual
            scaleSim.value = dialValue;
            simDialVal.textContent = dialValue;
        }
    }

    // 2. Travar Catracas: "Catraca 1 TRAVADA: X"
    else if (msg.includes('Catraca 1 TRAVADA')) {
        let val = dialValue;
        if (msg.includes(':')) {
            val = parseInt(msg.split(':')[1].trim());
        }
        lockSlot(0, val);
    }
    else if (msg.includes('Catraca 2 TRAVADA')) {
        let val = dialValue;
        if (msg.includes(':')) {
            val = parseInt(msg.split(':')[1].trim());
        }
        lockSlot(1, val);
    }
    else if (msg.includes('Catraca 3 TRAVADA')) {
        let val = dialValue;
        if (msg.includes(':')) {
            val = parseInt(msg.split(':')[1].trim());
        }
        lockSlot(2, val);
    }

    // 3. Status Final: "ACESSO LIBERADO" ou "ACESSO NEGADO"
    else if (msg.includes('ACESSO LIBERADO')) {
        setFinalStatus('success');
    }
    else if (msg.includes('ACESSO NEGADO')) {
        setFinalStatus('danger');
    }

    // 4. Reset do Cofre
    else if (msg.includes('Cofre resetado') || msg.includes('Reset') || msg.includes('RESET')) {
        clearSlotsUI();
    }
}

// Grava o valor em um dos slots
function lockSlot(index, value) {
    slotValues[index] = value;
    const box = document.getElementById(`slot-${index}`);
    const valDisplay = document.getElementById(`val-slot-${index}`);

    box.className = 'slot-box active';
    valDisplay.textContent = value;
    playBeep(600 + (index * 150), 0.08);
}

// Define o status do cofre no final da run
function setFinalStatus(status) {
    feedbackBlocked = true;
    
    if (status === 'success') {
        statusBar.className = 'status-bar unlocked';
        statusBar.textContent = 'ACESSO CONCEDIDO';
        logToTerminal('[SISTEMA] Cofre destravado com sucesso!', 'success');
        
        // Colore todos os slots em verde
        for (let i = 0; i < 3; i++) {
            document.getElementById(`slot-${i}`).className = 'slot-box success';
        }
        
        // Efeito sonoro de sucesso (arpejo)
        playSuccessChime();
    } else {
        statusBar.className = 'status-bar denied';
        statusBar.textContent = 'ACESSO NEGADO';
        logToTerminal('[SISTEMA] Código incorreto. Acesso rejeitado.', 'danger');

        // Colore slots em vermelho
        for (let i = 0; i < 3; i++) {
            document.getElementById(`slot-${i}`).className = 'slot-box danger';
        }

        // Som de falha
        playFailBuzz();
    }
    // Redesenha para atualizar cor do número do dial
    drawDial(dialValue);
}

// Reinicia o cofre e limpa os slots
function resetCofre() {
    feedbackBlocked = false;
    clearSlotsUI();
    
    // Envia sinal serial de RESET para o Arduino se conectado
    if (isConnected && port && port.writable) {
        sendSerialCommand("RESET\n");
    }

    playBeep(400, 0.1);
}

function clearSlotsUI() {
    slotValues = [null, null, null];
    statusBar.className = 'status-bar locked';
    statusBar.textContent = 'SISTEMA TRANCADO';
    
    for (let i = 0; i < 3; i++) {
        const box = document.getElementById(`slot-${i}`);
        const valDisplay = document.getElementById(`val-slot-${i}`);
        box.className = 'slot-box';
        valDisplay.textContent = '*';
    }
    
    logToTerminal('[SISTEMA] Cofre resetado. Aguardando decodificação...', 'system');
    drawDial(dialValue);
}

// Enviar comando para o Arduino
async function sendSerialCommand(commandText) {
    try {
        const encoder = new TextEncoder();
        const writer = port.writable.getWriter();
        await writer.write(encoder.encode(commandText));
        writer.releaseLock();
        logToTerminal(`[Serial TX] Enviado: ${commandText.trim()}`, 'system');
    } catch (e) {
        console.error("Erro ao enviar dados via serial", e);
        logToTerminal(`[Erro] Falha ao enviar comando para o Arduino.`, 'danger');
    }
}

// ==========================================
// METODOS DO SIMULADOR DIGITAL (MODO DEV)
// ==========================================
window.simulateLock = (slotNum) => {
    if (feedbackBlocked) return;
    processMessage(`Catraca ${slotNum} TRAVADA: ${dialValue}`, true);
};

window.simulateAccess = (type) => {
    if (type === 'liberado') {
        processMessage('ACESSO LIBERADO', true);
    } else if (type === 'negado') {
        processMessage('ACESSO NEGADO', true);
    } else {
        processMessage('RESET', true);
        resetCofre();
    }
};

function toggleSimulationPanel() {
    simulationBody.classList.toggle('collapsed');
}

// ==========================================
// FEEDBACKS AUDIOVISUAIS (WEB AUDIO API)
// ==========================================
function playBeep(frequency = 800, duration = 0.1) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.value = frequency;
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {}
}

function playSuccessChime() {
    // Toca um arpejo ascendente feliz
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
        setTimeout(() => playBeep(freq, 0.12), idx * 100);
    });
}

function playFailBuzz() {
    // Toca beeps graves e tristes
    playBeep(220, 0.25);
    setTimeout(() => playBeep(180, 0.35), 250);
}

// Adiciona linhas de log ao terminal da tela
function logToTerminal(text, type = 'system') {
    const line = document.createElement('div');
    line.className = `log-line ${type}`;
    
    // Timestamp
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${(now.getMilliseconds()/10).toFixed(0).padStart(2,'0')}`;
    
    line.textContent = `[${timeStr}] ${text}`;
    terminalLog.appendChild(line);
    
    // Rola console para baixo
    terminalLog.scrollTop = terminalLog.scrollHeight;
}
