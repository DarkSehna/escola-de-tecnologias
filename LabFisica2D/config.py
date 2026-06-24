import customtkinter as ctk

# Configurações do CustomTkinter
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")

# Design System de Cores (Estilo Physics Lab / Cyberpunk)
COLOR_BG_DARK = "#121217"         # Fundo principal
COLOR_BG_CARD = "#1b1b22"         # Fundo de containers laterais
COLOR_ACCENT = "#00ff66"          # Verde Neon (Destaques e ativo)
COLOR_ACCENT_HOVER = "#00cc52"    # Verde Neon Hover
COLOR_TEXT_PRIMARY = "#ffffff"    # Texto principal
COLOR_TEXT_MUTED = "#b5b5c9"      # Rótulos secundários
COLOR_BORDER = "#2a2a38"          # Bordas de inputs e grids
COLOR_ERROR = "#ff3333"           # Alerta de digitação inválida

# Cores específicas do canvas de simulação
COLOR_CANVAS_BG = "#0f0f13"       # Fundo do Canvas
COLOR_GRID = "#1a1a24"            # Linhas da grade 32x32
COLOR_PLAYER = "#00d2ff"          # Bloco do jogador (Ciano brilhante)
COLOR_OBSTACLE = "#4f4f6b"        # Blocos obstáculos colocados pelo usuário
COLOR_GROUND = "#1e7e34"          # Chão/Solo sólido (Verde escuro)
COLOR_PEAK_LINE = "#ff3b30"       # Linha de altura máxima (Vermelho)
COLOR_ARC_LINE = "#ffcc00"        # Linha do arco do salto (Amarelo)

# Fontes
FONT_TITLE = ("Segoe UI", 18, "bold")
FONT_SUBTITLE = ("Segoe UI", 12, "normal")
FONT_LABEL = ("Segoe UI", 12, "bold")
FONT_TEXT = ("Segoe UI", 12, "normal")
FONT_CODE = ("Consolas", 11, "normal")
FONT_HINT = ("Segoe UI", 11, "normal")

# Tamanho do Bloco e Grade
GRID_SIZE = 32

# Presets das Engines de Jogos com os 8 parâmetros de colisão e aceleração customizados
ENGINE_PRESETS = {
    "GameMaker": {
        "title": "GameMaker (Física Customizada)",
        "description": "Física programada manualmente no obj_player e obj_lifeForm, com aceleração e atritos separados para chão/ar.",
        "gravity": {"min": 0.05, "max": 2.0, "default": 0.3, "step": 0.05},
        "jump": {"min": -2.0, "max": -20.0, "default": -7.0, "step": 0.5},
        "speed": {"min": 1.0, "max": 16.0, "default": 4.0, "step": 0.5},
        "accelGround": {"min": 0.01, "max": 2.0, "default": 0.35, "step": 0.05},
        "frictionGround": {"min": 0.01, "max": 1.5, "default": 0.15, "step": 0.05},
        "accelAir": {"min": 0.01, "max": 2.0, "default": 0.20, "step": 0.05},
        "frictionAir": {"min": 0.01, "max": 1.0, "default": 0.05, "step": 0.01},
        "maxFallSpeed": {"min": 2.0, "max": 25.0, "default": 12.0, "step": 1.0},
        "code_template": (
            "// --- Variáveis no obj_lifeForm (Pai) ---\n"
            "grv = {gravity:.2f};          // Gravidade\n"
            "jspd = {jump:.1f};         // Força do pulo\n"
            "maxFallSpeed = {maxFallSpeed:.1f}; // Queda limite\n\n"
            "// --- Variáveis no obj_player (Filho) ---\n"
            "moveSpeed = {speed:.1f};      // Velocidade máx lateral\n"
            "accelGround = {accelGround:.2f};   // Aceleração no chão\n"
            "frictionGround = {frictionGround:.2f}; // Fricção no chão\n"
            "accelAir = {accelAir:.2f};      // Aceleração no ar\n"
            "frictionAir = {frictionAir:.2f};   // Fricção no ar\n"
        )
    },
    "Construct 3": {
        "title": "Construct 3 (Platform)",
        "description": "Variáveis mapeadas para as propriedades nativas do comportamento 'Platform'.",
        "gravity": {"min": 100.0, "max": 5000.0, "default": 1080.0, "step": 50.0},
        "jump": {"min": 100.0, "max": 1500.0, "default": 420.0, "step": 10.0},
        "speed": {"min": 50.0, "max": 1000.0, "default": 240.0, "step": 10.0},
        "accelGround": {"min": 50.0, "max": 5000.0, "default": 1260.0, "step": 50.0},
        "frictionGround": {"min": 50.0, "max": 5000.0, "default": 540.0, "step": 50.0},
        # Valores de ar escalados ou ajustados
        "accelAir": {"min": 50.0, "max": 5000.0, "default": 720.0, "step": 50.0},
        "frictionAir": {"min": 10.0, "max": 2000.0, "default": 180.0, "step": 10.0},
        "maxFallSpeed": {"min": 100.0, "max": 2500.0, "default": 720.0, "step": 50.0},
        "code_template": (
            "// Ajuste estas propriedades no comportamento 'Platform' do seu Objeto:\n"
            "Max Speed = {speed:.0f}\n"
            "Acceleration = {accelGround:.0f}\n"
            "Deceleration = {frictionGround:.0f}\n"
            "Gravity = {gravity:.0f}\n"
            "Jump Strength = {jump:.0f}\n"
            "Max Fall Speed = {maxFallSpeed:.0f}\n"
        )
    },
    "Scratch": {
        "title": "Scratch (Física adaptada)",
        "description": "Variáveis expressas em passos por frame (escala típica de scripts escolares).",
        "gravity": {"min": -0.1, "max": -5.0, "default": -0.9, "step": 0.1},
        "jump": {"min": 4.0, "max": 25.0, "default": 10.5, "step": 0.5},
        "speed": {"min": 1.0, "max": 18.0, "default": 7.2, "step": 0.5},
        "accelGround": {"min": 0.05, "max": 2.0, "default": 0.7, "step": 0.05},
        "frictionGround": {"min": 0.50, "max": 0.99, "default": 0.85, "step": 0.01},
        "accelAir": {"min": 0.05, "max": 2.0, "default": 0.4, "step": 0.05},
        "frictionAir": {"min": 0.50, "max": 0.99, "default": 0.95, "step": 0.01},
        "maxFallSpeed": {"min": -2.0, "max": -25.0, "default": -15.0, "step": 1.0},
        "code_template": (
            "// Defina as variáveis no script do seu Ator Jogador:\n"
            "mude [velocidade_max v] para ({speed:.1f})\n"
            "mude [aceleração_chão v] para ({accelGround:.2f})\n"
            "mude [atrito_chão v] para ({frictionGround:.2f})\n"
            "mude [aceleração_ar v] para ({accelAir:.2f})\n"
            "mude [atrito_ar v] para ({frictionAir:.2f})\n"
            "mude [gravidade v] para ({gravity:.1f})\n"
            "mude [força_pulo v] para ({jump:.1f})\n"
            "mude [queda_maxima v] para ({maxFallSpeed:.1f})\n"
        )
    }
}
