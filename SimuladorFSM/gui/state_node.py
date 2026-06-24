from PySide6.QtWidgets import QGraphicsObject
from PySide6.QtCore import QRectF, Qt, QTimer, Signal
from PySide6.QtGui import QPainter, QPen, QColor, QFont, QBrush, QPainterPath
import config

class StateNode(QGraphicsObject):
    # Signals for communicating actions to the editor scene/controller
    doubleClicked = Signal(str)  # Emits state name
    positionChanged = Signal()   # Notification that node was dragged
    
    def __init__(self, name, x=0, y=0):
        super().__init__()
        self.name = name.strip().upper()
        self.setPos(x, y)
        
        # Geometry
        self.width = config.NODE_WIDTH
        self.height = config.NODE_HEIGHT
        
        # State flags
        self.is_active = False
        self.is_error = False
        self.is_hovered = False
        
        # Connected transition arrow tracking
        self.outgoing_arrows = []
        self.incoming_arrows = []
        
        # Make item selectable and draggable
        self.setFlags(
            QGraphicsObject.GraphicsItemFlag.ItemIsSelectable |
            QGraphicsObject.GraphicsItemFlag.ItemIsMovable |
            QGraphicsObject.GraphicsItemFlag.ItemSendsGeometryChanges
        )
        self.setAcceptHoverEvents(True)
        
        # Timer to clear the error flash
        self.error_timer = QTimer()
        self.error_timer.setSingleShot(True)
        self.error_timer.timeout.connect(self.clear_error)

    def boundingRect(self):
        # Slightly larger bounding rect to accommodate border glows
        padding = 15
        return QRectF(-padding, -padding, self.width + padding * 2, self.height + padding * 2)

    def paint(self, painter, option, widget=None):
        # 1. Determine colors based on active / error / hover states
        if self.is_error:
            bg_color = QColor(config.COLOR_ERROR_BG)
            border_color = QColor(config.COLOR_ERROR)
            border_width = 3
        elif self.is_active:
            bg_color = QColor(config.COLOR_ACTIVE_BG)
            border_color = QColor(config.COLOR_ACTIVE_GLOW)
            border_width = 3.5
        else:
            bg_color = QColor(config.COLOR_NODE_BG)
            if self.is_hovered:
                border_color = QColor(config.COLOR_TRANSITION) # Cyan when hovering
                border_width = 2
            else:
                border_color = QColor(config.COLOR_NODE_BORDER)
                border_width = 1.5
                
        rect = QRectF(0, 0, self.width, self.height)
        
        # 2. Draw outer vector glowing contours for active/error states (driver-safe replacement for drop shadow)
        if self.is_active or self.is_error:
            glow_color = QColor(config.COLOR_ERROR) if self.is_error else QColor(config.COLOR_ACTIVE_GLOW)
            
            # Thick, very transparent outer glow layer
            painter.setPen(QPen(QColor(glow_color.red(), glow_color.green(), glow_color.blue(), 20), 8))
            glow_rect1 = rect.adjusted(-4, -4, 4, 4)
            painter.drawRoundedRect(glow_rect1, config.NODE_CORNER_RADIUS + 3, config.NODE_CORNER_RADIUS + 3)
            
            # Medium, slightly firmer intermediate glow layer
            painter.setPen(QPen(QColor(glow_color.red(), glow_color.green(), glow_color.blue(), 50), 4))
            glow_rect2 = rect.adjusted(-2, -2, 2, 2)
            painter.drawRoundedRect(glow_rect2, config.NODE_CORNER_RADIUS + 1, config.NODE_CORNER_RADIUS + 1)

        # 3. Draw state node rounded rectangle background
        path = QPainterPath()
        path.addRoundedRect(rect, config.NODE_CORNER_RADIUS, config.NODE_CORNER_RADIUS)
        painter.fillPath(path, QBrush(bg_color))
        
        # Draw border
        pen = QPen(border_color, border_width)
        painter.setPen(pen)
        painter.drawPath(path)
        
        # 4. Draw text label
        font = QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold)
        painter.setFont(font)
        
        if self.is_active:
            painter.setPen(QColor(config.COLOR_ACTIVE_GLOW))
        elif self.is_error:
            painter.setPen(QColor(config.COLOR_ERROR))
        else:
            painter.setPen(QColor(config.COLOR_NODE_TEXT))
            
        # Draw text fully centered
        painter.drawText(rect, Qt.AlignmentFlag.AlignCenter, self.name)
        
        # 5. Underline accent for aesthetic touch
        accent_y = self.height - 4
        accent_w = self.width - 24
        painter.setPen(QPen(border_color, 1.5, Qt.PenStyle.SolidLine))
        painter.drawLine(12, accent_y, 12 + accent_w, accent_y)

    def set_active(self, active):
        self.is_active = active
        self.update()

    def flash_error(self):
        self.is_error = True
        self.update()
        # Start timer for 300ms
        self.error_timer.start(300)

    def clear_error(self):
        self.is_error = False
        self.update()

    # Event handlers
    def hoverEnterEvent(self, event):
        self.is_hovered = True
        self.update()
        super().hoverEnterEvent(event)

    def hoverLeaveEvent(self, event):
        self.is_hovered = False
        self.update()
        super().hoverLeaveEvent(event)

    def mouseDoubleClickEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.doubleClicked.emit(self.name)
            event.accept()
        else:
            super().mouseDoubleClickEvent(event)

    def itemChange(self, change, value):
        if change == QGraphicsObject.GraphicsItemChange.ItemPositionHasChanged:
            # Notify all connected transition arrows to update their coordinates
            for arrow in self.outgoing_arrows:
                arrow.update_position()
            for arrow in self.incoming_arrows:
                arrow.update_position()
            self.positionChanged.emit()
        return super().itemChange(change, value)

    def add_outgoing(self, arrow):
        if arrow not in self.outgoing_arrows:
            self.outgoing_arrows.append(arrow)

    def add_incoming(self, arrow):
        if arrow not in self.incoming_arrows:
            self.incoming_arrows.append(arrow)

    def remove_arrow(self, arrow):
        if arrow in self.outgoing_arrows:
            self.outgoing_arrows.remove(arrow)
        if arrow in self.incoming_arrows:
            self.incoming_arrows.remove(arrow)
