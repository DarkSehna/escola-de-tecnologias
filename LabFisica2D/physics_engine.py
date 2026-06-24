import math
from config import GRID_SIZE

class PlayerPhysics:
    def __init__(self, start_x=64, start_y=320):
        # Posição inicial (canto superior esquerdo do bloco 32x32)
        self.x = float(start_x)
        self.y = float(start_y)
        
        # Velocidades atuais (Horizontal e Vertical)
        self.hsp = 0.0
        self.vsp = 0.0
        
        # Estado de colisão com o solo (Grounded)
        self.is_grounded = False
        
        # Rastreamento de Salto (Para métricas de Level Design)
        self.is_jumping = False
        self.jump_start_x = 0.0
        self.jump_peak_y = float(start_y)
        self.jump_land_x = 0.0
        
        # Histórico de pontos para desenhar o arco do pulo
        self.arc_points = []
        
        # Histórico fixado (último salto concluído)
        self.last_jump_peak_y = None
        self.last_jump_start_x = None
        self.last_jump_land_x = None
        self.last_arc_points = []

    def reset(self, start_x, start_y):
        """Reinicia o jogador e limpa métricas de saltos."""
        self.x = float(start_x)
        self.y = float(start_y)
        self.hsp = 0.0
        self.vsp = 0.0
        self.is_grounded = False
        self.is_jumping = False
        self.arc_points.clear()
        
        self.last_jump_peak_y = None
        self.last_jump_start_x = None
        self.last_jump_land_x = None
        self.last_arc_points.clear()

    def update(self, keys: dict, grv_int: float, jump_int: float, speed_int: float,
               accel_ground_int: float, fric_ground_int: float,
               accel_air_int: float, fric_air_int: float, max_fall_int: float,
               obstacles: set, ground_y: float, columns: int, rows: int):
        """
        Executa um tick físico (1 frame).
        Calcula a física de plataforma usando o modelo customizado (aceleração/atrito no ar e no chão).
        """
        # Garante que o jogador não fique afundado abaixo do solo principal (ex: após redimensionamento)
        if self.y + GRID_SIZE > ground_y:
            self.y = ground_y - GRID_SIZE
            self.vsp = 0.0
            self.is_grounded = True

        # --- 1. Determina constantes de aceleração/atrito com base no estado do jogador ---
        if self.is_grounded:
            accel = accel_ground_int
            fric = fric_ground_int
        else:
            accel = accel_air_int
            fric = fric_air_int

        # --- 2. Movimentação Horizontal (Aceleração Dinâmica e Fricção de Parada) ---
        move = 0
        if keys.get("right", False):
            move += 1
        if keys.get("left", False):
            move -= 1
            
        if move != 0:
            # Acelera na direção do input
            self.hsp += move * accel
        else:
            # Aplica atrito (fricção) para frear gradativamente
            if abs(self.hsp) < fric:
                self.hsp = 0.0
            else:
                # Retorna em direção a zero
                self.hsp -= math.copysign(fric, self.hsp)

        # Clampa a velocidade horizontal dentro do limite máximo (moveSpeed)
        self.hsp = max(-speed_int, min(self.hsp, speed_int))

        # --- 3. Movimentação Vertical (Gravidade & Pulo) ---
        if not self.is_grounded:
            # Aplica gravidade acelerando para baixo
            self.vsp += grv_int
            # Clampa a velocidade máxima de queda (maxFallSpeed/Velocidade Terminal)
            self.vsp = min(self.vsp, max_fall_int)
        else:
            self.vsp = 0.0
            # Se pressionar pulo e estiver no chão, aplica impulso para cima
            if keys.get("jump", False):
                self.vsp = jump_int  # Impulso de pulo interno é negativo (para cima)
                self.is_grounded = False
                
                # Inicia o rastreamento gráfico do pulo
                self.is_jumping = True
                self.jump_start_x = self.x + GRID_SIZE / 2.0
                self.jump_peak_y = self.y
                self.arc_points = [(self.jump_start_x, self.y + GRID_SIZE / 2.0)]

        # --- 4. Rastreia a Trajetória do Salto ---
        if self.is_jumping:
            # Rastreia o ponto mais alto (Y menor = maior altura física)
            if self.y < self.jump_peak_y:
                self.jump_peak_y = self.y
            self.arc_points.append((self.x + GRID_SIZE / 2.0, self.y + GRID_SIZE / 2.0))

        # --- 5. Resolução de Colisões Horizontais (AABB) ---
        new_x = self.x + self.hsp
        
        # Restringe X aos limites laterais da tela de simulação
        screen_width = columns * GRID_SIZE
        if new_x < 0:
            new_x = 0.0
            self.hsp = 0.0
        elif new_x + GRID_SIZE > screen_width:
            new_x = screen_width - GRID_SIZE
            self.hsp = 0.0

        if self.place_meeting(new_x, self.y, obstacles, ground_y):
            # Há colisão horizontal: aproxima pixel por pixel
            step = math.copysign(1.0, self.hsp)
            while not self.place_meeting(self.x + step, self.y, obstacles, ground_y):
                self.x += step
            self.hsp = 0.0
        else:
            self.x = new_x

        # --- 6. Resolução de Colisões Verticais (AABB) ---
        new_y = self.y + self.vsp

        if self.place_meeting(self.x, new_y, obstacles, ground_y):
            # Há colisão vertical: aproxima pixel por pixel
            step = math.copysign(1.0, self.vsp)
            while not self.place_meeting(self.x, self.y + step, obstacles, ground_y):
                self.y += step
            
            # Se colidiu caindo (vsp > 0), toca o chão
            if self.vsp > 0:
                self.is_grounded = True
                
                # Se estava pulando, encerra o pulo e fixa os marcadores
                if self.is_jumping:
                    self.is_jumping = False
                    self.jump_land_x = self.x + GRID_SIZE / 2.0
                    
                    # Salva dados do último pulo completo para visualização estática
                    self.last_jump_peak_y = self.jump_peak_y
                    self.last_jump_start_x = self.jump_start_x
                    self.last_jump_land_x = self.jump_land_x
                    self.last_arc_points = list(self.arc_points)
            self.vsp = 0.0
        else:
            self.y = new_y
            
        # --- 7. Checa se o jogador caiu de uma plataforma ---
        if self.is_grounded and not self.place_meeting(self.x, self.y + 1.0, obstacles, ground_y):
            self.is_grounded = False

    def place_meeting(self, check_x: float, check_y: float, obstacles: set, ground_y: float) -> bool:
        """
        Retorna True se a caixa de colisão do jogador nas coordenadas informadas
        colidir com o chão ou com algum bloco obstáculo.
        """
        # Solo principal
        if check_y + GRID_SIZE > ground_y:
            return True
            
        # Limites das caixas do jogador
        p_left = check_x
        p_right = check_x + GRID_SIZE
        p_top = check_y
        p_bottom = check_y + GRID_SIZE
        
        # Colisão com blocos desenhados
        for (col, row) in obstacles:
            o_left = col * GRID_SIZE
            o_right = (col + 1) * GRID_SIZE
            o_top = row * GRID_SIZE
            o_bottom = (row + 1) * GRID_SIZE
            
            # Sobreposição AABB
            if (p_left < o_right and p_right > o_left and
                p_top < o_bottom and p_bottom > o_top):
                return True
                
        return False
