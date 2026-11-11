        (function () {
            'use strict';

            // Endpoints e constantes sincronizadas com o Worker do ecossistema
            const WORKER_ENDPOINT = 'https://assistente-virtual-laboratorio-tecnologias.gabrielsehna.workers.dev/';
            const DEFAULT_MODEL = 'gemini-3.8-flash';
            const STORAGE_KEY_API = 'titan_gemini_api_key';
            const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
            const DIRECT_VIDEO_BASE64_LIMIT = 9 * 1024 * 1024; // Até 9 MB envia vídeo inline direto; acima extrai frames cronológicos HD

            // Prompt de Sistema embutido para Engenheiro de Telemetria de Robótica
            const TELEMETRY_SYSTEM_PROMPT = `Você é um Engenheiro Sênior de Telemetria e Controle PID de Robótica Competitiva (OBR / FLL / Seguidor de Linha).
Sua missão é analisar o vídeo (ou sequência cronológica de quadros da volta) de um robô seguidor de linha e diagnosticar:
1. Estabilidade Geral da volta: classifique estritamente em "Estável", "Oscilando" ou "Crítico".
2. Tempo estimado da volta (no formato MM:SS.d, ex: "00:12.4").
3. Timeline de Eventos Críticos com marcação de tempo (ex: "00:03 - Oscilação em S na reta", "00:07 - Perda parcial da fita em curva de 90°", "00:11 - Recuperação de trajetória").
4. Recomendações práticas de Engenharia e Tuning de PID (Kp, Kd e Velocidade Base V_base), explicando claramente em percentual ou valores sugeridos como corrigir o comportamento observado.

Responda EXCLUSIVAMENTE com um objeto JSON válido (sem blocos markdown extras fora do JSON) seguindo exatamente esta estrutura:
{
  "estabilidade_geral": "Estável | Oscilando | Crítico",
  "nota_estabilidade": "Resumo curto de 1 frase sobre o comportamento dinâmico do robô",
  "tempo_volta": "00:00.0",
  "resumo_velocidade": "Resumo curto sobre velocidade em retas e curvas",
  "timeline_eventos": [
    {
      "tempo": "00:03",
      "segundos": 3,
      "severidade": "ok | warning | critical",
      "evento": "Título curto do evento (ex: Oscilação em S)",
      "detalhe": "Explicação técnica concisa do que ocorreu neste instante"
    }
  ],
  "recomendacoes_engenharia": {
    "resumo_principal": "Frase de destaque com a recomendação direta (ex: Reduzir Kp em 15% e aumentar Kd para frear o serpenteio)",
    "ajustes_sugeridos": {
      "kp_sugerido": "1.20",
      "kp_acao": "Reduzir ~15%",
      "kd_sugerido": "15.0",
      "kd_acao": "Aumentar ~25%",
      "v_base_sugerido": "55",
      "v_base_acao": "Manter ou reduzir em curvas"
    },
    "passos_praticos": [
      "Orientação prática 1 para a equipe",
      "Orientação prática 2 sobre sensores ou mecânica/pneus",
      "Orientação prática 3 para o próximo teste de pista"
    ]
  }
}`;

            // Elementos da DOM
            const mediaPanel = document.getElementById('mediaPanel');
            const dropZone = document.getElementById('dropZone');
            const btnSelectFile = document.getElementById('btnSelectFile');
            const btnToggleCamera = document.getElementById('btnToggleCamera');
            const videoFileInput = document.getElementById('videoFileInput');
            const mobileCameraInput = document.getElementById('mobileCameraInput');

            const cameraRecorderBox = document.getElementById('cameraRecorderBox');
            const cameraLiveVideo = document.getElementById('cameraLiveVideo');
            const recIndicatorPill = document.getElementById('recIndicatorPill');
            const cameraFacingBadge = document.getElementById('cameraFacingBadge');
            const btnStartStopRec = document.getElementById('btnStartStopRec');
            const btnStartStopRecIcon = document.getElementById('btnStartStopRecIcon');
            const btnStartStopRecLabel = document.getElementById('btnStartStopRecLabel');
            const btnSwitchCamera = document.getElementById('btnSwitchCamera');
            const btnCloseCamera = document.getElementById('btnCloseCamera');
            const recDot = document.getElementById('recDot');
            const recTimerText = document.getElementById('recTimerText');

            const videoPreviewContainer = document.getElementById('videoPreviewContainer');
            const videoPreview = document.getElementById('videoPreview');
            const videoFileName = document.getElementById('videoFileName');
            const videoFileSize = document.getElementById('videoFileSize');
            const videoDurationLabel = document.getElementById('videoDurationLabel');
            const btnRemoveVideo = document.getElementById('btnRemoveVideo');

            const robotTypeSelect = document.getElementById('robotTypeSelect');
            const trackNotesInput = document.getElementById('trackNotesInput');
            const inputKp = document.getElementById('inputKp');
            const inputKd = document.getElementById('inputKd');
            const inputVbase = document.getElementById('inputVbase');

            const btnAnalyzeLap = document.getElementById('btnAnalyzeLap');
            const analyzeBtnIcon = document.getElementById('analyzeBtnIcon');
            const analyzeBtnText = document.getElementById('analyzeBtnText');
            const analysisProgressBox = document.getElementById('analysisProgressBox');
            const progressStatusText = document.getElementById('progressStatusText');
            const progressPercentText = document.getElementById('progressPercentText');
            const progressBarFill = document.getElementById('progressBarFill');
            const errorAlertBox = document.getElementById('errorAlertBox');

            const quotaAlertBanner = document.getElementById('quotaAlertBanner');
            const quotaAlertText = document.getElementById('quotaAlertText');
            const quotaCountdownBadge = document.getElementById('quotaCountdownBadge');

            const dashboardEmptyState = document.getElementById('dashboardEmptyState');
            const dashboardContent = document.getElementById('dashboardContent');
            const analysisModelBadge = document.getElementById('analysisModelBadge');
            const btnLoadDemoReport = document.getElementById('btnLoadDemoReport');

            const cardStabilityPill = document.getElementById('cardStabilityPill');
            const cardStabilitySub = document.getElementById('cardStabilitySub');
            const cardLapTime = document.getElementById('cardLapTime');
            const cardSpeedSub = document.getElementById('cardSpeedSub');
            const timelineList = document.getElementById('timelineList');
            const engineeringHeadline = document.getElementById('engineeringHeadline');
            const tuneKpVal = document.getElementById('tuneKpVal');
            const tuneKpAction = document.getElementById('tuneKpAction');
            const tuneKdVal = document.getElementById('tuneKdVal');
            const tuneKdAction = document.getElementById('tuneKdAction');
            const tuneVbaseVal = document.getElementById('tuneVbaseVal');
            const tuneVbaseAction = document.getElementById('tuneVbaseAction');
            const coachingStepsList = document.getElementById('coachingStepsList');
            const btnCopyDiagnosis = document.getElementById('btnCopyDiagnosis');
            const copyDiagnosisText = document.getElementById('copyDiagnosisText');

            // Modal API Key
            const btnOpenApiKeyModal = document.getElementById('btnOpenApiKeyModal');
            const apiKeyModal = document.getElementById('apiKeyModal');
            const customApiKeyInput = document.getElementById('customApiKeyInput');
            const btnSaveApiKey = document.getElementById('btnSaveApiKey');
            const btnClearApiKey = document.getElementById('btnClearApiKey');
            const apiKeyStatusLabel = document.getElementById('apiKeyStatusLabel');

            // Estado da aplicação
            let currentVideoFile = null;
            let currentVideoObjectUrl = null;
            let detectedVideoDuration = 0;
            let lastTelemetryReport = null;
            let quotaCooldownTimer = null;
            let isAnalyzing = false;

            // Estado da câmera WebRTC
            const MAX_RECORD_SECONDS = 60;
            let mediaStream = null;
            let mediaRecorder = null;
            let recordedChunks = [];
            let recSeconds = 0;
            let recInterval = null;
            let currentFacingMode = 'environment';
            let discardRecordingOnStop = false;
            let isSwitchingCamera = false;

            function updateApiKeyHeaderStatus() {
                const key = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
                apiKeyStatusLabel.textContent = key ? 'Chave Própria Ativa' : 'Cloudflare Worker';
            }
            updateApiKeyHeaderStatus();

            // Utilitários de Formatação
            function formatSecondsToMMSS(sec, includeTenths = false) {
                if (!Number.isFinite(sec) || sec < 0) return '00:00';
                const mins = Math.floor(sec / 60);
                const rem = sec - mins * 60;
                const secsInt = Math.floor(rem);
                const tenths = Math.floor((rem - secsInt) * 10);
                const mm = String(mins).padStart(2, '0');
                const ss = String(secsInt).padStart(2, '0');
                return includeTenths ? `${mm}:${ss}.${tenths}` : `${mm}:${ss}`;
            }

            function parseMMSSToSeconds(timeStr) {
                if (typeof timeStr === 'number') return timeStr;
                if (!timeStr) return 0;
                const clean = String(timeStr).trim();
                const parts = clean.split(':');
                if (parts.length === 2) {
                    return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
                }
                return parseFloat(clean) || 0;
            }

            function showError(msg) {
                if (!msg) {
                    errorAlertBox.classList.remove('active');
                    errorAlertBox.textContent = '';
                    return;
                }
                errorAlertBox.textContent = msg;
                errorAlertBox.classList.add('active');
            }

            function setProgress(percent, message) {
                analysisProgressBox.classList.add('active');
                progressBarFill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
                progressPercentText.textContent = `${Math.round(percent)}%`;
                if (message) progressStatusText.textContent = message;
            }

            function hideProgress() {
                analysisProgressBox.classList.remove('active');
                progressBarFill.style.width = '0%';
            }

            // Cooldown HTTP 429
            function triggerQuotaCooldown(customMessage, seconds = 60) {
                if (quotaCooldownTimer) clearInterval(quotaCooldownTimer);
                let remaining = seconds;
                quotaAlertText.textContent = customMessage || 'A cota de uso da IA foi temporariamente atingida. Por favor, aguarde alguns instantes antes de enviar uma nova análise.';
                quotaAlertBanner.classList.add('visible');
                btnAnalyzeLap.disabled = true;

                const updateTick = () => {
                    quotaCountdownBadge.textContent = `Aguarde ${remaining}s`;
                    analyzeBtnText.textContent = `Aguardando Cota (${remaining}s)`;
                };
                updateTick();

                quotaCooldownTimer = setInterval(() => {
                    remaining -= 1;
                    if (remaining <= 0) {
                        clearInterval(quotaCooldownTimer);
                        quotaCooldownTimer = null;
                        quotaAlertBanner.classList.remove('visible');
                        btnAnalyzeLap.disabled = false;
                        analyzeBtnText.textContent = 'Analisar Volta com IA';
                    } else {
                        updateTick();
                    }
                }, 1000);
            }

            // Carregamento e Validação de Vídeo
            function handleVideoFileSelected(file) {
                showError('');
                if (!file) return;

                const validExts = ['.mp4', '.webm', '.mov'];
                const fileNameLower = (file.name || '').toLowerCase();
                const isVideoMime = file.type && file.type.startsWith('video/');
                const hasValidExt = validExts.some(ext => fileNameLower.endsWith(ext));

                if (!isVideoMime && !hasValidExt) {
                    showError('Formato inválido. Por favor, selecione um arquivo de vídeo (.mp4, .webm ou .mov).');
                    return;
                }

                if (file.size > MAX_FILE_SIZE_BYTES) {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
                    showError(`O vídeo selecionado possui ${sizeMB} MB, excedendo o limite máximo de 50 MB.`);
                    return;
                }

                currentVideoFile = file;
                if (currentVideoObjectUrl) {
                    URL.revokeObjectURL(currentVideoObjectUrl);
                }
                currentVideoObjectUrl = URL.createObjectURL(file);
                videoPreview.src = currentVideoObjectUrl;
                videoFileName.textContent = file.name || 'gravacao_camera.webm';
                videoFileSize.textContent = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
                videoDurationLabel.textContent = 'Carregando...';

                if (mediaPanel) mediaPanel.classList.add('has-video');
                videoPreviewContainer.classList.add('active');
            }

            videoPreview.addEventListener('loadedmetadata', () => {
                if (Number.isFinite(videoPreview.duration) && videoPreview.duration > 0) {
                    detectedVideoDuration = videoPreview.duration;
                    videoDurationLabel.textContent = formatSecondsToMMSS(videoPreview.duration, true);
                } else {
                    detectedVideoDuration = 12.0;
                    videoDurationLabel.textContent = 'Vídeo pronto';
                }
            });

            btnRemoveVideo.addEventListener('click', () => {
                currentVideoFile = null;
                if (currentVideoObjectUrl) {
                    URL.revokeObjectURL(currentVideoObjectUrl);
                    currentVideoObjectUrl = null;
                }
                videoPreview.removeAttribute('src');
                videoPreview.load();
                videoPreviewContainer.classList.remove('active');
                if (mediaPanel) mediaPanel.classList.remove('has-video');
                videoFileInput.value = '';
                mobileCameraInput.value = '';
            });

            // Eventos de Drag & Drop e Clique
            btnSelectFile.addEventListener('click', (e) => {
                e.stopPropagation();
                videoFileInput.click();
            });

            dropZone.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                videoFileInput.click();
            });

            videoFileInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleVideoFileSelected(e.target.files[0]);
                }
            });

            mobileCameraInput.addEventListener('change', (e) => {
                if (e.target.files && e.target.files[0]) {
                    handleVideoFileSelected(e.target.files[0]);
                }
            });

            ['dragenter', 'dragover'].forEach(evtName => {
                dropZone.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.add('drag-over');
                });
            });

            ['dragleave', 'drop'].forEach(evtName => {
                dropZone.addEventListener(evtName, (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    dropZone.classList.remove('drag-over');
                });
            });

            dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                if (dt && dt.files && dt.files[0]) {
                    handleVideoFileSelected(dt.files[0]);
                }
            });

            // Gravação Direta da Câmera (Modo Viewfinder Imersivo com WebRTC + alternância frontal/traseira)
            function stopActiveMediaStream() {
                if (mediaStream) {
                    mediaStream.getTracks().forEach(t => t.stop());
                    mediaStream = null;
                }
                cameraLiveVideo.srcObject = null;
            }

            function resetRecordingControlsUI() {
                recSeconds = 0;
                recTimerText.textContent = `00:00 / máx ${formatSecondsToMMSS(MAX_RECORD_SECONDS)}`;
                recIndicatorPill.classList.remove('is-recording');
                btnStartStopRec.classList.remove('is-recording');
                btnStartStopRecIcon.textContent = '🔴';
                btnStartStopRecLabel.textContent = 'Iniciar Gravação';
                btnSwitchCamera.disabled = false;
            }

            function updateCameraFacingUI(facingMode) {
                const isFront = facingMode === 'user';
                cameraLiveVideo.classList.toggle('mirrored', isFront);
                cameraFacingBadge.textContent = isFront ? '🤳 Câmera Frontal' : '📷 Câmera Traseira';
            }

            async function startCameraStream(facingMode) {
                // Encerra tracks anteriores antes de reabrir (evita travamento em iOS/Android)
                stopActiveMediaStream();
                mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } },
                    audio: false
                });
                cameraLiveVideo.srcObject = mediaStream;
                updateCameraFacingUI(facingMode);
            }

            function setViewfinderMode(active) {
                if (mediaPanel) mediaPanel.classList.toggle('is-camera-mode', active);
                document.body.classList.toggle('camera-viewfinder-active', active);
                cameraRecorderBox.classList.toggle('active', active);
            }

            async function openCameraRecorder() {
                showError('');
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
                    mobileCameraInput.click();
                    return;
                }
                try {
                    await startCameraStream(currentFacingMode);
                    discardRecordingOnStop = false;
                    resetRecordingControlsUI();
                    setViewfinderMode(true);
                } catch (err) {
                    if (err && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
                        showError('Permissão da câmera negada. Autorize o acesso no navegador ou selecione um vídeo da galeria.');
                        return;
                    }
                    mobileCameraInput.click();
                }
            }

            function closeCameraRecorder(discardRecording = true) {
                discardRecordingOnStop = discardRecording;
                if (recInterval) {
                    clearInterval(recInterval);
                    recInterval = null;
                }
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    try { mediaRecorder.stop(); } catch (_) {}
                }
                stopActiveMediaStream();
                resetRecordingControlsUI();
                setViewfinderMode(false);
            }

            btnToggleCamera.addEventListener('click', (e) => {
                e.stopPropagation();
                if (cameraRecorderBox.classList.contains('active')) {
                    closeCameraRecorder(true);
                } else {
                    openCameraRecorder();
                }
            });

            btnSwitchCamera.addEventListener('click', async () => {
                if (isSwitchingCamera) return;
                if (mediaRecorder && mediaRecorder.state === 'recording') return;

                const previousFacing = currentFacingMode;
                const nextFacing = previousFacing === 'environment' ? 'user' : 'environment';
                isSwitchingCamera = true;
                btnSwitchCamera.disabled = true;

                try {
                    currentFacingMode = nextFacing;
                    await startCameraStream(nextFacing);
                } catch (err) {
                    currentFacingMode = previousFacing;
                    try { await startCameraStream(previousFacing); } catch (_) {}
                    showError('Não foi possível alternar a câmera neste dispositivo.');
                } finally {
                    isSwitchingCamera = false;
                    btnSwitchCamera.disabled = false;
                }
            });

            btnCloseCamera.addEventListener('click', () => closeCameraRecorder(true));

            btnStartStopRec.addEventListener('click', () => {
                if (!mediaStream) return;

                if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                    showError('');
                    discardRecordingOnStop = false;
                    recordedChunks = [];
                    const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
                    const supportedMime = mimeTypes.find(m => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(m)) || '';

                    mediaRecorder = supportedMime
                        ? new MediaRecorder(mediaStream, { mimeType: supportedMime })
                        : new MediaRecorder(mediaStream);

                    mediaRecorder.ondataavailable = (ev) => {
                        if (ev.data && ev.data.size > 0) recordedChunks.push(ev.data);
                    };

                    mediaRecorder.onstop = () => {
                        if (recInterval) {
                            clearInterval(recInterval);
                            recInterval = null;
                        }
                        const shouldDiscard = discardRecordingOnStop;
                        const chunksSnapshot = recordedChunks.slice();
                        const recMime = (mediaRecorder && mediaRecorder.mimeType) || 'video/webm';
                        recordedChunks = [];
                        mediaRecorder = null;

                        if (shouldDiscard || chunksSnapshot.length === 0) {
                            return;
                        }

                        const ext = recMime.includes('mp4') ? 'mp4' : 'webm';
                        const blob = new Blob(chunksSnapshot, { type: recMime });
                        const recordedFile = new File([blob], `volta_camera_${Date.now()}.${ext}`, { type: recMime });
                        handleVideoFileSelected(recordedFile);
                        closeCameraRecorder(false);
                    };

                    mediaRecorder.start(250);
                    recSeconds = 0;
                    recIndicatorPill.classList.add('is-recording');
                    recTimerText.textContent = `00:00 / máx ${formatSecondsToMMSS(MAX_RECORD_SECONDS)}`;
                    btnStartStopRec.classList.add('is-recording');
                    btnStartStopRecIcon.textContent = '⏹️';
                    btnStartStopRecLabel.textContent = 'Parar & Usar Vídeo';
                    btnSwitchCamera.disabled = true;

                    recInterval = setInterval(() => {
                        recSeconds += 1;
                        recTimerText.textContent = `${formatSecondsToMMSS(recSeconds)} / máx ${formatSecondsToMMSS(MAX_RECORD_SECONDS)}`;
                        if (recSeconds >= MAX_RECORD_SECONDS && mediaRecorder && mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    }, 1000);
                } else if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            });

            // Conversão de arquivo para Base64
            function fileToBase64(file) {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                        const result = String(reader.result || '');
                        const commaIdx = result.indexOf(',');
                        resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
                    };
                    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de vídeo em Base64.'));
                    reader.readAsDataURL(file);
                });
            }

            // Extração de Quadros Cronológicos para vídeos grandes (até 50 MB) ou fallback de codec
            async function extractChronologicalFrames(file, numFrames = 12) {
                return new Promise((resolve, reject) => {
                    const tempVideo = document.createElement('video');
                    const tempUrl = URL.createObjectURL(file);
                    tempVideo.src = tempUrl;
                    tempVideo.muted = true;
                    tempVideo.playsInline = true;
                    tempVideo.preload = 'auto';

                    const cleanup = () => URL.revokeObjectURL(tempUrl);

                    tempVideo.onerror = () => {
                        cleanup();
                        reject(new Error('Não foi possível decodificar os quadros do vídeo.'));
                    };

                    tempVideo.onloadedmetadata = async () => {
                        try {
                            const duration = Number.isFinite(tempVideo.duration) && tempVideo.duration > 0
                                ? tempVideo.duration
                                : (detectedVideoDuration || 10);

                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            const targetWidth = 640;
                            const ratio = (tempVideo.videoHeight && tempVideo.videoWidth)
                                ? (tempVideo.videoHeight / tempVideo.videoWidth)
                                : (9 / 16);
                            canvas.width = targetWidth;
                            canvas.height = Math.round(targetWidth * ratio);

                            const frames = [];
                            for (let i = 0; i < numFrames; i++) {
                                const t = Math.min(duration - 0.05, Math.max(0, (duration * i) / Math.max(1, numFrames - 1)));
                                await new Promise((resSeek) => {
                                    const onSeeked = () => {
                                        tempVideo.removeEventListener('seeked', onSeeked);
                                        resSeek();
                                    };
                                    tempVideo.addEventListener('seeked', onSeeked);
                                    tempVideo.currentTime = t;
                                });

                                ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
                                // Estampa o timestamp no canto superior esquerdo do quadro para precisão da timeline
                                const stamp = formatSecondsToMMSS(t, true);
                                ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
                                ctx.fillRect(8, 8, 92, 26);
                                ctx.fillStyle = '#00e5ff';
                                ctx.font = 'bold 14px monospace';
                                ctx.fillText(`T=${stamp}`, 14, 26);

                                const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
                                const b64 = dataUrl.split(',')[1];
                                frames.push({ timestamp: stamp, seconds: t, base64: b64 });
                            }
                            cleanup();
                            resolve({ duration, frames });
                        } catch (err) {
                            cleanup();
                            reject(err);
                        }
                    };
                });
            }

            // Monta o prompt contextual com os dados pré-análise informados pela equipe
            function buildUserPromptText(durationSec, modeLabel) {
                const robotType = robotTypeSelect.value || 'LEGO Spike Prime / Mindstorms';
                const trackNotes = trackNotesInput.value.trim() || 'Pista padrão de seguidor de linha';
                const kp = inputKp.value.trim() || 'Não informado';
                const kd = inputKd.value.trim() || 'Não informado';
                const vbase = inputVbase.value.trim() || 'Não informado';
                const durFormatted = formatSecondsToMMSS(durationSec || detectedVideoDuration || 12, true);

                return `Analise esta volta de robô seguidor de linha (${modeLabel}).
Dados da Equipe:
- Tipo de Robô: ${robotType}
- Observações da Pista: ${trackNotes}
- Duração total aproximada do vídeo: ${durFormatted}
- Calibração Atual usada no teste: Kp = ${kp}, Kd = ${kd}, V_base = ${vbase}

Gere o diagnóstico técnico completo em JSON estruturado com:
1. estabilidade_geral ("Estável", "Oscilando" ou "Crítico") e nota_estabilidade
2. tempo_volta (use "${durFormatted}" como referência se a volta completa estiver no vídeo) e resumo_velocidade
3. timeline_eventos (lista com tempo "MM:SS", segundos numéricos, severidade, evento e detalhe)
4. recomendacoes_engenharia (resumo_principal, ajustes_sugeridos para Kp, Kd e V_base levando em conta a calibração atual da equipe, e passos_praticos).`;
            }

            // Envia requisição para o Cloudflare Worker ou Chave Direta
            async function sendTelemetryRequest(parts) {
                const customKey = (localStorage.getItem(STORAGE_KEY_API) || '').trim();
                const url = customKey
                    ? `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(customKey)}`
                    : WORKER_ENDPOINT;

                const payload = {
                    model: DEFAULT_MODEL,
                    system_instruction: {
                        parts: [{ text: TELEMETRY_SYSTEM_PROMPT }]
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: parts
                        }
                    ],
                    generationConfig: {
                        temperature: 0.25,
                        responseMimeType: 'application/json'
                    }
                };

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (response.status === 429) {
                    let errJson = null;
                    try { errJson = await response.json(); } catch (_) {}
                    const msg = (errJson && errJson.error && errJson.error.message)
                        ? errJson.error.message
                        : 'A cota de uso da IA foi temporariamente atingida. Por favor, aguarde alguns instantes antes de enviar uma nova análise.';
                    const rateErr = new Error(msg);
                    rateErr.status = 429;
                    throw rateErr;
                }

                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    const apiMsg = (data && data.error && (data.error.message || data.error)) || `Erro HTTP ${response.status}`;
                    const httpErr = new Error(typeof apiMsg === 'string' ? apiMsg : JSON.stringify(apiMsg));
                    httpErr.status = response.status;
                    throw httpErr;
                }

                const rawText = data?.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('\n') || '';
                if (!rawText.trim()) {
                    throw new Error('A IA retornou uma resposta vazia. Tente novamente com um vídeo mais claro.');
                }
                return rawText;
            }

            // Faz o parse resiliente do JSON ou Markdown retornado pela IA
            function parseTelemetryResponse(rawText) {
                let cleaned = rawText.trim();
                const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
                if (fenceMatch) cleaned = fenceMatch[1].trim();

                const firstBrace = cleaned.indexOf('{');
                const lastBrace = cleaned.lastIndexOf('}');
                if (firstBrace !== -1 && lastBrace > firstBrace) {
                    try {
                        return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
                    } catch (_) {}
                }

                // Fallback caso o modelo retorne texto livre em Markdown
                return {
                    estabilidade_geral: cleaned.toLowerCase().includes('crític') ? 'Crítico' : (cleaned.toLowerCase().includes('estável') ? 'Estável' : 'Oscilando'),
                    nota_estabilidade: 'Diagnóstico processado a partir da análise multimodal da volta.',
                    tempo_volta: formatSecondsToMMSS(detectedVideoDuration || 12.0, true),
                    resumo_velocidade: 'Consulte as observações detalhadas abaixo.',
                    timeline_eventos: [
                        {
                            tempo: '00:02',
                            segundos: 2,
                            severidade: 'ok',
                            evento: 'Início da Tomada de Tempo',
                            detalhe: 'Robô alinhado na fita iniciando controle proporcional-derivativo.'
                        }
                    ],
                    recomendacoes_engenharia: {
                        resumo_principal: cleaned.slice(0, 220),
                        ajustes_sugeridos: {
                            kp_sugerido: inputKp.value || '1.20',
                            kp_acao: 'Ajustar conforme oscilação',
                            kd_sugerido: inputKd.value || '14.0',
                            kd_acao: 'Reforçar amortecimento',
                            v_base_sugerido: inputVbase.value || '55',
                            v_base_acao: 'Estabilizar velocidade'
                        },
                        passos_praticos: [cleaned]
                    }
                };
            }

            // Renderiza os dados no Dashboard de Telemetria
            function renderTelemetryDashboard(report, sourceLabel = 'Gemini 3.8 Flash') {
                lastTelemetryReport = report;
                dashboardEmptyState.style.display = 'none';
                dashboardContent.classList.add('active');
                analysisModelBadge.textContent = sourceLabel;

                // 1. Estabilidade Geral
                const rawStab = String(report.estabilidade_geral || 'Oscilando').trim();
                const stabLower = rawStab.toLowerCase();
                cardStabilityPill.className = 'stability-pill';
                if (stabLower.includes('estável') || stabLower.includes('estavel')) {
                    cardStabilityPill.classList.add('estavel');
                    cardStabilityPill.textContent = '✅ Estável';
                } else if (stabLower.includes('crític') || stabLower.includes('critic')) {
                    cardStabilityPill.classList.add('critico');
                    cardStabilityPill.textContent = '🚨 Crítico';
                } else {
                    cardStabilityPill.classList.add('oscilando');
                    cardStabilityPill.textContent = '⚠️ Oscilando';
                }
                cardStabilitySub.textContent = report.nota_estabilidade || 'Análise dinâmica de trajetória concluída';

                // 2. Tempo da Volta
                cardLapTime.textContent = report.tempo_volta || formatSecondsToMMSS(detectedVideoDuration || 14.2, true);
                cardSpeedSub.textContent = report.resumo_velocidade || 'Velocidade avaliada ao longo do percurso';

                // 3. Timeline de Eventos Críticos
                timelineList.innerHTML = '';
                const events = Array.isArray(report.timeline_eventos) && report.timeline_eventos.length > 0
                    ? report.timeline_eventos
                    : [
                        { tempo: '00:02', segundos: 2, severidade: 'ok', evento: 'Largada e alinhamento inicial', detalhe: 'Leitura estável dos sensores sobre a linha.' }
                    ];

                events.forEach(item => {
                    const li = document.createElement('li');
                    const sev = String(item.severidade || 'warning').toLowerCase();
                    const sevClass = sev.includes('crit') ? 'sev-critical' : (sev.includes('ok') ? 'sev-ok' : 'sev-warning');
                    li.className = `timeline-item ${sevClass}`;

                    const timeStr = item.tempo || formatSecondsToMMSS(item.segundos || 0);
                    const secVal = Number.isFinite(item.segundos) ? item.segundos : parseMMSSToSeconds(timeStr);

                    const timeBtn = document.createElement('button');
                    timeBtn.type = 'button';
                    timeBtn.className = 'timeline-time-btn';
                    timeBtn.textContent = `▶ ${timeStr}`;
                    timeBtn.title = `Avançar vídeo para ${timeStr}`;
                    timeBtn.addEventListener('click', () => {
                        if (videoPreview && videoPreview.src) {
                            videoPreview.currentTime = Math.max(0, secVal);
                            videoPreview.play().catch(() => {});
                            videoPreview.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    });

                    const bodyDiv = document.createElement('div');
                    bodyDiv.className = 'timeline-body';

                    const titleDiv = document.createElement('div');
                    titleDiv.className = 'timeline-event-title';
                    titleDiv.textContent = item.evento || 'Evento de Pista';

                    const descDiv = document.createElement('div');
                    descDiv.className = 'timeline-event-desc';
                    descDiv.textContent = item.detalhe || '';

                    bodyDiv.appendChild(titleDiv);
                    bodyDiv.appendChild(descDiv);
                    li.appendChild(timeBtn);
                    li.appendChild(bodyDiv);
                    timelineList.appendChild(li);
                });

                // 4. Recomendações de Engenharia
                const rec = report.recomendacoes_engenharia || {};
                engineeringHeadline.textContent = rec.resumo_principal || 'Ajuste os ganhos Kp e Kd gradualmente para reduzir a oscilação nas saídas de curva.';

                const ajustes = rec.ajustes_sugeridos || {};
                tuneKpVal.textContent = ajustes.kp_sugerido || (inputKp.value ? (parseFloat(inputKp.value) * 0.85).toFixed(2) : '1.20');
                tuneKpAction.textContent = ajustes.kp_acao || 'Ajuste Proporcional';

                tuneKdVal.textContent = ajustes.kd_sugerido || (inputKd.value ? (parseFloat(inputKd.value) * 1.25).toFixed(1) : '15.0');
                tuneKdAction.textContent = ajustes.kd_acao || 'Amortecimento Derivativo';

                tuneVbaseVal.textContent = ajustes.v_base_sugerido || inputVbase.value || '55';
                tuneVbaseAction.textContent = ajustes.v_base_acao || 'Velocidade Base';

                coachingStepsList.innerHTML = '';
                const steps = Array.isArray(rec.passos_praticos) && rec.passos_praticos.length > 0
                    ? rec.passos_praticos
                    : [
                        'Teste a nova relação Kp/Kd em pista limpa antes de alterar a velocidade máxima.',
                        'Verifique se os sensores de refletância estão a uma altura uniforme (4 a 8 mm do piso).'
                    ];

                steps.forEach(stepText => {
                    const li = document.createElement('li');
                    li.textContent = stepText;
                    coachingStepsList.appendChild(li);
                });
            }

            // Fluxo Principal: Analisar Volta com IA
            btnAnalyzeLap.addEventListener('click', async () => {
                if (isAnalyzing) return;
                showError('');

                if (!currentVideoFile) {
                    showError('Por favor, selecione ou grave um vídeo da volta do robô antes de iniciar a análise.');
                    return;
                }

                isAnalyzing = true;
                btnAnalyzeLap.disabled = true;
                btnAnalyzeLap.classList.add('loading');
                analyzeBtnIcon.style.display = 'none';
                analyzeBtnText.textContent = 'Analisando Volta...';

                try {
                    let rawResponseText = '';
                    const useDirectVideo = currentVideoFile.size <= DIRECT_VIDEO_BASE64_LIMIT;

                    if (useDirectVideo) {
                        setProgress(20, 'Convertendo vídeo para Base64...');
                        const base64Video = await fileToBase64(currentVideoFile);
                        const mimeType = currentVideoFile.type || 'video/mp4';

                        setProgress(55, 'Enviando vídeo para o Engenheiro IA (Gemini Multimodal)...');
                        try {
                            rawResponseText = await sendTelemetryRequest([
                                { inline_data: { mime_type: mimeType, data: base64Video } },
                                { text: buildUserPromptText(detectedVideoDuration, 'Vídeo Completo em Base64') }
                            ]);
                        } catch (directErr) {
                            if (directErr.status === 429) throw directErr;
                            // Fallback automático para sequência de quadros caso o payload exceda limite do Worker
                            setProgress(45, 'Otimizando quadros de telemetria HD para análise...');
                            const extracted = await extractChronologicalFrames(currentVideoFile, 12);
                            const frameParts = extracted.frames.map(f => ({
                                inline_data: { mime_type: 'image/jpeg', data: f.base64 }
                            }));
                            frameParts.push({
                                text: buildUserPromptText(extracted.duration, `Sequência Cronológica de ${extracted.frames.length} Quadros Estampados`)
                            });
                            setProgress(75, 'Analisando trajetória e oscilações no Gemini...');
                            rawResponseText = await sendTelemetryRequest(frameParts);
                        }
                    } else {
                        setProgress(25, 'Extraindo quadros cronológicos de alta definição do vídeo...');
                        const extracted = await extractChronologicalFrames(currentVideoFile, 14);
                        const frameParts = extracted.frames.map(f => ({
                            inline_data: { mime_type: 'image/jpeg', data: f.base64 }
                        }));
                        frameParts.push({
                            text: buildUserPromptText(extracted.duration, `Sequência Cronológica de ${extracted.frames.length} Quadros Estampados`)
                        });
                        setProgress(65, 'Enviando telemetria visual para o Gemini Multimodal...');
                        rawResponseText = await sendTelemetryRequest(frameParts);
                    }

                    setProgress(95, 'Montando Dashboard de Telemetria...');
                    const parsedReport = parseTelemetryResponse(rawResponseText);
                    renderTelemetryDashboard(parsedReport, 'Gemini 3.8 Flash • Multimodal');
                    setProgress(100, 'Diagnóstico concluído!');
                    setTimeout(hideProgress, 900);
                } catch (err) {
                    hideProgress();
                    if (err && err.status === 429) {
                        triggerQuotaCooldown(err.message, 60);
                    } else {
                        showError(`Não foi possível concluir a análise: ${err.message || 'Erro de conexão com o Worker.'}`);
                    }
                } finally {
                    isAnalyzing = false;
                    btnAnalyzeLap.classList.remove('loading');
                    analyzeBtnIcon.style.display = 'inline';
                    if (!quotaCooldownTimer) {
                        btnAnalyzeLap.disabled = false;
                        analyzeBtnText.textContent = 'Analisar Volta com IA';
                    }
                }
            });

            // Botão de Demonstração Rápida (para testar o Dashboard mesmo sem vídeo em mãos)
            btnLoadDemoReport.addEventListener('click', () => {
                if (!inputKp.value) inputKp.value = '1.45';
                if (!inputKd.value) inputKd.value = '11.0';
                if (!inputVbase.value) inputVbase.value = '65';
                if (!trackNotesInput.value) trackNotesInput.value = 'Saída de curva fechada + reta longa';

                const demoReport = {
                    estabilidade_geral: 'Oscilando',
                    nota_estabilidade: 'Oscilação em S (serpenteio) após curvas de 90° por excesso de ganho proporcional (Kp).',
                    tempo_volta: '00:13.8',
                    resumo_velocidade: 'Alta velocidade nas retas (V_base=65), porém derrapagem na entrada da curva 2.',
                    timeline_eventos: [
                        {
                            tempo: '00:02',
                            segundos: 2,
                            severidade: 'ok',
                            evento: 'Largada e Reta Inicial Estável',
                            detalhe: 'Robô acelera suavemente e mantém a fita centralizada entre os sensores.'
                        },
                        {
                            tempo: '00:05',
                            segundos: 5,
                            severidade: 'warning',
                            evento: 'Oscilação em S (Overshoot na Curva 1)',
                            detalhe: 'Ao sair da curva à direita, o robô cruza a linha 4 vezes seguidas antes de estabilizar.'
                        },
                        {
                            tempo: '00:09',
                            segundos: 9,
                            severidade: 'critical',
                            evento: 'Perda de Tração e Quase Saída de Fita',
                            detalhe: 'Entrada muito rápida na curva em S; roda interna levantou levemente e quase perdeu a leitura.'
                        },
                        {
                            tempo: '00:12',
                            segundos: 12,
                            severidade: 'ok',
                            evento: 'Recuperação Derivativa na Reta Final',
                            detalhe: 'O termo Kd amorteceu o erro final até cruzar o portal de chegada.'
                        }
                    ],
                    recomendacoes_engenharia: {
                        resumo_principal: 'Reduzir Kp em ~15% (de 1.45 para 1.22) e aumentar Kd em ~30% (para 14.5) para frear o serpenteio nas saídas de curva.',
                        ajustes_sugeridos: {
                            kp_sugerido: '1.22',
                            kp_acao: 'Reduzir ~15%',
                            kd_sugerido: '14.5',
                            kd_acao: 'Aumentar ~30%',
                            v_base_sugerido: '58',
                            v_base_acao: 'Reduzir ~10%'
                        },
                        passos_praticos: [
                            'Aplique KP = 1.22 e KD = 14.5 no código do tijolo LEGO para amortecer a transição entre curva e reta.',
                            'Reduza V_BASE de 65 para 58 para evitar perda de aderência no instante 00:09.',
                            'Limpe a banda de borracha dos pneus com fita adesiva antes da próxima tomada de tempo oficial.'
                        ]
                    }
                };

                renderTelemetryDashboard(demoReport, 'Modo Demonstração');
            });

            // Botão "Copiar Diagnóstico" para colar no diário de bordo da equipe
            btnCopyDiagnosis.addEventListener('click', async () => {
                if (!lastTelemetryReport) return;

                const r = lastTelemetryReport;
                const rec = r.recomendacoes_engenharia || {};
                const aj = rec.ajustes_sugeridos || {};
                const timelineLines = (r.timeline_eventos || [])
                    .map(ev => `  - [${ev.tempo || '00:00'}] ${ev.evento}: ${ev.detalhe}`)
                    .join('\n');
                const stepsLines = (rec.passos_praticos || [])
                    .map((s, idx) => `  ${idx + 1}. ${s}`)
                    .join('\n');

                const logbookText = [
                    '==================================================',
                    '📊 DIAGNÓSTICO DE TELEMETRIA & COACHING - ROBÓTICA',
                    '==================================================',
                    `• Robô: ${robotTypeSelect.value}`,
                    `• Parâmetros Testados: Kp=${inputKp.value || '-'} | Kd=${inputKd.value || '-'} | V_base=${inputVbase.value || '-'}`,
                    `• Estabilidade Geral: ${r.estabilidade_geral || '-'} (${r.nota_estabilidade || ''})`,
                    `• Tempo da Volta: ${r.tempo_volta || '-'}`,
                    '',
                    '📍 TIMELINE DE EVENTOS CRÍTICOS:',
                    timelineLines || '  - Sem eventos críticos.',
                    '',
                    '🛠️ RECOMENDAÇÕES DE ENGENHARIA (TUNING PID):',
                    `  "${rec.resumo_principal || ''}"`,
                    `  -> Kp Sugerido: ${aj.kp_sugerido || '-'} (${aj.kp_acao || ''})`,
                    `  -> Kd Sugerido: ${aj.kd_sugerido || '-'} (${aj.kd_acao || ''})`,
                    `  -> V_base Sugerida: ${aj.v_base_sugerido || '-'} (${aj.v_base_acao || ''})`,
                    '',
                    '✅ PASSOS PRÁTICOS PARA O PRÓXIMO TESTE:',
                    stepsLines,
                    '=================================================='
                ].join('\n');

                try {
                    await navigator.clipboard.writeText(logbookText);
                } catch (_) {
                    const ta = document.createElement('textarea');
                    ta.value = logbookText;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand('copy');
                    document.body.removeChild(ta);
                }

                const originalLabel = copyDiagnosisText.textContent;
                copyDiagnosisText.textContent = '✅ Diagnóstico Copiado para o Diário de Bordo!';
                setTimeout(() => {
                    copyDiagnosisText.textContent = originalLabel;
                }, 2400);
            });

            // Controle do Modal de Chave API
            btnOpenApiKeyModal.addEventListener('click', () => {
                customApiKeyInput.value = localStorage.getItem(STORAGE_KEY_API) || '';
                apiKeyModal.classList.add('active');
            });

            apiKeyModal.addEventListener('click', (e) => {
                if (e.target === apiKeyModal) apiKeyModal.classList.remove('active');
            });

            btnSaveApiKey.addEventListener('click', () => {
                const val = customApiKeyInput.value.trim();
                if (val) {
                    localStorage.setItem(STORAGE_KEY_API, val);
                } else {
                    localStorage.removeItem(STORAGE_KEY_API);
                }
                updateApiKeyHeaderStatus();
                apiKeyModal.classList.remove('active');
            });

            btnClearApiKey.addEventListener('click', () => {
                localStorage.removeItem(STORAGE_KEY_API);
                customApiKeyInput.value = '';
                updateApiKeyHeaderStatus();
                apiKeyModal.classList.remove('active');
            });
        })();
