import customtkinter as ctk

# Configurações do CustomTkinter
ctk.set_appearance_mode("dark")
ctk.set_default_color_theme("blue")  # Tema padrão, mas customizaremos cores específicas

# Paleta de Cores (Estilo Terminal Hacker/Cyberpunk)
COLOR_BG_DARK = "#090a0f"         # Fundo preto profundo
COLOR_BG_CARD = "#12141d"         # Fundo de containers/cards (HUD)
COLOR_ACCENT = "#00f0ff"          # Azul Ciano Laser vibrante para botões e destaques
COLOR_ACCENT_HOVER = "#00b2bd"    # Ciano hover
COLOR_TEXT_PRIMARY = "#ffffff"    # Texto principal
COLOR_TEXT_MUTED = "#5f6c8d"      # Rótulos inativos ou dicas de terminal
COLOR_BORDER = "#1f2230"          # Bordas de inputs e caixas (Cibernético)
COLOR_ERROR = "#ff3333"           # Alerta de erro

# Configurações de Fontes (Temática Monospace Terminal Hacker)
FONT_TITLE = ("Consolas", 22, "bold")
FONT_SUBTITLE = ("Consolas", 13, "normal")
FONT_TAB = ("Consolas", 14, "bold")
FONT_LABEL = ("Consolas", 14, "bold")
FONT_TEXT = ("Consolas", 14, "normal")
FONT_CODE = ("Consolas", 13, "normal")
FONT_HINT = ("Consolas", 12, "normal")

# Lista de Gêneros de Jogos
GENRES = [
    "Plataforma",
    "Top-Down (RPG / Aventura)",
    "Metroidvania",
    "Puzzle",
    "Shooter / Shooter 2D",
    "Outro"
]

