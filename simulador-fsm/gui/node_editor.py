from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsLineItem
from PySide6.QtCore import Qt, QPointF, Signal, QRectF
from PySide6.QtGui import QPainter, QPen, QColor
import math
import config
from gui.state_node import StateNode
from gui.transition_arrow import TransitionArrow

class NodeEditorScene(QGraphicsScene):
    nodeDoubleClicked = Signal(str)        # Emits state_name for FSM transition check
    selectionDeleted = Signal(list)        # Emits list of deleted items

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setSceneRect(-2000, -2000, 4000, 4000)

    def drawBackground(self, painter, rect):
        # Draw blueprint grid background
        painter.fillRect(rect, QColor(config.COLOR_BG))
        
        left = int(math.floor(rect.left()))
        top = int(math.floor(rect.top()))
        right = int(math.ceil(rect.right()))
        bottom = int(math.ceil(rect.bottom()))
        
        grid_size = config.GRID_SIZE
        first_x = left - (left % grid_size)
        first_y = top - (top % grid_size)
        
        # 1. Subtle Sub-grid (every 8px)
        sub_size = grid_size // 4
        first_sub_x = left - (left % sub_size)
        first_sub_y = top - (top % sub_size)
        
        pen_sub = QPen(QColor(config.COLOR_GRID_SUB), 0.5, Qt.PenStyle.SolidLine)
        painter.setPen(pen_sub)
        for x in range(first_sub_x, right, sub_size):
            if x % grid_size != 0:
                painter.drawLine(x, top, x, bottom)
        for y in range(first_sub_y, bottom, sub_size):
            if y % grid_size != 0:
                painter.drawLine(left, y, right, y)
                
        # 2. Main Grid Lines (every 32px)
        pen_main = QPen(QColor(config.COLOR_GRID_LINE), 1.0, Qt.PenStyle.SolidLine)
        painter.setPen(pen_main)
        for x in range(first_x, right, grid_size):
            painter.drawLine(x, top, x, bottom)
        for y in range(first_y, bottom, grid_size):
            painter.drawLine(left, y, right, y)


class NodeEditorView(QGraphicsView):
    # Signals communicating drag-and-drop and transition edits to MainWindow
    stateDropped = Signal(str, QPointF)    # Emits state_name, scene_position
    transitionRequested = Signal(str, str) # Emits source_name, target_name
    keyPressed = Signal(int)               # Emits pressed key code
    mouseClicked = Signal(Qt.MouseButton)  # Emits clicked mouse button

    def __init__(self, scene, parent=None):
        super().__init__(scene, parent)
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)
        self.setViewportUpdateMode(QGraphicsView.ViewportUpdateMode.FullViewportUpdate)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        
        # Styling view
        self.setStyleSheet("border: none; background: transparent;")
        
        # Center view around 0,0 initially
        self.centerOn(0, 0)
        
        # Enable rubber band selection
        self.setDragMode(QGraphicsView.DragMode.RubberBandDrag)
        self.setInteractive(True)
        
        # Drag and Drop settings
        self.setAcceptDrops(True)
        
        # Panning variables
        self._pan = False
        self._pan_start_x = 0
        self._pan_start_y = 0
        
        # Right-click connection variables
        self._drag_conn = False
        self._drag_source = None
        self._temp_line = None

    # Drag and Drop handlers
    def dragEnterEvent(self, event):
        if event.mimeData().hasText():
            event.acceptProposedAction()
        else:
            super().dragEnterEvent(event)

    def dragMoveEvent(self, event):
        if event.mimeData().hasText():
            event.acceptProposedAction()
        else:
            super().dragMoveEvent(event)

    def dropEvent(self, event):
        if event.mimeData().hasText():
            state_name = event.mimeData().text()
            view_pos = event.position().toPoint()
            scene_pos = self.mapToScene(view_pos)
            self.stateDropped.emit(state_name, scene_pos)
            event.acceptProposedAction()
        else:
            super().dropEvent(event)

    # Key events
    def keyPressEvent(self, event):
        # Emit key pressed signal for trigger validations
        self.keyPressed.emit(event.key())
        
        # Catch Delete key to delete selected states/connections
        if event.key() == Qt.Key.Key_Delete:
            selected = self.scene().selectedItems()
            if selected:
                self.scene().selectionDeleted.emit(selected)
                event.accept()
                return
                
        super().keyPressEvent(event)

    # Mouse events for custom panning and right-click connection
    def mousePressEvent(self, event):
        # 1. Middle button drag starts panning
        if event.button() == Qt.MouseButton.MiddleButton:
            self._pan = True
            self._pan_start_x = event.position().x()
            self._pan_start_y = event.position().y()
            self.viewport().setCursor(Qt.CursorShape.ClosedHandCursor)
            event.accept()
            return
            
        # 2. Right-click drag starts connection creation
        elif event.button() == Qt.MouseButton.RightButton:
            item = self.itemAt(event.position().toPoint())
            while item and not isinstance(item, StateNode):
                item = item.parentItem()
                
            if isinstance(item, StateNode):
                self._drag_conn = True
                self._drag_source = item
                
                # Start line from the center of the source node
                start_pos = QPointF(
                    item.scenePos().x() + item.width / 2,
                    item.scenePos().y() + item.height / 2
                )
                self._temp_line = QGraphicsLineItem()
                pen = QPen(QColor(config.COLOR_TRANS_DRAG), 2, Qt.PenStyle.DashLine)
                self._temp_line.setPen(pen)
                self._temp_line.setLine(
                    start_pos.x(), start_pos.y(),
                    self.mapToScene(event.position().toPoint()).x(),
                    self.mapToScene(event.position().toPoint()).y()
                )
                self.scene().addItem(self._temp_line)
                event.accept()
                return
            else:
                self.mouseClicked.emit(Qt.MouseButton.RightButton)
                
        elif event.button() == Qt.MouseButton.LeftButton:
            item = self.itemAt(event.position().toPoint())
            if item is None:
                self.mouseClicked.emit(Qt.MouseButton.LeftButton)
                
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        # 1. Update panning
        if self._pan:
            dx = event.position().x() - self._pan_start_x
            dy = event.position().y() - self._pan_start_y
            self.horizontalScrollBar().setValue(self.horizontalScrollBar().value() - dx)
            self.verticalScrollBar().setValue(self.verticalScrollBar().value() - dy)
            self._pan_start_x = event.position().x()
            self._pan_start_y = event.position().y()
            event.accept()
            return
            
        # 2. Update temporary line
        elif self._drag_conn and self._temp_line:
            line = self._temp_line.line()
            cur_scene = self.mapToScene(event.position().toPoint())
            self._temp_line.setLine(line.x1(), line.y1(), cur_scene.x(), cur_scene.y())
            event.accept()
            return
            
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        # 1. Release panning
        if event.button() == Qt.MouseButton.MiddleButton and self._pan:
            self._pan = False
            self.viewport().setCursor(Qt.CursorShape.ArrowCursor)
            event.accept()
            return
            
        # 2. Release right-click connection
        elif event.button() == Qt.MouseButton.RightButton and self._drag_conn:
            self._drag_conn = False
            if self._temp_line:
                self.scene().removeItem(self._temp_line)
                self._temp_line = None
                
            # Find if mouse was released over another StateNode
            item = self.itemAt(event.position().toPoint())
            while item and not isinstance(item, StateNode):
                item = item.parentItem()
                
            if isinstance(item, StateNode) and self._drag_source:
                self.transitionRequested.emit(self._drag_source.name, item.name)
                
            self._drag_source = None
            event.accept()
            return
            
        super().mouseReleaseEvent(event)

    def wheelEvent(self, event):
        # Zoom functionality
        zoom_in_factor = 1.15
        zoom_out_factor = 1 / zoom_in_factor
        
        # Check delta to determine zoom direction
        if event.angleDelta().y() > 0:
            self.scale(zoom_in_factor, zoom_in_factor)
        else:
            self.scale(zoom_out_factor, zoom_out_factor)
        event.accept()
