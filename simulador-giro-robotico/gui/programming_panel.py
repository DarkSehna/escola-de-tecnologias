# Painel de Programação do Aluno (Horizontal Inferior)
from PySide6.QtWidgets import QFrame, QHBoxLayout, QVBoxLayout, QLabel, QPushButton, QLineEdit, QComboBox
from PySide6.QtCore import Qt, Signal
from PySide6.QtGui import QFont
import config

class FocusLineEdit(QLineEdit):
    focusIn = Signal()
    focusOut = Signal()
    
    def focusInEvent(self, event):
        super().focusInEvent(event)
        self.focusIn.emit()
        
    def focusOutEvent(self, event):
        super().focusOutEvent(event)
        self.focusOut.emit()

class NumberAdjuster(QFrame):
    """Componente customizado com botões grandes [+] e [-] para ajuste numérico."""
    valueChanged = Signal(float)
    
    def __init__(self, min_val: float, max_val: float, init_val: float, step: float = 1.0, decimals: int = 0, suffix: str = "", parent=None):
        super().__init__(parent)
        self.min_val = min_val
        self.max_val = max_val
        self.val = init_val
        self.step = step
        self.decimals = decimals
        self.suffix = suffix
        self.setup_ui()
        
    def setup_ui(self):
        self.setStyleSheet("border: none; background: transparent;")
        layout = QHBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(4)
        
        self.btn_minus = QPushButton("-")
        self.btn_minus.setFixedSize(36, 32)
        self.btn_minus.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_minus.setStyleSheet(self.button_style())
        self.btn_minus.clicked.connect(self.decrement)
        
        self.txt_val = FocusLineEdit()
        self.txt_val.focusIn.connect(self.on_focus_in)
        self.txt_val.focusOut.connect(self.on_focus_out)
        self.txt_val.editingFinished.connect(self.on_text_edited)
        self.txt_val.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.txt_val.setFixedWidth(90)
        self.txt_val.setStyleSheet(f"""
            QLineEdit {{
                background-color: #0b0e14;
                color: #ffffff;
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 4px;
                font-family: '{config.FONT_FAMILY_DIGITAL}';
                font-size: 12px;
                font-weight: bold;
                min-height: 30px;
            }}
        """)
        
        self.btn_plus = QPushButton("+")
        self.btn_plus.setFixedSize(36, 32)
        self.btn_plus.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_plus.setStyleSheet(self.button_style())
        self.btn_plus.clicked.connect(self.increment)
        
        layout.addWidget(self.btn_minus)
        layout.addWidget(self.txt_val)
        layout.addWidget(self.btn_plus)
        
        self.update_display()
        
    def button_style(self) -> str:
        return f"""
            QPushButton {{
                background-color: #1a2233;
                color: #ffffff;
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 4px;
                font-size: 16px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: #242f47;
                border: 1px solid {config.COLOR_NEON_CYAN};
            }}
            QPushButton:pressed {{
                background-color: {config.COLOR_NEON_CYAN};
                color: #0c0f16;
            }}
        """
        
    def decrement(self):
        self.val = max(self.min_val, self.val - self.step)
        self.update_display()
        self.valueChanged.emit(self.val)
        
    def increment(self):
        self.val = min(self.max_val, self.val + self.step)
        self.update_display()
        self.valueChanged.emit(self.val)
        
    def update_display(self):
        fmt = f"{{:.{self.decimals}f}}"
        val_str = fmt.format(self.val)
        if self.suffix:
            val_str += f" {self.suffix}"
        self.txt_val.setText(val_str)
        
    def value(self) -> float:
        return self.val
        
    def setValue(self, val: float):
        self.val = max(self.min_val, min(self.max_val, val))
        self.update_display()
        self.valueChanged.emit(self.val)
        
    def configure(self, min_val: float, max_val: float, val: float, step: float, decimals: int, suffix: str):
        """Reconfigura dinamicamente os limites, passo e exibição do seletor."""
        self.min_val = min_val
        self.max_val = max_val
        self.val = val
        self.step = step
        self.decimals = decimals
        self.suffix = suffix
        self.update_display()
        self.valueChanged.emit(self.val)

    def on_focus_in(self):
        """Remove o sufixo temporariamente e seleciona o texto ao entrar em foco."""
        fmt = f"{{:.{self.decimals}f}}"
        self.txt_val.setText(fmt.format(self.val))
        self.txt_val.selectAll()
        
    def on_focus_out(self):
        """Valida e formata o texto ao perder o foco."""
        self.on_text_edited()
        
    def on_text_edited(self):
        """Valida, limita e emite o novo valor digitado pelo usuário."""
        text = self.txt_val.text()
        clean_text = ""
        for char in text:
            if char.isdigit() or char in ['.', '-', ',']:
                clean_text += char
        clean_text = clean_text.replace(',', '.')
        
        try:
            val = float(clean_text)
            self.val = max(self.min_val, min(self.max_val, val))
        except ValueError:
            pass
            
        self.update_display()
        self.valueChanged.emit(self.val)



class ProgrammingPanel(QFrame):
    """Painel inferior horizontal contendo caixas rígidas de programação e presets."""
    executeRequested = Signal(float, float, str, float)  # pwr_l, pwr_r, modo_controle, valor_alvo
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setup_ui()
        
    def setup_ui(self):
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
                padding: 4px 8px;
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
            QPushButton {{
                background-color: #1a2233;
                color: {config.COLOR_TEXT_PRIMARY};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 4px;
                padding: 6px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                border: 1px solid {config.COLOR_TEXT_MUTED};
                background-color: #242f47;
            }}
        """)
        
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(15, 10, 15, 10)
        main_layout.setSpacing(6)
        
        # Título da Seção
        lbl_title = QLabel("💻 PROGRAMAÇÃO DO ALUNO (TELA DE COMANDOS)")
        lbl_title.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
        lbl_title.setStyleSheet(f"color: {config.COLOR_NEON_CYAN}; border: none; background: transparent;")
        main_layout.addWidget(lbl_title)
        
        # Colunas horizontais
        columns_layout = QHBoxLayout()
        columns_layout.setSpacing(20)
        
        # --- COLUNA 1: Motor Esquerdo ---
        col1 = QVBoxLayout()
        col1.addWidget(QLabel("Força Motor Esquerdo (L):"))
        self.adj_power_l = NumberAdjuster(-100, 100, 100, step=10, suffix="%")
        self.adj_power_l.txt_val.setStyleSheet("""
            QLineEdit { background-color: #0b0e14; color: #ff8800; border: 1px solid #222a3d; border-radius: 4px; font-family: 'Consolas'; font-size: 12px; font-weight: bold; min-height: 30px; }
        """)
        col1.addWidget(self.adj_power_l)
        columns_layout.addLayout(col1)
        
        # --- COLUNA 2: Motor Direito ---
        col2 = QVBoxLayout()
        col2.addWidget(QLabel("Força Motor Direito (R):"))
        self.adj_power_r = NumberAdjuster(-100, 100, -100, step=10, suffix="%")
        self.adj_power_r.txt_val.setStyleSheet("""
            QLineEdit { background-color: #0b0e14; color: #ff8800; border: 1px solid #222a3d; border-radius: 4px; font-family: 'Consolas'; font-size: 12px; font-weight: bold; min-height: 30px; }
        """)
        col2.addWidget(self.adj_power_r)
        columns_layout.addLayout(col2)
        
        # --- COLUNA 3: Modo de Controle e Alvo ---
        col3 = QVBoxLayout()
        col3_h = QHBoxLayout()
        
        lbl_mode = QLabel("Modo:")
        lbl_mode.setFixedWidth(40)
        self.cmb_mode = QComboBox()
        self.cmb_mode.addItems(["Segundos", "Graus (Roda)", "Rotações (Roda)"])
        self.cmb_mode.currentIndexChanged.connect(self.on_mode_changed)
        
        col3_h.addWidget(lbl_mode)
        col3_h.addWidget(self.cmb_mode)
        col3.addLayout(col3_h)
        
        # Ajustador do valor de duração (reconfigurado dinamicamente)
        self.adj_target = NumberAdjuster(0.1, 15.0, 2.0, step=0.1, decimals=1, suffix="s")
        col3.addWidget(self.adj_target)
        columns_layout.addLayout(col3)
        
        # --- COLUNA 4: Presets e Execução ---
        col4 = QHBoxLayout()
        col4.setSpacing(8)
        
        # Sub-bloco vertical para os dois presets
        presets_v = QVBoxLayout()
        presets_v.setSpacing(4)
        
        self.btn_preset_axis = QPushButton("🔄 Giro no Eixo")
        self.btn_preset_axis.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
        self.btn_preset_axis.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_preset_axis.setFixedSize(110, 26)
        self.btn_preset_axis.clicked.connect(self.set_preset_axis)
        
        self.btn_preset_pivot = QPushButton("↪️ Giro na Roda")
        self.btn_preset_pivot.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
        self.btn_preset_pivot.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_preset_pivot.setFixedSize(110, 26)
        self.btn_preset_pivot.clicked.connect(self.set_preset_pivot)
        
        presets_v.addWidget(self.btn_preset_axis)
        presets_v.addWidget(self.btn_preset_pivot)
        col4.addLayout(presets_v)
        
        # Grande Botão de Executar
        self.btn_execute = QPushButton("▶️ EXECUTAR")
        self.btn_execute.setFixedSize(130, 56)
        self.btn_execute.setFont(QFont(config.FONT_FAMILY, 11, QFont.Weight.Bold))
        self.btn_execute.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_execute.setStyleSheet(f"""
            QPushButton {{
                background-color: #0c1622;
                color: {config.COLOR_NEON_CYAN};
                border: 2px solid {config.COLOR_NEON_CYAN};
                border-radius: 6px;
            }}
            QPushButton:hover {{
                background-color: {config.COLOR_NEON_CYAN};
                color: #0c0f16;
            }}
        """)
        self.btn_execute.clicked.connect(self.on_execute_clicked)
        col4.addWidget(self.btn_execute)
        
        columns_layout.addLayout(col4)
        
        main_layout.addLayout(columns_layout)
        
    def on_mode_changed(self):
        """Ajusta o NumberAdjuster do valor de comando com base no modo selecionado."""
        mode = self.cmb_mode.currentText()
        if mode == "Segundos":
            self.adj_target.configure(min_val=0.1, max_val=15.0, val=2.0, step=0.1, decimals=1, suffix="s")
        elif mode == "Graus (Roda)":
            self.adj_target.configure(min_val=10.0, max_val=3600.0, val=360.0, step=90.0, decimals=0, suffix="°")
        else: # Rotações
            self.adj_target.configure(min_val=0.1, max_val=10.0, val=1.0, step=0.1, decimals=1, suffix="rot")
            
    def set_preset_axis(self):
        """Preset Giro no Eixo (100% / -100%)."""
        self.adj_power_l.setValue(100)
        self.adj_power_r.setValue(-100)
        
    def set_preset_pivot(self):
        """Preset Giro na Roda (100% / 0%)."""
        self.adj_power_l.setValue(100)
        self.adj_power_r.setValue(0)
        
    def on_execute_clicked(self):
        """Emite sinal com os parâmetros para executar a rotação diferencial."""
        pwr_l = self.adj_power_l.value()
        pwr_r = self.adj_power_r.value()
        mode = self.cmb_mode.currentText()
        value = self.adj_target.value()
        
        self.executeRequested.emit(pwr_l, pwr_r, mode, value)
