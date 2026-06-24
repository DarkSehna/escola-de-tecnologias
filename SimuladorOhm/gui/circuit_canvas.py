import math
from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsItem
from PySide6.QtCore import Qt, QTimer, QRectF, QPointF
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QLinearGradient, QRadialGradient, QFont

import config

# Global schematic drawing helpers
def draw_schematic_resistor(painter, cx, cy, horizontal=True, resistance=10.0, scale=1.0):
    """Draws a standardized IEEE zig-zag resistor symbol centered at (cx, cy)."""
    painter.save()
    painter.translate(cx, cy)
    painter.scale(scale, scale)
    
    r_factor = min(1.0, resistance / 100000.0)
    # Color fades from yellow-orange to intense red at high R
    res_color = QColor(
        int(200 + r_factor * 55),
        int(160 - r_factor * 140),
        int(50 - r_factor * 50)
    )
    
    # Draw outer glow
    glow_pen = QPen(QColor(res_color.red(), res_color.green(), res_color.blue(), 50), 7, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.MiterJoin)
    painter.setBrush(Qt.BrushStyle.NoBrush)
    
    # Core pen
    core_pen = QPen(res_color, 3.0, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap, Qt.PenJoinStyle.MiterJoin)
    
    path = QPainterPath()
    if horizontal:
        # Horizontal zig-zag (length 80px, centered at 0,0)
        path.moveTo(-40, 0)
        path.lineTo(-30, 0)
        path.lineTo(-24, -12)
        path.lineTo(-16, 12)
        path.lineTo(-8, -12)
        path.lineTo(0, 12)
        path.lineTo(8, -12)
        path.lineTo(16, 12)
        path.lineTo(24, -12)
        path.lineTo(30, 0)
        path.lineTo(40, 0)
    else:
        # Vertical zig-zag (height 80px, centered at 0,0)
        path.moveTo(0, -40)
        path.lineTo(0, -30)
        path.lineTo(-12, -24)
        path.lineTo(12, -16)
        path.lineTo(-12, -8)
        path.lineTo(12, 0)
        path.lineTo(-12, 8)
        path.lineTo(12, 16)
        path.lineTo(-12, 24)
        path.lineTo(0, 30)
        path.lineTo(0, 40)
        
    painter.setPen(glow_pen)
    painter.drawPath(path)
    painter.setPen(core_pen)
    painter.drawPath(path)
    
    painter.restore()


def draw_schematic_bulb(painter, cx, cy, current=1.20, burned=False, scale=1.0):
    """Draws a standardized circle with X bulb symbol centered at (cx, cy)."""
    painter.save()
    painter.translate(cx, cy)
    painter.scale(scale, scale)
    
    if current > 0.0001 and not burned:
        # Root pow factor ensures visibility at lower currents (like 100mA)
        factor = min(1.0, math.pow(current / 1.5, 0.35))
    else:
        factor = 0.0
        
    # 1. Background Radial Glow
    if factor > 0.01:
        glow_radius = 35.0 + factor * 65.0
        glow_grad = QRadialGradient(QPointF(0, 0), glow_radius)
        glow_grad.setColorAt(0.0, QColor(255, 255, 180, int(factor * 210)))
        glow_grad.setColorAt(0.35, QColor(255, 190, 50, int(factor * 110)))
        glow_grad.setColorAt(1.0, QColor(255, 100, 0, 0))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(glow_grad))
        painter.drawEllipse(QPointF(0, 0), glow_radius, glow_radius)
        
    # 2. Outer Ring & Body
    painter.setPen(QPen(QColor(config.COLOR_BORDER), 2.5))
    if factor > 0.01:
        r = int(13 + factor * (255 - 13))
        g = int(18 + factor * (240 - 18))
        b = int(28 + factor * (120 - 28))
        body_color = QColor(r, g, b)
    else:
        body_color = QColor("#0d121c")
        
    painter.setBrush(QBrush(body_color))
    painter.drawEllipse(QPointF(0, 0), 28, 28)
    
    # 3. Inner Glow Overlay (Makes the bulb itself look glowing with 3D glass shine)
    if factor > 0.01:
        inner_grad = QRadialGradient(QPointF(-6, -6), 25)
        inner_grad.setColorAt(0.0, QColor(255, 255, 255, int(factor * 230)))
        inner_grad.setColorAt(0.5, QColor(255, 230, 80, int(factor * 180)))
        inner_grad.setColorAt(1.0, QColor(255, 150, 0, int(factor * 100)))
        painter.setPen(Qt.PenStyle.NoPen)
        painter.setBrush(QBrush(inner_grad))
        painter.drawEllipse(QPointF(0, 0), 27, 27)
        
    # 4. Crossed X Lines (Filament)
    if burned:
        # Draw broken filament: gap in the middle of X
        painter.setPen(QPen(QColor("#4f5e75"), 3, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(-18, -18, -4, -4)
        painter.drawLine(4, 4, 18, 18)
        painter.drawLine(18, -18, 4, -4)
        painter.drawLine(-4, 4, -18, 18)
    else:
        if factor > 0.01:
            r = int(200 + factor * 55)
            g = int(80 + factor * 175)
            b = int(30 + factor * 225)
            filament_color = QColor(r, g, b)
        else:
            filament_color = QColor(68, 68, 68)
            
        painter.setPen(QPen(filament_color, 4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(-18, -18, 18, 18)
        painter.drawLine(18, -18, -18, 18)
        
    painter.restore()


def draw_schematic_motor(painter, cx, cy, rotation_angle=0.0, scale=1.0):
    """Draws a standardized circle with M motor symbol centered at (cx, cy)."""
    painter.save()
    painter.translate(cx, cy)
    painter.scale(scale, scale)
    
    # Inner casing fill
    painter.setPen(QPen(QColor(config.COLOR_BORDER), 2.5))
    painter.setBrush(QBrush(QColor("#1e2536")))
    painter.drawEllipse(QPointF(0, 0), 28, 28)
    
    # Upright M letter
    font_m = QFont(config.FONT_FAMILY, 15, QFont.Weight.Bold)
    painter.setFont(font_m)
    painter.setPen(QColor(config.COLOR_TEXT_PRIMARY))
    painter.drawText(QRectF(-20, -20, 40, 40), Qt.AlignmentFlag.AlignCenter, "M")
    
    # Rotating outer dashed ring
    painter.save()
    painter.rotate(rotation_angle)
    
    dash_pen = QPen(QColor(config.COLOR_WIRE_LOW), 2.5)
    dash_pen.setStyle(Qt.PenStyle.DashLine)
    painter.setPen(dash_pen)
    painter.setBrush(Qt.BrushStyle.NoBrush)
    painter.drawEllipse(QPointF(0, 0), 28, 28)
    
    painter.restore()
    painter.restore()


class WireItem(QGraphicsItem):
    """Draws the circuit wires dynamically based on topology mode."""
    def __init__(self, mode="series"):
        super().__init__()
        self.mode = mode
        self.voltage = 12.0
        self.load_type = config.LOAD_RESISTOR
        self.setZValue(-2)
        
    def set_voltage_and_load(self, voltage, load_type):
        self.voltage = voltage
        self.load_type = load_type
        self.update()
        
    def boundingRect(self):
        pad = 20
        return QRectF(
            config.CIRCUIT_X - pad,
            config.CIRCUIT_Y - pad,
            config.CIRCUIT_WIDTH + pad * 2,
            config.CIRCUIT_HEIGHT + pad * 2
        )
        
    def paint(self, painter, option, widget=None):
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        intensity = int(150 + (self.voltage / 24.0) * 105)
        high_color = QColor(255, intensity, 0)
        low_color = QColor(config.COLOR_WIRE_LOW)
        
        path_high = QPainterPath()
        path_low = QPainterPath()
        
        if self.mode == "series":
            has_top_resistor = (self.load_type != config.LOAD_RESISTOR)
            
            # Segment 1: Battery (+) to top-right
            path_high.moveTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2 - 30)
            path_high.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y)
            
            if has_top_resistor:
                # Top Resistor gap from X=295 to X=375
                path_high.lineTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2 - 40, config.CIRCUIT_Y)
                path_high.moveTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2 + 40, config.CIRCUIT_Y)
                
            path_high.lineTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH, config.CIRCUIT_Y)
            path_high.lineTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH, config.CIRCUIT_Y + 90)
            
            # Segment 2: Carga output to battery (-)
            path_low.moveTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH, config.CIRCUIT_Y + 190)
            path_low.lineTo(config.CIRCUIT_X + config.CIRCUIT_WIDTH, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            path_low.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            path_low.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2 + 30)
            
        else: # parallel mode
            # Battery (+) to split point
            path_high.moveTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2 - 30)
            path_high.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y)
            path_high.lineTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y)
            
            # Low wire: Merge point to battery (-)
            path_low.moveTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            path_low.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            path_low.lineTo(config.CIRCUIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2 + 30)
            
            if self.load_type == config.LOAD_RESISTOR:
                # Standard single gap (140 to 240) in each branch
                # Branch 1 (inner): split to 540, down to Y=140
                path_high.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 90)
                
                # Branch 1 low wire: Y=240 to Y=330, left to split
                path_low.moveTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 190)
                path_low.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                path_low.lineTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                
                # Branch 2 (outer): split to 610, down to Y=140
                path_high.moveTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 90)
                
                # Branch 2 low wire: Y=240 to Y=330, left to split
                path_low.moveTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 190)
                path_low.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                path_low.lineTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            else:
                # Bulb mode in parallel: each branch has Resistor + Bulb in series
                # Resistor gap: Y=80 to Y=140
                # Bulb gap: Y=200 to Y=260
                
                # Branch 1:
                path_high.moveTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 30) # wire to resistor 1 top
                path_high.moveTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 90) # resistor 1 bottom to bulb 1 top
                path_high.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 150)
                
                path_low.moveTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 210) # bulb 1 bottom to branch 1 bottom
                path_low.lineTo(config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                path_low.lineTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                
                # Branch 2:
                path_high.moveTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y)
                path_high.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 30) # wire to resistor 2 top
                path_high.moveTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 90) # resistor 2 bottom to bulb 2 top
                path_high.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 150)
                
                path_low.moveTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 210) # bulb 2 bottom to branch 2 bottom
                path_low.lineTo(config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                path_low.lineTo(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                
        # Draw outer glows
        pen_glow_high = QPen(QColor(high_color.red(), high_color.green(), high_color.blue(), 25), 10)
        pen_glow_low = QPen(QColor(low_color.red(), low_color.green(), low_color.blue(), 25), 10)
        
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.setPen(pen_glow_high)
        painter.drawPath(path_high)
        painter.setPen(pen_glow_low)
        painter.drawPath(path_low)
        
        # Draw cores
        pen_core_high = QPen(high_color, 4)
        pen_core_low = QPen(low_color, 4)
        painter.setPen(pen_core_high)
        painter.drawPath(path_high)
        painter.setPen(pen_core_low)
        painter.drawPath(path_low)


class BatteryItem(QGraphicsItem):
    """Draws a gamified glowing Battery with charge indicator."""
    def __init__(self):
        super().__init__()
        self.voltage = 12.0
        self.width = 40
        self.height = 80
        self.x = config.CIRCUIT_X - self.width // 2
        self.y = config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2 - self.height // 2
        
    def set_voltage(self, voltage):
        self.voltage = voltage
        self.update()
        
    def boundingRect(self):
        pad = 10
        return QRectF(self.x - pad, self.y - pad, self.width + pad * 2, self.height + pad * 2)
        
    def paint(self, painter, option, widget=None):
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect = QRectF(self.x, self.y, self.width, self.height)
        
        glow_alpha = int(40 + (self.voltage / 24.0) * 100)
        glow_color = QColor(0, 255, 102, glow_alpha)
        
        painter.setPen(QPen(glow_color, 6))
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawRoundedRect(rect.adjusted(-2, -2, 2, 2), 6, 6)
        
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 2.5))
        painter.setBrush(QBrush(QColor(config.COLOR_PANEL_BG)))
        painter.drawRoundedRect(rect, 4, 4)
        
        charge_height = int((self.voltage / 24.0) * (self.height - 12))
        if charge_height > 0:
            charge_rect = QRectF(self.x + 4, self.y + self.height - 4 - charge_height, self.width - 8, charge_height)
            grad = QLinearGradient(charge_rect.topLeft(), charge_rect.bottomLeft())
            grad.setColorAt(0, QColor("#00ff66"))
            grad.setColorAt(1, QColor("#008833"))
            painter.fillRect(charge_rect, QBrush(grad))
            
        font = QFont(config.FONT_FAMILY, 9, QFont.Weight.Bold)
        painter.setFont(font)
        
        painter.setPen(QColor(config.COLOR_WIRE_HIGH))
        painter.drawText(QRectF(self.x, self.y + 4, self.width, 15), Qt.AlignmentFlag.AlignCenter, "+")
        
        painter.setPen(QColor(config.COLOR_WIRE_LOW))
        painter.drawText(QRectF(self.x, self.y + self.height - 20, self.width, 15), Qt.AlignmentFlag.AlignCenter, "-")
        
        font_lbl = QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold)
        painter.setFont(font_lbl)
        painter.setPen(QColor(config.COLOR_TEXT_PRIMARY))
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, f"{self.voltage:.1f}V")


class Electron:
    """Class tracking single electron physics along the loop."""
    def __init__(self, start_dist):
        self.distance = start_dist
        
    def move(self, speed, loop_perimeter):
        self.distance = (self.distance + speed) % loop_perimeter
        
    def get_position_series(self, w, h):
        d = self.distance
        cx = config.CIRCUIT_X
        cy = config.CIRCUIT_Y
        
        if d < w:
            return QPointF(cx + d, cy + h)
        elif d < (w + h):
            offset = d - w
            return QPointF(cx + w, cy + h - offset)
        elif d < (2 * w + h):
            offset = d - (w + h)
            return QPointF(cx + w - offset, cy)
        else:
            offset = d - (2 * w + h)
            return QPointF(cx, cy + offset)
            
    def get_position_parallel_main(self, total_len):
        d = self.distance % total_len
        cx = config.CIRCUIT_X
        cy = config.CIRCUIT_Y
        
        if d < 430:
            return QPointF(490 - d, cy + config.CIRCUIT_HEIGHT)
        elif d < 710:
            offset = d - 430
            return QPointF(cx, cy + config.CIRCUIT_HEIGHT - offset)
        else:
            offset = d - 710
            return QPointF(cx + offset, cy)
            
    def get_position_parallel_b1(self, total_len):
        d = self.distance % total_len
        cy = config.CIRCUIT_Y
        
        if d < 50:
            return QPointF(490 + d, cy)
        elif d < 330:
            offset = d - 50
            return QPointF(540, cy + offset)
        else:
            offset = d - 330
            return QPointF(540 - offset, cy + config.CIRCUIT_HEIGHT)
            
    def get_position_parallel_b2(self, total_len):
        d = self.distance % total_len
        cy = config.CIRCUIT_Y
        
        if d < 120:
            return QPointF(490 + d, cy)
        elif d < 400:
            offset = d - 120
            return QPointF(610, cy + offset)
        else:
            offset = d - 400
            return QPointF(610 - offset, cy + config.CIRCUIT_HEIGHT)


class CircuitCanvas(QGraphicsView):
    """Interactive canvas rendering all components and running electron loop."""
    def __init__(self, mode="series", parent=None):
        self.scene = QGraphicsScene()
        self.scene.setSceneRect(0, 0, 680, 380)
        super().__init__(self.scene, parent)
        
        self.mode = mode
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setViewportUpdateMode(QGraphicsView.ViewportUpdateMode.FullViewportUpdate)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setStyleSheet("border: none; background: transparent;")
        
        # State variables
        self.voltage = 12.0
        self.resistance = 10.0
        self.resistance2 = 20.0
        self.current = 1.20
        self.load_type = config.LOAD_RESISTOR
        
        # Burnout flags
        self.bulb_burned = False
        self.bulb1_burned = False
        self.bulb2_burned = False
        
        self.rotation_angle = 0.0
        
        self.loop_w = config.CIRCUIT_WIDTH
        self.loop_h = config.CIRCUIT_HEIGHT
        self.perimeter = 2 * (self.loop_w + self.loop_h)
        
        self.wire_item = WireItem(self.mode)
        self.battery_item = BatteryItem()
        self.scene.addItem(self.wire_item)
        self.scene.addItem(self.battery_item)
        
        # Electrons
        if self.mode == "series":
            self.electrons = []
            step = self.perimeter / config.ELECTRON_COUNT
            for i in range(config.ELECTRON_COUNT):
                self.electrons.append(Electron(i * step))
        else:
            self.electrons_main = []
            for i in range(18):
                self.electrons_main.append(Electron(i * (1140 / 18)))
                
            self.electrons_b1 = []
            for i in range(9):
                self.electrons_b1.append(Electron(i * (380 / 9)))
                
            self.electrons_b2 = []
            for i in range(9):
                self.electrons_b2.append(Electron(i * (520 / 9)))
                
        # Timer
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.update_animation)
        self.timer.start(16)
        
        self.update_values(self.voltage, self.resistance)
        
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
            if self.load_type == config.LOAD_BULB and self.current > 1.5:
                self.bulb_burned = True
                self.current = 0.0
            else:
                self.bulb_burned = False
        else: # parallel mode
            if self.load_type == config.LOAD_BULB:
                # Branch 1 series: Resistor 1 + Bulb (10 ohm)
                i1 = voltage / (resistance + 10.0)
                if i1 > 1.5:
                    self.bulb1_burned = True
                    i1 = 0.0
                else:
                    self.bulb1_burned = False
                    
                # Branch 2 series: Resistor 2 + Bulb (10 ohm)
                i2 = voltage / (resistance2 + 10.0)
                if i2 > 1.5:
                    self.bulb2_burned = True
                    i2 = 0.0
                else:
                    self.bulb2_burned = False
                    
                self.current = i1 + i2
            else:
                self.bulb1_burned = False
                self.bulb2_burned = False
                self.current = (voltage / resistance) + (voltage / resistance2)
                
        self.wire_item.set_voltage_and_load(voltage, self.load_type)
        self.battery_item.set_voltage(voltage)
        
    def set_load_type(self, load_type):
        self.load_type = load_type
        self.update_values(self.voltage, self.resistance, self.resistance2)
        
    def update_animation(self):
        if self.mode == "series":
            speed = self.current * config.BASE_SPEED_MULTIPLIER
            if self.current > 0.0001:
                speed = max(config.MIN_SPEED, min(config.MAX_SPEED, speed))
            else:
                speed = 0.0
            for e in self.electrons:
                e.move(speed, self.perimeter)
        else:
            # Parallel mode: Branch speeds match branch currents
            # Branch 1 current
            if self.load_type == config.LOAD_BULB:
                i1 = 0.0 if self.bulb1_burned else (self.voltage / (self.resistance + 10.0))
            else:
                i1 = self.voltage / self.resistance
            speed_b1 = i1 * config.BASE_SPEED_MULTIPLIER
            speed_b1 = max(config.MIN_SPEED, min(config.MAX_SPEED, speed_b1)) if i1 > 0.0001 else 0.0
            for e in self.electrons_b1:
                e.move(speed_b1, 380)
                
            # Branch 2 current
            if self.load_type == config.LOAD_BULB:
                i2 = 0.0 if self.bulb2_burned else (self.voltage / (self.resistance2 + 10.0))
            else:
                i2 = self.voltage / self.resistance2
            speed_b2 = i2 * config.BASE_SPEED_MULTIPLIER
            speed_b2 = max(config.MIN_SPEED, min(config.MAX_SPEED, speed_b2)) if i2 > 0.0001 else 0.0
            for e in self.electrons_b2:
                e.move(speed_b2, 520)
                
            # Main current: i1 + i2
            i_total = i1 + i2
            speed_main = i_total * config.BASE_SPEED_MULTIPLIER
            speed_main = max(config.MIN_SPEED, min(config.MAX_SPEED, speed_main)) if i_total > 0.0001 else 0.0
            for e in self.electrons_main:
                e.move(speed_main, 1140)
                
        if self.load_type == config.LOAD_MOTOR and self.current > 0.0001:
            rot_speed = self.current * 7.0
            rot_speed = max(0.5, min(35.0, rot_speed))
            self.rotation_angle = (self.rotation_angle + rot_speed) % 360.0
            
        self.scene.update()
        
    def drawBackground(self, painter, rect):
        painter.fillRect(rect, QColor(config.COLOR_BG))
        
        # Grid
        grid_size = 20
        pen = QPen(QColor("#0d1321"), 0.5)
        painter.setPen(pen)
        
        left = int(rect.left()) - (int(rect.left()) % grid_size)
        top = int(rect.top()) - (int(rect.top()) % grid_size)
        
        for x in range(left, int(rect.right()), grid_size):
            painter.drawLine(x, int(rect.top()), x, int(rect.bottom()))
        for y in range(top, int(rect.bottom()), grid_size):
            painter.drawLine(int(rect.left()), y, int(rect.right()), y)
            
    def drawForeground(self, painter, rect):
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # 1. Flowing electrons
        def draw_electron_dot(pos):
            radial_grad = QRadialGradient(pos, config.ELECTRON_RADIUS * 2)
            radial_grad.setColorAt(0, QColor(255, 255, 50, 180))
            radial_grad.setColorAt(0.5, QColor(255, 200, 0, 80))
            radial_grad.setColorAt(1.0, QColor(255, 100, 0, 0))
            
            painter.setPen(Qt.PenStyle.NoPen)
            painter.setBrush(QBrush(radial_grad))
            painter.drawEllipse(pos, config.ELECTRON_RADIUS * 2.5, config.ELECTRON_RADIUS * 2.5)
            
            painter.setBrush(QBrush(QColor(config.COLOR_ELECTRON)))
            painter.drawEllipse(pos, config.ELECTRON_RADIUS, config.ELECTRON_RADIUS)
            
        if self.mode == "series":
            for e in self.electrons:
                draw_electron_dot(e.get_position_series(self.loop_w, self.loop_h))
        else:
            for e in self.electrons_main:
                draw_electron_dot(e.get_position_parallel_main(1140))
            for e in self.electrons_b1:
                draw_electron_dot(e.get_position_parallel_b1(380))
            for e in self.electrons_b2:
                draw_electron_dot(e.get_position_parallel_b2(520))
                
        # 2. Draw Schematic Components on Canvas (at double size!)
        if self.mode == "series":
            if self.load_type == config.LOAD_RESISTOR:
                # Single load resistor
                draw_schematic_resistor(painter, config.CIRCUIT_X + config.CIRCUIT_WIDTH, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2, False, self.resistance)
            else:
                # Series load: Resistor on top, Bulb/Motor on the right
                draw_schematic_resistor(painter, config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2, config.CIRCUIT_Y, True, self.resistance)
                
                cx_right = config.CIRCUIT_X + config.CIRCUIT_WIDTH
                cy_right = config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2
                if self.load_type == config.LOAD_BULB:
                    draw_schematic_bulb(painter, cx_right, cy_right, self.current, self.bulb_burned)
                else: # motor
                    draw_schematic_motor(painter, cx_right, cy_right, self.rotation_angle)
        else:
            # Parallel mode:
            cy_cargash = config.CIRCUIT_Y + config.CIRCUIT_HEIGHT // 2
            if self.load_type == config.LOAD_RESISTOR:
                # Two resistors in parallel
                draw_schematic_resistor(painter, config.PARALLEL_BRANCH_1_X, cy_cargash, False, self.resistance)
                draw_schematic_resistor(painter, config.PARALLEL_BRANCH_2_X, cy_cargash, False, self.resistance2)
            else:
                # Two branches in parallel, each containing Resistor + Bulb in series
                # Branch 1 (inner): Resistor at Y=110 (scale=0.7), Bulb at Y=230 (scale=0.75)
                i1 = 0.0 if self.bulb1_burned else (self.voltage / (self.resistance + 10.0))
                draw_schematic_resistor(painter, config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 60, False, self.resistance, 0.7)
                draw_schematic_bulb(painter, config.PARALLEL_BRANCH_1_X, config.CIRCUIT_Y + 180, i1, self.bulb1_burned, 0.75)
                
                # Branch 2 (outer): Resistor at Y=110 (scale=0.7), Bulb at Y=230 (scale=0.75)
                i2 = 0.0 if self.bulb2_burned else (self.voltage / (self.resistance2 + 10.0))
                draw_schematic_resistor(painter, config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 60, False, self.resistance2, 0.7)
                draw_schematic_bulb(painter, config.PARALLEL_BRANCH_2_X, config.CIRCUIT_Y + 180, i2, self.bulb2_burned, 0.75)
                
        # 3. Draw Voltmeters
        if self.mode == "series":
            if self.load_type == config.LOAD_RESISTOR:
                pos_v1 = QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH - 60, config.CIRCUIT_Y)
                self.draw_voltmeter_probe(painter, pos_v1, f"{self.voltage:.1f} V", config.COLOR_WIRE_HIGH, "Ponto A (Entrada)")
                
                pos_v2 = QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH - 60, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                self.draw_voltmeter_probe(painter, pos_v2, "0.0 V", config.COLOR_WIRE_LOW, "Ponto B (Saída)")
            else:
                # 3 Voltmeters for series divisor
                pos_v1 = QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2 - 80, config.CIRCUIT_Y)
                self.draw_voltmeter_probe(painter, pos_v1, f"{self.voltage:.1f} V", config.COLOR_WIRE_HIGH, "Ponto A (Entrada)")
                
                load_r = 10.0 if self.load_type == config.LOAD_BULB else 15.0
                v_mid = self.current * load_r if not self.bulb_burned else self.voltage
                pos_v2 = QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2 + 80, config.CIRCUIT_Y)
                self.draw_voltmeter_probe(painter, pos_v2, f"{v_mid:.1f} V", "#9400D3", "Ponto B (Intermediário)")
                
                pos_v3 = QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH - 60, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
                self.draw_voltmeter_probe(painter, pos_v3, "0.0 V", config.COLOR_WIRE_LOW, "Ponto C (Saída)")
        else:
            # Parallel: voltage across both branches
            pos_v1 = QPointF(config.PARALLEL_SPLIT_X - 40, config.CIRCUIT_Y)
            self.draw_voltmeter_probe(painter, pos_v1, f"{self.voltage:.1f} V", config.COLOR_WIRE_HIGH, "Ponto A (Entrada)")
            
            pos_v2 = QPointF(config.PARALLEL_SPLIT_X - 40, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT)
            self.draw_voltmeter_probe(painter, pos_v2, "0.0 V", config.COLOR_WIRE_LOW, "Ponto B (Saída)")
            
        # 4. Giant Polarity Signs (+ and -)
        font_signs = QFont(config.FONT_FAMILY, 16, QFont.Weight.Bold)
        painter.setFont(font_signs)
        
        def draw_neon_sign(char, pos, color_hex):
            color = QColor(color_hex)
            rect_sign = QRectF(pos.x() - 15, pos.y() - 15, 30, 30)
            painter.setPen(QPen(QColor(color.red(), color.green(), color.blue(), 50), 3))
            painter.drawText(rect_sign, Qt.AlignmentFlag.AlignCenter, char)
            painter.setPen(color)
            painter.drawText(rect_sign, Qt.AlignmentFlag.AlignCenter, char)
            
        # Battery Polarity
        draw_neon_sign("+", QPointF(config.CIRCUIT_X - 35, config.CIRCUIT_Y + 25), config.COLOR_WIRE_HIGH)
        draw_neon_sign("-", QPointF(config.CIRCUIT_X - 35, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT - 25), config.COLOR_WIRE_LOW)
        
        # Consumer Polarity
        if self.mode == "series":
            if self.load_type == config.LOAD_RESISTOR:
                draw_neon_sign("+", QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH + 35, config.CIRCUIT_Y + 25), config.COLOR_WIRE_HIGH)
                draw_neon_sign("-", QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH + 35, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT - 25), config.COLOR_WIRE_LOW)
            else:
                draw_neon_sign("+", QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH // 2 - 80, config.CIRCUIT_Y - 25), config.COLOR_WIRE_HIGH)
                draw_neon_sign("-", QPointF(config.CIRCUIT_X + config.CIRCUIT_WIDTH + 35, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT - 25), config.COLOR_WIRE_LOW)
        else:
            draw_neon_sign("+", QPointF(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y - 25), config.COLOR_WIRE_HIGH)
            draw_neon_sign("-", QPointF(config.PARALLEL_SPLIT_X, config.CIRCUIT_Y + config.CIRCUIT_HEIGHT + 25), config.COLOR_WIRE_LOW)
        
    def draw_voltmeter_probe(self, painter, pos, text, color_hex, label):
        color = QColor(color_hex)
        painter.setPen(QPen(color, 2))
        painter.setBrush(QBrush(QColor(config.COLOR_BG)))
        painter.drawEllipse(pos, 6, 6)
        
        is_top = (pos.y() < 150)
        offset_y = -35 if is_top else 35
        dest_pt = QPointF(pos.x(), pos.y() + offset_y)
        
        painter.drawLine(pos, dest_pt)
        
        box_w = 110
        box_h = 24
        box_rect = QRectF(dest_pt.x() - box_w / 2, dest_pt.y() - box_h / 2, box_w, box_h)
        
        painter.setBrush(QBrush(QColor(config.COLOR_PANEL_BG)))
        painter.setPen(QPen(color, 1.5))
        painter.drawRoundedRect(box_rect, 3, 3)
        
        font = QFont(config.FONT_FAMILY_DIGITAL, 9, QFont.Weight.Bold)
        painter.setFont(font)
        painter.setPen(QColor(config.COLOR_TEXT_PRIMARY))
        painter.drawText(box_rect, Qt.AlignmentFlag.AlignCenter, text)
        
        font_lbl = QFont(config.FONT_FAMILY, 7)
        painter.setFont(font_lbl)
        painter.setPen(QColor(config.COLOR_TEXT_MUTED))
        lbl_rect = QRectF(dest_pt.x() - 60, dest_pt.y() + (13 if is_top else -25), 120, 12)
        painter.drawText(lbl_rect, Qt.AlignmentFlag.AlignCenter, label)
