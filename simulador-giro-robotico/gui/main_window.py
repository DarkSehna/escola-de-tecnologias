# Janela Principal do Simulador
from PySide6.QtWidgets import QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QLabel, QFrame
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QFont
import config
import physics
from gui.config_panel import ConfigPanel
from gui.robot_canvas import RobotCanvas
from gui.programming_panel import ProgrammingPanel
from gui.odometry_hud import OdometryHUD

class MainWindow(QMainWindow):
    """Janela principal gerenciadora do layout mestre (duas colunas + rodapé) do simulador."""
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Simulador de Cinemática Diferencial - Robótica LEGO")
        self.resize(1150, 750)
        self.setMinimumSize(1000, 650)
        
        # Estado de pose atual do robô (em mm e rad)
        self.robot_x = 0.0
        self.robot_y = 0.0
        self.robot_theta = 0.0
        
        # Parâmetros da animação
        self.trajectory_steps = []
        self.current_step_idx = 0
        self.anim_timer = QTimer(self)
        self.anim_timer.timeout.connect(self.on_anim_step)
        
        # Parâmetros do giro em execução
        self.exec_power_l = 0.0
        self.exec_power_r = 0.0
        self.exec_duration = 0.0
        self.exec_max_rpm = 0.0
        self.exec_wheel_dia = 0.0
        self.exec_chassis_width = 0.0
        self.exec_is_tread = False
        
        self.setup_ui()
        self.connect_signals()
        
        # Garante a centralização correta do canvas gráfico logo após renderizar a janela
        QTimer.singleShot(100, lambda: self.canvas.centerOn(0.0, 0.0))
        
    def setup_ui(self):
        # Widget Central Mestre
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.central_widget.setStyleSheet(f"background-color: {config.COLOR_BG};")
        
        # Layout principal da janela
        main_layout = QVBoxLayout(self.central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(10)
        
        # --- 1. CABEÇALHO (Header Estilo CAD) ---
        header_frame = QFrame()
        header_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {config.COLOR_PANEL_BG};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
        """)
        header_layout = QHBoxLayout(header_frame)
        header_layout.setContentsMargins(15, 10, 15, 10)
        
        title_text = QLabel("🤖 SIMULADOR DE CINEMÁTICA DIFERENCIAL (LEGO)")
        title_text.setFont(QFont(config.FONT_FAMILY, 14, QFont.Weight.Bold))
        title_text.setStyleSheet(f"color: {config.COLOR_NEON_CYAN}; border: none; background: transparent;")
        
        subtitle_text = QLabel("Comparador: Graus do Motor vs Graus do Chassi")
        subtitle_text.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
        subtitle_text.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent;")
        subtitle_text.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        
        header_layout.addWidget(title_text)
        header_layout.addStretch()
        header_layout.addWidget(subtitle_text)
        
        main_layout.addWidget(header_frame)
        
        # --- 2. ÁREA DE CONTEÚDO (Middle Row: Sidebar + Canvas) ---
        middle_layout = QHBoxLayout()
        middle_layout.setSpacing(10)
        
        # Painel Lateral de Configurações Físicas
        self.config_panel = ConfigPanel()
        middle_layout.addWidget(self.config_panel)
        
        # Canvas de Simulação
        self.canvas_container = QFrame()
        self.canvas_container.setStyleSheet(f"""
            QFrame {{
                background-color: {config.COLOR_PANEL_BG};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
        """)
        canvas_layout = QVBoxLayout(self.canvas_container)
        canvas_layout.setContentsMargins(2, 2, 2, 2)
        
        self.canvas = RobotCanvas()
        canvas_layout.addWidget(self.canvas)
        middle_layout.addWidget(self.canvas_container, stretch=1)
        main_layout.addLayout(middle_layout, stretch=1)
        
        # --- 3. BARRA INFERIOR (Bottom Row: Programação + HUD) ---
        bottom_layout = QHBoxLayout()
        bottom_layout.setSpacing(10)
        
        # Painel de Programação (Horizontal)
        self.programming_panel = ProgrammingPanel()
        
        # HUD de Odometria (Visores Digitais)
        self.hud = OdometryHUD()
        self.hud.setFixedWidth(440)  # Mantém o HUD compacto à direita
        
        bottom_layout.addWidget(self.programming_panel, stretch=1)
        bottom_layout.addWidget(self.hud, stretch=0)
        main_layout.addLayout(bottom_layout, stretch=0)
        
        # Sincroniza dimensões iniciais do robô na tela
        self.on_physical_params_changed(*self.config_panel.get_physical_params())
        
    def connect_signals(self):
        # Alteração de parâmetros físicos no painel lateral
        self.config_panel.physicalParamsChanged.connect(self.on_physical_params_changed)
        
        # Solicitação de execução do giro
        self.programming_panel.executeRequested.connect(self.on_execute_requested)
        
        # Reset de pose solicitado pelo canvas
        self.canvas.resetRequested.connect(self.on_reset_requested)
        
    def on_physical_params_changed(self, wheel_dia: float, chassis_width: float, is_tread: bool, trace_mode: str):
        """Atualiza a parte gráfica do robô dinamicamente quando mudam os parâmetros."""
        wheel_type = self.config_panel.cmb_wheels.currentText()
        self.canvas.update_robot_dims(wheel_dia, chassis_width, is_tread, wheel_type)
        self.canvas.update_trace_visibility(trace_mode)
        
    def on_execute_requested(self, power_l: float, power_r: float, mode: str, value: float):
        """Prepara e inicia o timer para animar a trajetória cinemática do robô."""
        if self.anim_timer.isActive():
            self.anim_timer.stop()
            
        # Coleta os parâmetros físicos da configuração lateral
        wheel_dia, chassis_width, is_tread, _ = self.config_panel.get_physical_params()
        wheel_type = self.config_panel.cmb_wheels.currentText()
        
        # Prepara um novo rastro com cores do modelo de roda atual
        self.canvas.start_new_trace(wheel_type)
        
        motor_key = self.config_panel.cmb_motor.currentText()
        max_rpm = config.MOTOR_PRESETS[motor_key]
        
        # Calcula o tempo total real em segundos baseado no modo (Segundos, Graus, Rotações)
        duration = physics.calculate_execution_time(power_l, power_r, max_rpm, mode, value)
        
        # Salva parâmetros para cálculo de odometria no loop
        self.exec_power_l = power_l
        self.exec_power_r = power_r
        self.exec_duration = duration
        self.exec_max_rpm = max_rpm
        self.exec_wheel_dia = wheel_dia
        self.exec_chassis_width = chassis_width
        self.exec_is_tread = is_tread
        
        if duration <= 0:
            return  # Nada a simular
            
        # Gera a trajetória precisa passo a passo partindo da pose atual do robô no Canvas
        self.trajectory_steps = physics.calculate_trajectory(
            power_l, power_r, max_rpm, duration, wheel_dia, chassis_width, is_tread,
            num_steps=120, start_x=self.robot_x, start_y=self.robot_y, start_theta=self.robot_theta
        )
        
        self.current_step_idx = 0
        total_steps = len(self.trajectory_steps)
        interval_ms = int((duration * 1000) / total_steps)
        
        # Limita o intervalo para manter a animação visualmente estável
        self.anim_timer.setInterval(max(8, min(80, interval_ms)))
        
        # Desativa o botão de execução temporariamente
        self.programming_panel.btn_execute.setEnabled(False)
        self.programming_panel.btn_execute.setText("SIMULANDO...")
        
        self.anim_timer.start()
        
    def on_anim_step(self):
        """Passo periódico da animação de simulação."""
        if self.current_step_idx < len(self.trajectory_steps):
            x, y, theta = self.trajectory_steps[self.current_step_idx]
            
            # Atualiza pose gráfica do robô e estende trajeto
            is_first_step = (self.current_step_idx == 0)
            self.canvas.set_robot_pose(x, y, theta, extend_path=True, is_first_step=is_first_step)
            
            # Salva pose atual
            self.robot_x = x
            self.robot_y = y
            self.robot_theta = theta
            
            # Calcula tempo decorrido neste passo
            total_steps = len(self.trajectory_steps) - 1
            progress_ratio = self.current_step_idx / total_steps
            elapsed_time = self.exec_duration * progress_ratio
            
            # Calcula odometria acumulada neste passo (com sinal)
            deg_l = physics.calculate_motor_degrees(self.exec_power_l, self.exec_max_rpm, elapsed_time)
            deg_r = physics.calculate_motor_degrees(self.exec_power_r, self.exec_max_rpm, elapsed_time)
            
            # Média física absoluta para o HUD do motor
            motor_deg_avg = (abs(deg_l) + abs(deg_r)) / 2.0
            
            # Calcula distâncias lineares com base na rotação de cada roda (com sinal)
            dist_l = physics.calculate_wheel_distance(deg_l, self.exec_wheel_dia)
            dist_r = physics.calculate_wheel_distance(deg_r, self.exec_wheel_dia)
            
            # Calcula rotação acumulada do robô em graus
            chassis_angle_deg = physics.calculate_chassis_angle(dist_l, dist_r, self.exec_chassis_width, self.exec_is_tread)
            
            # Atualiza o HUD de odometria com os valores corretos
            self.hud.set_values(motor_deg_avg, chassis_angle_deg)
            
            self.current_step_idx += 1
        else:
            self.anim_timer.stop()
            self.programming_panel.btn_execute.setEnabled(True)
            self.programming_panel.btn_execute.setText("▶️ EXECUTAR")
            
    def on_reset_requested(self):
        """Reseta variáveis de pose e telemetria, re-centralizando a câmera no robô."""
        self.robot_x = 0.0
        self.robot_y = 0.0
        self.robot_theta = 0.0
        self.hud.reset_displays()
        self.canvas.centerOn(0.0, 0.0)
