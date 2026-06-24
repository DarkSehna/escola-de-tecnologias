# Painel de Odometria (HUD Digital)
from PySide6.QtWidgets import QFrame, QHBoxLayout, QVBoxLayout, QLabel
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QColor
import config

class OdometryHUD(QFrame):
    """Visores digitais reativos para telemetria dos motores e do chassi do robô."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
        
    def setup_ui(self):
        # Estilo do painel HUD
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {config.COLOR_PANEL_BG};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
        """)
        
        layout = QHBoxLayout(self)
        layout.setContentsMargins(15, 12, 15, 12)
        layout.setSpacing(20)
        
        # --- Visor 1: Ângulo do Motor (Graus Físicos da Roda) ---
        v1_layout = QVBoxLayout()
        v1_layout.setSpacing(4)
        
        v1_title = QLabel("⚙️ ENCODER DO MOTOR (RODA)")
        v1_title.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
        v1_title.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent;")
        v1_title.setWordWrap(True)
        
        self.lbl_motor = QLabel("0.0°")
        self.lbl_motor.setFont(QFont(config.FONT_FAMILY_DIGITAL, 32, QFont.Weight.Bold))
        self.lbl_motor.setStyleSheet(f"color: {config.COLOR_NEON_ORANGE}; border: none; background: transparent;")
        self.lbl_motor.setAlignment(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter)
        
        v1_help = QLabel("Rotação média acumulada das rodas L e R.")
        v1_help.setFont(QFont(config.FONT_FAMILY, 8))
        v1_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent; font-style: italic;")
        v1_help.setWordWrap(True)
        
        v1_layout.addWidget(v1_title)
        v1_layout.addWidget(self.lbl_motor)
        v1_layout.addWidget(v1_help)
        layout.addLayout(v1_layout, stretch=1)
        
        # Divisor vertical interno
        divider = QFrame()
        divider.setFrameShape(QFrame.Shape.VLine)
        divider.setStyleSheet(f"background-color: {config.COLOR_BORDER}; max-width: 1px; border: none;")
        layout.addWidget(divider)
        
        # --- Visor 2: Ângulo do Robô (Giro do Chassi no Mundo) ---
        v2_layout = QVBoxLayout()
        v2_layout.setSpacing(4)
        
        v2_title = QLabel("🤖 ROTAÇÃO DO ROBÔ (CHASSI)")
        v2_title.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
        v2_title.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent;")
        v2_title.setWordWrap(True)
        
        self.lbl_robot = QLabel("0.0°")
        self.lbl_robot.setFont(QFont(config.FONT_FAMILY_DIGITAL, 32, QFont.Weight.Bold))
        self.lbl_robot.setStyleSheet(f"color: {config.COLOR_NEON_GREEN}; border: none; background: transparent;")
        self.lbl_robot.setAlignment(Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter)
        
        v2_help = QLabel("Orientação angular do robô em relação ao início.")
        v2_help.setFont(QFont(config.FONT_FAMILY, 8))
        v2_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent; font-style: italic;")
        v2_help.setWordWrap(True)
        
        v2_layout.addWidget(v2_title)
        v2_layout.addWidget(self.lbl_robot)
        v2_layout.addWidget(v2_help)
        layout.addLayout(v2_layout, stretch=1)
        
    def set_values(self, motor_deg: float, robot_deg: float):
        """Atualiza dinamicamente as leituras de odometria."""
        self.lbl_motor.setText(f"{motor_deg:.1f}°")
        self.lbl_robot.setText(f"{robot_deg:.1f}°")
        
    def reset_displays(self):
        """Reseta as leituras para zero."""
        self.lbl_motor.setText("0.0°")
        self.lbl_robot.setText("0.0°")
