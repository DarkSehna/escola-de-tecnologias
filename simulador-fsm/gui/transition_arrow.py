from PySide6.QtWidgets import QGraphicsPathItem, QGraphicsSimpleTextItem
from PySide6.QtCore import QPointF, QRectF, Qt
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont, QPainterPathStroker
import math
import config

class TransitionArrow(QGraphicsPathItem):
    def __init__(self, source_node, target_node):
        super().__init__()
        self.source_node = source_node
        self.target_node = target_node
        
        # Track connections on both nodes
        self.source_node.add_outgoing(self)
        self.target_node.add_incoming(self)
        
        # Styling
        self.setZValue(-1) # Arrows are drawn behind state nodes
        self.color = QColor(config.COLOR_TRANSITION)
        self.is_selected = False
        
        # Make item selectable
        self.setFlags(
            QGraphicsPathItem.GraphicsItemFlag.ItemIsSelectable |
            QGraphicsPathItem.GraphicsItemFlag.ItemSendsGeometryChanges
        )
        
        self.setPen(QPen(self.color, 2))
        self.line_path = QPainterPath()
        self.arrowhead_path = QPainterPath()

        # Trigger condition label
        self.condition = "NONE"
        self.label_item = QGraphicsSimpleTextItem(self)
        self.label_item.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL, QFont.Weight.Bold))
        self.label_item.setBrush(QBrush(self.color))
        
        self.update_position()

    def set_condition(self, cond):
        self.condition = cond if cond else "NONE"
        if self.condition == "NONE":
            self.label_item.setText("")
        else:
            self.label_item.setText(f"[{self.condition}]")
        self.update_position()

    def update_position(self):
        # Recalculate coordinates and draw arrow path
        path = QPainterPath()
        
        # Check if there is a reverse transition to curve bidirectional lines
        has_reverse = any(arrow.target_node == self.source_node for arrow in self.target_node.outgoing_arrows)
        
        if self.source_node == self.target_node:
            # Self loop: Draw a beautiful bezier curve loop
            node = self.source_node
            x = node.scenePos().x()
            y = node.scenePos().y()
            w = node.width
            h = node.height
            
            # Start at top-right
            start_pt = QPointF(x + w - 20, y)
            # End at bottom-right (entering from the right)
            end_pt = QPointF(x + w, y + h / 2)
            
            # Control points for the loop
            cp1 = QPointF(x + w + 30, y - 40)
            cp2 = QPointF(x + w + 50, y + h / 2 - 20)
            
            path.moveTo(start_pt)
            path.cubicTo(cp1, cp2, end_pt)
            
            angle = math.pi + 0.3  # Pointing into the side
            arrow_path = self.get_arrowhead_path(end_pt, angle)
            self.line_path = path
            self.arrowhead_path = arrow_path
            
            # Position label above the self loop
            if self.label_item.text():
                self.label_item.setPos(x + w + 10, y - 25)
            
        else:
            # Get center points
            c_src = QPointF(
                self.source_node.scenePos().x() + self.source_node.width / 2,
                self.source_node.scenePos().y() + self.source_node.height / 2
            )
            c_tgt = QPointF(
                self.target_node.scenePos().x() + self.target_node.width / 2,
                self.target_node.scenePos().y() + self.target_node.height / 2
            )
            
            # Get intersection boundary points
            rect_src = QRectF(
                self.source_node.scenePos().x(),
                self.source_node.scenePos().y(),
                self.source_node.width,
                self.source_node.height
            )
            rect_tgt = QRectF(
                self.target_node.scenePos().x(),
                self.target_node.scenePos().y(),
                self.target_node.width,
                self.target_node.height
            )
            
            # Exit point from source node
            start_pt = self.get_intersection(c_tgt, c_src, rect_src)
            # Entry point to target node
            end_pt = self.get_intersection(c_src, c_tgt, rect_tgt)
            
            if has_reverse:
                # Bidirectional: Draw curved path (quadratic Bezier) to avoid overlapping
                mid = (start_pt + end_pt) / 2.0
                dx = end_pt.x() - start_pt.x()
                dy = end_pt.y() - start_pt.y()
                length = math.hypot(dx, dy)
                
                if length > 0:
                    nx = -dy / length
                    ny = dx / length
                    # Control point offset perpendicular to line
                    cp = mid + QPointF(nx * 30, ny * 30)
                    
                    path.moveTo(start_pt)
                    path.quadTo(cp, end_pt)
                    
                    # Arrowhead direction is tangent at end of curve (vector from cp to end_pt)
                    tangent_dx = end_pt.x() - cp.x()
                    tangent_dy = end_pt.y() - cp.y()
                    angle = math.atan2(tangent_dy, tangent_dx)
                    arrow_path = self.get_arrowhead_path(end_pt, angle)
                    self.line_path = path
                    self.arrowhead_path = arrow_path
                    
                    # Position label near control point, offset slightly more
                    if self.label_item.text():
                        label_pt = cp + QPointF(nx * 10, ny * 10)
                        self.label_item.setPos(label_pt.x() - 20, label_pt.y() - 6)
                else:
                    path.moveTo(start_pt)
                    path.lineTo(end_pt)
                    arrow_path = self.get_arrowhead_path(end_pt, 0)
                    self.line_path = path
                    self.arrowhead_path = arrow_path
                    if self.label_item.text():
                        self.label_item.setPos(mid)
            else:
                # Unidirectional: Draw straight line
                path.moveTo(start_pt)
                path.lineTo(end_pt)
                
                # Calculate angle of line
                dx = end_pt.x() - start_pt.x()
                dy = end_pt.y() - start_pt.y()
                angle = math.atan2(dy, dx)
                
                # Add arrowhead at end_pt
                arrow_path = self.get_arrowhead_path(end_pt, angle)
                self.line_path = path
                self.arrowhead_path = arrow_path
                
                # Position the trigger condition label near midpoint, offset perpendicular
                if self.label_item.text():
                    mid = (start_pt + end_pt) / 2.0
                    length = math.hypot(dx, dy)
                    if length > 0:
                        nx = -dy / length
                        ny = dx / length
                        offset_pt = mid + QPointF(nx * 12, ny * 12)
                        self.label_item.setPos(offset_pt.x() - 20, offset_pt.y() - 6)
                    else:
                        self.label_item.setPos(mid)
            
        combined_path = QPainterPath()
        combined_path.addPath(self.line_path)
        combined_path.addPath(self.arrowhead_path)
        self.setPath(combined_path)

    def get_arrowhead_path(self, tip, angle):
        # Computes sharp triangular arrowhead points and returns it as a QPainterPath
        arrow_size = 12
        wing_angle = 0.35 # radians (approx 20 degrees)
        
        # Point 1: Tip of the arrow (already at end_pt)
        # Point 2: Left wing
        p2_x = tip.x() - arrow_size * math.cos(angle - wing_angle)
        p2_y = tip.y() - arrow_size * math.sin(angle - wing_angle)
        p2 = QPointF(p2_x, p2_y)
        
        # Point 3: Right wing
        p3_x = tip.x() - arrow_size * math.cos(angle + wing_angle)
        p3_y = tip.y() - arrow_size * math.sin(angle + wing_angle)
        p3 = QPointF(p3_x, p3_y)
        
        path = QPainterPath()
        path.moveTo(tip)
        path.lineTo(p2)
        path.lineTo(p3)
        path.closeSubpath()
        return path

    def get_intersection(self, p_outside, p_inside, rect):
        # Calculate intersection of line segment from p_outside to p_inside with rect
        x1, y1 = p_outside.x(), p_outside.y()
        x2, y2 = p_inside.x(), p_inside.y()
        
        dx = x2 - x1
        dy = y2 - y1
        
        candidates = []
        
        # Left border: x = rect.left()
        if abs(dx) > 1e-6:
            t = (rect.left() - x1) / dx
            if 0.0 <= t <= 1.0:
                y = y1 + t * dy
                if rect.top() <= y <= rect.bottom():
                    candidates.append((t, QPointF(rect.left(), y)))
                    
        # Right border: x = rect.right()
        if abs(dx) > 1e-6:
            t = (rect.right() - x1) / dx
            if 0.0 <= t <= 1.0:
                y = y1 + t * dy
                if rect.top() <= y <= rect.bottom():
                    candidates.append((t, QPointF(rect.right(), y)))
                    
        # Top border: y = rect.top()
        if abs(dy) > 1e-6:
            t = (rect.top() - y1) / dy
            if 0.0 <= t <= 1.0:
                x = x1 + t * dx
                if rect.left() <= x <= rect.right():
                    candidates.append((t, QPointF(x, rect.top())))
                    
        # Bottom border: y = rect.bottom()
        if abs(dy) > 1e-6:
            t = (rect.bottom() - y1) / dy
            if 0.0 <= t <= 1.0:
                x = x1 + t * dx
                if rect.left() <= x <= rect.right():
                    candidates.append((t, QPointF(x, rect.bottom())))
                    
        if not candidates:
            return p_inside # Fallback
            
        # Sort candidates by parameter t. The smallest t is the closest intersection to p_outside.
        candidates.sort(key=lambda item: item[0])
        return candidates[0][1]

    def shape(self):
        stroker = QPainterPathStroker()
        stroker.setWidth(12)
        return stroker.createStroke(self.path())

    def paint(self, painter, option, widget=None):
        painter.save()
        
        # 1. Draw line path (stroked only)
        painter.setPen(self.pen())
        painter.setBrush(Qt.BrushStyle.NoBrush)
        painter.drawPath(self.line_path)
        
        # 2. Draw arrowhead path (filled)
        painter.setBrush(QBrush(self.pen().color()))
        painter.setPen(self.pen())
        painter.drawPath(self.arrowhead_path)
        
        painter.restore()

    def itemChange(self, change, value):
        if change == QGraphicsPathItem.GraphicsItemChange.ItemSelectedHasChanged:
            is_sel = bool(value)
            color = QColor(config.COLOR_TRANS_DRAG) if is_sel else self.color
            self.setPen(QPen(color, 3.5 if is_sel else 2))
            self.label_item.setBrush(QBrush(color))
        return super().itemChange(change, value)

    def disconnect(self):
        # Clean up references
        self.source_node.remove_arrow(self)
        self.target_node.remove_arrow(self)
