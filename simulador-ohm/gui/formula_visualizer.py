import math
from PySide6.QtWidgets import QWidget
from PySide6.QtCore import Qt, QRectF, QPointF
from PySide6.QtGui import QPainter, QPen, QColor, QFont, QFontMetrics
import config

class FormulaVisualizer(QWidget):
    """Custom widget displaying Ohm's Law formulas with dynamic text scaling."""
    def __init__(self, mode="series", parent=None):
        super().__init__(parent)
        self.mode = mode
        self.setMinimumHeight(150)
        
        self.voltage = 12.0
        self.resistance = 10.0
        self.resistance2 = 20.0
        self.load_type = config.LOAD_RESISTOR
        self.current = 1.20
        self.bulb_burned = False
        
    def update_values(self, voltage, resistance, resistance2=20.0):
        self.voltage = voltage
        self.resistance = resistance
        self.resistance2 = resistance2
        
        if self.mode == "series":
            if self.load_type == config.LOAD_RESISTOR:
                r_total = resistance
            elif self.load_type == config.LOAD_BULB:
                r_total = resistance + 10.0
            else: # motor
                r_total = resistance + 15.0
            self.current = voltage / r_total
            # Burnout threshold at 1.5A
            if self.load_type == config.LOAD_BULB and self.current > 1.5:
                self.bulb_burned = True
                self.current = 0.0
            else:
                self.bulb_burned = False
        else: # parallel
            # In parallel with bulbs: each branch has a bulb (10 ohm) in series with its resistor
            if self.load_type == config.LOAD_BULB:
                i1 = voltage / (resistance + 10.0)
                if i1 > 1.5: i1 = 0.0
                i2 = voltage / (resistance2 + 10.0)
                if i2 > 1.5: i2 = 0.0
            else:
                i1 = voltage / resistance
                i2 = voltage / resistance2
            self.current = i1 + i2
            self.bulb_burned = False
            
        self.update()
        
    def set_load_type(self, load_type):
        self.load_type = load_type
        self.update()
        
    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        rect = self.rect()
        painter.fillRect(rect, QColor(config.COLOR_PANEL_BG))
        
        # Border
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 1.5))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawRoundedRect(rect.adjusted(1, 1, -1, -1), 4, 4)
        
        # Title
        font_title = QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold)
        painter.setFont(font_title)
        painter.setPen(QColor(config.COLOR_TEXT_MUTED))
        title_text = "📊 LEI DE OHM EM SÉRIE" if self.mode == "series" else "📊 LEI DE OHM EM PARALELO"
        painter.drawText(
            QRectF(10, 8, rect.width() - 20, 16),
            Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter,
            title_text
        )
        
        if self.bulb_burned:
            font_warn = QFont(config.FONT_FAMILY, 11, QFont.Weight.Bold)
            painter.setFont(font_warn)
            painter.setPen(QColor("#ff3344"))
            painter.drawText(
                rect.adjusted(10, 30, -10, -10),
                Qt.AlignmentFlag.AlignCenter | Qt.TextFlag.TextWordWrap,
                "⚠️ LÂMPADA QUEIMADA!\n\nCorrente excedeu 1,5 A.\nAumente a resistência para limitar a corrente e restaurar."
            )
            return
            
        if self.mode == "series":
            self.draw_series_formula(painter, rect)
        else:
            self.draw_parallel_formula(painter, rect)
            
    def draw_series_formula(self, painter, rect):
        has_load = (self.load_type != config.LOAD_RESISTOR)
        load_r_val = 10.0 if self.load_type == config.LOAD_BULB else 15.0
        load_name = "Lâmpada" if self.load_type == config.LOAD_BULB else "Motor"
        
        # Calculate dynamic scales (multiplier capped to prevent clipping)
        scale_v = 0.85 + (self.voltage / 24.0) * 0.3
        
        log_r = math.log10(self.resistance)
        ratio_r = log_r / 5.0 # log10(100k) = 5
        scale_r = 0.85 + ratio_r * 0.3
        
        min_i = 0.0001
        max_i = 24.0
        log_min = math.log10(min_i)
        log_max = math.log10(max_i)
        cur_i = max(min_i, min(max_i, self.current))
        log_cur = math.log10(cur_i)
        ratio_i = (log_cur - log_min) / (log_max - log_min)
        scale_i = 0.85 + ratio_i * 0.3
        
        base_size = 20
        font_i = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_i), QFont.Weight.Bold)
        font_eq = QFont(config.FONT_FAMILY_DIGITAL, base_size, QFont.Weight.Bold)
        font_v = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_v), QFont.Weight.Bold)
        font_denom = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_r), QFont.Weight.Bold)
        
        fm_i = QFontMetrics(font_i)
        fm_eq = QFontMetrics(font_eq)
        fm_v = QFontMetrics(font_v)
        fm_denom = QFontMetrics(font_denom)
        
        denom_text = "R + R_L" if has_load else "R"
        
        w_i = fm_i.horizontalAdvance("I")
        h_i = fm_i.height()
        w_eq = fm_eq.horizontalAdvance(" = ")
        h_eq = fm_eq.height()
        w_v = fm_v.horizontalAdvance("V")
        h_v = fm_v.height()
        w_denom = fm_denom.horizontalAdvance(denom_text)
        h_denom = fm_denom.height()
        
        # Calculate dynamic centering and layout
        frac_line_w = max(w_v, w_denom) + 20
        total_w = w_i + 10 + w_eq + 10 + frac_line_w
        start_x = (rect.width() - total_w) / 2.0
        center_y = rect.height() / 2.0 + 10
        
        i_rect = QRectF(start_x, center_y - h_i / 2.0, w_i, h_i)
        eq_rect = QRectF(i_rect.right() + 10, center_y - h_eq / 2.0, w_eq, h_eq)
        
        frac_center_x = eq_rect.right() + 10 + (frac_line_w / 2.0)
        frac_line_rect = QRectF(frac_center_x - frac_line_w / 2.0, center_y, frac_line_w, 2.5)
        
        v_rect = QRectF(frac_center_x - w_v / 2.0, frac_line_rect.top() - h_v - 2, w_v, h_v)
        denom_rect = QRectF(frac_center_x - w_denom / 2.0, frac_line_rect.bottom() + 2, w_denom, h_denom)
        
        # Draw equal
        painter.setFont(font_eq)
        painter.setPen(QColor(config.COLOR_TEXT_PRIMARY))
        painter.drawText(eq_rect, Qt.AlignmentFlag.AlignCenter, "=")
        
        # Draw I
        painter.setFont(font_i)
        glow_color = QColor(config.COLOR_ELECTRON_GLOW)
        painter.setPen(QPen(QColor(glow_color.red(), glow_color.green(), glow_color.blue(), 60), 3))
        painter.drawText(i_rect, Qt.AlignmentFlag.AlignCenter, "I")
        painter.setPen(QColor(glow_color))
        painter.drawText(i_rect, Qt.AlignmentFlag.AlignCenter, "I")
        
        # Draw V
        painter.setFont(font_v)
        painter.setPen(QColor(config.COLOR_BATTERY))
        painter.drawText(v_rect, Qt.AlignmentFlag.AlignCenter, "V")
        
        # Draw Denominator
        painter.setFont(font_denom)
        painter.setPen(QColor(config.COLOR_RESISTOR))
        painter.drawText(denom_rect, Qt.AlignmentFlag.AlignCenter, denom_text)
        
        # Draw line
        painter.fillRect(frac_line_rect, QColor(config.COLOR_BORDER))
        
        # Draw explanations vertically above/below formula to save horizontal space and prevent clipping
        font_help = QFont(config.FONT_FAMILY, 7)
        painter.setFont(font_help)
        painter.setPen(QColor(config.COLOR_TEXT_MUTED))
        
        painter.drawText(
            QRectF(i_rect.center().x() - 50, i_rect.bottom() + 2, 100, 12),
            Qt.AlignmentFlag.AlignCenter,
            "Corrente (I)"
        )
        painter.drawText(
            QRectF(frac_center_x - 50, v_rect.top() - 14, 100, 12),
            Qt.AlignmentFlag.AlignCenter,
            "Tensão (V)"
        )
        
        denom_help = "Resistência Total" if has_load else "Resistência (R)"
        painter.drawText(
            QRectF(frac_center_x - 70, denom_rect.bottom() + 2, 140, 12),
            Qt.AlignmentFlag.AlignCenter,
            denom_help
        )
        
        if has_load:
            font_fn = QFont(config.FONT_FAMILY, 7, QFont.Weight.Bold)
            painter.setFont(font_fn)
            painter.setPen(QColor(config.COLOR_TEXT_MUTED))
            # Format R with thousands dot separator for Portuguese UI (e.g. 10.000)
            fmt_r = f"{int(self.resistance):,}".replace(",", ".")
            painter.drawText(
                QRectF(10, rect.height() - 22, rect.width() - 20, 16),
                Qt.AlignmentFlag.AlignCenter,
                f"Resistência Total: R ({fmt_r}Ω) + R_L ({load_name}: {load_r_val:.0f}Ω) = {int(self.resistance + load_r_val):,}Ω".replace(",", ".")
            )
            
    def draw_parallel_formula(self, painter, rect):
        scale_v = 0.85 + (self.voltage / 24.0) * 0.3
        
        log_r1 = math.log10(self.resistance)
        ratio_r1 = log_r1 / 5.0
        scale_r1 = 0.85 + ratio_r1 * 0.3
        
        log_r2 = math.log10(self.resistance2)
        ratio_r2 = log_r2 / 5.0
        scale_r2 = 0.85 + ratio_r2 * 0.3
        
        min_i = 0.0001
        max_i = 48.0
        log_min = math.log10(min_i)
        log_max = math.log10(max_i)
        cur_i = max(min_i, min(max_i, self.current))
        log_cur = math.log10(cur_i)
        ratio_i = (log_cur - log_min) / (log_max - log_min)
        scale_i = 0.85 + ratio_i * 0.3
        
        base_size = 14 # Decreased base size to prevent clipping in parallel mode
        font_i = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_i), QFont.Weight.Bold)
        font_op = QFont(config.FONT_FAMILY_DIGITAL, base_size, QFont.Weight.Bold)
        font_v = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_v), QFont.Weight.Bold)
        font_r1 = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_r1), QFont.Weight.Bold)
        font_r2 = QFont(config.FONT_FAMILY_DIGITAL, int(base_size * scale_r2), QFont.Weight.Bold)
        
        fm_i = QFontMetrics(font_i)
        fm_op = QFontMetrics(font_op)
        fm_v = QFontMetrics(font_v)
        fm_r1 = QFontMetrics(font_r1)
        fm_r2 = QFontMetrics(font_r2)
        
        denom_text1 = "R_1 + R_L" if self.load_type == config.LOAD_BULB else "R_1"
        denom_text2 = "R_2 + R_L" if self.load_type == config.LOAD_BULB else "R_2"
        
        w_it = fm_i.horizontalAdvance("I_t")
        h_it = fm_i.height()
        w_eq = fm_op.horizontalAdvance(" = ")
        h_eq = fm_op.height()
        w_plus = fm_op.horizontalAdvance(" + ")
        h_plus = fm_op.height()
        
        w_v = fm_v.horizontalAdvance("V")
        h_v = fm_v.height()
        w_r1 = fm_r1.horizontalAdvance(denom_text1)
        h_r1 = fm_r1.height()
        w_r2 = fm_r2.horizontalAdvance(denom_text2)
        h_r2 = fm_r2.height()
        
        frac1_w = max(w_v, w_r1) + 12
        frac2_w = max(w_v, w_r2) + 12
        
        # Arrange layout elements horizontally to ensure it fits perfectly within 320px width
        total_w = w_it + 4 + w_eq + 10 + frac1_w + 6 + w_plus + 10 + frac2_w
        start_x = (rect.width() - total_w) / 2.0
        center_y = rect.height() / 2.0 + 10
        
        i_rect = QRectF(start_x, center_y - h_it / 2.0, w_it, h_it)
        eq_rect = QRectF(i_rect.right() + 4, center_y - h_eq / 2.0, w_eq, h_eq)
        
        frac1_cx = eq_rect.right() + 10 + (frac1_w / 2.0)
        frac1_line = QRectF(frac1_cx - frac1_w / 2.0, center_y, frac1_w, 2.0)
        v1_rect = QRectF(frac1_cx - w_v / 2.0, frac1_line.top() - h_v - 2, w_v, h_v)
        r1_rect = QRectF(frac1_cx - w_r1 / 2.0, frac1_line.bottom() + 2, w_r1, h_r1)
        
        plus_rect = QRectF(frac1_line.right() + 6, center_y - h_plus / 2.0, w_plus, h_plus)
        
        frac2_cx = plus_rect.right() + 10 + (frac2_w / 2.0)
        frac2_line = QRectF(frac2_cx - frac2_w / 2.0, center_y, frac2_w, 2.0)
        v2_rect = QRectF(frac2_cx - w_v / 2.0, frac2_line.top() - h_v - 2, w_v, h_v)
        r2_rect = QRectF(frac2_cx - w_r2 / 2.0, frac2_line.bottom() + 2, w_r2, h_r2)
        
        # Draw I_t
        painter.setFont(font_i)
        glow_color = QColor(config.COLOR_ELECTRON_GLOW)
        painter.setPen(QPen(QColor(glow_color.red(), glow_color.green(), glow_color.blue(), 60), 3))
        painter.drawText(i_rect, Qt.AlignmentFlag.AlignCenter, "I_t")
        painter.setPen(QColor(glow_color))
        painter.drawText(i_rect, Qt.AlignmentFlag.AlignCenter, "I_t")
        
        # Draw = and +
        painter.setFont(font_op)
        painter.setPen(QColor(config.COLOR_TEXT_PRIMARY))
        painter.drawText(eq_rect, Qt.AlignmentFlag.AlignCenter, "=")
        painter.drawText(plus_rect, Qt.AlignmentFlag.AlignCenter, "+")
        
        # Draw Frac 1
        painter.fillRect(frac1_line, QColor(config.COLOR_BORDER))
        painter.setFont(font_v)
        painter.setPen(QColor(config.COLOR_BATTERY))
        painter.drawText(v1_rect, Qt.AlignmentFlag.AlignCenter, "V")
        painter.setFont(font_r1)
        painter.setPen(QColor(config.COLOR_RESISTOR))
        painter.drawText(r1_rect, Qt.AlignmentFlag.AlignCenter, denom_text1)
        
        # Draw Frac 2
        painter.fillRect(frac2_line, QColor(config.COLOR_BORDER))
        painter.setFont(font_v)
        painter.setPen(QColor(config.COLOR_BATTERY))
        painter.drawText(v2_rect, Qt.AlignmentFlag.AlignCenter, "V")
        painter.setFont(font_r2)
        painter.setPen(QColor(config.COLOR_WIRE_LOW))
        painter.drawText(r2_rect, Qt.AlignmentFlag.AlignCenter, denom_text2)
        
        # Draw explanations vertically above/below formula to save space and prevent clipping
        font_help = QFont(config.FONT_FAMILY, 7)
        painter.setFont(font_help)
        painter.setPen(QColor(config.COLOR_TEXT_MUTED))
        
        painter.drawText(
            QRectF(i_rect.center().x() - 50, i_rect.bottom() + 2, 100, 12),
            Qt.AlignmentFlag.AlignCenter,
            "Corrente (I_t)"
        )
        
        painter.drawText(
            QRectF(frac1_cx - 40, v1_rect.top() - 14, 80, 12),
            Qt.AlignmentFlag.AlignCenter,
            "Ramo 1"
        )
        
        painter.drawText(
            QRectF(frac2_cx - 40, v2_rect.top() - 14, 80, 12),
            Qt.AlignmentFlag.AlignCenter,
            "Ramo 2"
        )
        
        # Legend
        font_fn = QFont(config.FONT_FAMILY, 7, QFont.Weight.Bold)
        painter.setFont(font_fn)
        painter.setPen(QColor(config.COLOR_TEXT_MUTED))
        painter.drawText(
            QRectF(10, rect.height() - 22, rect.width() - 20, 16),
            Qt.AlignmentFlag.AlignCenter,
            "Corrente Total (I_t) = I_1 (Ramo 1) + I_2 (Ramo 2)"
        )
