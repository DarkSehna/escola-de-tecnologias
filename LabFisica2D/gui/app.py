import os
import customtkinter as ctk
from tkinter import messagebox

from config import *
from physics_engine import PlayerPhysics
from gui.simulation_canvas import SimulationCanvas

class PhysicsLabApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        
        # Configuração da Janela - Inicia Maximizada por padrão
        self.title("Laboratório de Física 2D e Level Design")
        self.geometry("1100x720")
        self.minsize(980, 680)
        self.configure(fg_color=COLOR_BG_DARK)
        
        try:
            self.state("zoomed")  # Maximiza no Windows/Linux
            self.update()         # Força atualização imediata da janela maximizada
        except Exception:
            pass
        
        # Teclado (Estado das teclas)
        self.keys = {"left": False, "right": False, "jump": False}
        
        # Instanciação do Motor de Física
        self.player_physics = PlayerPhysics(start_x=64, start_y=320)
        
        # Controle de Slow Motion
        self.slow_motion_counter = 0
        
        # Bind de Teclado Global
        self.bind("<KeyPress>", self._on_key_press)
        self.bind("<KeyRelease>", self._on_key_release)
        
        # --- LAYOUT PRINCIPAL (2 Colunas) ---
        self.grid_columnconfigure(0, weight=1)  # Canvas + Toolbar (Esquerda)
        self.grid_columnconfigure(1, weight=0)  # Painel de Controle (Direita)
        self.grid_rowconfigure(0, weight=1)
        
        # --- COLUNA ESQUERDA: Simulação ---
        self.left_frame = ctk.CTkFrame(self, fg_color="transparent")
        self.left_frame.grid(row=0, column=0, sticky="nsew", padx=(20, 10), pady=20)
        self.left_frame.grid_columnconfigure(0, weight=1)
        self.left_frame.grid_rowconfigure(0, weight=1)   # Canvas
        self.left_frame.grid_rowconfigure(1, weight=0)   # Toolbar
        
        # 1. Canvas de Simulação (Configurado para esticar em tela cheia)
        self.canvas = SimulationCanvas(self.left_frame, columns=20, rows=15)
        self.canvas.grid(row=0, column=0, sticky="nsew", pady=(0, 10))
        
        # 2. Barra de Ferramentas Inferior (Toolbar)
        self.toolbar = ctk.CTkFrame(self.left_frame, fg_color=COLOR_BG_CARD, border_color=COLOR_BORDER, border_width=1, height=50)
        self.toolbar.grid(row=1, column=0, sticky="ew")
        self.toolbar.pack_propagate(False)
        
        # Switch Câmera Lenta
        self.switch_slow = ctk.CTkSwitch(
            self.toolbar,
            text="Câmera Lenta (0.25x)",
            font=FONT_LABEL,
            progress_color=COLOR_ACCENT,
            text_color=COLOR_TEXT_PRIMARY
        )
        self.switch_slow.pack(side="left", padx=15, pady=10)
        
        # Botão: Reiniciar Bloco
        self.btn_reset_player = ctk.CTkButton(
            self.toolbar,
            text="🔄 Reiniciar Bloco",
            font=FONT_LABEL,
            fg_color="transparent",
            text_color=COLOR_TEXT_PRIMARY,
            border_color=COLOR_BORDER,
            border_width=1,
            hover_color=COLOR_BORDER,
            width=130,
            command=self.reset_player
        )
        self.btn_reset_player.pack(side="right", padx=10, pady=8)
        
        # Botão: Limpar Obstáculos
        self.btn_clear_canvas = ctk.CTkButton(
            self.toolbar,
            text="🧹 Limpar Desenhos",
            font=FONT_LABEL,
            fg_color="transparent",
            text_color="#ff5555",
            border_color="#5a2c2c",
            border_width=1,
            hover_color="#3a1c1c",
            width=140,
            command=self.canvas.clear_obstacles
        )
        self.btn_clear_canvas.pack(side="right", padx=5, pady=8)
        
        # --- COLUNA DIREITA: Painel de Controle ---
        self.right_frame = ctk.CTkFrame(self, fg_color=COLOR_BG_CARD, border_color=COLOR_BORDER, border_width=1, width=340)
        self.right_frame.grid(row=0, column=1, sticky="ns", padx=(10, 20), pady=20)
        self.right_frame.grid_propagate(False)
        self.right_frame.grid_columnconfigure(0, weight=1)
        self.right_frame.grid_rowconfigure(5, weight=1)  # O container de inputs ocupa o espaço livre
        
        # Título
        self.panel_title = ctk.CTkLabel(
            self.right_frame,
            text="⚙️ CONTROLES FÍSICOS",
            font=FONT_TITLE,
            text_color=COLOR_ACCENT
        )
        self.panel_title.grid(row=0, column=0, sticky="w", padx=20, pady=(20, 5))
        
        # Seletor de Engine
        self.lbl_engine = ctk.CTkLabel(self.right_frame, text="Motor de Jogo (Preset)", font=FONT_LABEL, text_color=COLOR_TEXT_PRIMARY)
        self.lbl_engine.grid(row=1, column=0, sticky="w", padx=20, pady=(15, 2))
        
        self.combo_engine = ctk.CTkComboBox(
            self.right_frame,
            values=list(ENGINE_PRESETS.keys()),
            font=FONT_TEXT,
            dropdown_font=FONT_TEXT,
            border_color=COLOR_BORDER,
            button_color=COLOR_BORDER,
            button_hover_color=COLOR_BORDER,
            command=self.on_engine_change
        )
        self.combo_engine.grid(row=2, column=0, sticky="ew", padx=20, pady=(0, 2))
        self.combo_engine.set("GameMaker")
        
        # Descrição da Engine
        self.lbl_engine_desc = ctk.CTkLabel(
            self.right_frame,
            text="",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED,
            wraplength=290,
            justify="left"
        )
        self.lbl_engine_desc.grid(row=3, column=0, sticky="w", padx=20, pady=(2, 10))
        
        # Separador
        self.sep = ctk.CTkFrame(self.right_frame, height=2, fg_color=COLOR_BORDER)
        self.sep.grid(row=4, column=0, sticky="ew", padx=15, pady=10)
        
        # Container de Inputs Rolável (Evita quebrar o layout em telas menores)
        self.inputs_container = ctk.CTkScrollableFrame(
            self.right_frame,
            fg_color="transparent",
            scrollbar_button_color=COLOR_BORDER,
            scrollbar_button_hover_color=COLOR_ACCENT
        )
        self.inputs_container.grid(row=5, column=0, sticky="nsew", padx=10, pady=5)
        self.inputs_container.grid_columnconfigure(0, weight=1)
        
        # Criação dos Inputs Físicos para os 8 parâmetros customizados
        self.physics_inputs = {}
        self._create_input_row("gravity", "Gravidade (grv)", 0)
        self._create_input_row("jump", "Força do Pulo (jspd)", 1)
        self._create_input_row("speed", "Velocidade Máxima (moveSpeed)", 2)
        self._create_input_row("accelGround", "Aceleração Chão (accelGround)", 3)
        self._create_input_row("frictionGround", "Atrito Chão (frictionGround)", 4)
        self._create_input_row("accelAir", "Aceleração Ar (accelAir)", 5)
        self._create_input_row("frictionAir", "Atrito Ar (frictionAir)", 6)
        self._create_input_row("maxFallSpeed", "Vel. Queda Máx (maxFallSpeed)", 7)
        
        # Botão Copiar Variáveis
        self.btn_copy = ctk.CTkButton(
            self.right_frame,
            text="📋 COPIAR VARIÁVEIS",
            font=FONT_LABEL,
            fg_color=COLOR_ACCENT,
            hover_color=COLOR_ACCENT_HOVER,
            text_color=COLOR_BG_DARK,
            height=45,
            command=self.copy_variables
        )
        self.btn_copy.grid(row=6, column=0, sticky="ew", padx=20, pady=(15, 20))
        
        # Inicializa com base no preset padrão
        self.on_engine_change("GameMaker")
        
        # Iniciar o Game Loop
        self.game_loop()

    def _create_input_row(self, key, label_text, row_idx):
        """Cria uma linha contendo Nome, Padrão Clicável e a Caixa de escrita."""
        frame = ctk.CTkFrame(self.inputs_container, fg_color="transparent")
        frame.grid(row=row_idx, column=0, sticky="ew", pady=5)
        frame.grid_columnconfigure(0, weight=1)
        
        header_frame = ctk.CTkFrame(frame, fg_color="transparent")
        header_frame.pack(fill="x", pady=(0, 2))
        
        lbl_name = ctk.CTkLabel(header_frame, text=label_text, font=FONT_LABEL, text_color=COLOR_TEXT_PRIMARY)
        lbl_name.pack(side="left")
        
        # Rótulo de padrão clicável
        lbl_default = ctk.CTkLabel(
            header_frame,
            text="Padrão: 0.0",
            font=FONT_HINT,
            text_color=COLOR_TEXT_MUTED,
            cursor="hand2"
        )
        lbl_default.pack(side="right")
        
        # Campo de entrada de escrita
        entry = ctk.CTkEntry(
            frame,
            font=FONT_TEXT,
            border_color=COLOR_BORDER,
            height=30
        )
        entry.pack(fill="x")
        
        # Vincula clique do mouse para restaurar valor padrão
        lbl_default.bind("<Button-1>", lambda e, k=key: self.reset_to_default(k))
        
        self.physics_inputs[key] = {
            "entry": entry,
            "label_default": lbl_default,
            "display_name": label_text
        }

    def reset_to_default(self, key):
        """Restaura o valor de escrita para o padrão do motor selecionado."""
        engine = self.combo_engine.get()
        preset = ENGINE_PRESETS[engine]
        default_val = preset[key]["default"]
        
        entry = self.physics_inputs[key]["entry"]
        entry.delete(0, "end")
        
        # Formatação limpa dependendo do motor
        if engine == "Construct 3":
            entry.insert(0, f"{int(default_val)}")
        elif engine == "Scratch" and key in ["frictionGround", "frictionAir"]:
            entry.insert(0, f"{default_val:.2f}")
        elif engine == "Scratch":
            entry.insert(0, f"{default_val:.1f}")
        else:
            if key in ["gravity", "accelGround", "frictionGround", "accelAir", "frictionAir"]:
                entry.insert(0, f"{default_val:.2f}")
            else:
                entry.insert(0, f"{default_val:.1f}")
                
        entry.configure(border_color=COLOR_BORDER)

    def on_engine_change(self, event=None):
        """Atualiza rótulos padrão e preenche campos ao alterar motor."""
        engine = self.combo_engine.get()
        preset = ENGINE_PRESETS[engine]
        
        self.lbl_engine_desc.configure(text=preset["description"])
        
        for key in ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"]:
            default_val = preset[key]["default"]
            lbl_def = self.physics_inputs[key]["label_default"]
            
            # Formatação do rótulo padrão
            if engine == "Construct 3":
                lbl_def.configure(text=f"Padrão: {int(default_val)}")
            elif engine == "Scratch" and key in ["frictionGround", "frictionAir"]:
                lbl_def.configure(text=f"Padrão: {default_val:.2f}")
            else:
                lbl_def.configure(text=f"Padrão: {default_val:.2f}")
                
            self.reset_to_default(key)
            
        self.reset_player()

    def get_converted_physics_values(self) -> tuple:
        """
        Lê e valida os 8 campos de escrita.
        Se houver valor inválido, altera a borda para Vermelho e utiliza
        temporariamente o valor padrão para evitar falha na simulação.
        """
        engine = self.combo_engine.get()
        preset = ENGINE_PRESETS[engine]
        
        parsed_vals = {}
        for key in ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"]:
            entry_widget = self.physics_inputs[key]["entry"]
            default_val = preset[key]["default"]
            
            try:
                val_str = entry_widget.get().strip()
                if not val_str:
                    val = default_val
                else:
                    val = float(val_str)
                
                # Otimização: Só atualiza a borda se ela não estiver na cor padrão
                if entry_widget.cget("border_color") != COLOR_BORDER:
                    entry_widget.configure(border_color=COLOR_BORDER)
            except ValueError:
                # Se for inválido, destaca a caixa em Vermelho e usa fallback seguro
                if entry_widget.cget("border_color") != COLOR_ERROR:
                    entry_widget.configure(border_color=COLOR_ERROR)
                val = default_val
                
            parsed_vals[key] = val
            
        grv = parsed_vals["gravity"]
        jump = parsed_vals["jump"]
        speed = parsed_vals["speed"]
        accel_g = parsed_vals["accelGround"]
        fric_g = parsed_vals["frictionGround"]
        accel_a = parsed_vals["accelAir"]
        fric_a = parsed_vals["frictionAir"]
        max_fall = parsed_vals["maxFallSpeed"]
        
        # Conversão de escalas do motor ativo para a simulação física interna (GameMaker)
        if engine == "GameMaker":
            return grv, jump, speed, accel_g, fric_g, accel_a, fric_a, max_fall
            
        elif engine == "Construct 3":
            # Converte Construct 3 (Platform) para unidades internas por frame
            grv_int = grv / 3600.0
            jump_int = -jump / 60.0         # Pulo Construct é positivo, GM é negativo
            speed_int = speed / 60.0
            accel_g_int = accel_g / 3600.0
            fric_g_int = fric_g / 3600.0
            accel_a_int = accel_a / 3600.0
            fric_a_int = fric_a / 3600.0
            max_fall_int = max_fall / 60.0
            return grv_int, jump_int, speed_int, accel_g_int, fric_g_int, accel_a_int, fric_a_int, max_fall_int
            
        elif engine == "Scratch":
            # Converte Scratch para unidades internas por frame
            grv_int = -grv / 3.0            # Scratch usa gravidade negativa
            jump_int = -jump / 1.5          # Scratch usa pulo positivo
            speed_int = speed / 1.8
            accel_g_int = accel_g / 2.0
            fric_g_int = (1.0 - fric_g) / 0.5
            accel_a_int = accel_a / 2.0
            fric_a_int = (1.0 - fric_a) / 0.5
            max_fall_int = -max_fall / 1.25 # Scratch usa queda limite negativa
            return grv_int, jump_int, speed_int, accel_g_int, fric_g_int, accel_a_int, fric_a_int, max_fall_int
            
        return 0.3, -7.0, 4.0, 0.35, 0.15, 0.20, 0.05, 12.0

    def reset_player(self):
        """Reinicia o bloco do jogador para a plataforma de teste."""
        start_x = 2 * GRID_SIZE
        start_y = self.canvas.ground_y - 3 * GRID_SIZE
        self.player_physics.reset(start_x, start_y)

    def _on_key_press(self, event):
        key = event.keysym.lower()
        if key in ["left", "a"]:
            self.keys["left"] = True
        elif key in ["right", "d"]:
            self.keys["right"] = True
        elif key in ["space", "up", "w"]:
            self.keys["jump"] = True

    def _on_key_release(self, event):
        key = event.keysym.lower()
        if key in ["left", "a"]:
            self.keys["left"] = False
        elif key in ["right", "d"]:
            self.keys["right"] = False
        elif key in ["space", "up", "w"]:
            self.keys["jump"] = False

    def copy_variables(self):
        """Gera o código formatado do preset atual com os dados da escrita e copia."""
        engine = self.combo_engine.get()
        preset = ENGINE_PRESETS[engine]
        
        # Validação final antes da cópia
        vals = {}
        for key in ["gravity", "jump", "speed", "accelGround", "frictionGround", "accelAir", "frictionAir", "maxFallSpeed"]:
            entry = self.physics_inputs[key]["entry"]
            try:
                vals[key] = float(entry.get().strip())
            except ValueError:
                messagebox.showwarning(
                    "Valor Inválido",
                    f"O campo '{self.physics_inputs[key]['display_name']}' contém um valor inválido.\n"
                    f"Por favor, corrija antes de copiar."
                )
                entry.focus()
                return
                
        # Formata o template
        code = preset["code_template"].format(
            gravity=vals["gravity"],
            jump=vals["jump"],
            speed=vals["speed"],
            accelGround=vals["accelGround"],
            frictionGround=vals["frictionGround"],
            accelAir=vals["accelAir"],
            frictionAir=vals["frictionAir"],
            maxFallSpeed=vals["maxFallSpeed"]
        )
        
        try:
            self.clipboard_clear()
            self.clipboard_append(code)
            self.update()
            
            messagebox.showinfo(
                "Variáveis Copiadas!",
                f"Código copiado no formato para a engine {preset['title']}!\n\n"
                f"Você já pode colá-lo na sua engine de desenvolvimento."
            )
        except Exception as e:
            messagebox.showerror(
                "Erro ao copiar",
                f"Não foi possível acessar a área de transferência:\n\n{str(e)}"
            )

    def game_loop(self):
        """Game Loop principal da física e renderização rodando a 60 FPS."""
        # Captura as variáveis físicas atuais validadas e convertidas
        (grv_int, jump_int, speed_int,
         accel_g_int, fric_g_int,
         accel_a_int, fric_a_int, max_fall_int) = self.get_converted_physics_values()
        
        # Se câmera lenta estiver ativa, só atualiza física 1 a cada 4 frames (0.25x)
        run_physics = True
        if self.switch_slow.get():
            self.slow_motion_counter = (self.slow_motion_counter + 1) % 4
            run_physics = (self.slow_motion_counter == 0)
            
        if run_physics:
            self.player_physics.update(
                keys=self.keys,
                grv_int=grv_int,
                jump_int=jump_int,
                speed_int=speed_int,
                accel_ground_int=accel_g_int,
                fric_ground_int=fric_g_int,
                accel_air_int=accel_a_int,
                fric_air_int=fric_a_int,
                max_fall_int=max_fall_int,
                obstacles=self.canvas.obstacles,
                ground_y=self.canvas.ground_y,
                columns=self.canvas.columns,
                rows=self.canvas.rows
            )
            
        # Redesenha a tela em todos os frames (para manter interações fluidas)
        self.canvas.draw_frame(
            player_x=self.player_physics.x,
            player_y=self.player_physics.y,
            is_grounded=self.player_physics.is_grounded,
            player_physics=self.player_physics
        )
        
        # Próxima chamada em ~16.6ms (60 FPS)
        self.after(16, self.game_loop)
