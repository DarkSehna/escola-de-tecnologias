import customtkinter as ctk
from config import *
from gui.widgets import PlaceholderTextbox, GlowEntry

class TabOverview(ctk.CTkFrame):
    def __init__(self, parent, on_change=None):
        super().__init__(parent, fg_color="transparent")
        self.on_change = on_change
        
        # Grid layout para ocupar todo o espaço
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(0, weight=1)
        
        # Frame rolável
        self.scroll_frame = ctk.CTkScrollableFrame(
            self,
            fg_color=COLOR_BG_CARD,
            border_color=COLOR_BORDER,
            border_width=1
        )
        self.scroll_frame.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)
        self.scroll_frame.grid_columnconfigure(0, weight=1)
        
        # Controle sequencial de linhas
        self.current_row = 0
        
        # --- Seção 1: Identificação Básica ---
        self.create_section_header("[ SYSTEM INITIALIZATION - IDENTIFICAÇÃO BANCO ]")
        
        # Nome do Jogo
        header_name_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_name_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_name = ctk.CTkLabel(
            header_name_frame,
            text="Título do Projeto (Game Name) *",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_name.pack(side="left")
        
        self.lbl_status_name = ctk.CTkLabel(
            header_name_frame,
            text="[ ! ]",
            font=FONT_LABEL,
            text_color="#ffcc00"
        )
        self.lbl_status_name.pack(side="left", padx=10)
        
        self.entry_name = GlowEntry(
            self.scroll_frame,
            placeholder_text="Ex: A Aventura de Pixel",
            font=FONT_TEXT,
            height=35
        )
        self.entry_name.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.entry_name.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_name = ctk.CTkLabel(
            self.scroll_frame,
            text="Escolha um nome marcante para o seu projeto. Este campo é obrigatório!",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_name.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 10))
        self.current_row += 1
        
        # Gênero
        header_genre_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_genre_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_genre = ctk.CTkLabel(
            header_genre_frame,
            text="Gênero / Arquétipo",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_genre.pack(side="left")
        
        self.label_genre_status = ctk.CTkLabel(
            header_genre_frame,
            text="[ OK ]",
            font=FONT_LABEL,
            text_color="#00ff66"
        )
        self.label_genre_status.pack(side="left", padx=10)
        
        self.combo_genre = ctk.CTkComboBox(
            self.scroll_frame,
            values=GENRES,
            font=FONT_TEXT,
            border_color=COLOR_BORDER,
            button_color=COLOR_BORDER,
            button_hover_color=COLOR_ACCENT,
            dropdown_font=FONT_TEXT,
            height=35
        )
        self.combo_genre.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 2))
        self.combo_genre.set(GENRES[0])
        self.current_row += 1
        
        self.hint_genre = ctk.CTkLabel(
            self.scroll_frame,
            text="Define o estilo principal de regras de colisão e movimentação do jogo.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_genre.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # --- Seção 2: Contexto e Mundo ---
        self.create_section_header("[ WORLD ENGINE - O UNIVERSO DO JOGO ]")
        
        # Objetivo Geral
        header_obj_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_obj_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_objective = ctk.CTkLabel(
            header_obj_frame,
            text="Objetivo do Jogo (O que o jogador faz para vencer?)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_objective.pack(side="left")
        
        self.lbl_status_objective = ctk.CTkLabel(
            header_obj_frame,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_objective.pack(side="left", padx=10)
        
        self.text_objective = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Exemplo: Chegar ao fim da fase coletando pelo menos 3 chaves para abrir o portal final antes que o tempo se esgote.",
            height=110,
            font=FONT_TEXT
        )
        self.text_objective.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_objective.bind("<KeyRelease>", self.update_status_tags)
            
        self.hint_objective = ctk.CTkLabel(
            self.scroll_frame,
            text="Defina a meta principal que encerra o nível ou o jogo.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_objective.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # História / Premissa
        header_story_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_story_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_story = ctk.CTkLabel(
            header_story_frame,
            text="Lore / Premissa do Mundo (História)",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_story.pack(side="left")
        
        self.lbl_status_story = ctk.CTkLabel(
            header_story_frame,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_story.pack(side="left", padx=10)
        
        self.text_story = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Explique resumidamente quem é o protagonista, onde ele começa, qual problema surge e o que ele busca resolver.",
            height=140,
            font=FONT_TEXT
        )
        self.text_story.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_story.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_story = ctk.CTkLabel(
            self.scroll_frame,
            text="Conte o início da história e o que impulsiona a jogabilidade.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_story.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 15))
        self.current_row += 1
        
        # Mundo / Cenário
        header_world_frame = ctk.CTkFrame(self.scroll_frame, fg_color="transparent")
        header_world_frame.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(10, 2))
        self.current_row += 1
        
        self.label_world = ctk.CTkLabel(
            header_world_frame,
            text="Ambiente / Cenário das Fases",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.label_world.pack(side="left")
        
        self.lbl_status_world = ctk.CTkLabel(
            header_world_frame,
            text="[ - ]",
            font=FONT_LABEL,
            text_color=COLOR_TEXT_MUTED
        )
        self.lbl_status_world.pack(side="left", padx=10)
        
        self.text_world = PlaceholderTextbox(
            self.scroll_frame,
            placeholder_text="Descreva o ambiente visual e sonoro: uma masmorra escura cheia de lava, uma ilha flutuante pacífica e ensolarada, ou um planeta alienígena roxo.",
            height=110,
            font=FONT_TEXT
        )
        self.text_world.grid(row=self.current_row, column=0, sticky="ew", padx=15, pady=(0, 2))
        self.current_row += 1
        
        self.text_world.bind("<KeyRelease>", self.update_status_tags)
        
        self.hint_world = ctk.CTkLabel(
            self.scroll_frame,
            text="Descreva os temas visuais e cores predominantes do cenário.",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.hint_world.grid(row=self.current_row, column=0, sticky="w", padx=15, pady=(0, 20))
        self.current_row += 1
        
        # Inicializa o status das tags
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
        """Atualiza dinamicamente as tags [ ! ], [ - ] ou [ OK ] conforme digitação."""
        # 1. Nome do Jogo (Obrigatório)
        if self.entry_name.get().strip():
            self.lbl_status_name.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_name.configure(text="[ ! ]", text_color="#ffcc00")
            
        # 2. Objetivo Geral
        if self.text_objective.get_text().strip():
            self.lbl_status_objective.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_objective.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 3. História (Opcional)
        if self.text_story.get_text().strip():
            self.lbl_status_story.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_story.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # 4. Mundo (Opcional)
        if self.text_world.get_text().strip():
            self.lbl_status_world.configure(text="[ OK ]", text_color="#00ff66")
        else:
            self.lbl_status_world.configure(text="[ - ]", text_color=COLOR_TEXT_MUTED)
            
        # Dispara callback global do app
        if self.on_change:
            self.on_change()

    def get_data(self) -> dict:
        return {
            "game_name": self.entry_name.get().strip(),
            "genre": self.combo_genre.get(),
            "objective": self.text_objective.get_text(),
            "story": self.text_story.get_text(),
            "world_setting": self.text_world.get_text()
        }

    def set_data(self, data: dict):
        self.entry_name.delete(0, "end")
        self.entry_name.insert(0, data.get("game_name", ""))
        
        genre_val = data.get("genre", GENRES[0])
        self.combo_genre.set(genre_val)
            
        self.text_objective.set_text(data.get("objective", ""))
        self.text_story.set_text(data.get("story", ""))
        self.text_world.set_text(data.get("world_setting", ""))
        
        self.update_status_tags()

    def clear(self):
        self.entry_name.delete(0, "end")
        self.combo_genre.set(GENRES[0])
        self.text_objective.clear_text()
        self.text_story.clear_text()
        self.text_world.clear_text()
        
        self.update_status_tags()
