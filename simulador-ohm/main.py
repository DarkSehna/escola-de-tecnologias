import sys
import os

# Add current directory to path to ensure correct relative imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from PySide6.QtWidgets import QApplication
from gui.main_window import MainWindow

def main():
    # Create the Qt Application
    app = QApplication(sys.argv)
    
    # Initialize and show main workspace window
    window = MainWindow()
    window.show()
    
    # Run the main event loop
    sys.exit(app.exec())

if __name__ == "__main__":
    main()
