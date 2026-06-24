import math
from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QSlider, QFrame, QLineEdit, QPushButton
from PySide6.QtCore import Qt, Signal, QRectF, QPointF
from PySide6.QtGui import QFont, QColor, QDoubleValidator, QIntValidator, QPainter, QPen, QBrush
import config

class ResistorColorWidget(QWidget):
    """Draws a small graphical resistor showing the 4 E24 color bands."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedSize(120, 24)
        self.colors = ["#8B4513", "#000000", "#000000", "#D4AF37"]
        
    def set_colors(self, colors):
        self.colors = colors
        self.update()
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        rect = self.rect()
        painter.fillRect(rect, Qt.GlobalColor.transparent)
        
        cy = rect.height() / 2.0
        
        painter.setPen(QPen(QColor("#4f5e75"), 2.0))
        painter.drawLine(5, cy, rect.width() - 5, cy)
        
        body_w = 54
        body_h = 14
        body_rect = QRectF(rect.width() / 2.0 - body_w / 2.0, cy - body_h / 2.0, body_w, body_h)
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 1))
        painter.setBrush(QBrush(QColor("#ded4c5")))
        painter.drawRoundedRect(body_rect, 3, 3)
        
        band_w = 4
        start_x = body_rect.left()
        band_positions = [8, 17, 26, 42]
        
        for idx, pos in enumerate(band_positions):
            if idx < len(self.colors):
                band_color = QColor(self.colors[idx])
                painter.setPen(Qt.PenStyle.NoPen)
                painter.setBrush(QBrush(band_color))
                painter.drawRect(QRectF(start_x + pos, body_rect.top(), band_w, body_rect.height()))


class ControlPanel(QWidget):
    """The panel holding sliders, digital inputs, load selector and ammeter."""
    voltageChanged = Signal(float)
    resistanceChanged = Signal(float)
    resistance2Changed = Signal(float)
    loadTypeChanged = Signal(str)
    
    E24_BASES = [
        1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 
        3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1
    ]
    
    def __init__(self, mode="series", parent=None):
        super().__init__(parent)
        self.mode = mode
        self.voltage = 12.0
        self.resistance = 10.0
        self.resistance2 = 10.0 # Used in parallel mode
        self.current_load_type = config.LOAD_RESISTOR
        
        # Generate full E24 values up to 100k limit
        self.e24_values = []
        for m in [1.0, 10.0, 100.0, 1000.0, 10000.0]:
            for b in self.E24_BASES:
                self.e24_values.append(b * m)
        self.e24_values.append(100000.0)
        
        self.setup_ui()
        
    def setup_ui(self):
        # Layouts
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(15, 10, 15, 15)
        self.main_layout.setSpacing(12)
        
        # Base styling
        self.setStyleSheet(f"""
            QWidget {{
                color: {config.COLOR_TEXT_PRIMARY};
                font-family: '{config.FONT_FAMILY}';
            }}
            QLabel {{
                font-weight: bold;
            }}
            QSlider::groove:horizontal {{
                border: 1px solid #1f2735;
                height: 6px;
                background: #0d121c;
                border-radius: 3px;
            }}
            QSlider::handle:horizontal {{
                width: 14px;
                height: 14px;
                margin: -4px 0;
                border-radius: 7px;
                background: #ffffff;
            }}
        """)
        
        # --- 0. LOAD TYPE SELECTOR PANEL ---
        selector_layout = QHBoxLayout()
        selector_layout.setSpacing(10)
        
        selector_lbl = QLabel("🔌 COMPONENTE DE CARGA:" if self.mode == "series" else "🔌 TIPO DE CARGA EM PARALELO:")
        selector_lbl.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
        selector_lbl.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
        selector_layout.addWidget(selector_lbl)
        
        if self.mode == "series":
            self.btn_resistor = QPushButton("🛑 Apenas Resistor")
            self.btn_bulb = QPushButton("💡 Resistor + Lâmpada")
            self.btn_motor = QPushButton("⚙️ Resistor + Motor")
            
            self.buttons = {
                config.LOAD_RESISTOR: self.btn_resistor,
                config.LOAD_BULB: self.btn_bulb,
                config.LOAD_MOTOR: self.btn_motor
            }
        else: # parallel
            self.btn_resistor = QPushButton("🛑 Resistores em Paralelo")
            self.btn_bulb = QPushButton("💡 Lâmpadas + Resistores")
            
            self.buttons = {
                config.LOAD_RESISTOR: self.btn_resistor,
                config.LOAD_BULB: self.btn_bulb
            }
            
        for load_type, btn in self.buttons.items():
            btn.setFixedWidth(180 if self.mode == "parallel" else 150)
            btn.setFixedHeight(28)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setFont(QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold))
            btn.clicked.connect(lambda checked=False, lt=load_type: self.set_load_type(lt))
            selector_layout.addWidget(btn)
            
        selector_layout.addStretch()
        self.main_layout.addLayout(selector_layout)
        
        self.set_load_type(config.LOAD_RESISTOR)
        
        # Spacer
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("background-color: #161c28; max-height: 1px; border: none;")
        self.main_layout.addWidget(sep)
        
        # --- 1. SLIDERS & INPUTS ---
        sliders_layout = QHBoxLayout()
        sliders_layout.setSpacing(25)
        
        # 1A. Voltage (Common to both modes)
        v_group = QVBoxLayout()
        v_header = QHBoxLayout()
        
        v_title = QLabel("⚡ TENSÃO (BATERIA)")
        v_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold))
        v_title.setStyleSheet(f"color: {config.COLOR_WIRE_HIGH};")
        
        self.v_input = QLineEdit()
        self.v_input.setText("12.0")
        self.v_input.setFixedWidth(50)
        self.v_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.v_input.setStyleSheet(f"""
            QLineEdit {{
                background-color: #0d121c;
                color: {config.COLOR_WIRE_HIGH};
                border: 1px solid #1f2735;
                border-radius: 4px;
                padding: 2px;
                font-family: '{config.FONT_FAMILY_DIGITAL}';
                font-size: 11px;
                font-weight: bold;
            }}
            QLineEdit:focus {{
                border: 1px solid {config.COLOR_WIRE_HIGH};
            }}
        """)
        v_validator = QDoubleValidator(1.0, 24.0, 1, self)
        v_validator.setNotation(QDoubleValidator.Notation.StandardNotation)
        self.v_input.setValidator(v_validator)
        self.v_input.editingFinished.connect(self.on_v_input_finished)
        
        self.v_unit_lbl = QLabel("V")
        self.v_unit_lbl.setFont(QFont(config.FONT_FAMILY_DIGITAL, config.FONT_SIZE_BODY, QFont.Weight.Bold))
        self.v_unit_lbl.setStyleSheet(f"color: {config.COLOR_WIRE_HIGH};")
        
        v_header.addWidget(v_title)
        v_header.addStretch()
        v_header.addWidget(self.v_input)
        v_header.addWidget(self.v_unit_lbl)
        
        self.v_slider = QSlider(Qt.Orientation.Horizontal)
        self.v_slider.setRange(10, 240)
        self.v_slider.setValue(120)
        self.v_slider.setCursor(Qt.CursorShape.PointingHandCursor)
        self.v_slider.setStyleSheet(f"""
            QSlider::sub-page:horizontal {{
                background: {config.COLOR_WIRE_HIGH};
                border-radius: 3px;
            }}
            QSlider::handle:horizontal {{
                border: 2px solid {config.COLOR_WIRE_HIGH};
            }}
        """)
        self.v_slider.valueChanged.connect(self.on_v_changed)
        
        v_help = QLabel("Fórmula: V representa a força da bateria empurrando elétrons.")
        v_help.setFont(QFont(config.FONT_FAMILY, 8))
        v_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; font-style: italic;")
        
        v_group.addLayout(v_header)
        v_group.addWidget(self.v_slider)
        v_group.addWidget(v_help)
        sliders_layout.addLayout(v_group)
        
        # 1B. Resistance Inputs
        if self.mode == "series":
            r_group = QVBoxLayout()
            r_header = QHBoxLayout()
            
            r_title = QLabel("🛑 RESISTÊNCIA LIMITADORA (E24)")
            r_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold))
            r_title.setStyleSheet(f"color: {config.COLOR_RESISTOR};")
            
            self.r_input = QLineEdit()
            self.r_input.setText("10")
            self.r_input.setFixedWidth(65)
            self.r_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.r_input.setStyleSheet(f"""
                QLineEdit {{
                    background-color: #0d121c;
                    color: {config.COLOR_RESISTOR};
                    border: 1px solid #1f2735;
                    border-radius: 4px;
                    padding: 2px;
                    font-family: '{config.FONT_FAMILY_DIGITAL}';
                    font-size: 11px;
                    font-weight: bold;
                }}
                QLineEdit:focus {{
                    border: 1px solid {config.COLOR_RESISTOR};
                }}
            """)
            self.r_input.setValidator(QIntValidator(1, 100000, self))
            self.r_input.editingFinished.connect(self.on_r_input_finished)
            
            self.r_unit_lbl = QLabel("Ω")
            self.r_unit_lbl.setFont(QFont(config.FONT_FAMILY_DIGITAL, config.FONT_SIZE_BODY, QFont.Weight.Bold))
            self.r_unit_lbl.setStyleSheet(f"color: {config.COLOR_RESISTOR};")
            
            self.resistor_color_widget = ResistorColorWidget()
            
            r_header.addWidget(r_title)
            r_header.addStretch()
            r_header.addWidget(self.resistor_color_widget)
            r_header.addWidget(self.r_input)
            r_header.addWidget(self.r_unit_lbl)
            
            self.r_colors_text_lbl = QLabel("Cores: Marrom, Preto, Preto, Ouro")
            self.r_colors_text_lbl.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
            self.r_colors_text_lbl.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
            
            r_help = QLabel("Fórmula: O resistor reduz a corrente para proteger a lâmpada/motor.")
            r_help.setFont(QFont(config.FONT_FAMILY, 8))
            r_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; font-style: italic;")
            
            r_bottom_layout = QHBoxLayout()
            r_bottom_layout.addWidget(self.r_colors_text_lbl)
            r_bottom_layout.addStretch()
            
            r_group.addLayout(r_header)
            r_group.addWidget(r_help)
            r_group.addLayout(r_bottom_layout)
            sliders_layout.addLayout(r_group)
            
        else: # parallel mode - TWO resistance inputs
            r_parallel_layout = QVBoxLayout()
            
            # Sub-layout for two columns
            cols_layout = QHBoxLayout()
            cols_layout.setSpacing(15)
            
            # Branch 1
            b1_layout = QVBoxLayout()
            b1_header = QHBoxLayout()
            b1_title = QLabel("🛑 RAMO 1: R1 (E24)")
            b1_title.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
            b1_title.setStyleSheet(f"color: {config.COLOR_RESISTOR};")
            
            self.r_input = QLineEdit()
            self.r_input.setText("10")
            self.r_input.setFixedWidth(55)
            self.r_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.r_input.setStyleSheet(f"""
                QLineEdit {{
                    background-color: #0d121c;
                    color: {config.COLOR_RESISTOR};
                    border: 1px solid #1f2735;
                    border-radius: 4px;
                    font-family: '{config.FONT_FAMILY_DIGITAL}';
                    font-size: 10px;
                    font-weight: bold;
                }}
            """)
            self.r_input.setValidator(QIntValidator(1, 100000, self))
            self.r_input.editingFinished.connect(self.on_r_input_finished)
            
            self.resistor_color_widget = ResistorColorWidget()
            b1_header.addWidget(b1_title)
            b1_header.addStretch()
            b1_header.addWidget(self.resistor_color_widget)
            b1_header.addWidget(self.r_input)
            b1_header.addWidget(QLabel("Ω"))
            
            self.r_colors_text_lbl = QLabel("Cores: Marrom, Preto, Preto, Ouro")
            self.r_colors_text_lbl.setFont(QFont(config.FONT_FAMILY, 7, QFont.Weight.Bold))
            self.r_colors_text_lbl.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
            
            b1_layout.addLayout(b1_header)
            b1_layout.addWidget(self.r_colors_text_lbl)
            cols_layout.addLayout(b1_layout)
            
            # Branch 2
            b2_layout = QVBoxLayout()
            b2_header = QHBoxLayout()
            b2_title = QLabel("🛑 RAMO 2: R2 (E24)")
            b2_title.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
            b2_title.setStyleSheet(f"color: {config.COLOR_WIRE_LOW};")
            
            self.r2_input = QLineEdit()
            self.r2_input.setText("20")
            self.r2_input.setFixedWidth(55)
            self.r2_input.setAlignment(Qt.AlignmentFlag.AlignCenter)
            self.r2_input.setStyleSheet(f"""
                QLineEdit {{
                    background-color: #0d121c;
                    color: {config.COLOR_WIRE_LOW};
                    border: 1px solid #1f2735;
                    border-radius: 4px;
                    font-family: '{config.FONT_FAMILY_DIGITAL}';
                    font-size: 10px;
                    font-weight: bold;
                }}
            """)
            self.r2_input.setValidator(QIntValidator(1, 100000, self))
            self.r2_input.editingFinished.connect(self.on_r2_input_finished)
            
            self.resistor2_color_widget = ResistorColorWidget()
            b2_header.addWidget(b2_title)
            b2_header.addStretch()
            b2_header.addWidget(self.resistor2_color_widget)
            b2_header.addWidget(self.r2_input)
            b2_header.addWidget(QLabel("Ω"))
            
            self.r2_colors_text_lbl = QLabel("Cores: Vermelho, Vermelho, Preto, Ouro")
            self.r2_colors_text_lbl.setFont(QFont(config.FONT_FAMILY, 7, QFont.Weight.Bold))
            self.r2_colors_text_lbl.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
            
            b2_layout.addLayout(b2_header)
            b2_layout.addWidget(self.r2_colors_text_lbl)
            cols_layout.addLayout(b2_layout)
            
            r_parallel_layout.addLayout(cols_layout)
            
            r_help = QLabel("Fórmula: Em paralelo, a corrente se divide. Cada ramo tem brilho/corrente independente.")
            r_help.setFont(QFont(config.FONT_FAMILY, 8))
            r_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; font-style: italic; margin-top: 5px;")
            r_parallel_layout.addWidget(r_help)
            
            sliders_layout.addLayout(r_parallel_layout)
            
        self.main_layout.addLayout(sliders_layout)
        
        # --- 2. AMPEREMETER HUD READOUT ---
        hud_frame = QFrame()
        hud_frame.setFrameShape(QFrame.Shape.NoFrame)
        hud_frame.setStyleSheet(f"""
            QFrame {{
                background-color: #0b0e16;
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
        """)
        hud_layout = QHBoxLayout(hud_frame)
        hud_layout.setContentsMargins(15, 12, 15, 12)
        
        # Ammeter Label
        amp_title_layout = QVBoxLayout()
        amp_title_layout.setSpacing(2)
        amp_title = QLabel("AMPERÍMETRO (CORRENTE TOTAL)")
        amp_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SUBTITLE, QFont.Weight.Bold))
        amp_title.setStyleSheet(f"color: {config.COLOR_ELECTRON_GLOW}; border: none; background: transparent;")
        
        amp_help = QLabel("Taxa de fluxo: Quantos elétrons entram/saem da bateria por segundo.")
        amp_help.setFont(QFont(config.FONT_FAMILY, 8))
        amp_help.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent;")
        
        amp_title_layout.addWidget(amp_title)
        amp_title_layout.addWidget(amp_help)
        
        # Ammeter Value
        self.amp_value_lbl = QLabel("1.20 A")
        self.amp_value_lbl.setFont(QFont(config.FONT_FAMILY_DIGITAL, 20, QFont.Weight.Bold))
        self.amp_value_lbl.setStyleSheet(f"color: {config.COLOR_ELECTRON_GLOW}; border: none; background: transparent;")
        self.amp_value_lbl.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        
        hud_layout.addLayout(amp_title_layout)
        hud_layout.addStretch()
        hud_layout.addWidget(self.amp_value_lbl)
        
        self.main_layout.addWidget(hud_frame)
        
        # Initialize resistor colors
        self.update_resistor_colors()
        if self.mode == "parallel":
            self.update_resistor2_colors()
        
    def set_load_type(self, load_type):
        self.current_load_type = load_type
        
        # Update styling for all buttons
        for lt, btn in self.buttons.items():
            if lt == load_type:
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background-color: #121724;
                        color: {config.COLOR_WIRE_HIGH};
                        border: 2px solid {config.COLOR_WIRE_HIGH};
                        border-radius: 4px;
                    }}
                """)
            else:
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background-color: #0b0e16;
                        color: {config.COLOR_TEXT_MUTED};
                        border: 1px solid {config.COLOR_BORDER};
                        border-radius: 4px;
                    }}
                    QPushButton:hover {{
                        border: 1px solid {config.COLOR_TEXT_MUTED};
                        color: {config.COLOR_TEXT_PRIMARY};
                    }}
                """)
                
        self.loadTypeChanged.emit(load_type)
        
    def snap_to_e24(self, val):
        val = max(1.0, min(100000.0, val))
        closest = min(self.e24_values, key=lambda x: abs(x - val))
        return closest
        
    def get_resistor_colors(self, val):
        exp = int(math.floor(math.log10(val)))
        if exp < 1:
            digit1 = int(val)
            digit2 = int(round((val - digit1) * 10))
            mult = "Gold"
        else:
            val_norm = val / (10 ** (exp - 1))
            digit1 = int(val_norm // 10)
            digit2 = int(round(val_norm % 10))
            if digit2 >= 10:
                digit1 += 1
                digit2 = 0
                if digit1 >= 10:
                    digit1 = 1
                    digit2 = 0
                    exp += 1
            mult_exp = exp - 1
            mult_colors = {
                0: "Black",
                1: "Brown",
                2: "Red",
                3: "Orange",
                4: "Yellow",
                5: "Green",
                6: "Blue"
            }
            mult = mult_colors.get(mult_exp, "Black")
            
        COLOR_MAP = {
            0: ("Preto", "#000000"),
            1: ("Marrom", "#8B4513"),
            2: ("Vermelho", "#FF0000"),
            3: ("Laranja", "#FF8C00"),
            4: ("Amarelo", "#FFD700"),
            5: ("Verde", "#008000"),
            6: ("Azul", "#0000FF"),
            7: ("Violeta", "#8A2BE2"),
            8: ("Cinza", "#808080"),
            9: ("Branco", "#FFFFFF")
        }
        
        MULT_MAP = {
            "Gold": ("Ouro", "#D4AF37"),
            "Black": ("Preto", "#000000"),
            "Brown": ("Marrom", "#8B4513"),
            "Red": ("Vermelho", "#FF0000"),
            "Orange": ("Laranja", "#FF8C00"),
            "Yellow": ("Amarelo", "#FFD700"),
            "Green": ("Verde", "#008000"),
            "Blue": ("Azul", "#0000FF")
        }
        
        c1_name, c1_hex = COLOR_MAP[digit1]
        c2_name, c2_hex = COLOR_MAP[digit2]
        c3_name, c3_hex = MULT_MAP[mult]
        c4_name, c4_hex = ("Ouro", "#D4AF37")
        
        return [c1_hex, c2_hex, c3_hex, c4_hex], [c1_name, c2_name, c3_name, c4_name]
        
    def update_resistor_colors(self):
        hex_colors, name_colors = self.get_resistor_colors(self.resistance)
        self.resistor_color_widget.set_colors(hex_colors)
        self.r_colors_text_lbl.setText(f"Cores: {', '.join(name_colors)}")
        
    def update_resistor2_colors(self):
        hex_colors, name_colors = self.get_resistor_colors(self.resistance2)
        self.resistor2_color_widget.set_colors(hex_colors)
        self.r2_colors_text_lbl.setText(f"Cores: {', '.join(name_colors)}")
        
    def on_v_changed(self, value):
        self.voltage = value / 10.0
        self.v_input.setText(f"{self.voltage:.1f}")
        self.voltageChanged.emit(self.voltage)
        self.update_ammeter()
        
    def on_v_input_finished(self):
        text = self.v_input.text().replace(",", ".")
        try:
            val = float(text)
            val = max(1.0, min(24.0, val))
            self.voltage = val
            self.v_input.setText(f"{val:.1f}")
            self.v_slider.blockSignals(True)
            self.v_slider.setValue(int(val * 10.0))
            self.v_slider.blockSignals(False)
            self.voltageChanged.emit(self.voltage)
            self.update_ammeter()
        except ValueError:
            self.v_input.setText(f"{self.voltage:.1f}")
            
    def on_r_input_finished(self):
        text = self.r_input.text().replace(",", ".")
        try:
            val = float(text)
            snapped = self.snap_to_e24(val)
            self.resistance = snapped
            
            formatted = f"{int(snapped):,}".replace(",", ".")
            self.r_input.setText(formatted)
            
            self.update_resistor_colors()
            self.resistanceChanged.emit(self.resistance)
            self.update_ammeter()
        except ValueError:
            formatted = f"{int(self.resistance):,}".replace(",", ".")
            self.r_input.setText(formatted)
            
    def on_r2_input_finished(self):
        text = self.r2_input.text().replace(",", ".")
        try:
            val = float(text)
            snapped = self.snap_to_e24(val)
            self.resistance2 = snapped
            
            formatted = f"{int(snapped):,}".replace(",", ".")
            self.r2_input.setText(formatted)
            
            self.update_resistor2_colors()
            self.resistance2Changed.emit(self.resistance2)
            self.update_ammeter()
        except ValueError:
            formatted = f"{int(self.resistance2):,}".replace(",", ".")
            self.r2_input.setText(formatted)
            
    def update_ammeter(self):
        if self.mode == "series":
            # In series mode:
            # If plain resistor: R_total = R
            # If bulb: R_total = R + 10 ohm (bulb resistance)
            # If motor: R_total = R + 15 ohm (motor resistance)
            if self.current_load_type == config.LOAD_RESISTOR:
                r_total = self.resistance
            elif self.current_load_type == config.LOAD_BULB:
                r_total = self.resistance + 10.0
            else: # motor
                r_total = self.resistance + 15.0
            
            current = self.voltage / r_total
            
            # Check for bulb burnout: if I > 1.5A in bulb mode
            if self.current_load_type == config.LOAD_BULB and current > 1.5:
                current = 0.0 # Burned out!
        else:
            # In parallel mode:
            # Current is sum of branch currents: I_total = I1 + I2
            if self.current_load_type == config.LOAD_BULB:
                i1 = self.voltage / (self.resistance + 10.0)
                if i1 > 1.5:
                    i1 = 0.0
                i2 = self.voltage / (self.resistance2 + 10.0)
                if i2 > 1.5:
                    i2 = 0.0
            else:
                i1 = self.voltage / self.resistance
                i2 = self.voltage / self.resistance2
            current = i1 + i2
            
        if current >= 1.0:
            self.amp_value_lbl.setText(f"{current:.2f} A")
        elif current > 0.0:
            current_ma = current * 1000.0
            if current_ma >= 10.0:
                self.amp_value_lbl.setText(f"{current_ma:.1f} mA")
            else:
                self.amp_value_lbl.setText(f"{current_ma:.2f} mA")
        else:
            self.amp_value_lbl.setText("0.00 A")
            
    def update_values(self, voltage, resistance, resistance2=10.0):
        self.v_slider.blockSignals(True)
        
        self.voltage = voltage
        self.resistance = resistance
        self.resistance2 = resistance2
        
        self.v_slider.setValue(int(voltage * 10.0))
        self.v_input.setText(f"{self.voltage:.1f}")
        
        formatted = f"{int(resistance):,}".replace(",", ".")
        self.r_input.setText(formatted)
        self.update_resistor_colors()
        
        if self.mode == "parallel":
            formatted2 = f"{int(resistance2):,}".replace(",", ".")
            self.r2_input.setText(formatted2)
            self.update_resistor2_colors()
            
        self.update_ammeter()
        self.v_slider.blockSignals(False)
