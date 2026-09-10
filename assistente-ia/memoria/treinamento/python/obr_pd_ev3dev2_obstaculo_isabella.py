#!/usr/bin/env python3

from ev3dev2.motor import MoveSteering, OUTPUT_A, OUTPUT_D, OUTPUT_C, SpeedPercent
from ev3dev2.sensor import INPUT_1, INPUT_2, INPUT_4
from ev3dev2.sensor.lego import ColorSensor, UltrasonicSensor
from time import sleep
import traceback

# =====================================================================
# CONFIGURAÇÃO DE PORTAS (MOTORES E SENSORES)
# =====================================================================

try:
    # Motores A e D (MoveSteering recebe motor esquerdo e motor direito)
    motores = MoveSteering(OUTPUT_A, OUTPUT_D)

    # Sensores de luz/cor nas portas 1 e 4
    sensor_esq = ColorSensor(INPUT_1)
    sensor_dir = ColorSensor(INPUT_4)

    # Sensor ultrassônico na porta 2
    ultrassonico = UltrasonicSensor(INPUT_2)

    # Configura os sensores para ler a intensidade de luz refletida
    sensor_esq.mode = 'COL-REFLECT'
    sensor_dir.mode = 'COL-REFLECT'
except Exception as e:
    import traceback
    error_msg = traceback.format_exc()
    print("ERRO DE INICIALIZACAO:\n", error_msg)
    with open("erro_log.txt", "w") as f:
        f.write(error_msg)
    sleep(15)
    exit(1)

# =====================================================================
# CALIBRAÇÃO MANUAL (ALTERE AQUI COM OS VALORES LIDOS NO EV3 PORT VIEW)
# =====================================================================

# Sensor Esquerdo (Porta 1)
MIN_ESQ = 7   # Valor de luz refletida lido na linha PRETA
MAX_ESQ = 86   # Valor de luz refletida lido na pista BRANCA

# Sensor Direito (Porta 4)
MIN_DIR = 8   # Valor de luz refletida lido na linha PRETA
MAX_DIR = 90   # Valor de luz refletida lido na pista BRANCA

# =====================================================================
# PARÂMETROS DE CONTROLE DO SEGUIDOR E GAP
# =====================================================================

# Velocidade base do robô
VELOCIDADE_BASE = 25

# Ganho Proporcional (Kp) - controla a intensidade das curvas
Kp = 1.6

# Ganho Derivativo (Kd) - atua como um amortecedor para evitar oscilações/zig-zag
Kd = 1.2  # Valor inicial recomendado para teste (ajuste conforme necessário)

# Como os valores agora serão NORMALIZADOS (0 = PRETO, 100 = BRANCO),
# o limiar ideal fica em torno de 45 (valores abaixo de 45 são pretos)
LIMIAR_PRETO = 45

# ID numérico da cor verde retornado pelo sensor do EV3 (3 = Verde)
COR_VERDE = 3

# Tempos de curva do verde em segundos (ajuste se o robô girar demais ou de menos)
TEMPO_GIRO_90 = 1.1
TEMPO_GIRO_180 = 2.2

# Contador para o GAP (vão/falha na linha preta)
contador_gap = 0
# Como o loop tem um delay de 0.01s (10ms), 50 ciclos equivalem a aproximadamente 0.5 segundos.
# Aumente este valor se o gap for muito longo, diminua se o robô demorar a parar no fim da linha.
CICLOS_MAX_GAP = 50

# =====================================================================
# PARÂMETROS DO DESVIO DE OBSTÁCULO (SENSOR ULTRASSÔNICO)
# =====================================================================
DISTANCIA_OBSTACULO = 5        # Distância de aproximação do obstáculo em cm (ajuste se bater)
TEMPO_DESVIO_GIRO = 1.0         # Tempo para girar 90 graus (ajuste se necessário)
TEMPO_DESVIO_FRENTE_LADO = 1.2  # Tempo andando para o lado para desviar da linha
TEMPO_DESVIO_FRENTE = 2.0       # Tempo andando reto paralelo à fita

#Como 5 cm é uma distância bem curta, caso o sensor demore a ler e o robô bata no obstáculo antes de iniciar o desvio, aumente o valor de DISTANCIA_OBSTACULO = 5 para 8 ou 10 nos parâmetros do código.



# Parâmetros da Garra           
#GRAUS_ABRIR = 120        # Ajuste a rotação para abrir sua garra
#GRAUS_FECHAR = 120       # Ajuste a rotação para fechar sua garra
#VELOCIDADE_GARRA = 30    # Velocidade de abertura/fechamento

# =====================================================================
# FUNÇÃO DA GARRA DE RESGATE
# =====================================================================
#def garraresgate(acao):
    #if acao == 'abrir':
        #print("Abrindo a garra...")
       # garra.on_for_degrees(speed=SpeedPercent(VELOCIDADE_GARRA), degrees=GRAUS_ABRIR)
      #  garra.off(release=True)  # Solta a garra para não forçar o motor
      #   
    #elif acao == 'fechar':
    #     print("Fechando a garra...")
   #      # Velocidade negativa para girar no sentido contrário e fechar
  #       garra.on_for_degrees(speed=SpeedPercent(-VELOCIDADE_GARRA), degrees=GRAUS_FECHAR)
 #        garra.off(release=False) # Mantém travada para segurar a vítima firmemente




# =====================================================================
# FUNÇÃO PARA PROCESSAR A FITA VERDE (OBR)
# =====================================================================

def processar_verde(cor_esq, cor_dir):
    print("Verde detectado! Esq: {}, Dir: {}".format(cor_esq, cor_dir))
    
    # 1. Avança um pouco para alinhar o eixo do robô com a fita verde no cruzamento
    motores.on_for_seconds(steering=0, speed=SpeedPercent(15), seconds=0.2)
    motores.off()
    
    # Prepara os sensores voltando para Refletida ANTES de começar a girar
    sensor_esq.mode = 'COL-REFLECT'
    sensor_dir.mode = 'COL-REFLECT'
    sleep(0.05)
    
    # 2. Decide a ação com base na posição da fita verde
    if cor_esq == COR_VERDE and cor_dir == COR_VERDE:
        # Verde em ambos os lados -> Meia volta (180 graus) para retornar
        print("Verde nos dois lados: Girando 180 graus...")
        # Gira no próprio eixo para a direita
        motores.on(steering=100, speed=SpeedPercent(15))
        sleep(TEMPO_GIRO_180) # Tempo mínimo para sair da fita atual
        # Continua girando até achar a linha preta novamente (usando valor cru para segurança)
        while sensor_esq.reflected_light_intensity > raw_limiar_esq and sensor_dir.reflected_light_intensity > raw_limiar_dir:
            sleep(0.01)
            
    elif cor_esq == COR_VERDE:
        # Verde apenas na esquerda -> Curva de 90 graus para a esquerda
        print("Verde na esquerda: Girando 90 graus para a esquerda...")
        motores.on(steering=-100, speed=SpeedPercent(15))
        sleep(TEMPO_GIRO_90) # Tempo mínimo para sair da fita atual
        while sensor_esq.reflected_light_intensity > raw_limiar_esq and sensor_dir.reflected_light_intensity > raw_limiar_dir:
            sleep(0.01)
            
    elif cor_dir == COR_VERDE:
        # Verde apenas na direita -> Curva de 90 graus para a direita
        print("Verde na direita: Girando 90 graus para a direita...")
        motores.on(steering=100, speed=SpeedPercent(15))
        sleep(TEMPO_GIRO_90) # Tempo mínimo para sair da fita atual
        while sensor_esq.reflected_light_intensity > raw_limiar_esq and sensor_dir.reflected_light_intensity > raw_limiar_dir:
            sleep(0.01)
            
    # Para os motores após a manobra e garante que os sensores voltem para o modo de refletida
    motores.off()
    sensor_esq.mode = 'COL-REFLECT'
    sensor_dir.mode = 'COL-REFLECT'
    sleep(0.1)

# =====================================================================
# LOOP PRINCIPAL
# =====================================================================

# Garante que não haja divisão por zero se os valores inseridos forem iguais
div_esq = (MAX_ESQ - MIN_ESQ) if (MAX_ESQ - MIN_ESQ) != 0 else 1
div_dir = (MAX_DIR - MIN_DIR) if (MAX_DIR - MIN_DIR) != 0 else 1

# Calcula o limiar em valores brutos (raw) para as sub-rotinas de curva
raw_limiar_esq = MIN_ESQ + div_esq * (LIMIAR_PRETO / 100.0)
raw_limiar_dir = MIN_DIR + div_dir * (LIMIAR_PRETO / 100.0)

#print("--- SEGUIDOR DE LINHA COM DETECCAO DE VERDE E GAP INICIADO (PD + CALIBRAÇÃO MANUAL) ---")
#print("Motores: A e D | Sensores: 1 e 4")

# Inicializa o erro anterior para o cálculo da derivada (Kd)
erro_anterior = 0

# =====================================================================
# FUNÇÃO DE DESVIO DE OBSTÁCULO (CONTORNO)
# =====================================================================
def desviar_obstaculo():
    print("Obstáculo detectado! Iniciando desvio...")
    motores.off()
    sleep(0.2)
    
    # 1. Virar para o lado (Direita)
    print("Passo 1: Girando para a direita...")
    motores.on_for_seconds(steering=100, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_GIRO)
    motores.off()
    sleep(0.1)
    
    # 2. Andar um pouco para frente (afastando-se da linha original)
    print("Passo 2: Andando para o lado...")
    motores.on_for_seconds(steering=0, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_FRENTE_LADO)
    motores.off()
    sleep(0.1)
    
    # 3. Virar para frente (Esquerda)
    print("Passo 3: Girando para a esquerda (paralelo à linha)...")
    motores.on_for_seconds(steering=-100, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_GIRO)
    motores.off()
    sleep(0.1)
    
    # 4. Andar para frente (ultrapassando o obstáculo)
    print("Passo 4: Andando para a frente...")
    motores.on_for_seconds(steering=0, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_FRENTE)
    motores.off()
    sleep(0.1)
    
    # 5. Virar para o lado contrário (Esquerda, apontando de volta para a linha)
    print("Passo 5: Girando para a esquerda (em direção à linha)...")
    motores.on_for_seconds(steering=-100, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_GIRO)
    motores.off()
    sleep(0.1)
    
    # 6. Andar de novo até reencontrar a linha preta
    print("Passo 6: Andando até reencontrar a linha...")
    motores.on(steering=0, speed=SpeedPercent(15))
    
    # Fica andando até que pelo menos um dos sensores detecte a linha preta
    while sensor_esq.reflected_light_intensity > raw_limiar_esq and sensor_dir.reflected_light_intensity > raw_limiar_dir:
        sleep(0.01)
        
    motores.off()
    sleep(0.1)
    
    # 7. Virar para a direita (girando no próprio eixo) para alinhar de volta com o sentido da linha
    print("Passo 7: Alinhando com a linha (girando para a direita)...")
    motores.on_for_seconds(steering=100, speed=SpeedPercent(15), seconds=TEMPO_DESVIO_GIRO * 0.9)
    motores.off()
    sleep(0.1)
    
    print("Desvio concluído! Retomando seguidor de linha...")

try:
    while True:
        # Verificação do sensor ultrassônico com dupla checagem contra leituras fantasmas
        if ultrassonico.distance_centimeters < DISTANCIA_OBSTACULO:
            sleep(0.02)
            if ultrassonico.distance_centimeters < DISTANCIA_OBSTACULO:
                desviar_obstaculo()
                erro_anterior = 0
                contador_gap = 0
                continue

        # Lê a intensidade de luz refletida crua de cada sensor (valor de 0 a 100)
        luz_esq_raw = sensor_esq.reflected_light_intensity
        luz_dir_raw = sensor_dir.reflected_light_intensity

        # NORMALIZAÇÃO: Converte a leitura crua para uma escala de 0 (preto) a 100 (branco)
        luz_esq = ((luz_esq_raw - MIN_ESQ) / div_esq) * 100
        luz_dir = ((luz_dir_raw - MIN_DIR) / div_dir) * 100

        # Garante que os limites fiquem estritamente entre 0 e 100
        if luz_esq < 0: luz_esq = 0
        elif luz_esq > 100: luz_esq = 100
        if luz_dir < 0: luz_dir = 0
        elif luz_dir > 100: luz_dir = 100

        # Caso 1: Ambos os sensores estão no BRANCO (Possível GAP ou fim da linha)
        if luz_esq > LIMIAR_PRETO and luz_dir > LIMIAR_PRETO:
            contador_gap += 1
            erro_anterior = 0 # Reseta erro anterior para evitar picos na volta do GAP
            
            if contador_gap <= CICLOS_MAX_GAP:
                # Se ainda está dentro do limite do GAP, força o robô a ir reto (steering = 0)
                ajuste = 0
                motores.on(steering=ajuste, speed=SpeedPercent(VELOCIDADE_BASE))
            else:
                # Se ultrapassou o limite do GAP e não achou a linha, gira para retornar
                print("Linha perdida. Girando para retornar...")
                achou = False
                
                # 1. Gira para a esquerda procurando a linha
                motores.on(steering=-100, speed=SpeedPercent(15))
                for _ in range(10):
                    sleep(0.01)
                    if sensor_esq.reflected_light_intensity <= raw_limiar_esq or sensor_dir.reflected_light_intensity <= raw_limiar_dir:
                        achou = True
                        break
                
                # 2. Se não achou na esquerda, gira para a direita
                if not achou:
                    motores.on(steering=100, speed=SpeedPercent(15))
                    for _ in range(20):
                        sleep(0.01)
                        if sensor_esq.reflected_light_intensity <= raw_limiar_esq or sensor_dir.reflected_light_intensity <= raw_limiar_dir:
                            achou = True
                            break
                
                # 3. Se não achou de nenhum lado, realinha no centro para continuar reto
                if not achou:
                    motores.on(steering=-100, speed=SpeedPercent(15))
                    sleep(0.1)
                
                # Para os motores e zera as variáveis
                motores.off()
                contador_gap = 0
                erro_anterior = 0 # Reseta após reencontrar a linha para evitar trancos do PD
                # Gira sobre o próprio eixo (steering = 100 faz o robô girar no lugar para a direita)
              #  motores.on(steering=100, speed=SpeedPercent(20))
                
                # Fica girando até que pelo menos um dos sensores detecte a linha preta novamente
              #  while sensor_esq.reflected_light_intensity > raw_limiar_esq and sensor_dir.reflected_light_intensity > raw_limiar_dir:
             #       sleep(0.01)
                
                # Para os motores e zera o contador de gap para retomar
             #   motores.off()
              #  contador_gap = 0
              #  erro_anterior = 0 # Reseta após reencontrar a linha
              #  print("Linha reencontrada! Retomando...")
        
        # Caso 2: Pelo menos um dos sensores detectou a linha preta/escura
        else:
            # Zera o contador de gap pois encontramos a linha
            contador_gap = 0

            # Se ambos os sensores detectaram preto, pode ser um cruzamento ou fita verde
            # Usamos um limiar mais baixo (30) para cruzamento para evitar falsos positivos enquanto o robo oscila no PD
            if luz_esq <= 30 and luz_dir <= 30:
                print("Ambos sensores no preto! Movendo para ajustar...")
                
                # Gira levemente para a direita (steering=50) a uma velocidade menor (10%) para evitar passar do ponto
                motores.on(steering=50, speed=SpeedPercent(10))
                while True:
                    luz_esq_raw = sensor_esq.reflected_light_intensity
                    luz_dir_raw = sensor_dir.reflected_light_intensity
                    luz_esq_temp = ((luz_esq_raw - MIN_ESQ) / div_esq) * 100
                    luz_dir_temp = ((luz_dir_raw - MIN_DIR) / div_dir) * 100
                    
                    if luz_esq_temp > LIMIAR_PRETO or luz_dir_temp > LIMIAR_PRETO:
                        break
                    sleep(0.01)
                
                motores.off()
                sleep(0.05)  # Aguarda o robô parar totalmente antes de medir novamente
                
                # Mede de novo para verificar se a inércia levou ambos os sensores para o branco
                luz_esq_raw = sensor_esq.reflected_light_intensity
                luz_dir_raw = sensor_dir.reflected_light_intensity
                luz_esq_temp = ((luz_esq_raw - MIN_ESQ) / div_esq) * 100
                luz_dir_temp = ((luz_dir_raw - MIN_DIR) / div_dir) * 100
                
                # Se passou do ponto e ambos ficaram brancos, faz a correção voltando para a esquerda bem devagar
                if luz_esq_temp > LIMIAR_PRETO and luz_dir_temp > LIMIAR_PRETO:
                    print("Passou do ponto! Corrigindo para a esquerda...")
                    motores.on(steering=-50, speed=SpeedPercent(8))
                    while True:
                        luz_esq_raw = sensor_esq.reflected_light_intensity
                        luz_dir_raw = sensor_dir.reflected_light_intensity
                        luz_esq_temp = ((luz_esq_raw - MIN_ESQ) / div_esq) * 100
                        luz_dir_temp = ((luz_dir_raw - MIN_DIR) / div_dir) * 100
                        
                        # Para assim que pelo menos um dos sensores tocar o preto novamente
                        if luz_esq_temp <= LIMIAR_PRETO or luz_dir_temp <= LIMIAR_PRETO:
                            break
                        sleep(0.01)
                    motores.off()
                
                erro_anterior = 0 # Reseta erro para evitar picos no PD
                continue  # Retorna ao início do loop principal para seguir a linha normalmente

            # CODIGO ANTERIOR DE COR/VERDE COMENTADO PARA TESTES:
            # if luz_esq <= 30 and luz_dir <= 30:
            #     # Para os motores para fazer leitura precisa de cor sem trepidação
            #     motores.off()
            #     
            #     # Configura os sensores para o modo de COR antes de ler
            #     sensor_esq.mode = 'COL-COLOR'
            #     sensor_dir.mode = 'COL-COLOR'
            #     sleep(0.15)  # Aguarda os sensores mudarem de modo e estabilizarem
            #     
            #     # Lê a cor de ambos os sensores
            #     cor_esq = sensor_esq.color
            #     cor_dir = sensor_dir.color
            #     
            #     # FILTRO DE SEGURANÇA: O sensor do EV3 frequentemente lê a linha preta como verde (3).
            #     # Como a fita verde reflete mais luz que a preta, exigimos que a luz normalizada seja > 12.
            #     # Se for menor ou igual a 12, é preto puro e ignoramos o verde.
            #     eh_esq_verde = (cor_esq == COR_VERDE and luz_esq > 12)
            #     eh_dir_verde = (cor_dir == COR_VERDE and luz_dir > 12)
            #     
            #     eh_verde = False
            #     if eh_esq_verde or eh_dir_verde:
            #         # Confirmação secundária para evitar falsos positivos de reflexos
            #         sleep(0.05)
            #         cor_esq2 = sensor_esq.color
            #         cor_dir2 = sensor_dir.color
            #         
            #         eh_esq_verde2 = (cor_esq2 == COR_VERDE and luz_esq > 12)
            #         eh_dir_verde2 = (cor_dir2 == COR_VERDE and luz_dir > 12)
            #         
            #         if eh_esq_verde2 or eh_dir_verde2:
            #             eh_verde = True
            #             p_esq = COR_VERDE if eh_esq_verde2 else cor_esq2
            #             p_dir = COR_VERDE if eh_dir_verde2 else cor_dir2
            #             processar_verde(p_esq, p_dir)
            #             erro_anterior = 0  # Reseta erro anterior após a manobra do verde
            #     
            #     # Se não for verde (ou se a confirmação falhou), trata como cruzamento comum
            #     if not eh_verde:
            #         # Volta para o modo de refletida para poder andar com o PD correto depois
            #         sensor_esq.mode = 'COL-REFLECT'
            #         sensor_dir.mode = 'COL-REFLECT'
            #         sleep(0.05)
            #         # Avança reto um pouco para ignorar a linha transversal e não travar
            #         motores.on_for_seconds(steering=0, speed=SpeedPercent(VELOCIDADE_BASE), seconds=0.15)
            #         erro_anterior = 0  # Reseta erro anterior após cruzar
            #     
            #     continue  # Reinicia o loop principal para ler sensores atualizados

            # Seguidor de linha proporcional-derivativo (PD)
            erro = luz_esq - luz_dir
            derivada = erro - erro_anterior
            ajuste = (erro * Kp) + (derivada * Kd)
            
            # Guarda o erro atual para ser o erro anterior na próxima iteração
            erro_anterior = erro

            # Limita o ajuste entre -100 e 100
            if ajuste > 100:
                ajuste = 100
            elif ajuste < -100:
                ajuste = -100

            # Liga os motores com o ajuste calculado
            motores.on(steering=ajuste, speed=SpeedPercent(VELOCIDADE_BASE))

        # Pequeno atraso para estabilização das leituras
        sleep(0.01)

except KeyboardInterrupt:
    # Desliga os motores ao parar o programa
    motores.off()
    print("Programa finalizado. Motores desligados.")
except Exception as e:
    try:
        motores.off()
    except:
        pass
    import traceback
    error_msg = traceback.format_exc()
    print("ERRO DE EXECUCAO:\n", error_msg)
    with open("erro_log.txt", "w") as f:
        f.write(error_msg)
    sleep(15)
