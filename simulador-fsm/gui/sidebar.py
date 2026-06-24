from PySide6.QtWidgets import QWidget, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit, QPushButton, QPlainTextEdit, QFrame, QListWidget, QListWidgetItem, QApplication, QComboBox
from PySide6.QtCore import Qt, Signal, QMimeData, QPointF
from PySide6.QtGui import QFont, QColor, QDrag
import config

class StateListRow(QWidget):
    deleteRequested = Signal(str) # Emits state name to be deleted

    def __init__(self, name, parent=None):
        super().__init__(parent)
        self.name = name
        self.drag_start_position = None
        self.setup_ui()

    def setup_ui(self):
        layout = QHBoxLayout(self)
        layout.setContentsMargins(6, 2, 6, 2)
        layout.setSpacing(8)
        
        # Label styled beautifully with cyan indicator
        self.label = QLabel(f"⬡ {self.name}")
        self.label.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold))
        self.label.setStyleSheet(f"color: {config.COLOR_TRANSITION}; border: none; background: transparent;")
        
        # Small cyber-styled delete button
        self.del_btn = QPushButton("✕")
        self.del_btn.setFixedSize(20, 20)
        self.del_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.del_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                border: 1px solid {config.COLOR_ERROR};
                border-radius: 3px;
                color: {config.COLOR_ERROR};
                font-weight: bold;
                font-size: 8px;
                padding: 0;
            }}
            QPushButton:hover {{
                background-color: {config.COLOR_ERROR};
                color: #ffffff;
            }}
        """)
        self.del_btn.clicked.connect(lambda: self.deleteRequested.emit(self.name))
        
        layout.addWidget(self.label)
        layout.addStretch()
        layout.addWidget(self.del_btn)
        
        # Make row styled as a dark card
        self.setStyleSheet("""
            background-color: #0b0d13;
            border-radius: 3px;
        """)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self.drag_start_position = event.position()
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if not (event.buttons() & Qt.MouseButton.LeftButton) or not self.drag_start_position:
            return
        if (event.position() - self.drag_start_position).manhattanLength() < QApplication.startDragDistance():
            return
            
        # Start the Drag and Drop event!
        drag = QDrag(self)
        mime_data = QMimeData()
        mime_data.setText(self.name)
        drag.setMimeData(mime_data)
        
        # Let's perform drag
        drag.exec(Qt.DropAction.CopyAction)


class Sidebar(QWidget):
    createStateRequested = Signal(str)
    deleteStateRequested = Signal(str)
    transitionConditionChanged = Signal(str, str, str) # Emits source, target, condition
    recordTriggerRequested = Signal()                  # Emits when record button is clicked

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedWidth(300)
        
        # State tracking for transition triggers
        self.current_trans_source = None
        self.current_trans_target = None
        self.block_trigger_signal = False
        
        self.setup_ui()

    def setup_ui(self):
        # Master layout
        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 15, 15, 15)
        layout.setSpacing(12)
        
        # Stylesheet for inputs and buttons (cyberpunk neon theme)
        self.setStyleSheet(f"""
            QWidget {{
                background-color: {config.COLOR_SIDEBAR_BG};
                color: {config.COLOR_TEXT_PRIMARY};
                font-family: '{config.FONT_FAMILY}';
            }}
            QLabel {{
                font-weight: bold;
                border: none;
            }}
            QLineEdit {{
                background-color: #0d0f17;
                border: 1px solid {config.COLOR_NODE_BORDER};
                border-radius: 4px;
                padding: 8px;
                color: #ffffff;
                font-size: 11px;
            }}
            QLineEdit:focus {{
                border: 1.5px solid {config.COLOR_TRANSITION};
            }}
            QPushButton {{
                background-color: #1a1e2e;
                border: 1.5px solid {config.COLOR_TRANSITION};
                border-radius: 4px;
                color: {config.COLOR_TRANSITION};
                padding: 8px;
                font-weight: bold;
                font-size: 11px;
            }}
            QPushButton:hover {{
                background-color: {config.COLOR_TRANSITION};
                color: #090a0f;
            }}
            QPushButton:pressed {{
                background-color: #0088cc;
                border-color: #0088cc;
            }}
            QListWidget {{
                background-color: #07090d;
                border: 1px solid {config.COLOR_NODE_BORDER};
                border-radius: 4px;
                padding: 4px;
            }}
            QPlainTextEdit {{
                background-color: #07090d;
                border: 1px solid {config.COLOR_NODE_BORDER};
                border-radius: 4px;
                padding: 6px;
                color: {config.COLOR_TRANSITION};
                font-size: 10px;
            }}
        """)
        
        # 1. Header/Title
        title_label = QLabel("[ SYSTEM CORE CONTROLLER ]")
        title_label.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold))
        title_label.setStyleSheet(f"color: {config.COLOR_TRANSITION};")
        layout.addWidget(title_label)
        
        # 2. State Input Group
        input_frame = QFrame()
        input_frame.setFrameShape(QFrame.Shape.NoFrame)
        input_layout = QVBoxLayout(input_frame)
        input_layout.setContentsMargins(0, 0, 0, 0)
        input_layout.setSpacing(6)
        
        input_label = QLabel("NOVO ESTADO:")
        input_label.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL))
        input_label.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
        
        self.state_name_input = QLineEdit()
        self.state_name_input.setPlaceholderText("Digite o estado (ex: SLIDE)...")
        self.state_name_input.returnPressed.connect(self.on_create_clicked)
        
        self.create_btn = QPushButton("CRIAR ESTADO NO PROJETO")
        self.create_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.create_btn.clicked.connect(self.on_create_clicked)
        
        input_layout.addWidget(input_label)
        input_layout.addWidget(self.state_name_input)
        input_layout.addWidget(self.create_btn)
        layout.addWidget(input_frame)
        
        # 3. Project States List Widget
        states_list_label = QLabel("ESTADOS NO PROJETO (Arraste p/ Canvas):")
        states_list_label.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL))
        states_list_label.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
        layout.addWidget(states_list_label)
        
        self.states_list_widget = QListWidget()
        self.states_list_widget.setStyleSheet("""
            QListWidget::item {
                background: transparent;
                border: none;
                margin-bottom: 4px;
            }
        """)
        layout.addWidget(self.states_list_widget)
        
        # 3.5. Transition Config Panel (Shown when a transition is selected)
        self.trans_config_frame = QFrame()
        self.trans_config_frame.setStyleSheet(f"""
            QFrame {{
                background-color: #0b0e16;
                border: 1px solid {config.COLOR_TRANSITION};
                border-radius: 6px;
            }}
            QComboBox {{
                background-color: #0d0f17;
                border: 1px solid {config.COLOR_NODE_BORDER};
                border-radius: 4px;
                padding: 4px;
                color: {config.COLOR_TRANSITION};
                font-family: '{config.FONT_FAMILY}';
                font-weight: bold;
            }}
            QPushButton {{
                background-color: #1a1e2e;
                border: 1.5px solid {config.COLOR_TRANSITION};
                border-radius: 4px;
                color: {config.COLOR_TRANSITION};
                padding: 8px;
                font-weight: bold;
                font-size: 11px;
            }}
            QPushButton:hover {{
                background-color: {config.COLOR_TRANSITION};
                color: #090a0f;
            }}
        """)
        trans_config_layout = QVBoxLayout(self.trans_config_frame)
        trans_config_layout.setContentsMargins(10, 10, 10, 10)
        trans_config_layout.setSpacing(8)
        
        trans_config_title = QLabel("CONFIGURAR GATILHO")
        trans_config_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL, QFont.Weight.Bold))
        trans_config_title.setStyleSheet(f"color: {config.COLOR_TRANSITION}; border: none;")
        
        self.trans_info_label = QLabel("Nenhuma transição selecionada")
        self.trans_info_label.setFont(QFont(config.FONT_FAMILY, 9))
        self.trans_info_label.setStyleSheet("color: #ffffff; border: none;")
        
        # Display current trigger
        self.current_trigger_lbl = QLabel("GATILHO: NONE")
        self.current_trigger_lbl.setFont(QFont(config.FONT_FAMILY, 10, QFont.Weight.Bold))
        self.current_trigger_lbl.setStyleSheet(f"color: {config.COLOR_ACTIVE_GLOW}; border: none; padding: 2px 0;")
        
        # Record input button
        self.record_trigger_btn = QPushButton("⌨️ GRAVAR TECLA / CLIQUE")
        self.record_trigger_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.record_trigger_btn.clicked.connect(self.recordTriggerRequested.emit)
        
        # Timer Dropdown
        combo_layout = QHBoxLayout()
        combo_layout.setContentsMargins(0, 0, 0, 0)
        combo_label = QLabel("OU TEMPO:")
        combo_label.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL))
        combo_label.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none;")
        
        self.time_combo = QComboBox()
        self.time_combo.addItems(["[Sem temporizador]", "0.5s", "1s", "2s", "3s", "5s"])
        self.time_combo.currentIndexChanged.connect(self.on_timer_changed)
        
        combo_layout.addWidget(combo_label)
        combo_layout.addWidget(self.time_combo)
        
        trans_config_layout.addWidget(trans_config_title)
        trans_config_layout.addWidget(self.trans_info_label)
        trans_config_layout.addWidget(self.current_trigger_lbl)
        trans_config_layout.addWidget(self.record_trigger_btn)
        trans_config_layout.addLayout(combo_layout)
        
        # Hide it by default
        self.trans_config_frame.setVisible(False)
        layout.addWidget(self.trans_config_frame)
        
        # 4. Active State HUD Monitor
        hud_frame = QFrame()
        hud_frame.setStyleSheet(f"""
            QFrame {{
                background-color: #0b0e16;
                border: 1px solid {config.COLOR_NODE_BORDER};
                border-radius: 6px;
            }}
        """)
        hud_layout = QVBoxLayout(hud_frame)
        hud_layout.setContentsMargins(10, 10, 10, 10)
        hud_layout.setSpacing(4)
        
        hud_title = QLabel("ESTADO ATIVO ATUAL")
        hud_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL, QFont.Weight.Bold))
        hud_title.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none;")
        hud_layout.addWidget(hud_title)
        
        self.active_state_label = QLabel("< NONE >")
        self.active_state_label.setFont(QFont(config.FONT_FAMILY, 14, QFont.Weight.Bold))
        self.active_state_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.active_state_label.setStyleSheet(f"color: {config.COLOR_ACTIVE_GLOW}; border: none; padding: 4px;")
        hud_layout.addWidget(self.active_state_label)
        
        layout.addWidget(hud_frame)
        
        # 5. Console Log Panel (Collapsible, hidden by default)
        self.console_header_layout = QHBoxLayout()
        self.console_header_layout.setContentsMargins(0, 0, 0, 0)
        
        console_title = QLabel("[ SYSTEM CONSOLE LOGS ]")
        console_title.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_SMALL, QFont.Weight.Bold))
        console_title.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED};")
        
        self.console_toggle_btn = QPushButton("[+] ABRIR")
        self.console_toggle_btn.setFixedSize(70, 20)
        self.console_toggle_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.console_toggle_btn.setFont(QFont(config.FONT_FAMILY, 8, QFont.Weight.Bold))
        self.console_toggle_btn.setStyleSheet(f"""
            QPushButton {{
                background-color: transparent;
                border: 1px solid {config.COLOR_TRANSITION};
                border-radius: 3px;
                color: {config.COLOR_TRANSITION};
                padding: 0;
            }}
            QPushButton:hover {{
                background-color: {config.COLOR_TRANSITION};
                color: #090a0f;
            }}
        """)
        self.console_toggle_btn.clicked.connect(self.toggle_console)
        
        self.console_header_layout.addWidget(console_title)
        self.console_header_layout.addStretch()
        self.console_header_layout.addWidget(self.console_toggle_btn)
        layout.addLayout(self.console_header_layout)
        
        self.console_output = QPlainTextEdit()
        self.console_output.setReadOnly(True)
        self.console_output.setLineWrapMode(QPlainTextEdit.LineWrapMode.WidgetWidth)
        self.console_output.setVisible(False) # HIDE BY DEFAULT
        layout.addWidget(self.console_output)
        
        # 6. Instructions text
        instr_label = QLabel(
            "CONTROLES:\n"
            "- Arraste da lista acima para posicionar no Canvas.\n"
            "- Duplo-clique: Transiciona estado ativo.\n"
            "- Botão Direito + Arraste: Cria conexões.\n"
            "- Scroll Wheel: Zoom.  - Botão do Meio: Arrastar canvas.\n"
            "- Delete: Remove elemento gráfico do Canvas."
        )
        instr_label.setFont(QFont(config.FONT_FAMILY, 8))
        instr_label.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; line-height: 130%;")
        layout.addWidget(instr_label)

    def on_create_clicked(self):
        text = self.state_name_input.text().strip().upper()
        if text:
            self.createStateRequested.emit(text)
            self.state_name_input.clear()

    def add_state_to_list(self, state_name):
        # Check if already in list widget
        for i in range(self.states_list_widget.count()):
            item = self.states_list_widget.item(i)
            row_widget = self.states_list_widget.itemWidget(item)
            if row_widget and row_widget.name == state_name:
                return # Already exists
                
        # Create item
        item = QListWidgetItem(self.states_list_widget)
        # Create custom row widget
        row_widget = StateListRow(state_name)
        row_widget.deleteRequested.connect(self.deleteStateRequested.emit)
        
        item.setSizeHint(row_widget.sizeHint())
        self.states_list_widget.addItem(item)
        self.states_list_widget.setItemWidget(item, row_widget)

    def remove_state_from_list(self, state_name):
        for i in range(self.states_list_widget.count()):
            item = self.states_list_widget.item(i)
            row_widget = self.states_list_widget.itemWidget(item)
            if row_widget and row_widget.name == state_name:
                self.states_list_widget.takeItem(i)
                break

    def update_active_state(self, state_name):
        if state_name:
            self.active_state_label.setText(f"[ {state_name} ]")
            self.active_state_label.setStyleSheet(f"color: {config.COLOR_ACTIVE_GLOW}; border: none; padding: 4px;")
        else:
            self.active_state_label.setText("< NONE >")
            self.active_state_label.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; padding: 4px;")

    def show_transition_config(self, source, target, current_condition):
        self.block_trigger_signal = True
        self.current_trans_source = source
        self.current_trans_target = target
        self.trans_info_label.setText(f"De: {source} ➔ Para: {target}")
        
        self.current_trigger_lbl.setText(f"GATILHO: {current_condition}")
        
        is_time = False
        if current_condition and current_condition.lower().endswith("s"):
            try:
                val_str = current_condition[:-1].replace(",", ".")
                float(val_str)
                is_time = True
            except ValueError:
                pass
                
        if is_time:
            # Dropdown items are lowercase (e.g. "0.5s"), search case-insensitively
            idx = self.time_combo.findText(current_condition.lower())
            if idx >= 0:
                self.time_combo.setCurrentIndex(idx)
            else:
                self.time_combo.setCurrentIndex(0)
        else:
            self.time_combo.setCurrentIndex(0)
            
        self.trans_config_frame.setVisible(True)
        self.block_trigger_signal = False

    def hide_transition_config(self):
        self.current_trans_source = None
        self.current_trans_target = None
        self.trans_config_frame.setVisible(False)

    def on_timer_changed(self, index):
        if self.block_trigger_signal or not self.current_trans_source or not self.current_trans_target:
            return
        if index == 0:
            # Resetting to NONE when clicking [Sem temporizador]
            self.transitionConditionChanged.emit(self.current_trans_source, self.current_trans_target, "NONE")
        else:
            condition = self.time_combo.itemText(index)
            self.transitionConditionChanged.emit(self.current_trans_source, self.current_trans_target, condition)

    def set_recording_mode(self, active):
        if active:
            self.record_trigger_btn.setText("[ AGUARDANDO ENTRADA... ]")
            self.record_trigger_btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: {config.COLOR_ACTIVE_GLOW};
                    border: 1.5px solid #ffffff;
                    border-radius: 4px;
                    color: #090a0f;
                    padding: 8px;
                    font-weight: bold;
                    font-size: 11px;
                }}
            """)
        else:
            self.record_trigger_btn.setText("⌨️ GRAVAR TECLA / CLIQUE")
            self.record_trigger_btn.setStyleSheet("")

    def log(self, text, is_error=False):
        color_tag = "color: #ff3333;" if is_error else f"color: {config.COLOR_TRANSITION};"
        prefix = "[!] " if is_error else ">> "
        
        self.console_output.appendHtml(f"<span style='{color_tag}'>{prefix}{text}</span>")
        self.console_output.verticalScrollBar().setValue(self.console_output.verticalScrollBar().maximum())

    def toggle_console(self):
        is_visible = self.console_output.isVisible()
        self.console_output.setVisible(not is_visible)
        self.console_toggle_btn.setText("[+] ABRIR" if is_visible else "[-] FECHAR")
