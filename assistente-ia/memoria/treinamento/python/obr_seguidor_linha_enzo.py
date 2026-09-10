#!/usr/bin/env python3

import time
from time import sleep
# pyrefly: ignore [missing-import]
from ev3dev2.motor import OUTPUT_A, OUTPUT_D, MoveTank
# pyrefly: ignore [missing-import]
from ev3dev2.sensor.lego import ColorSensor, UltrasonicSensor, GyroSensor
# pyrefly: ignore [missing-import]
from ev3dev2.sensor import INPUT_2, INPUT_4, INPUT_1, INPUT_3

# Configurações de Sensores e Motores
corE = ColorSensor(INPUT_2)
corD = ColorSensor(INPUT_4)
tank = MoveTank(OUTPUT_A, OUTPUT_D)
ultra = UltrasonicSensor(INPUT_1)

# CALIBRAÇÃO (Valores sugeridos, teste na sua pista real!)
LIMIAR_PRETO = 20  # Refletância abaixo disso é considerada linha preta
LIMIAR_PRATA = 90  # Refletância acima disso é prata brilhante (Entrada do Resgate)

# Parâmetros de calibração do verde (RGB)
PROPORCAO_VERDE = 1.8   # Canal G deve ser pelo menos X vezes maior que R e B
MIN_G_VERDE = 35        # Valor mínimo absoluto do canal G para ser considerado verde
MAX_REF_VERDE = 45      # Refletância máxima para ser considerado verde (evita branco)
DIFERENCA_VERDE = 15    # Diferença mínima absoluta do canal G para R e B (evita ruído no preto)

GIRO_TEMPO_90 = 1.4         # Tempo (s) para girar 90 graus na velocidade 30 (Aumente para virar mais, diminua para virar menos)

VELOCIDADE_BASE = 30  # Velocidade reta padrão do robô

# Constantes do PID (Ajuste esses números na pista!)
KP = 1.0   # Força da correção proporcional (tente de 0.4 a 1.2)
KI = 0.05  # Quase sempre 0.0 no EV3
KD = 2.0   # Força amortecedora (tente 2x ou 3x o valor do KP)

# Variáveis para controle histórico do PID
erro_anterior = 0
integral = 0

def girar_angulo(angulo, velocidade=20):
    # angulo positivo = direita (horário)
    # angulo negativo = esquerda (anti-horário)
    
    # Giro por tempo (giroscópio removido do percurso)
    vel_fallback = 30
    tempo = abs(angulo) * (GIRO_TEMPO_90 / 90.0) # Usa a constante calibrada para 90 graus
    if angulo > 0:
        tank.on_for_seconds(vel_fallback, -vel_fallback, tempo)
    else:
        tank.on_for_seconds(-vel_fallback, vel_fallback, tempo)

def obter_refletancia_rgb(rgb):
    # O ev3dev2 retorna valores de 0 a 255 para a propriedade .rgb
    # Dividindo por 2.55, temos uma escala de 0 a 100 extremamente estável.
    ref = rgb[0] / 2.55
    return min(max(ref, 0), 100)

def obter_refletancia(sensor):
    return obter_refletancia_rgb(sensor.rgb)

def ler_sensores():
    # Retorna refletância equivalente lendo ambos os sensores em RGB (sem trocar de modo)
    return obter_refletancia(corE), obter_refletancia(corD)

def verificar_verde(rgb_e, rgb_d, ref_e, ref_d):
    # Retorna (verde_na_esquerda, verde_na_direita) usando leituras RGB
    # Extrai diretamente os canais (escala de 0 a 255)
    r_e, g_e, b_e = rgb_e
    r_d, g_d, b_d = rgb_d
    
    # Otimização crucial: só detecta verde se o sensor estiver sobre uma cor escura
    # (refletância < MAX_REF_VERDE), que é a característica física do verde e do preto.
    # Isso impede que o sensor leia "verde" falsamente no papel branco devido ao ruído.
    # O verde deve ter o canal G (verde) significativamente superior a R (vermelho) e B (azul),
    # e a diferença absoluta de G para R e B deve ser relevante para evitar falso positivo em preto.
    verde_e = (ref_e < MAX_REF_VERDE and 
               g_e > r_e * PROPORCAO_VERDE and 
               g_e > b_e * PROPORCAO_VERDE and 
               g_e > MIN_G_VERDE and
               (g_e - r_e) > DIFERENCA_VERDE and 
               (g_e - b_e) > DIFERENCA_VERDE)
               
    verde_d = (ref_d < MAX_REF_VERDE and 
               g_d > r_d * PROPORCAO_VERDE and 
               g_d > b_d * PROPORCAO_VERDE and 
               g_d > MIN_G_VERDE and
               (g_d - r_d) > DIFERENCA_VERDE and 
               (g_d - b_d) > DIFERENCA_VERDE)
    
    return verde_e, verde_d

def seguidorLinha(ref_e, ref_d, verde_e, verde_d, rgb_e, rgb_d):
    global erro_anterior, integral

    # 1. Manter a prioridade dos cruzamentos de verde
    if verde_e and verde_d:
        print("Marcador VERDE duplo detectado! Girando 180...")
        tank.on_for_seconds(20, 20, 0.2)
        tank.on_for_seconds(30, -30, GIRO_TEMPO_90 * 2.0)
        erro_anterior = 0  # Reseta o erro após a curva
        return
        
    elif verde_e:
        r_e, g_e, b_e = rgb_e
        print("Marcador VERDE na esquerda detectado! R={}, G={}, B={}".format(r_e, g_e, b_e))
        tank.on_for_seconds(20, 20, 0.3)
        tank.on(-25, 25)
        sleep(0.4) # Tempo mínimo girando antes de procurar a linha preta
        tempo_inicio = time.time()
        while obter_refletancia(corE) > LIMIAR_PRETO:
            if time.time() - tempo_inicio > 2.5:
                print("Aviso: Timeout tentando encontrar linha preta na esquerda!")
                break
            sleep(0.01)
        tank.off()
        erro_anterior = 0
        return

    elif verde_d:
        r_d, g_d, b_d = rgb_d
        print("Marcador VERDE na direita detectado! R={}, G={}, B={}".format(r_d, g_d, b_d))
        tank.on_for_seconds(20, 20, 0.3)
        tank.on(25, -25)
        sleep(0.4) # Tempo mínimo girando antes de procurar a linha preta
        tempo_inicio = time.time()
        while obter_refletancia(corD) > LIMIAR_PRETO:
            if time.time() - tempo_inicio > 2.5:
                print("Aviso: Timeout tentando encontrar linha preta na direita!")
                break
            sleep(0.01)
        tank.off()
        erro_anterior = 0
        return

    # 2. CÁLCULO DO PID (Substitui os if/elif antigos de direção)
    
    # Se ambos virem branco (Gap) ou ambos virem preto (Cruzamento), anda reto e zera histórico
    if (ref_e > 60 and ref_d > 60) or (ref_e < LIMIAR_PRETO and ref_d < LIMIAR_PRETO):
        erro = 0
        integral = 0
        erro_anterior = 0
    else:
        erro = ref_e - ref_d
    
    # Proporcional
    P = KP * erro
    
    # Integral
    integral += erro
    integral = max(min(integral, 100), -100) # Evita que a soma cresça infinitamente
    I = KI * integral
    
    # Derivativo
    derivada = erro - erro_anterior
    D = KD * derivada
    
    # Calcula a correção total
    correcao = P + I + D
    
    # Salva o erro para o próximo ciclo
    erro_anterior = erro
    
    # Define as velocidades aplicando a correção
    vel_e = VELOCIDADE_BASE + correcao
    vel_d = VELOCIDADE_BASE - correcao
    
    # Limita as velocidades dos motores entre -100 e 100
    vel_e = max(min(vel_e, 100), -100)
    vel_d = max(min(vel_d, 100), -100)
    
    # Aciona os motores
    tank.on(vel_e, vel_d)

def resgate():
    # Entrou na área de resgate
    tank.off()
    print("Iniciando Resgate...")
    
    # Inicializa o giroscópio apenas no resgate
    try:
        gyro = GyroSensor(INPUT_3)
        gyro.mode = 'GYRO-RATE'
        sleep(0.2)
        gyro.mode = 'GYRO-ANG'
        sleep(0.2)
        print("Giroscopio detectado e inicializado com sucesso para o resgate!")
    except Exception as e:
        print("Aviso: Giroscopio nao detectado na porta 3. Erro:", e)
        gyro = None

    # Aqui entra o seu código de varredura ou resgate
    while True:
        tank.on(0, 0)
        sleep(1)

# Loop Principal
while True:
    # 1. Faz uma única leitura RGB por ciclo para ambos os sensores
    rgb_e = corE.rgb
    rgb_d = corD.rgb
    
    # 2. Calcula as refletâncias equivalentes
    ref_e = obter_refletancia_rgb(rgb_e)
    ref_d = obter_refletancia_rgb(rgb_d)

    # 3. Checa se chegou na entrada de prata do Resgate
    if ref_e > LIMIAR_PRATA and ref_d > LIMIAR_PRATA:
        resgate()
    else:
        # 4. Segue a linha normalmente usando os marcadores verdes e refletâncias calculadas
        verde_e, verde_d = verificar_verde(rgb_e, rgb_d, ref_e, ref_d)
        
        # Filtro Anti-Falso Positivo (Debounce) para transições na borda da linha preta
        if verde_e or verde_d:
            confirma_e = 0
            confirma_d = 0
            # Faz 2 leituras rápidas para ter certeza absoluta de que é um quadrado verde e não a borda da linha
            for _ in range(2):
                sleep(0.01)
                re_rgb_e, re_rgb_d = corE.rgb, corD.rgb
                ve, vd = verificar_verde(re_rgb_e, re_rgb_d, obter_refletancia_rgb(re_rgb_e), obter_refletancia_rgb(re_rgb_d))
                if ve: confirma_e += 1
                if vd: confirma_d += 1
            
            # Se não confirmou nas leituras seguintes, descarta a leitura (era ruído da borda)
            if confirma_e == 0: verde_e = False
            if confirma_d == 0: verde_d = False

        seguidorLinha(ref_e, ref_d, verde_e, verde_d, rgb_e, rgb_d)
        
    sleep(0.01)
