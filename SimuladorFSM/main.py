import sys
from PySide6.QtWidgets import QApplication
from gui.main_window import MainWindow

def main():
    # Setup PySide6 application
    app = QApplication(sys.argv)
    
    # Initialize and show main workspace window
    window = MainWindow()
    window.show()
    
    # Run the Qt event loop
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
