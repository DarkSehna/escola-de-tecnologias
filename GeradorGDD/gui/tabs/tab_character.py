import customtkinter as ctk
from config import *
from gui.widgets import PlaceholderTextbox, GlowEntry, play_sound_async

class TabCharacter(ctk.CTkFrame):
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
        
        # Controle de linhas sequencial para o grid
        self.current_row = 0
        
        # --- Seção 1: O Protagonista ---
        self.create_section_header("[ AVATAR INITIALIZATION - O PROTAGONISTA ]")
        
        # Nome do Protagonista
        header_hero_name = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_hero_name.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_hero_name = ctk.CTkLabel(
            header_hero_name,
            text="Identidade do Herói (Nome)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_hero_name.pack(side="left")
        
        self.lbl_status_hero_name = ctk.CTkLabel(
            header_hero_name,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_hero_name.pack(side="left", padx=10)
        
        self.entry_hero_name = GlowEntry(
            self.scroll_frame,
            placeholder_text="Ex: Alex, Spark, Robô X",
            font=FONT_TEXT,
            height=35
        )
        self.entry_hero_name.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.entry_hero_name.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_hero_name = ctk.CTkLabel(
            self.scroll_frame,
            text="Digite o nome oficial ou codinome do personagem principal.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_hero_name.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 10))
        self.current_row += 1
        
        # Descrição / Aparência
        header_hero_desc = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_hero_desc.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_hero_desc = ctk.CTkLabel(
            header_hero_desc,
            text="Aparência & Atributos",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_hero_desc.pack(side="left")
        
        self.lbl_status_hero_desc = ctk.CTkLabel(
            header_hero_desc,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_hero_desc.pack(side="left", padx=10)
        
        self.text_hero_desc = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Descreva como o herói se parece (Ex: Um gato com botas espaciais vermelhas, uma guerreira cibernética com armadura brilhante).",
            height=110,
            font=FONT_TEXT
        )
        self.text_hero_desc.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_hero_desc.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_hero_desc = ctk.CTkLabel(
            self.scroll_frame,
            text="Descreva a aparência visual do protagonista para orientar os artistas.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_hero_desc.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # Habilidades e Mecânicas
        header_hero_skills = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_hero_skills.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_hero_skills = ctk.CTkLabel(
            header_hero_skills,
            text="Habilidades de Gameplay (Ações)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_hero_skills.pack(side="left")
        
        self.lbl_status_hero_skills = ctk.CTkLabel(
            header_hero_skills,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_hero_skills.pack(side="left", padx=10)
        
        self.text_hero_skills = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Descreva as habilidades básicas e especiais (Ex: Andar, Pular, Pulo Duplo, Escalar Paredes, Disparar Laser).",
            height=110,
            font=FONT_TEXT
        )
        self.text_hero_skills.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_hero_skills.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_hero_skills = ctk.CTkLabel(
            self.scroll_frame,
            text="Descreva todas as ações físicas que o protagonista pode realizar.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_hero_skills.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # --- Seção 2: Mapeamento de Controles ---
        self.create_section_header("[ CONTROL ENGINE - MAPEAMENTO DE INPUTS ]")
        
        self.hint_controls_intro = ctk.CTkLabel(
            self.scroll_frame,
            text="Mapeie quais teclas ou botões ativam cada ação do jogador durante a partida.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_controls_intro.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 10))
        self.current_row += 1
        
        # Lista/Container dinâmico para os controles
        self.controls_container = ctk.CTkFrame(
            self.scroll_frame,
            fg_color="transparent"
        )
        self.controls_container.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=5)
        self.current_row += 1
        self.controls_container.grid_columnconfigure(0, weight=1)
        
        self.control_rows = []
        
        # Botão para adicionar novo controle
        self.btn_add_control = ctk.CTkButton(
            self.scroll_frame,
            text="+ Adicionar Controle",
            font=FONT_LABEL,
            fg_color="transparent",
            text_color=COLOR_ACCENT,
            hover_color=COLOR_BORDER,
            border_color=COLOR_ACCENT,
            border_width=1,
            height=30,
            command=self.add_blank_control
        )
        self.btn_add_control.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(5, 20))
        self.current_row += 1
        
        # Adicionar controles iniciais padrão
        self.load_default_controls()
        
        # Inicializa status
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

    def update_status_tags(self, event=None):
        """Atualiza dinamicamente as tags [ - ] ou [ OK ] conforme digitação."""
        # 1. Nome do Protagonista
        if self.entry_hero_name.get().strip():
            self.lbl_status_hero_name.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_hero_name.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 2. Descrição Física
        if self.text_hero_desc.get_text().strip():
            self.lbl_status_hero_desc.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_hero_desc.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 3. Habilidades
        if self.text_hero_skills.get_text().strip():
            self.lbl_status_hero_skills.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_hero_skills.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # Dispara callback global do app
        if self.on_change:
            self.on_change()

    def add_control_row(self, action_text="", key_text="", play_sound=False):
        if play_sound:
            play_sound_async("click")
            
        row_frame = ctk.CTkFrame(
            self.controls_container,
            fg_color="transparent",
            height=40
        )
        row_frame.pack(fill="x", pady=4)
        
        row_frame.grid_columnconfigure(0, weight=4)
        row_frame.grid_columnconfigure(1, weight=4)
        row_frame.grid_columnconfigure(2, weight=1)
        
        entry_action = GlowEntry(
            row_frame,
            placeholder_text="Ação (Ex: Pular)",
            font=FONT_TEXT,
            height=30
        )
        entry_action.grid(row=0, column=0, padx=(0, 5), sticky="ew")
        entry_action.insert(0, action_text)
        
        entry_key = GlowEntry(
            row_frame,
            placeholder_text="Tecla (Ex: Espaço)",
            font=FONT_TEXT,
            height=30
        )
        entry_key.grid(row=0, column=1, padx=(0, 5), sticky="ew")
        entry_key.insert(0, key_text)
        
        entry_action.bind("<KeyRelease>", self.update_status_tags)
        entry_key.bind("<KeyRelease>", self.update_status_tags)
            
        btn_remove = ctk.CTkButton(
            row_frame,
            text="✕",
            font=FONT_LABEL,
            fg_color="#1c1212",
            text_color="#ff5555",
            hover_color="#2c1a1a",
            border_color="#5a2c2c",
            border_width=1,
            width=30,
            height=30,
            command=lambda: self.remove_control_row(row_frame)
        )
        btn_remove.grid(row=0, column=2, sticky="ew")
        
        self.control_rows.append({
            "frame": row_frame,
            "action": entry_action,
            "key": entry_key
        })
        
        self.update_status_tags()

    def add_blank_control(self):
        self.add_control_row("", "", play_sound=True)

    def remove_control_row(self, frame_to_remove):
        play_sound_async("remove")
        for item in list(self.control_rows):
            if item["frame"] == frame_to_remove:
                item["frame"].destroy()
                self.control_rows.remove(item)
                break
        self.update_status_tags()

    def load_default_controls(self):
        self.clear_controls()
        self.add_control_row("Mover Esquerda", "Seta Esquerda / A")
        self.add_control_row("Mover Direita", "Seta Direita / D")
        self.add_control_row("Pular", "Seta Cima / W / Espaço")

    def clear_controls(self):
        for item in self.control_rows:
            item["frame"].destroy()
        self.control_rows.clear()

    def get_data(self) -> dict:
        controls_data = []
        for row in self.control_rows:
            act = row["action"].get().strip()
            k = row["key"].get().strip()
            if act or k:
                controls_data.append({"action": act, "key": k})
                
        return {
            "hero_name": self.entry_hero_name.get().strip(),
            "hero_desc": self.text_hero_desc.get_text(),
            "hero_skills": self.text_hero_skills.get_text(),
            "controls": controls_data
        }

    def set_data(self, data: dict):
        self.entry_hero_name.delete(0, "end")
        self.entry_hero_name.insert(0, data.get("hero_name", ""))
        
        self.text_hero_desc.set_text(data.get("hero_desc", ""))
        self.text_hero_skills.set_text(data.get("hero_skills", ""))
        
        self.clear_controls()
        saved_controls = data.get("controls", [])
        if saved_controls:
            for ctrl in saved_controls:
                self.add_control_row(ctrl.get("action", ""), ctrl.get("key", ""))
        else:
            self.load_default_controls()
            
        self.update_status_tags()

    def clear(self):
        self.entry_hero_name.delete(0, "end")
        self.text_hero_desc.clear_text()
        self.text_hero_skills.clear_text()
        self.load_default_controls()
        
        self.update_status_tags()
