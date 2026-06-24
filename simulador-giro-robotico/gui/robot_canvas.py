# Área de Simulação (Canvas Gráfico 2D)
import math
from PySide6.QtWidgets import QGraphicsView, QGraphicsScene, QGraphicsItem, QPushButton, QGraphicsPathItem
from PySide6.QtCore import Qt, Signal, QRectF, QPointF
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont
import config

class RobotItem(QGraphicsItem):
    """Representação vetorial do robô LEGO NXT/EV3 com proporções dinâmicas."""
    def __init__(self, wheel_dia=56.0, chassis_width=120.0, is_tread=False):
        super().__init__()
        self.wheel_dia = wheel_dia
        self.chassis_width = chassis_width
        self.is_tread = is_tread
        
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemSendsGeometryChanges)
        self.setZValue(1)  # Garante que o robô seja desenhado sobre a linha de rastro
        
    def update_params(self, wheel_dia: float, chassis_width: float, is_tread: bool):
        """Atualiza fisicamente as dimensões do desenho do robô."""
        self.wheel_dia = wheel_dia
        self.chassis_width = chassis_width
        self.is_tread = is_tread
        self.prepareGeometryChange()
        self.update()
        
    def boundingRect(self):
        scale = config.SCALE_MM_TO_PX
        w_px = max(self.chassis_width * scale + 40.0, 160.0)
        h_px = max(self.wheel_dia * scale + 60.0, 200.0)
        return QRectF(-w_px / 2.0 - 10, -h_px / 2.0 - 10, w_px + 20, h_px + 20)
        
    def paint(self, painter, option, widget=None):
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        scale = config.SCALE_MM_TO_PX
        
        # Converter mm para pixels
        w_px = self.chassis_width * scale
        d_px = self.wheel_dia * scale
        wheel_w_px = 15.0 * scale
        
        brick_w_px = 50.0 * scale
        brick_h_px = 75.0 * scale
        
        # 1. Desenhar o Eixo (Metallic Axle)
        painter.setPen(QPen(QColor("#7a8a9e"), 4, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(-w_px / 2.0, 0.0, w_px / 2.0, 0.0)
        
        # 2. Desenhar o Corpo Principal (EV3 Brick)
        rect_brick = QRectF(-brick_w_px / 2.0, -brick_h_px / 2.0, brick_w_px, brick_h_px)
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 2))
        painter.setBrush(QBrush(QColor(config.COLOR_ROBOT_BODY)))
        painter.drawRoundedRect(rect_brick, 5, 5)
        
        # Tela LCD do EV3
        screen_w = brick_w_px - 14
        screen_h = brick_h_px / 3.0
        rect_screen = QRectF(-screen_w / 2.0, -brick_h_px / 2.0 + 7, screen_w, screen_h)
        painter.setPen(QPen(QColor("#3b4860"), 1.5))
        painter.setBrush(QBrush(QColor("#0d121c")))
        painter.drawRect(rect_screen)
        
        # Texto da tela
        font_lcd = QFont(config.FONT_FAMILY_DIGITAL, 7, QFont.Weight.Bold)
        painter.setFont(font_lcd)
        painter.setPen(QColor(config.COLOR_NEON_CYAN))
        painter.drawText(rect_screen, Qt.AlignmentFlag.AlignCenter, "Qt-MINDSTORMS")
        
        # Botões de controle do cérebro
        btn_y = brick_h_px / 4.0
        painter.setBrush(QBrush(QColor("#4e5970")))
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 1))
        # Botão central
        painter.drawEllipse(QPointF(0, btn_y), 5, 5)
        # Botões direcionais
        painter.drawEllipse(QPointF(-12, btn_y), 3, 3)
        painter.drawEllipse(QPointF(12, btn_y), 3, 3)
        
        # Roda de apoio (Castor Wheel) traseira
        painter.setBrush(QBrush(QColor(config.COLOR_ROBOT_WHEEL)))
        painter.setPen(QPen(QColor(config.COLOR_BORDER), 1.5))
        painter.drawEllipse(QPointF(0.0, brick_h_px / 2.0 - 10), 7, 7)
        
        # 3. Desenhar as Rodas ou Esteiras
        def draw_side_wheel(x_center):
            rect_w = QRectF(x_center - wheel_w_px / 2.0, -d_px / 2.0, wheel_w_px, d_px)
            if self.is_tread:
                # Desenhar Esteira (Tread)
                painter.setPen(QPen(QColor(config.COLOR_BORDER), 2))
                painter.setBrush(QBrush(QColor(config.COLOR_ROBOT_TREAD)))
                painter.drawRoundedRect(rect_w, 6, 6)
                
                # Nervuras da esteira
                painter.setPen(QPen(QColor("#1b2230"), 1.5))
                y_start = int(-d_px / 2.0)
                y_end = int(d_px / 2.0)
                for ty in range(y_start + 6, y_end - 4, 8):
                    painter.drawLine(x_center - wheel_w_px / 2.0 + 2, ty, x_center + wheel_w_px / 2.0 - 2, ty)
            else:
                # Desenhar Pneu de Borracha (Tire)
                painter.setPen(QPen(QColor(config.COLOR_BORDER), 2))
                painter.setBrush(QBrush(QColor("#161a24")))  # Borracha preta
                painter.drawRoundedRect(rect_w, 4, 4)
                
                # Calota de Plástico Amarela LEGO (Rim)
                rim_w = wheel_w_px - 6
                rim_h = d_px - 14
                if rim_h > 4:
                    rect_rim = QRectF(x_center - rim_w / 2.0, -rim_h / 2.0, rim_w, rim_h)
                    painter.setPen(QPen(QColor("#ccaa00"), 1.5))
                    painter.setBrush(QBrush(QColor(config.COLOR_ROBOT_WHEEL)))
                    painter.drawRoundedRect(rect_rim, 2, 2)
                    
        draw_side_wheel(-w_px / 2.0)  # Roda esquerda
        draw_side_wheel(w_px / 2.0)   # Roda direita
        
        # 4. Seta indicando direção frontal (Frente do robô é -y)
        painter.setPen(QPen(QColor(config.COLOR_NEON_GREEN), 3, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
        painter.drawLine(0.0, -brick_h_px / 2.0 + 5, 0.0, -brick_h_px / 2.0 - 15)
        # Ponta da seta
        painter.drawLine(0.0, -brick_h_px / 2.0 - 15, -6, -brick_h_px / 2.0 - 9)
        painter.drawLine(0.0, -brick_h_px / 2.0 - 15, 6, -brick_h_px / 2.0 - 9)


class RobotCanvas(QGraphicsView):
    """Área do gráfico 2D contendo a grade CAD, robô, rastro tracejado e botões flutuantes."""
    resetRequested = Signal()
    
    def __init__(self, parent=None):
        self.scene = QGraphicsScene()
        self.scene.setSceneRect(-1000, -1000, 2000, 2000)
        super().__init__(self.scene, parent)
        
        self.chassis_width = 120.0  # Largura inicial para fins de rastro
        self.setup_ui()
        
    def setup_ui(self):
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setViewportUpdateMode(QGraphicsView.ViewportUpdateMode.FullViewportUpdate)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setStyleSheet("border: none; background: transparent;")
        
        # Inicializa o histórico de rastros
        self.all_traces = []
        self.cmb_trace_current_mode = "Centro (Verde)"
        self.last_wheel_type = "Padrão (56mm)"
        self.start_new_trace(self.last_wheel_type)
        
        # Item do robô
        self.robot_item = RobotItem()
        self.scene.addItem(self.robot_item)
        
        # Centraliza a câmera no início
        self.centerOn(0.0, 0.0)
        
        # Botões Flutuantes sobrepostos (Toolbar estilo CAD)
        self.btn_reset = QPushButton("🔄 Resetar Posição", self)
        self.btn_reset.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_reset.setStyleSheet(self.get_floating_button_style())
        self.btn_reset.clicked.connect(self.on_reset_clicked)
        
        self.btn_clear = QPushButton("🗑️ Limpar Trajeto", self)
        self.btn_clear.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_clear.setStyleSheet(self.get_floating_button_style())
        self.btn_clear.clicked.connect(self.clear_path)
        
    def get_floating_button_style(self) -> str:
        return f"""
            QPushButton {{
                background-color: rgba(19, 23, 34, 0.85);
                color: {config.COLOR_TEXT_PRIMARY};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 4px;
                padding: 4px 8px;
                font-family: '{config.FONT_FAMILY}';
                font-size: 11px;
                font-weight: bold;
            }}
            QPushButton:hover {{
                background-color: #242f47;
                border: 1px solid {config.COLOR_NEON_CYAN};
            }}
        """
        
    def resizeEvent(self, event):
        super().resizeEvent(event)
        # Posiciona os botões no canto superior direito do viewport
        btn_w = 120
        btn_h = 26
        margin = 10
        self.btn_reset.setGeometry(self.width() - btn_w * 2 - margin * 2, margin, btn_w, btn_h)
        self.btn_clear.setGeometry(self.width() - btn_w - margin, margin, btn_w, btn_h)
        
    def start_new_trace(self, wheel_type: str):
        """Cria um novo conjunto de caminhos (rastro) com cores específicas para o modelo de roda."""
        # 1. Determina as cores baseadas no modelo de roda
        if "Padrão" in wheel_type:
            color_c = QColor(config.COLOR_NEON_GREEN)
            color_l = QColor(config.COLOR_NEON_ORANGE)
            color_r = QColor(config.COLOR_NEON_CYAN)
        elif "Pequena" in wheel_type:
            color_c = QColor("#ff007f")  # Neon Pink
            color_l = QColor("#ffa07a")  # Light Salmon
            color_r = QColor("#87cefa")  # Light Sky Blue
        elif "Moto" in wheel_type:
            color_c = QColor("#ffff00")  # Neon Yellow
            color_l = QColor("#ff7f50")  # Coral
            color_r = QColor("#40e0d0")  # Turquoise
        else:  # Esteira
            color_c = QColor("#b57cff")  # Light Purple
            color_l = QColor("#ff4500")  # Red-Orange
            color_r = QColor("#1e90ff")  # Dodger Blue
            
        # 2. Cria os novos itens de caminho
        new_path = QGraphicsPathItem()
        pen_c = QPen(color_c, 2.0, Qt.PenStyle.DashLine)
        new_path.setPen(pen_c)
        new_path.setZValue(-1)
        self.scene.addItem(new_path)
        
        new_path_l = QGraphicsPathItem()
        pen_l = QPen(color_l, 2.0, Qt.PenStyle.DashLine)
        new_path_l.setPen(pen_l)
        new_path_l.setZValue(-1)
        self.scene.addItem(new_path_l)
        
        new_path_r = QGraphicsPathItem()
        pen_r = QPen(color_r, 2.0, Qt.PenStyle.DashLine)
        new_path_r.setPen(pen_r)
        new_path_r.setZValue(-1)
        self.scene.addItem(new_path_r)
        
        # 3. Registra no histórico de rastros
        trace_entry = {
            "center": new_path,
            "left": new_path_l,
            "right": new_path_r,
            "type": wheel_type
        }
        self.all_traces.append(trace_entry)
        
        # 4. Atualiza os itens ativos atualmente sendo desenhados
        self.path_item = new_path
        self.path_item_left = new_path_l
        self.path_item_right = new_path_r
        
        # 5. Aplica a visibilidade atual a esse novo rastro
        trace_mode = self.cmb_trace_current_mode if hasattr(self, 'cmb_trace_current_mode') else "Completo (3 Linhas)"
        self.update_trace_visibility(trace_mode)

    def update_robot_dims(self, wheel_dia: float, chassis_width: float, is_tread: bool, wheel_type: str = "Padrão (56mm)"):
        """Ajusta as dimensões gráficas do robô conforme especificações físicas."""
        self.chassis_width = chassis_width
        self.robot_item.update_params(wheel_dia, chassis_width, is_tread)
        self.last_wheel_type = wheel_type
        
    def update_trace_visibility(self, trace_mode: str):
        """Alterna a visibilidade dos trajetos (Centro, Rodas ou Completo) para todos os rastros no histórico."""
        self.cmb_trace_current_mode = trace_mode
        for trace in self.all_traces:
            c_item = trace["center"]
            l_item = trace["left"]
            r_item = trace["right"]
            
            if trace_mode == "Centro (Verde)":
                c_item.show()
                l_item.hide()
                r_item.hide()
            elif trace_mode == "Rodas (Laranja/Azul)":
                c_item.hide()
                l_item.show()
                r_item.show()
            else:  # Completo (3 Linhas)
                c_item.show()
                l_item.show()
                r_item.show()
            
    def set_robot_pose(self, pos_x_mm: float, pos_y_mm: float, theta_rad: float, extend_path: bool = True, is_first_step: bool = False):
        """Posiciona e rotaciona o robô na simulação, estendendo o rastro das rodas e do centro se solicitado."""
        px_x = pos_x_mm * config.SCALE_MM_TO_PX
        px_y = pos_y_mm * config.SCALE_MM_TO_PX
        
        self.robot_item.setPos(px_x, px_y)
        self.robot_item.setRotation(math.degrees(theta_rad))
        
        if extend_path and self.path_item is not None:
            # 1. Rastro do Centro
            path = self.path_item.path()
            if path.elementCount() == 0 or is_first_step:
                path.moveTo(px_x, px_y)
            else:
                path.lineTo(px_x, px_y)
            self.path_item.setPath(path)
            
            # 2. Rastro das Rodas
            # Calcula o deslocamento lateral das rodas a partir da orientação
            half_w_px = (self.chassis_width / 2.0) * config.SCALE_MM_TO_PX
            
            wl_x = px_x - half_w_px * math.cos(theta_rad)
            wl_y = px_y - half_w_px * math.sin(theta_rad)
            
            wr_x = px_x + half_w_px * math.cos(theta_rad)
            wr_y = px_y + half_w_px * math.sin(theta_rad)
            
            # Trajeto da roda esquerda
            path_l = self.path_item_left.path()
            if path_l.elementCount() == 0 or is_first_step:
                path_l.moveTo(wl_x, wl_y)
            else:
                path_l.lineTo(wl_x, wl_y)
            self.path_item_left.setPath(path_l)
            
            # Trajeto da roda direita
            path_r = self.path_item_right.path()
            if path_r.elementCount() == 0 or is_first_step:
                path_r.moveTo(wr_x, wr_y)
            else:
                path_r.lineTo(wr_x, wr_y)
            self.path_item_right.setPath(path_r)
            
    def clear_path(self):
        """Limpa todos os trajetos desenhados do cenário e remove-os da cena."""
        for trace in self.all_traces:
            self.scene.removeItem(trace["center"])
            self.scene.removeItem(trace["left"])
            self.scene.removeItem(trace["right"])
        self.all_traces.clear()
        
        # Recria um rastro ativo para o caso do robô continuar desenhando
        self.start_new_trace(self.last_wheel_type)
        
    def on_reset_clicked(self):
        """Reseta a pose do robô para (0, 0, 0) e re-centraliza a visualização."""
        self.set_robot_pose(0.0, 0.0, 0.0, extend_path=False)
        self.resetRequested.emit()
        self.centerOn(0.0, 0.0)
        
    # --- Controle de Panning (Segurar Botão do Meio) e Zoom (Scroll) ---
    def wheelEvent(self, event):
        zoom_in_factor = 1.12
        zoom_out_factor = 1.0 / zoom_in_factor
        
        old_pos = self.mapToScene(event.position().toPoint())
        
        if event.angleDelta().y() > 0:
            zoom_factor = zoom_in_factor
        else:
            zoom_factor = zoom_out_factor
            
        # Restringe zoom excessivo
        current_zoom = self.transform().m11()
        if (zoom_factor > 1.0 and current_zoom > 4.0) or (zoom_factor < 1.0 and current_zoom < 0.25):
            return
            
        self.scale(zoom_factor, zoom_factor)
        
        new_pos = self.mapToScene(event.position().toPoint())
        delta = new_pos - old_pos
        self.translate(delta.x(), delta.y())
        
    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.MiddleButton:
            self.setDragMode(QGraphicsView.DragMode.ScrollHandDrag)
            # Envia evento de clique esquerdo falso para habilitar arrastar
            fake_event = event.__class__(
                event.type(), event.position(), event.globalPosition(),
                Qt.MouseButton.LeftButton, event.buttons(), event.modifiers()
            )
            super().mousePressEvent(fake_event)
        else:
            super().mousePressEvent(event)
            
    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.MiddleButton:
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
        super().mouseReleaseEvent(event)
        
    def drawBackground(self, painter, rect):
        painter.fillRect(rect, QColor(config.COLOR_BG))
        
        # Espaçamento da grade
        step_minor = 10.0 * config.SCALE_MM_TO_PX
        step_major = 50.0 * config.SCALE_MM_TO_PX
        
        left = rect.left()
        right = rect.right()
        top = rect.top()
        bottom = rect.bottom()
        
        # Alinha os loops com a grade
        start_x = math.floor(left / step_minor) * step_minor
        end_x = math.ceil(right / step_minor) * step_minor
        start_y = math.floor(top / step_minor) * step_minor
        end_y = math.ceil(bottom / step_minor) * step_minor
        
        # 1. Desenhar grade secundária (linhas finas a cada 10mm)
        pen_minor = QPen(QColor(config.COLOR_GRID_MINOR), 0.5)
        painter.setPen(pen_minor)
        for x in range(int(start_x), int(end_x), int(step_minor)):
            if abs(x) % int(step_major) < 0.1:
                continue  # Evita desenhar sobre a linha principal
            painter.drawLine(x, int(top), x, int(bottom))
        for y in range(int(start_y), int(end_y), int(step_minor)):
            if abs(y) % int(step_major) < 0.1:
                continue
            painter.drawLine(int(left), y, int(right), y)
            
        # 2. Desenhar grade principal (linhas mais marcadas a cada 50mm)
        pen_major = QPen(QColor(config.COLOR_GRID_MAJOR), 1.0)
        painter.setPen(pen_major)
        for x in range(int(start_x), int(end_x), int(step_minor)):
            if abs(x) % int(step_major) < 0.1:
                painter.drawLine(x, int(top), x, int(bottom))
        for y in range(int(start_y), int(end_y), int(step_minor)):
            if abs(y) % int(step_major) < 0.1:
                painter.drawLine(int(left), y, int(right), y)
                
        # 3. Eixos cartesianos da origem (Destaque do centro (0, 0))
        pen_axis = QPen(QColor(config.COLOR_BORDER), 1.5, Qt.PenStyle.DashLine)
        painter.setPen(pen_axis)
        painter.drawLine(0, int(top), 0, int(bottom))
        painter.drawLine(int(left), 0, int(right), 0)
