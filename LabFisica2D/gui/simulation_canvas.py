import tkinter as tk
import customtkinter as ctk
from config import *

class SimulationCanvas(ctk.CTkCanvas):
    def __init__(self, parent, columns=20, rows=15, **kwargs):
        self.columns = columns
        self.rows = rows
        self.width = columns * GRID_SIZE
        self.height = rows * GRID_SIZE
        
        # O chão começa na linha 13 (as linhas 13 e 14 são terra/solo)
        self.ground_row = 13
        self.ground_y = self.ground_row * GRID_SIZE
        
        # Inicializa o canvas com dimensões exatas e borda visível para destaque
        super().__init__(
            parent,
            width=self.width,
            height=self.height,
            bg=COLOR_CANVAS_BG,
            highlightthickness=1,
            highlightbackground=COLOR_BORDER,
            **kwargs
        )
        
        # Conjunto de obstáculos representados por (col, row)
        self.obstacles = set()
        
        # Binds de interação com o Mouse para Level Design
        self.bind("<Button-1>", self._on_draw_click)
        self.bind("<B1-Motion>", self._on_draw_click)
        self.bind("<Button-3>", self._on_erase_click)
        self.bind("<B3-Motion>", self._on_erase_click)
        self.bind("<Button-2>", self._on_erase_click)  # Botão do meio/scroll como alternativa
        self.bind("<B2-Motion>", self._on_erase_click)
        
        # Bind de redimensionamento dinâmico
        self.bind("<Configure>", self._on_resize)

    def _on_resize(self, event):
        """Redimensiona dinamicamente a grade de acordo com o tamanho real da janela."""
        new_width = event.width
        new_height = event.height
        
        if new_width <= 1 or new_height <= 1:
            return
            
        # Calcula quantas colunas e linhas cabem na área visível
        new_cols = new_width // GRID_SIZE
        new_rows = new_height // GRID_SIZE
        
        # Mantém limites mínimos seguros para a grade (evita valores negativos ou muito pequenos)
        self.columns = max(10, new_cols)
        self.rows = max(8, new_rows)
        
        # Atualiza dimensões virtuais para renderização da grade
        self.width = self.columns * GRID_SIZE
        self.height = self.rows * GRID_SIZE
        
        # O chão fica sempre nas duas últimas linhas
        self.ground_row = self.rows - 2
        self.ground_y = self.ground_row * GRID_SIZE

    def clear_obstacles(self):
        """Limpa todos os blocos desenhados pelo usuário."""
        self.obstacles.clear()
        self.redraw_static()

    def _on_draw_click(self, event):
        """Adiciona um bloco obstáculo na coordenada clicada."""
        col = event.x // GRID_SIZE
        row = event.y // GRID_SIZE
        
        # Só permite desenhar dentro dos limites e acima do chão principal
        if 0 <= col < self.columns and 0 <= row < self.ground_row:
            self.obstacles.add((col, row))
            
    def _on_erase_click(self, event):
        """Remove o bloco obstáculo na coordenada clicada."""
        col = event.x // GRID_SIZE
        row = event.y // GRID_SIZE
        
        if (col, row) in self.obstacles:
            self.obstacles.remove((col, row))

    def redraw_static(self):
        """Método auxiliar que pode ser chamado se quisermos forçar o redesenho externo."""
        pass

    def draw_frame(self, player_x: float, player_y: float, is_grounded: bool, player_physics):
        """Redesenha a simulação completa (roda no game loop principal)."""
        self.delete("all")
        
        # 1. Desenhar a Grade (Grid)
        for c in range(self.columns + 1):
            x_pos = c * GRID_SIZE
            self.create_line(x_pos, 0, x_pos, self.height, fill=COLOR_GRID)
        for r in range(self.rows + 1):
            y_pos = r * GRID_SIZE
            self.create_line(0, y_pos, self.width, y_pos, fill=COLOR_GRID)
            
        # 2. Desenhar o Solo Principal (Chão verde)
        self.create_rectangle(
            0, self.ground_y,
            self.width, self.height,
            fill=COLOR_GROUND,
            outline=COLOR_BORDER,
            width=1
        )
        
        # 3. Desenhar os Obstáculos colocados pelo usuário
        for (col, row) in self.obstacles:
            self.create_rectangle(
                col * GRID_SIZE, row * GRID_SIZE,
                (col + 1) * GRID_SIZE, (row + 1) * GRID_SIZE,
                fill=COLOR_OBSTACLE,
                outline=COLOR_BORDER,
                width=1
            )
            
        # 4. Desenhar as Métricas do Pulo
        # Determina se estamos pulando ou se mostramos o último pulo completo
        peak_y = None
        start_x = None
        land_x = None
        arc = []
        
        if player_physics.is_jumping:
            peak_y = player_physics.jump_peak_y
            start_x = player_physics.jump_start_x
            arc = player_physics.arc_points
        elif player_physics.last_jump_peak_y is not None:
            peak_y = player_physics.last_jump_peak_y
            start_x = player_physics.last_jump_start_x
            land_x = player_physics.last_jump_land_x
            arc = player_physics.last_arc_points
            
        # A. Desenhar Arco do Pulo
        if len(arc) > 1:
            # Conecta todos os pontos do arco
            self.create_line(
                arc,
                fill=COLOR_ARC_LINE,
                width=2,
                smooth=True,
                arrow=tk.LAST,
                arrowshape=(8, 10, 3)
            )
            
        # B. Desenhar Linha Horizontal de Pico com rótulo
        if peak_y is not None:
            # Desenha linha pontilhada vermelha
            self.create_line(
                0, peak_y + GRID_SIZE,  # Mede com base na base do player (pé do bloco)
                self.width, peak_y + GRID_SIZE,
                fill=COLOR_PEAK_LINE,
                dash=(4, 4),
                width=1.5
            )
            # Calcula a altura em blocos de 32px
            height_pixels = self.ground_y - (peak_y + GRID_SIZE)
            height_blocks = height_pixels / GRID_SIZE
            
            # Desenha a etiqueta de texto explicativa no canto
            self.create_text(
                15, peak_y + GRID_SIZE - 10,
                text=f"Altura Pico: {height_blocks:.2f} blocos ({int(height_pixels)}px)",
                font=FONT_HINT,
                fill=COLOR_PEAK_LINE,
                anchor="w"
            )
            
        # C. Desenhar Medidor de Alcance Horizontal (Distância do salto)
        if start_x is not None:
            # Se ainda está pulando, mede a distância até o X atual. Se pousou, mede até o land_x
            current_x = player_physics.x + GRID_SIZE / 2.0 if player_physics.is_jumping else land_x
            
            if current_x is not None and abs(current_x - start_x) > 2:
                # Desenha linha de alcance amarela na altura do chão
                self.create_line(
                    start_x, self.ground_y - 6,
                    current_x, self.ground_y - 6,
                    fill=COLOR_ARC_LINE,
                    width=2
                )
                self.create_oval(start_x - 3, self.ground_y - 9, start_x + 3, self.ground_y - 3, fill=COLOR_ARC_LINE, outline="")
                self.create_oval(current_x - 3, self.ground_y - 9, current_x + 3, self.ground_y - 3, fill=COLOR_ARC_LINE, outline="")
                
                dist_pixels = abs(current_x - start_x)
                dist_blocks = dist_pixels / GRID_SIZE
                
                # Desenha o texto do alcance no meio da linha
                mid_x = (start_x + current_x) / 2.0
                self.create_text(
                    mid_x, self.ground_y - 20,
                    text=f"Alcance: {dist_blocks:.2f} bl",
                    font=FONT_HINT,
                    fill=COLOR_ARC_LINE,
                    anchor="center"
                )

        # 5. Desenhar o Bloco do Jogador
        self.create_rectangle(
            player_x, player_y,
            player_x + GRID_SIZE, player_y + GRID_SIZE,
            fill=COLOR_PLAYER,
            outline=COLOR_TEXT_PRIMARY,
            width=1.5
        )
        
        # Detalhe visual (olhos simples para saber a direção)
        # Olhos apontando na direção que ele se move
        eye_y = player_y + 10
        if player_physics.hsp >= 0:
            self.create_rectangle(player_x + 18, eye_y, player_x + 22, eye_y + 6, fill="#121217", outline="")
            self.create_rectangle(player_x + 24, eye_y, player_x + 28, eye_y + 6, fill="#121217", outline="")
        else:
            self.create_rectangle(player_x + 4, eye_y, player_x + 8, eye_y + 6, fill="#121217", outline="")
            self.create_rectangle(player_x + 10, eye_y, player_x + 14, eye_y + 6, fill="#121217", outline="")
            
        # Instruções de ajuda flutuantes no topo do Canvas
        self.create_text(
            10, 15,
            text="Setas: Mover | Espaço: Pular",
            font=FONT_HINT,
            fill=COLOR_TEXT_MUTED,
            anchor="w"
        )
        self.create_text(
            10, 32,
            text="Botão Esquerdo Mouse: Desenhar Blocos | Botão Direito: Apagar",
            font=FONT_HINT,
            fill=COLOR_TEXT_MUTED,
            anchor="w"
        )
