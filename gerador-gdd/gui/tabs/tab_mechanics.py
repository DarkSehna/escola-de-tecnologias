import customtkinter as ctk
from config import *
from gui.widgets import PlaceholderTextbox, GlowEntry

class TabMechanics(ctk.CTkFrame):
    def __init__(self, parent, on_change=None):
        super().__init__(parent, fg_color="transparent")
        self.on_change = on_change
        
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Frame rolável principal
        self.scroll_frame = ctk.CTkScrollableFrame(
            self,
            fg_color=COLOR_BG_CARD,
            border_color=COLOR_BORDER,
            border_width=1
        )
        self.scroll_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        self.scroll_frame.grid_columnconfigure(0, weight=1)
        
        # Controle sequencial de linhas para o grid
        self.current_row = 0
        
        # --- Seção 1: Mecânicas do Mundo ---
        self.create_section_header("[ MAP ENGINE - OBSTÁCULOS E ELEMENTOS DO MAPA ]")
        
        self.hint_checkboxes = ctk.CTkLabel(
            self.scroll_frame,
            text="Selecione quais elementos ou obstáculos estarão presentes nas fases do seu jogo:",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_checkboxes.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(5, 5))
        self.current_row += 1
        
        # Grid para Checkboxes (2 Colunas)
        self.checkboxes_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        self.checkboxes_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=5)
        self.current_row += 1
        self.checkboxes_frame.columnconfigure(0, weight=1)
        self.checkboxes_frame.columnconfigure(1, weight=1)
        
        self.mechanics_options = [
            ("Armadilhas (Espinhos, serras...)", "Armadilhas"),
            ("Paredes Falsas (Passagens secretas)", "Paredes Falsas"),
            ("Paredes Quebráveis (Destruir com ataques)", "Paredes Quebráveis"),
            ("Ciclo Dia / Noite (Luzes e cores)", "Ciclo Dia/Noite"),
            ("Limite de Tempo / Cronômetro", "Limite de Tempo"),
            ("Plataformas Móveis (Sobe/desce ou lados)", "Plataformas Móveis"),
            ("Plataformas Falsas (Cai ao pisar)", "Plataformas Falsas"),
            ("Outros Obstáculos (Especifique abaixo)", "Outros Obstáculos")
        ]
        
        self.checkbox_vars = {}
        for index, (label_text, value) in enumerate(self.mechanics_options):
            col = index % 2
            row = index // 2
            
            var = ctk.BooleanVar(value=False)
            cb = ctk.CTkCheckBox(
                self.checkboxes_frame,
                text=label_text,
                variable=var,
                font=FONT_TEXT,
                text_color=COLOR_TEXT_PRIMARY,
                checkmark_color=COLOR_BG_DARK,
                fg_color=COLOR_ACCENT,
                hover_color=COLOR_ACCENT_HOVER,
                border_color=COLOR_BORDER,
                border_width=2,
                command=self.checkbox_changed
            )
            cb.grid(row=row, column=col, sticky="w", padx=5, pady=5)
            self.checkbox_vars[value] = var
            
        # Campo para detalhar mecânicas
        header_world_desc = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_world_desc.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_world_desc = ctk.CTkLabel(
            header_world_desc,
            text="Funcionamento dos Elementos do Mapa",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_world_desc.pack(side="left")
        
        self.lbl_status_world_desc = ctk.CTkLabel(
            header_world_desc,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_world_desc.pack(side="left", padx=10)
        
        self.text_world_desc = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Exemplo: Ao pisar na plataforma falsa, ela treme por 1 segundo antes de cair física e visualmente, forçando o jogador a agir rápido.",
            height=110,
            font=FONT_TEXT
        )
        self.text_world_desc.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_world_desc.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_world_desc = ctk.CTkLabel(
            self.scroll_frame,
            text="Explique como o cenário interage com o jogador.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_world_desc.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # --- Seção 2: Inimigos e Ameaças ---
        self.create_section_header("[ BESTIARY ENGINE - AMEAÇAS LOCAIS & CHEFES ]")
        
        # Minions
        header_minions = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_minions.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_minions = ctk.CTkLabel(
            header_minions,
            text="Bestiário (Ameaças Locais / Minions)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_minions.pack(side="left")
        
        self.lbl_status_minions = ctk.CTkLabel(
            header_minions,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_minions.pack(side="left", padx=10)
        
        self.text_minions = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Exemplo: 1) Slime Verde que se move horizontalmente batendo nas paredes. 2) Morcego Vermelho que persegue o jogador se ele se aproximar.",
            height=110,
            font=FONT_TEXT
        )
        self.text_minions.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_minions.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_minions = ctk.CTkLabel(
            self.scroll_frame,
            text="Descreva os tipos de inimigos mais comuns no caminho.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_minions.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # Chefes
        header_bosses = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_bosses.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_bosses = ctk.CTkLabel(
            header_bosses,
            text="Grandes Oponentes (Chefes / Bosses)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_bosses.pack(side="left")
        
        self.lbl_status_bosses = ctk.CTkLabel(
            header_bosses,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_bosses.pack(side="left", padx=10)
        
        self.text_bosses = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Exemplo: Um único dragão no final do jogo. Ele atira 3 bolas de fogo sequenciais, depois fica cansado por 2 segundos.",
            height=110,
            font=FONT_TEXT
        )
        self.text_bosses.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_bosses.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_bosses = ctk.CTkLabel(
            self.scroll_frame,
            text="Descreva o grande oponente e a mecânica para derrotá-lo.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_bosses.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # --- Seção 3: Regras de Jogo ---
        self.create_section_header("[ SYSTEM STATUS - REGRAS DO JOGO ]")
        
        # Vitória
        header_victory = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_victory.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_victory = ctk.CTkLabel(
            header_victory,
            text="Vitória do Jogador (Win State) *",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_victory.pack(side="left")
        
        self.lbl_status_victory = ctk.CTkLabel(
            header_victory,
            text="[ ! ]",
            font=FONT_LABEL,
            text_color="#ffcc00"
        )
        self.lbl_status_victory.pack(side="left", padx=10)
        
        self.text_victory = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Explique o gatilho lógico de vitória. Exemplo: Derrotar o chefe final, resgatar o pet preso ou encostar na bandeira de fim de fase.",
            height=100,
            font=FONT_TEXT
        )
        self.text_victory.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_victory.bind("<KeyRelease>", self.update_status_tags)
            
        self.hint_victory = ctk.CTkLabel(
            self.scroll_frame,
            text="Esta regra é obrigatória para definir o fim de um nível com sucesso!",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_victory.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # Derrota
        header_defeat = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_defeat.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_defeat = ctk.CTkLabel(
            header_defeat,
            text="Game Over: O que destrói seu herói? *",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_defeat.pack(side="left")
        
        self.lbl_status_defeat = ctk.CTkLabel(
            header_defeat,
            text="[ ! ]",
            font=FONT_LABEL,
            text_color="#ffcc00"
        )
        self.lbl_status_defeat.pack(side="left", padx=10)
        
        self.text_defeat = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Explique o que penaliza o jogador. Exemplo: A barra de vida zerar devido a ataques inimigos, cair em um buraco ou esgotar o tempo.",
            height=100,
            font=FONT_TEXT
        )
        self.text_defeat.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_defeat.bind("<KeyRelease>", self.update_status_tags)
            
        self.hint_defeat = ctk.CTkLabel(
            self.scroll_frame,
            text="Esta regra é obrigatória para definir o fim de jogo em derrota!",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_defeat.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 20))
        self.current_row += 1
        
        # Inicializa status das tags
        self.update_status_tags()

    def create_section_header(self, title_text):
        """Helper para criar cabeçalhos de seção visualmente separados usando o contador sequencial."""
        separator = ctk.CTkFrame(self.scroll_frame, height=2, fg_color=COLOR_BORDER)
        separator.grid(row=self.current_row, column=0, sticky="ew", padx=10, pady=(15, 10))
        self.current_row += 1
        
        header = ctk.CTkLabel(
            self.scroll_frame,
            text=title_text,
            font=FONT_LABEL,
            text_color=COLOR_ACCENT
        )
        header.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 5))
        self.current_row += 1

    def checkbox_changed(self):
        # Repassa alteração
        if self.on_change:
            self.on_change()

    def update_status_tags(self, event=None):
        """Atualiza dinamicamente as tags [ ! ], [ - ] ou [ OK ]."""
        # 1. Funcionamento detalhado
        if self.text_world_desc.get_text().strip():
            self.lbl_status_world_desc.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_world_desc.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 2. Inimigos Comuns
        if self.text_minions.get_text().strip():
            self.lbl_status_minions.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_minions.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 3. Chefes
        if self.text_bosses.get_text().strip():
            self.lbl_status_bosses.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_bosses.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 4. Vitória (Obrigatório)
        if self.text_victory.get_text().strip():
            self.lbl_status_victory.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_victory.configure(text="[ ! ]", text_color="#ffcc00")
            
        # 5. Derrota (Obrigatório)
        if self.text_defeat.get_text().strip():
            self.lbl_status_defeat.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_defeat.configure(text="[ ! ]", text_color="#ffcc00")
            
        if self.on_change:
            self.on_change()

    def get_data(self) -> dict:
        selected_mechs = [name for name, var in self.checkbox_vars.items() if var.get()]
        
        return {
            "world_mechanics_selected": selected_mechs,
            "world_mechanics_desc": self.text_world_desc.get_text(),
            "minions_desc": self.text_minions.get_text(),
            "bosses_desc": self.text_bosses.get_text(),
            "victory_cond": self.text_victory.get_text(),
            "defeat_cond": self.text_defeat.get_text()
        }

    def set_data(self, data: dict):
        selected_mechs = data.get("world_mechanics_selected", [])
        for name, var in self.checkbox_vars.items():
            var.set(name in selected_mechs)
            
        self.text_world_desc.set_text(data.get("world_mechanics_desc", ""))
        self.text_minions.set_text(data.get("minions_desc", ""))
        self.text_bosses.set_text(data.get("bosses_desc", ""))
        self.text_victory.set_text(data.get("victory_cond", ""))
        self.text_defeat.set_text(data.get("defeat_cond", ""))
        
        self.update_status_tags()

    def clear(self):
        for var in self.checkbox_vars.values():
            var.set(False)
        self.text_world_desc.clear_text()
        self.text_minions.clear_text()
        self.text_bosses.clear_text()
        self.text_victory.clear_text()
        self.text_defeat.clear_text()
        
        self.update_status_tags()
