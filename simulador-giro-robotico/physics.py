# Física e Cinemática Diferencial do Robô
import math
import config

def calculate_motor_degrees(power: float, max_rpm: float, time_s: float) -> float:
    """
    Calcula quantos graus o motor girou com base na potência, RPM máximo e tempo.
    1 RPM = 360 graus por minuto = 6 graus por segundo.
    """
    # A velocidade angular do motor em graus por segundo
    rpm_atual = max_rpm * (power / 100.0)
    omega_deg_s = rpm_atual * 6.0
    return omega_deg_s * time_s

def calculate_wheel_distance(degrees: float, wheel_diameter: float) -> float:
    """
    Calcula a distância linear percorrida pela roda em milímetros.
    Distância = Circunferência * (Graus / 360)
    """
    return math.pi * wheel_diameter * (degrees / 360.0)

def calculate_chassis_angle(dist_l: float, dist_r: float, chassis_width: float, is_tread: bool = False) -> float:
    """
    Calcula a rotação final do chassi em graus com base nas distâncias lineares
    percorridas pelas rodas esquerda e direita.
    
    Formula básica: theta (rad) = (dist_r - dist_l) / chassis_width
    """
    if chassis_width <= 0:
        return 0.0
        
    theta_rad = (dist_r - dist_l) / chassis_width
    
    # Aplica penalidade de atrito caso seja esteira (Tread)
    if is_tread:
        theta_rad *= config.TREAD_SLIP_ROTATION
        
    return math.degrees(theta_rad)

def calculate_trajectory(
    power_l: float,
    power_r: float,
    max_rpm: float,
    time_s: float,
    wheel_diameter: float,
    chassis_width: float,
    is_tread: bool = False,
    num_steps: int = 150,
    start_x: float = 0.0,
    start_y: float = 0.0,
    start_theta: float = 0.0
) -> list:
    """
    Gera uma lista de estados (x, y, theta_rad) representando o trajeto do robô.
    Usa integração numérica de Differential Drive para traçar o caminho exato.
    Coordenadas na tela:
      - x positivo para a direita.
      - y positivo para baixo.
      - theta = 0 aponta para cima (-y). Rotação positiva gira no sentido horário.
    """
    # Rotação total teórica dos motores nos dois lados
    deg_l = calculate_motor_degrees(power_l, max_rpm, time_s)
    deg_r = calculate_motor_degrees(power_r, max_rpm, time_s)
    
    # Velocidade linear máxima teórica de cada roda (mm/s)
    # Rotação por segundo: RPM / 60
    # Velocidade: (RPM / 60) * pi * D
    v_l_max = (max_rpm / 60.0) * math.pi * wheel_diameter
    v_r_max = (max_rpm / 60.0) * math.pi * wheel_diameter
    
    # Velocidade atual de cada roda (mm/s)
    v_l = v_l_max * (power_l / 100.0)
    v_r = v_r_max * (power_r / 100.0)
    
    # Passo de tempo
    t_step = time_s / num_steps
    
    x, y, theta = start_x, start_y, start_theta  # Estado inicial
    steps = [(x, y, theta)]
    
    for _ in range(num_steps):
        # Aplica coeficientes de eficiência se for esteira (Tread)
        if is_tread:
            v_c = config.TREAD_SLIP_TRANSLATION * (v_r + v_l) / 2.0
            omega = config.TREAD_SLIP_ROTATION * (v_r - v_l) / chassis_width
        else:
            v_c = (v_r + v_l) / 2.0
            omega = (v_r - v_l) / chassis_width
            
        # Equações diferenciais de movimento (com y invertido para tela)
        dx = v_c * math.sin(theta) * t_step
        dy = -v_c * math.cos(theta) * t_step
        dtheta = omega * t_step
        
        x += dx
        y += dy
        theta += dtheta
        
        steps.append((x, y, theta))
        
    return steps

def calculate_execution_time(power_l: float, power_r: float, max_rpm: float, mode: str, value: float) -> float:
    """
    Calcula o tempo necessário em segundos para executar o movimento com base no modo programado.
    Modos: 'Segundos', 'Graus (Roda)', 'Rotações (Roda)'.
    """
    if mode == "Segundos":
        return value
        
    # Determina o alvo em graus de rotação do motor de referência
    target_degrees = value if "Graus" in mode else value * 360.0
    
    # O motor de referência é o que possui maior potência absoluta
    p_max = max(abs(power_l), abs(power_r))
    if p_max == 0:
        return 0.0
        
    # Velocidade angular máxima do motor de referência em graus/s
    rpm_atual = max_rpm * (p_max / 100.0)
    omega_deg_s = rpm_atual * 6.0
    if omega_deg_s == 0:
        return 0.0
        
    # Tempo = Rotação do alvo / Velocidade
    return target_degrees / omega_deg_s
