# Design and Physics Configurations for Ohm's Law Simulator

# Colors (Cyberpunk / Gamer Dark Mode)
COLOR_BG = "#07090d"              # Deep space black-blue
COLOR_PANEL_BG = "#0c0f18"        # Dark slate for control panels
COLOR_BORDER = "#1b2234"          # Sleek boundary color

# Circuit Visual Elements
COLOR_WIRE_HIGH = "#ff9d00"       # Neon orange/yellow (High Potential)
COLOR_WIRE_LOW = "#00bfff"        # Neon cyan/blue (Low Potential)
COLOR_BATTERY = "#00ff66"         # Neon green
COLOR_RESISTOR = "#ff3344"        # Crimson red
COLOR_ELECTRON = "#ffffff"        # Glowing white core
COLOR_ELECTRON_GLOW = "#ffff33"   # Bright yellow aura
COLOR_TEXT_PRIMARY = "#ffffff"    # Crisp white
COLOR_TEXT_MUTED = "#6f7d95"      # Secondary gray-blue

# Fonts
FONT_FAMILY = "Segoe UI"
FONT_SIZE_TITLE = 18
FONT_SIZE_SUBTITLE = 12
FONT_SIZE_BODY = 10
FONT_FAMILY_DIGITAL = "Consolas"   # Monospace for digital look

# Circuit Dimensions
CIRCUIT_WIDTH = 550
CIRCUIT_HEIGHT = 280
CIRCUIT_X = 60
CIRCUIT_Y = 50

# Wire Segment Locations (Defining the rectangle)
# x1, y1 to x2, y2
LINE_TOP_LEFT = (CIRCUIT_X, CIRCUIT_Y, CIRCUIT_X + CIRCUIT_WIDTH // 2, CIRCUIT_Y)
# The consumer sits in the middle of the right side vertical path (100px gap, from Y=140 to Y=240)
LINE_RIGHT_TOP = (CIRCUIT_X + CIRCUIT_WIDTH, CIRCUIT_Y, CIRCUIT_X + CIRCUIT_WIDTH, CIRCUIT_Y + 90)
LINE_RIGHT_BOTTOM = (CIRCUIT_X + CIRCUIT_WIDTH, CIRCUIT_Y + 190, CIRCUIT_X + CIRCUIT_WIDTH, CIRCUIT_Y + CIRCUIT_HEIGHT)
# Bottom return path
LINE_BOTTOM = (CIRCUIT_X + CIRCUIT_WIDTH, CIRCUIT_Y + CIRCUIT_HEIGHT, CIRCUIT_X, CIRCUIT_Y + CIRCUIT_HEIGHT)
# Left side vertical path (contains the battery)
LINE_LEFT_TOP = (CIRCUIT_X, CIRCUIT_Y + CIRCUIT_HEIGHT // 2 - 30, CIRCUIT_X, CIRCUIT_Y)
LINE_LEFT_BOTTOM = (CIRCUIT_X, CIRCUIT_Y + CIRCUIT_HEIGHT, CIRCUIT_X, CIRCUIT_Y + CIRCUIT_HEIGHT // 2 + 30)

# Electron Animation Settings
ELECTRON_COUNT = 36          # Total electrons in loop
ELECTRON_RADIUS = 5
BASE_SPEED_MULTIPLIER = 10.0  # Scalar to match electron flow speed to Current (I)
MIN_SPEED = 0.5               # Prevents electrons from stopping completely
MAX_SPEED = 25.0              # Caps speed for visual smoothness

# Load (Consumer) Type Constants
LOAD_RESISTOR = "resistor"
LOAD_BULB = "bulb"
LOAD_MOTOR = "motor"

# Parallel branch X-coordinates
PARALLEL_SPLIT_X = 490
PARALLEL_BRANCH_1_X = 540
PARALLEL_BRANCH_2_X = 610
