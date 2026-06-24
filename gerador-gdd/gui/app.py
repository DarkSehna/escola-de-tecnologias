import os
import customtkinter as ctk
from tkinter import filedialog, messagebox

from config import *
import document_manager
from gui.tabs.tab_overview import TabOverview
from gui.tabs.tab_character import TabCharacter
from gui.tabs.tab_mechanics import TabMechanics
from gui.widgets import play_sound_async

class GDDGeneratorApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configuração da Janela
        self.title("Gerador de GDD (Game Design Document) - Para Alunos e Professores")
        self.geometry("950x750")
        self.minsize(900, 700)
        self.configure(fg_color=COLOR_BG_DARK)
        
        # Grid principal da aplicação (Header: Row 0, Tabs: Row 1, Status: Row 2)
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(1, weight=1)
        
        # --- 1. CABEÇALHO E TOOLBAR (Header) ---
        self.header_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.header_frame.grid(row=0, column=0, sticky="ew", padx=20, pady=(15, 10))
        self.header_frame.grid_columnconfigure(0, weight=1)
        
        # Linha 0: Título e Botões
        top_header = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        top_header.grid(row=0, column=0, sticky="ew")
        top_header.grid_columnconfigure(0, weight=1)
        top_header.grid_columnconfigure(1, weight=0)
        
        # Container de Títulos (Esquerda)
        self.title_container = ctk.CTkFrame(top_header, fg_color="transparent")
        self.title_container.grid(row=0, column=0, sticky="w")
        
        self.title_label = ctk.CTkLabel(
            self.title_container,
            text="🎮 GERADOR DE GAME DESIGN DOCUMENT (GDD)",
            font=FONT_TITLE,
            text_color=COLOR_ACCENT
        )
        self.title_label.grid(row=0, column=0, sticky="w")
        
        self.subtitle_label = ctk.CTkLabel(
            self.title_container,
            text="Planeje e estruture as regras, histórias, personagens e mecânicas do seu jogo!",
            font=FONT_SUBTITLE,
            text_color=COLOR_TEXT_MUTED
        )
        self.subtitle_label.grid(row=1, column=0, sticky="w", pady=(2, 0))
        
        # Container de Botões / Toolbar (Direita)
        self.buttons_container = ctk.CTkFrame(top_header, fg_color="transparent")
        self.buttons_container.grid(row=0, column=1, sticky="e", padx=(15, 0))
        
        # Botão: Novo GDD
        self.btn_new = ctk.CTkButton(
            self.buttons_container,
            text="Novo Documento",
            font=FONT_LABEL,
            fg_color="transparent",
            text_color=COLOR_TEXT_PRIMARY,
            hover_color=COLOR_BG_CARD,
            border_color=COLOR_BORDER,
            border_width=1,
            height=38,
            command=lambda: self.flash_button(self.btn_new, self.new_document)
        )
        self.btn_new.pack(side="left", padx=5)
        
        # Botão: Carregar Projeto
        self.btn_load = ctk.CTkButton(
            self.buttons_container,
            text="📁 Carregar Projeto",
            font=FONT_LABEL,
            fg_color=COLOR_BG_CARD,
            text_color=COLOR_TEXT_PRIMARY,
            hover_color=COLOR_BORDER,
            border_color=COLOR_BORDER,
            border_width=1,
            height=38,
            command=lambda: self.flash_button(self.btn_load, self.load_project)
        )
        self.btn_load.pack(side="left", padx=5)
        
        # Botão: Salvar GDD (Será estilizado dinamicamente)
        self.btn_save = ctk.CTkButton(
            self.buttons_container,
            text="💾 Salvar GDD",
            font=FONT_LABEL,
            height=38,
            command=lambda: self.flash_button(self.btn_save, self.save_project)
        )
        self.btn_save.pack(side="left", padx=5)
        
        # Linha 1: Barra de Progresso da Quest (Thick Neon XP Bar)
        self.progress_frame = ctk.CTkFrame(self.header_frame, fg_color="transparent")
        self.progress_frame.grid(row=1, column=0, sticky="ew", pady=(15, 5))
        self.progress_frame.grid_columnconfigure(1, weight=1)
        
        self.lbl_progress_tag = ctk.CTkLabel(
            self.progress_frame,
            text="QUEST PROGRESS: 0%",
            font=FONT_LABEL,
            text_color=COLOR_ACCENT
        )
        self.lbl_progress_tag.grid(row=0, column=0, padx=(0, 15), sticky="w")
        
        self.progress_bar = ctk.CTkProgressBar(
            self.progress_frame,
            height=16,
            fg_color="#181a24",
            progress_color=COLOR_ACCENT,
            border_color=COLOR_BORDER,
            border_width=1
        )
        self.progress_bar.grid(row=0, column=1, sticky="ew")
        self.progress_bar.set(0.0)
        
        # --- 2. ABAS (Tabview) ---
        self.tabview = ctk.CTkTabview(
            self,
            fg_color=COLOR_BG_DARK,
            segmented_button_fg_color=COLOR_BG_CARD,
            segmented_button_selected_color=COLOR_ACCENT,
            segmented_button_selected_hover_color=COLOR_ACCENT_HOVER,
            segmented_button_unselected_color=COLOR_BG_CARD,
            segmented_button_unselected_hover_color=COLOR_BORDER,
            text_color=COLOR_TEXT_PRIMARY,
            text_color_disabled=COLOR_TEXT_MUTED
        )
        self.tabview.grid(row=1, column=0, sticky="nsew", padx=20, pady=(0, 5))
        self.tabview.configure(command=self.on_tab_change)
        
        # Nomes das abas estilo menu de quest
        self.tab_overview_name = "[ 🌍 1. DIRETRIZES DO SISTEMA ]"
        self.tab_character_name = "[ 👤 2. AVATAR & CONTROLES ]"
        self.tab_mechanics_name = "[ ⚙️ 3. REGRAS & AMEAÇAS ]"
        
        self.tabview.add(self.tab_overview_name)
        self.tabview.add(self.tab_character_name)
        self.tabview.add(self.tab_mechanics_name)
        
        # Ajustando altura e fonte das abas
        self.tabview._segmented_button.configure(font=FONT_TAB, height=45)
        
        # Instanciando abas passando o callback de validação em tempo real
        self.tab_overview = TabOverview(self.tabview.tab(self.tab_overview_name), on_change=self.update_save_button_state)
        self.tab_overview.pack(fill="both", expand=True)
        
        self.tab_character = TabCharacter(self.tabview.tab(self.tab_character_name), on_change=self.update_save_button_state)
        self.tab_character.pack(fill="both", expand=True)
        
        self.tab_mechanics = TabMechanics(self.tabview.tab(self.tab_mechanics_name), on_change=self.update_save_button_state)
        self.tab_mechanics.pack(fill="both", expand=True)
        
        # --- 3. BARRA DE STATUS E CONTROLE DE AUDIO ---
        self.status_container = ctk.CTkFrame(self, fg_color="transparent")
        self.status_container.grid(row=2, column=0, sticky="ew", padx=20, pady=(2, 8))
        self.status_container.grid_columnconfigure(0, weight=1)
        self.status_container.grid_columnconfigure(1, weight=0)
        
        self.status_label = ctk.CTkLabel(
            self.status_container,
            text="[ STATUS ] Inicializando sistemas da HUD...",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED
        )
        self.status_label.grid(row=0, column=0, sticky="w")
        
        self.cb_sound = ctk.CTkCheckBox(
            self.status_container,
            text="Habilitar Sons (Beeps)",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED,
            fg_color=COLOR_ACCENT,
            hover_color=COLOR_ACCENT_HOVER,
            border_color=COLOR_BORDER,
            border_width=2,
            command=self.toggle_sound
        )
        self.cb_sound.grid(row=0, column=1, sticky="e")
        
        # Inicializa o estado visual do botão de salvar
        self.update_save_button_state()
        
        # Toca som de inicialização do sistema
        play_sound_async("boot")

    def toggle_sound(self):
        """Liga/desliga os sons baseados no checkbox."""
        import gui.widgets as widgets
        widgets.SOUND_ENABLED = self.cb_sound.get()
        if widgets.SOUND_ENABLED:
            play_sound_async("click")

    def on_tab_change(self):
        """Gatilha som ao trocar de abas."""
        play_sound_async("tab")

    def get_completion_percentage(self) -> int:
        """Calcula o progresso de completude do GDD com base nos campos."""
        data = self.get_all_data()
        
        # Campos de texto principais para contar
        fields_to_check = [
            "game_name", "objective", "story", "world_setting",
            "hero_name", "hero_desc", "hero_skills", "world_mechanics_desc",
            "minions_desc", "bosses_desc", "victory_cond", "defeat_cond"
        ]
        
        filled_count = sum(1 for field in fields_to_check if data.get(field, "").strip())
        
        # Contribuição de listas dinâmicas se preenchidas
        if data.get("controls"):
            filled_count += 1
        if data.get("world_mechanics_selected"):
            filled_count += 1
            
        total_fields = len(fields_to_check) + 2
        percentage = int((filled_count / total_fields) * 100)
        return percentage

    def flash_button(self, button, callback):
        """Cria um feedback de piscar visual tátil ao inverter as cores rapidamente."""
        orig_fg = button.cget("fg_color")
        orig_text = button.cget("text_color")
        
        play_sound_async("click")
        
        # Inverte cor: Ciano de fundo e texto escuro
        button.configure(fg_color=COLOR_ACCENT, text_color="#090a0f")
        
        def restore_and_run():
            button.configure(fg_color=orig_fg, text_color=orig_text)
            callback()
            
        self.after(100, restore_and_run)

    def update_save_button_state(self):
        """Atualiza o Quest Tracker da barra superior e a cor do botão Salvar."""
        try:
            name_filled = bool(self.tab_overview.entry_name.get().strip())
            victory_filled = bool(self.tab_mechanics.text_victory.get_text().strip())
            defeat_filled = bool(self.tab_mechanics.text_defeat.get_text().strip())
            
            # Atualiza o Quest Tracker na Barra superior e o valor da barra
            pct = self.get_completion_percentage()
            self.lbl_progress_tag.configure(text=f"QUEST PROGRESS: {pct}%")
            self.progress_bar.set(pct / 100.0)
            
            if name_filled and victory_filled and defeat_filled:
                # Verde Ciano brilhante (Salvar ativo)
                self.btn_save.configure(
                    fg_color=COLOR_ACCENT,
                    hover_color=COLOR_ACCENT_HOVER,
                    text_color="#090a0f",
                    text="💾 Salvar GDD (Pronto!)"
                )
                self.status_label.configure(
                    text="[ STATUS ] Requisitos básicos preenchidos. Banco de dados pronto para gravação.",
                    text_color=COLOR_TEXT_PRIMARY
                )
            else:
                # Vermelho/Cinza (Incompleto)
                self.btn_save.configure(
                    fg_color="#181a24",
                    hover_color="#272b3c",
                    text_color="#5f6c8d",
                    text="💾 Salvar GDD (Incompleto)"
                )
                self.status_label.configure(
                    text="[ STATUS ] Preencha Título, Vitória e Derrota para desbloquear gravação.",
                    text_color=COLOR_TEXT_MUTED
                )
        except AttributeError:
            pass

    def get_all_data(self) -> dict:
        """Coleta dados de todas as abas e retorna em um único dicionário."""
        data = {}
        data.update(self.tab_overview.get_data())
        data.update(self.tab_character.get_data())
        data.update(self.tab_mechanics.get_data())
        return data

    def save_project(self):
        """Coleta, valida e exporta o projeto em arquivo Markdown Híbrido."""
        data = self.get_all_data()
        
        # 1. Validação: Nome do Jogo
        if not data.get("game_name"):
            play_sound_async("warning")
            messagebox.showwarning(
                "Título do Projeto Vazio",
                "Ops! Você esqueceu de definir o Título do Projeto.\n\nPreencha o Nome do Jogo na aba 'Diretrizes do Sistema' para prosseguir!"
            )
            self.tabview.set(self.tab_overview_name)
            self.tab_overview.entry_name.focus()
            return
            
        # 2. Validação: Condição de Vitória
        if not data.get("victory_cond"):
            play_sound_async("warning")
            messagebox.showwarning(
                "Condição de Vitória Ausente",
                "Seu jogo precisa de uma Condição de Vitória para que o herói possa concluir a Quest!\n\nPreencha este campo na aba 'Regras & Ameaças'."
            )
            self.tabview.set(self.tab_mechanics_name)
            self.tab_mechanics.text_victory.focus()
            return

        # 3. Validação: Condição de Derrota
        if not data.get("defeat_cond"):
            play_sound_async("warning")
            messagebox.showwarning(
                "Condição de Derrota Ausente",
                "Seu jogo precisa de uma Condição de Derrota para determinar o Game Over!\n\nPreencha este campo na aba 'Regras & Ameaças'."
            )
            self.tabview.set(self.tab_mechanics_name)
            self.tab_mechanics.text_defeat.focus()
            return
            
        # Pede o local para salvar o arquivo Markdown (.md)
        md_path = filedialog.asksaveasfilename(
            title="Salvar GDD Híbrido (.md)",
            defaultextension=".md",
            filetypes=[("Documento GDD Híbrido (*.md)", "*.md")],
            initialfile=f"GDD_{data['game_name'].replace(' ', '_')}.md"
        )
        
        if not md_path:
            return  # Usuário cancelou
            
        try:
            document_manager.save_document(data, md_path)
            play_sound_async("success")
            
            # Atualiza status e mostra sucesso
            self.status_label.configure(
                text=f"[ STATUS ] Documento '{os.path.basename(md_path)}' gravado com sucesso!",
                text_color="#00ff66"
            )
            
            messagebox.showinfo(
                "Quest Concluída & Salva!",
                f"GDD salvo com sucesso!\n\n"
                f"👉 {os.path.basename(md_path)}\n\n"
                f"Os dados estruturados do seu projeto foram gravados ocultamente no topo do arquivo Markdown. "
                f"Você pode reabri-lo neste gerador quando quiser!"
            )
        except Exception as e:
            play_sound_async("warning")
            messagebox.showerror(
                "Falha ao Gravar",
                f"Ocorreu um erro ao salvar o arquivo:\n\n{str(e)}"
            )

    def load_project(self):
        """Abre e carrega dados de um arquivo GDD Híbrido (.md) ou legado (.json)."""
        file_path = filedialog.askopenfilename(
            title="Carregar GDD / Projeto",
            filetypes=[("Arquivos de Projeto GDD (*.md, *.json)", "*.md;*.json")]
        )
        
        if not file_path:
            return  # Cancelado pelo usuário
            
        try:
            data = document_manager.load_document(file_path)
            
            # Popula cada uma das abas
            self.tab_overview.set_data(data)
            self.tab_character.set_data(data)
            self.tab_mechanics.set_data(data)
            
            # Vai para a primeira aba e informa sucesso
            self.tabview.set(self.tab_overview_name)
            
            play_sound_async("success")
            
            # Atualiza o estado visual do botão e status
            self.update_save_button_state()
            
            messagebox.showinfo(
                "Projeto Restaurado",
                f"O GDD do jogo '{data.get('game_name')}' foi carregado com sucesso!\nVocê já pode continuar editando."
            )
        except Exception as e:
            play_sound_async("warning")
            messagebox.showerror(
                "Erro ao Carregar",
                f"Não foi possível abrir o arquivo selecionado:\n\n{str(e)}"
            )

    def new_document(self):
        """Limpa todo o formulário para um novo planejamento."""
        confirm = messagebox.askyesno(
            "Reiniciar Quest",
            "Tem certeza que deseja começar um novo GDD? Todos os campos preenchidos e não salvos serão limpos!"
        )
        if confirm:
            self.tab_overview.clear()
            self.tab_character.clear()
            self.tab_mechanics.clear()
            
            self.tabview.set(self.tab_overview_name)
            self.update_save_button_state()
            self.tab_overview.entry_name.focus()
