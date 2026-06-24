from PySide6.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QTabWidget
from PySide6.QtCore import Qt
from PySide6.QtGui import QFont, QColor
import config
from gui.circuit_canvas import CircuitCanvas
from gui.control_panel import ControlPanel
from gui.formula_visualizer import FormulaVisualizer

class MainWindow(QMainWindow):
    """The master application window managing layout, signals, and styling."""
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Laboratório de Física: Lei de Ohm - Edição Escolar")
        self.resize(1100, 750)
        self.setMinimumSize(1020, 680)
        
        # State variables
        self.series_voltage = 12.0
        self.series_resistance = 10.0
        
        self.parallel_voltage = 12.0
        self.parallel_resistance = 10.0
        self.parallel_resistance2 = 20.0
        
        self.setup_ui()
        self.connect_signals()
        
    def setup_ui(self):
        # 1. Master Central Widget
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        self.central_widget.setStyleSheet(f"background-color: {config.COLOR_BG};")
        
        # Main Layout (Vertical)
        self.main_layout = QVBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(15, 15, 15, 15)
        self.main_layout.setSpacing(10)
        
        # --- 2. HEADER TITLE PANEL ---
        header_frame = QFrame()
        header_frame.setStyleSheet(f"""
            QFrame {{
                background-color: {config.COLOR_PANEL_BG};
                border: 1px solid {config.COLOR_BORDER};
                border-radius: 6px;
            }}
        """)
        header_layout = QHBoxLayout(header_frame)
        header_layout.setContentsMargins(15, 10, 15, 10)
        
        title_text = QLabel("🎮 LABORATÓRIO DE FISICA: LEI DE OHM")
        title_text.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_TITLE, QFont.Weight.Bold))
        title_text.setStyleSheet(f"color: {config.COLOR_WIRE_HIGH}; border: none; background: transparent;")
        
        subtitle_text = QLabel("Ensino Prático de Tensão, Resistência e Corrente")
        subtitle_text.setFont(QFont(config.FONT_FAMILY, config.FONT_SIZE_BODY, QFont.Weight.Bold))
        subtitle_text.setStyleSheet(f"color: {config.COLOR_TEXT_MUTED}; border: none; background: transparent;")
        subtitle_text.setAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        
        header_layout.addWidget(title_text)
        header_layout.addStretch()
        header_layout.addWidget(subtitle_text)
        
        self.main_layout.addWidget(header_frame)
        
        # --- 3. TAB WINDOW MANAGEMENT (SERIES vs PARALLEL) ---
        self.tab_widget = QTabWidget()
        self.tab_widget.setStyleSheet(f"""
            QTabWidget::pane {{
                border: 1px solid {config.COLOR_BORDER};
                background: {config.COLOR_BG};
                border-radius: 6px;
            }}
            QTabBar::tab {{
                background: {config.COLOR_PANEL_BG};
                color: {config.COLOR_TEXT_MUTED};
                border: 1px solid {config.COLOR_BORDER};
                border-bottom: none;
                padding: 10px 24px;
                font-family: '{config.FONT_FAMILY}';
                font-size: 11px;
                font-weight: bold;
                border-top-left-radius: 6px;
                border-top-right-radius: 6px;
                margin-right: 4px;
            }}
            QTabBar::tab:selected {{
                background: #121724;
                color: {config.COLOR_WIRE_HIGH};
                border: 2px solid {config.COLOR_WIRE_HIGH};
                border-bottom: none;
            }}
            QTabBar::tab:hover {{
                color: {config.COLOR_TEXT_PRIMARY};
            }}
        """)
        
        # --- TAB 1: CIRCUITO EM SÉRIE ---
        self.series_tab = QWidget()
        series_layout = QVBoxLayout(self.series_tab)
        series_layout.setContentsMargins(10, 10, 10, 10)
        series_layout.setSpacing(10)
        
        # Series Middle Row (Canvas + Formula)
        series_middle = QHBoxLayout()
        series_middle.setSpacing(10)
        
        self.series_canvas_container = QFrame()
        self.series_canvas_container.setStyleSheet(f"background-color: {config.COLOR_PANEL_BG}; border: 1px solid {config.COLOR_BORDER}; border-radius: 6px;")
        canvas_layout_s = QVBoxLayout(self.series_canvas_container)
        canvas_layout_s.setContentsMargins(5, 5, 5, 5)
        
        self.series_canvas = CircuitCanvas(mode="series")
        canvas_layout_s.addWidget(self.series_canvas)
        
        self.series_formula = FormulaVisualizer(mode="series")
        self.series_formula.setFixedWidth(330)
        
        series_middle.addWidget(self.series_canvas_container, stretch=1)
        series_middle.addWidget(self.series_formula, stretch=0)
        series_layout.addLayout(series_middle, stretch=1)
        
        # Series Bottom Controls
        self.series_controls_container = QFrame()
        self.series_controls_container.setStyleSheet(f"background-color: {config.COLOR_PANEL_BG}; border: 1px solid {config.COLOR_BORDER}; border-radius: 6px;")
        control_layout_s = QVBoxLayout(self.series_controls_container)
        control_layout_s.setContentsMargins(0, 0, 0, 0)
        
        self.series_controls = ControlPanel(mode="series")
        control_layout_s.addWidget(self.series_controls)
        series_layout.addWidget(self.series_controls_container, stretch=0)
        
        self.tab_widget.addTab(self.series_tab, "🔄 CIRCUITO EM SÉRIE")
        
        # --- TAB 2: CIRCUITO EM PARALELO ---
        self.parallel_tab = QWidget()
        parallel_layout = QVBoxLayout(self.parallel_tab)
        parallel_layout.setContentsMargins(10, 10, 10, 10)
        parallel_layout.setSpacing(10)
        
        # Parallel Middle Row (Canvas + Formula)
        parallel_middle = QHBoxLayout()
        parallel_middle.setSpacing(10)
        
        self.parallel_canvas_container = QFrame()
        self.parallel_canvas_container.setStyleSheet(f"background-color: {config.COLOR_PANEL_BG}; border: 1px solid {config.COLOR_BORDER}; border-radius: 6px;")
        canvas_layout_p = QVBoxLayout(self.parallel_canvas_container)
        canvas_layout_p.setContentsMargins(5, 5, 5, 5)
        
        self.parallel_canvas = CircuitCanvas(mode="parallel")
        canvas_layout_p.addWidget(self.parallel_canvas)
        
        self.parallel_formula = FormulaVisualizer(mode="parallel")
        self.parallel_formula.setFixedWidth(330)
        
        parallel_middle.addWidget(self.parallel_canvas_container, stretch=1)
        parallel_middle.addWidget(self.parallel_formula, stretch=0)
        parallel_layout.addLayout(parallel_middle, stretch=1)
        
        # Parallel Bottom Controls
        self.parallel_controls_container = QFrame()
        self.parallel_controls_container.setStyleSheet(f"background-color: {config.COLOR_PANEL_BG}; border: 1px solid {config.COLOR_BORDER}; border-radius: 6px;")
        control_layout_p = QVBoxLayout(self.parallel_controls_container)
        control_layout_p.setContentsMargins(0, 0, 0, 0)
        
        self.parallel_controls = ControlPanel(mode="parallel")
        control_layout_p.addWidget(self.parallel_controls)
        parallel_layout.addWidget(self.parallel_controls_container, stretch=0)
        
        self.tab_widget.addTab(self.parallel_tab, "🔀 CIRCUITO EM PARALELO")
        
        self.main_layout.addWidget(self.tab_widget)
        
        # Set initial simulation states
        self.update_series_simulation()
        self.update_parallel_simulation()
        
    def connect_signals(self):
        # 1. Series Signals
        self.series_controls.voltageChanged.connect(self.on_series_voltage_changed)
        self.series_controls.resistanceChanged.connect(self.on_series_resistance_changed)
        self.series_controls.loadTypeChanged.connect(self.on_series_load_type_changed)
        
        # 2. Parallel Signals
        self.parallel_controls.voltageChanged.connect(self.on_parallel_voltage_changed)
        self.parallel_controls.resistanceChanged.connect(self.on_parallel_r1_changed)
        self.parallel_controls.resistance2Changed.connect(self.on_parallel_r2_changed)
        self.parallel_controls.loadTypeChanged.connect(self.on_parallel_load_type_changed)
        
    # --- Series slots ---
    def on_series_voltage_changed(self, value):
        self.series_voltage = value
        self.update_series_simulation()
        
    def on_series_resistance_changed(self, value):
        self.series_resistance = value
        self.update_series_simulation()
        
    def on_series_load_type_changed(self, load_type):
        self.series_canvas.set_load_type(load_type)
        self.series_formula.set_load_type(load_type)
        self.update_series_simulation()
        
    def update_series_simulation(self):
        self.series_canvas.update_values(self.series_voltage, self.series_resistance)
        self.series_formula.update_values(self.series_voltage, self.series_resistance)
        self.series_controls.update_values(self.series_voltage, self.series_resistance)
        
    # --- Parallel slots ---
    def on_parallel_voltage_changed(self, value):
        self.parallel_voltage = value
        self.update_parallel_simulation()
        
    def on_parallel_r1_changed(self, value):
        self.parallel_resistance = value
        self.update_parallel_simulation()
        
    def on_parallel_r2_changed(self, value):
        self.parallel_resistance2 = value
        self.update_parallel_simulation()
        
    def on_parallel_load_type_changed(self, load_type):
        self.parallel_canvas.set_load_type(load_type)
        self.parallel_formula.set_load_type(load_type)
        self.update_parallel_simulation()
        
    def update_parallel_simulation(self):
        self.parallel_canvas.update_values(self.parallel_voltage, self.parallel_resistance, self.parallel_resistance2)
        self.parallel_formula.update_values(self.parallel_voltage, self.parallel_resistance, self.parallel_resistance2)
        self.parallel_controls.update_values(self.parallel_voltage, self.parallel_resistance, self.parallel_resistance2)
