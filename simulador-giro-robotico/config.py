# Configurações do Simulador de Cinemática Diferencial

# Cores (Tema Escuro CAD / Engenharia)
COLOR_BG = "#0c0f16"               # Fundo escuro profundo do canvas
COLOR_GRID_MAJOR = "#1a2233"       # Linhas de grade principais (50 mm)
COLOR_GRID_MINOR = "#121824"       # Linhas de grade secundárias (10 mm)
COLOR_PANEL_BG = "#131722"         # Fundo cinza-chumbo do painel de controle
COLOR_BORDER = "#222a3d"           # Cor das bordas e divisores
COLOR_TEXT_PRIMARY = "#ffffff"     # Texto principal em branco puro
COLOR_TEXT_MUTED = "#708099"       # Texto secundário ou de ajuda

# Cores de Destaque Neon
COLOR_NEON_CYAN = "#00f0ff"        # Destaque de seleção e botões ativos
COLOR_NEON_GREEN = "#39ff14"       # Rastro do robô (trajetória) e valores corretos
COLOR_NEON_ORANGE = "#ff8800"      # Representação de motores e potência positiva
COLOR_NEON_RED = "#ff2a4b"         # Alertas e potência negativa
COLOR_ROBOT_BODY = "#2d3548"       # Corpo do robô
COLOR_ROBOT_WHEEL = "#ffdd00"      # Rodas do robô (Amarelo LEGO)
COLOR_ROBOT_TREAD = "#424b5e"      # Esteira do robô

# Tipografia
FONT_FAMILY = "Segoe UI"
FONT_FAMILY_DIGITAL = "Consolas"

# Fatores Físicos e Escala
SCALE_MM_TO_PX = 1.5               # 1 mm físico equivale a 1.5 pixels na tela

# Presets de Motores (RPM máximos teóricos)
MOTOR_PRESETS = {
    "LEGO NXT (170 RPM)": 170.0,
    "LEGO EV3 (160 RPM)": 160.0
}

# Presets de Rodas (Diâmetro em mm)
WHEEL_PRESETS = {
    "Padrão (56mm)": 56.0,
    "Pequena (43.2mm)": 43.2,
    "Moto (94.2mm)": 94.2,
    "Esteira (Aplica penalidade de atrito)": 56.0
}

# Penalidades de Atrito da Esteira (Tread)
TREAD_SLIP_ROTATION = 0.70         # Perda de 30% na eficiência rotacional
TREAD_SLIP_TRANSLATION = 0.90      # Perda de 10% na velocidade linear de translação
