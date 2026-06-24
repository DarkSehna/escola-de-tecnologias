# Painel de Configuração Lateral (Apenas Fatores Físicos)
from PySide6.QtWidgets import QFrame, QVBoxLayout, QHBoxLayout, QLabel, QComboBox
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
import config
from gui.programming_panel import NumberAdjuster

class ConfigPanel(QFrame):
    """Painel contendo apenas configurações físicas básicas do robô LEGO."""
    physicalParamsChanged = Signal(float, float, bool, str)  # diâmetro_roda, largura_chassi, is_esteira, modo_rastro
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
        
    def setup_ui(self):
        self.setFixedWidth(280)
        self.setStyleSheet(f"""
            QFrame {{
                background-color: {config.COLOR_PANEL_BG};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
            QLabel {{
                color: {config.COLOR_TEXT_PRIMARY};
                font-weight: bold;
                border: none;
                background: transparent;
            }}
            QComboBox {{
                background-color: #0b0e14;
                color: {config.COLOR_TEXT_PRIMARY};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 4px;
                padding: 6px 10px;
                min-height: 30px;
                font-weight: bold;
            }}
            QComboBox:focus {{
                border: 1px solid {config.COLOR_NEON_CYAN};
            }}
            QComboBox::drop-down {{
                border: none;
                width: 20px;
            }}
        """)
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(12)
        
        # --- CABEÇALHO DA SEÇÃO ---
        lbl_sec1 = QLabel("🔧 1. CONFIGURAÇÃO FÍSICA")
        lbl_sec1.setFont(QFont(config.FONT_FAMILY, 10, QFont.Weight.Bold))
        lbl_sec1.setStyleSheet(f"color: {config.COLOR_NEON_CYAN};")
        main_layout.addWidget(lbl_sec1)
        
        # Cérebro/Motor
        main_layout.addWidget(QLabel("Motor / Cérebro LEGO:"))
        self.cmb_motor = QComboBox()
        self.cmb_motor.addItems(list(config.MOTOR_PRESETS.keys()))
        self.cmb_motor.setCurrentIndex(1)  # Padrão: EV3 (160 RPM)
        self.cmb_motor.currentIndexChanged.connect(self.on_physical_params_changed)
        main_layout.addWidget(self.cmb_motor)
        
        # Rodas/Tração
        main_layout.addWidget(QLabel("Modelo de Rodas / Tração:"))
        self.cmb_wheels = QComboBox()
        self.cmb_wheels.addItems(list(config.WHEEL_PRESETS.keys()))
        self.cmb_wheels.setCurrentIndex(0)  # Padrão: Padrão (56mm)
        self.cmb_wheels.currentIndexChanged.connect(self.on_physical_params_changed)
        main_layout.addWidget(self.cmb_wheels)
        
        # Largura do Chassi (mm) - Usando NumberAdjuster com botões grandes [+] e [-]
        main_layout.addWidget(QLabel("Largura do Chassi (Dist. Rodas):"))
        self.adj_chassis_width = NumberAdjuster(80, 250, 120, step=5, suffix="mm")
        self.adj_chassis_width.valueChanged.connect(self.on_physical_params_changed)
        main_layout.addWidget(self.adj_chassis_width)
        
        # Tipo de Visualização do Rastro
        main_layout.addWidget(QLabel("Visualização do Rastro:"))
        self.cmb_trace = QComboBox()
        self.cmb_trace.addItems([
            "Centro (Verde)",
            "Rodas (Laranja/Azul)",
            "Completo (3 Linhas)"
        ])
        self.cmb_trace.setCurrentIndex(0)  # Padrão: Apenas centro
        self.cmb_trace.currentIndexChanged.connect(self.on_physical_params_changed)
        main_layout.addWidget(self.cmb_trace)
        
        # Explicação Física Auxiliar
        lbl_help = QLabel(
            "A largura do chassi (distância entre rodas) e o diâmetro da roda definem a física de giro.\n\n"
            "Chassi maior ➔ giro mais lento.\n"
            "Rodas maiores ➔ robô corre mais rápido."
        )
        lbl_help.setFont(QFont(config.FONT_FAMILY, 8))
        lbl_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; font-style: italic; margin-top: 10px;")
        lbl_help.setWordWrap(True)
        main_layout.addWidget(lbl_help)
        
        main_layout.addStretch()
        
    def get_physical_params(self):
        """Retorna (diâmetro_roda, largura_chassi, is_esteira, modo_rastro)."""
        wheel_key = self.cmb_wheels.currentText()
        wheel_dia = config.WHEEL_PRESETS[wheel_key]
        chassis_width = float(self.adj_chassis_width.value())
        is_tread = "Esteira" in wheel_key
        trace_mode = self.cmb_trace.currentText()
        return wheel_dia, chassis_width, is_tread, trace_mode
        
    def on_physical_params_changed(self):
        """Emite sinal para atualizar dinamicamente o desenho do robô e do rastro."""
        wheel_dia, chassis_width, is_tread, trace_mode = self.get_physical_params()
        self.physicalParamsChanged.emit(wheel_dia, chassis_width, is_tread, trace_mode)
