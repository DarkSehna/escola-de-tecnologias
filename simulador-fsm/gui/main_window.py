from PySide6.QtWidgets import QMainWindow, QWidget, QHBoxLayout
from PySide6.QtCore import Qt, QPointF, QTimer
from PySide6.QtGui import QIcon
import threading
import winsound
import random

import config
from fsm_model import FSMModel
from gui.sidebar import Sidebar
from gui.node_editor import NodeEditorScene, NodeEditorView
from gui.state_node import StateNode
from gui.transition_arrow import TransitionArrow

def play_sound_async(frequency, duration):
    def run():
        try:
            winsound.Beep(frequency, duration)
        except Exception:
            pass
    threading.Thread(target=run, daemon=True).start()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("FSM Visual Simulator - Game Maker Player State Model")
        self.resize(1100, 750)
        
        # 1. Initialize logic model
        self.fsm = FSMModel()
        
        # Dictionaries to track UI items mapping to logic entities
        self.nodes = {}  # state_name (str) -> StateNode (placed on canvas)
        self.arrows = {} # (source_name, target_name) -> TransitionArrow (placed on canvas)
        
        # 2. Setup Central Widget and Layout
        self.central_widget = QWidget()
        self.setCentralWidget(self.central_widget)
        
        self.main_layout = QHBoxLayout(self.central_widget)
        self.main_layout.setContentsMargins(0, 0, 0, 0)
        self.main_layout.setSpacing(0)
        
        # 3. Create Left Sidebar
        self.sidebar = Sidebar()
        self.main_layout.addWidget(self.sidebar)
        
        # 4. Create Right Canvas Editor
        self.scene = NodeEditorScene()
        self.view = NodeEditorView(self.scene)
        self.main_layout.addWidget(self.view)
        
        # Apply dark background to main window as well to avoid white flash
        self.setStyleSheet(f"background-color: {config.COLOR_BG};")
        
        # 5. Connect signals
        self.sidebar.createStateRequested.connect(self.create_new_state)
        self.sidebar.deleteStateRequested.connect(self.delete_state_from_project)
        self.sidebar.transitionConditionChanged.connect(self.set_transition_trigger)
        self.sidebar.recordTriggerRequested.connect(self.start_recording_trigger)
        self.view.stateDropped.connect(self.handle_state_dropped)
        self.view.transitionRequested.connect(self.create_transition)
        self.view.mouseClicked.connect(self.handle_mouse_click)
        
        self.scene.nodeDoubleClicked.connect(self.handle_node_double_click)
        self.scene.selectionDeleted.connect(self.handle_selection_deleted)
        self.scene.selectionChanged.connect(self.handle_selection_changed)
        
        # Single-shot timer for time transitions
        self.timer_trigger = QTimer(self)
        self.timer_trigger.setSingleShot(True)
        self.timer_trigger.timeout.connect(self.handle_time_transition)
        self.pending_timer_target = None
        self.recording_arrow = None
        
        # Write welcome banner to console
        self.sidebar.log("SIMULADOR VISUAL DE MÁQUINA DE ESTADOS")
        self.sidebar.log("Tema: Máquina de Estados de Player (GameMaker)")
        self.sidebar.log("Use Duplo-Clique para transicionar o Estado Ativo.")
        self.sidebar.log("Use Botão Direito + Arraste para conectar transições.")
        self.sidebar.log("Arraste itens da lista de estados para o canvas.")
        self.sidebar.log("-------------------------------------------------")
        
        # 6. Populate default GameMaker platformer states and transitions
        self.populate_default_model()
        
        # Start sound
        play_sound_async(1000, 150)

    def populate_default_model(self):
        # 1. Default states: All loaded into project/sidebar. But ONLY GROUND and AIR visually placed.
        project_states = ["GROUND", "AIR", "DASH", "ATTACK", "HURT", "DEAD"]
        placed_states = {
            "GROUND": (-120, -50),
            "AIR": (120, -50)
        }
        
        # Add all to logic FSM and sidebar list
        for state_name in project_states:
            success, msg = self.fsm.add_state(state_name)
            if success:
                self.sidebar.add_state_to_list(state_name)
                
        # Draw GROUND and AIR on canvas visually
        for state_name, pos in placed_states.items():
            node = StateNode(state_name, pos[0], pos[1])
            node.doubleClicked.connect(self.handle_node_double_click)
            self.scene.addItem(node)
            self.nodes[state_name] = node
                
        # 2. Set active state
        self.fsm.set_active("GROUND")
        self.nodes["GROUND"].set_active(True)
        self.sidebar.update_active_state("GROUND")
        self.sidebar.log("Estado ativo inicial: GROUND")
        
        # 3. Create transitions in model logic with default trigger conditions
        default_transitions = [
            ("GROUND", "AIR", "SPACE"), # Space bar transitions ground to air
            ("GROUND", "DASH", "SHIFT"),
            ("GROUND", "ATTACK", "X"),
            ("GROUND", "HURT", "H"),
            ("GROUND", "DEAD", "K"),
            
            ("AIR", "GROUND", "DOWN"),  # Down arrow transitions air to ground
            ("AIR", "DASH", "SHIFT"),
            ("AIR", "HURT", "H"),
            ("AIR", "DEAD", "K"),
            
            ("DASH", "GROUND", "NONE"),
            ("DASH", "AIR", "NONE"),
            ("DASH", "HURT", "H"),
            ("DASH", "DEAD", "K"),
            
            ("ATTACK", "GROUND", "NONE"),
            ("ATTACK", "AIR", "NONE"),
            ("ATTACK", "HURT", "H"),
            ("ATTACK", "DEAD", "K"),
            
            ("HURT", "GROUND", "NONE"),
            ("HURT", "AIR", "NONE"),
            ("HURT", "DEAD", "K"),
            
            ("DEAD", "AIR", "SPACE") # Press space to respawn into air
        ]
        
        for src, tgt, cond in default_transitions:
            success, msg = self.fsm.add_transition(src, tgt, cond)
            # Visually draw only if both nodes are placed on the canvas
            if success and src in self.nodes and tgt in self.nodes:
                arrow = TransitionArrow(self.nodes[src], self.nodes[tgt])
                arrow.set_condition(cond)
                self.scene.addItem(arrow)
                self.arrows[(src, tgt)] = arrow
                
        self.sidebar.log(f"Carregados {len(project_states)} estados no projeto.")
        self.sidebar.log(f"Pre-posicionados GROUND e AIR no canvas.")
        self.check_and_start_state_timer("GROUND")

    def create_new_state(self, state_name):
        state_name = state_name.strip().upper()
        success, msg = self.fsm.add_state(state_name)
        if success:
            # Add to sidebar list ONLY. Do not place visually on the canvas.
            self.sidebar.add_state_to_list(state_name)
            self.sidebar.log(f"Estado '{state_name}' criado no projeto. Arraste-o para o Canvas.")
            play_sound_async(800, 80)
        else:
            self.sidebar.log(msg, is_error=True)
            play_sound_async(300, 200)

    def delete_state_from_project(self, state_name):
        state_name = state_name.strip().upper()
        
        # 1. Remove node and connected arrows visually from the canvas if it was placed
        found_key = None
        for key in self.nodes:
            if key.strip().upper() == state_name:
                found_key = key
                break
                
        if found_key:
            node = self.nodes[found_key]
            connected_arrows = node.outgoing_arrows[:] + node.incoming_arrows[:]
            for arrow in connected_arrows:
                src = arrow.source_node.name
                tgt = arrow.target_node.name
                
                # Remove visual arrow key robustly
                arrow_key = None
                for a_key in self.arrows:
                    if a_key[0].strip().upper() == src.strip().upper() and a_key[1].strip().upper() == tgt.strip().upper():
                        arrow_key = a_key
                        break
                if arrow_key:
                    del self.arrows[arrow_key]
                elif (src, tgt) in self.arrows:
                    del self.arrows[(src, tgt)]
                    
                arrow.disconnect()
                self.scene.removeItem(arrow)
                
            self.scene.removeItem(node)
            del self.nodes[found_key]
            
        # 2. Remove from logic model
        self.fsm.remove_state(state_name)
        
        # 3. Remove from sidebar list
        self.sidebar.remove_state_from_list(state_name)
        
        self.sidebar.log(f"Estado '{state_name}' removido permanentemente do projeto.")
        self.sidebar.update_active_state(self.fsm.active_state)
        play_sound_async(400, 150)

    def handle_state_dropped(self, state_name, scene_pos):
        state_name = state_name.strip().upper()
        
        found_key = None
        for key in self.nodes:
            if key.strip().upper() == state_name:
                found_key = key
                break
                
        if found_key:
            # State is already placed on the canvas: move it to the new position
            self.nodes[found_key].setPos(scene_pos)
            self.sidebar.log(f"Nó '{found_key}' reposicionado no canvas.")
            play_sound_async(950, 70)
        else:
            # Instantiate visual StateNode at the drop location
            node = StateNode(state_name, scene_pos.x(), scene_pos.y())
            node.doubleClicked.connect(self.handle_node_double_click)
            self.scene.addItem(node)
            self.nodes[state_name] = node
            
            # If FSM active state matches this and was not visually active, update it
            if self.fsm.active_state == state_name:
                node.set_active(True)
                
            # Recreate visual arrows for pre-existing FSM connections to/from this node
            # 1. Outgoing transitions from this new node
            if state_name in self.fsm.connections:
                for tgt, cond in self.fsm.connections[state_name].items():
                    tgt_key = None
                    for key in self.nodes:
                        if key.strip().upper() == tgt.strip().upper():
                            tgt_key = key
                            break
                    if tgt_key:
                        arrow = TransitionArrow(node, self.nodes[tgt_key])
                        arrow.set_condition(cond)
                        self.scene.addItem(arrow)
                        self.arrows[(state_name, tgt_key)] = arrow
                        
            # 2. Incoming transitions to this new node from other placed nodes
            for src in self.nodes:
                src_clean = src.strip().upper()
                if src_clean != state_name and src_clean in self.fsm.connections:
                    found_tgt_in_fsm = None
                    for tgt in self.fsm.connections[src_clean]:
                        if tgt.strip().upper() == state_name:
                            found_tgt_in_fsm = tgt
                            break
                    if found_tgt_in_fsm:
                        cond = self.fsm.connections[src_clean][found_tgt_in_fsm]
                        arrow = TransitionArrow(self.nodes[src], node)
                        arrow.set_condition(cond)
                        self.scene.addItem(arrow)
                        self.arrows[(src, state_name)] = arrow
                        
            self.sidebar.log(f"Nó '{state_name}' posicionado no canvas.")
            play_sound_async(900, 80)

    def create_transition(self, source_name, target_name):
        source_name = source_name.strip().upper()
        target_name = target_name.strip().upper()
        if source_name == target_name:
            self.sidebar.log("Auto-transições (self-loops) não são permitidas.", is_error=True)
            play_sound_async(300, 200)
            return

        success, msg = self.fsm.add_transition(source_name, target_name)
        if success:
            src_node = None
            tgt_node = None
            for key, val in self.nodes.items():
                if key.strip().upper() == source_name:
                    src_node = val
                if key.strip().upper() == target_name:
                    tgt_node = val
            if not src_node:
                src_node = self.nodes.get(source_name)
            if not tgt_node:
                tgt_node = self.nodes.get(target_name)
                
            arrow = TransitionArrow(src_node, tgt_node)
            self.scene.addItem(arrow)
            self.arrows[(source_name, target_name)] = arrow
            self.sidebar.log(f"Nova transição criada: {source_name} -> {target_name}")
            play_sound_async(900, 80)
        else:
            self.sidebar.log(msg, is_error=True)
            play_sound_async(300, 150)

    def set_transition_trigger(self, source, target, key_name):
        source = source.strip().upper()
        target = target.strip().upper()
        key_name = key_name.strip().upper()
        success, msg = self.fsm.set_transition_condition(source, target, key_name)
        if success:
            arrow_key = None
            for key in self.arrows:
                if key[0].strip().upper() == source and key[1].strip().upper() == target:
                    arrow_key = key
                    break
            if arrow_key:
                self.arrows[arrow_key].set_condition(key_name)
            elif (source, target) in self.arrows:
                self.arrows[(source, target)].set_condition(key_name)
                
            self.sidebar.log(f"Gatilho de '{source}' -> '{target}' atualizado para [{key_name}]")
            play_sound_async(950, 70)
            
            if source == self.fsm.active_state:
                self.check_and_start_state_timer(source)

    def get_key_name(self, key_code):
        # Map specific keys to clean uppercase names
        special_map = {
            Qt.Key.Key_Space: "SPACE",
            Qt.Key.Key_Down: "DOWN",
            Qt.Key.Key_Up: "UP",
            Qt.Key.Key_Left: "LEFT",
            Qt.Key.Key_Right: "RIGHT",
            Qt.Key.Key_Shift: "SHIFT",
            Qt.Key.Key_Control: "CTRL",
            Qt.Key.Key_Alt: "ALT",
            Qt.Key.Key_Return: "ENTER",
            Qt.Key.Key_Enter: "ENTER",
            Qt.Key.Key_Escape: "ESC",
            Qt.Key.Key_Tab: "TAB",
            Qt.Key.Key_Backspace: "BACKSPACE",
            Qt.Key.Key_Delete: "DELETE"
        }
        if key_code in special_map:
            return special_map[key_code]
            
        # Standard letters A-Z
        if Qt.Key.Key_A <= key_code <= Qt.Key.Key_Z:
            return chr(key_code).upper()
        # Numbers 0-9
        if Qt.Key.Key_0 <= key_code <= Qt.Key.Key_9:
            return chr(key_code)
            
        # Fallback to key sequence representation
        from PySide6.QtGui import QKeySequence
        seq_str = QKeySequence(key_code).toString().upper()
        if seq_str and len(seq_str) <= 15:
            return seq_str
            
        return None

    def start_recording_trigger(self):
        selected = self.scene.selectedItems()
        if len(selected) == 1 and isinstance(selected[0], TransitionArrow):
            self.recording_arrow = selected[0]
            self.sidebar.set_recording_mode(True)
            self.sidebar.log("Aguardando entrada: Pressione qualquer tecla ou clique no canvas...")
            play_sound_async(1000, 100)

    def handle_key_press(self, key_code):
        trigger = self.get_key_name(key_code)
        if not trigger or not self.fsm.active_state:
            return
            
        # Look for all outgoing transitions from active state matching the trigger
        active = self.fsm.active_state
        connections = self.fsm.connections.get(active, {})
        
        candidates = []
        for tgt, cond in connections.items():
            if cond == trigger:
                candidates.append(tgt)
                
        target_state = None
        # Prioritize target states that are currently placed on the canvas (robust match)
        for tgt in candidates:
            tgt_clean = tgt.strip().upper()
            found_key = None
            for key in self.nodes:
                if key.strip().upper() == tgt_clean:
                    found_key = key
                    break
            if found_key:
                target_state = found_key
                break
                
        # Fallback if none are on canvas
        if not target_state and candidates:
            for key in self.nodes:
                if key.strip().upper() == candidates[0].strip().upper():
                    target_state = key
                    break
            if not target_state:
                target_state = candidates[0]
                
        # Log details to console for debugging
        self.sidebar.log(f"Teclado: Gatilho [{trigger}] - Candidatos: {candidates} - Ativo: {active} - Selecionado: {target_state}")
                
        if target_state:
            self.handle_node_double_click(target_state)

    def keyPressEvent(self, event):
        # 1. Check if we are recording a transition trigger
        if self.recording_arrow:
            if event.key() == Qt.Key.Key_Escape:
                self.recording_arrow = None
                self.sidebar.set_recording_mode(False)
                self.sidebar.log("Gravação de gatilho cancelada.")
                play_sound_async(400, 150)
                event.accept()
                return
                
            key_name = self.get_key_name(event.key())
            if key_name:
                src = self.recording_arrow.source_node.name
                tgt = self.recording_arrow.target_node.name
                self.set_transition_trigger(src, tgt, key_name)
                # Show in sidebar config
                self.sidebar.show_transition_config(src, tgt, key_name)
                self.recording_arrow = None
                self.sidebar.set_recording_mode(False)
                event.accept()
                return
                
        # 2. Check focus
        if self.sidebar.state_name_input.hasFocus():
            super().keyPressEvent(event)
            return
            
        self.handle_key_press(event.key())
        
        # Globally handle delete keys too, for better UX
        if event.key() == Qt.Key.Key_Delete:
            selected = self.scene.selectedItems()
            if selected:
                self.scene.selectionDeleted.emit(selected)
                event.accept()
                return
                
        super().keyPressEvent(event)

    def handle_mouse_click(self, button):
        # 1. Check if we are recording a transition trigger
        if self.recording_arrow:
            trigger = "MOUSE_LEFT" if button == Qt.MouseButton.LeftButton else "MOUSE_RIGHT"
            src = self.recording_arrow.source_node.name
            tgt = self.recording_arrow.target_node.name
            self.set_transition_trigger(src, tgt, trigger)
            # Show in sidebar config
            self.sidebar.show_transition_config(src, tgt, trigger)
            self.recording_arrow = None
            self.sidebar.set_recording_mode(False)
            return
            
        # 2. Otherwise process normal mouse triggers
        trigger = None
        if button == Qt.MouseButton.LeftButton:
            trigger = "MOUSE_LEFT"
        elif button == Qt.MouseButton.RightButton:
            trigger = "MOUSE_RIGHT"
            
        if not trigger or not self.fsm.active_state:
            return
            
        # Look for all outgoing transitions from active state matching the trigger
        active = self.fsm.active_state
        connections = self.fsm.connections.get(active, {})
        
        candidates = []
        for tgt, cond in connections.items():
            if cond == trigger:
                candidates.append(tgt)
                
        target_state = None
        # Prioritize target states that are currently placed on the canvas (robust match)
        for tgt in candidates:
            tgt_clean = tgt.strip().upper()
            found_key = None
            for key in self.nodes:
                if key.strip().upper() == tgt_clean:
                    found_key = key
                    break
            if found_key:
                target_state = found_key
                break
                
        # Fallback if none are on canvas
        if not target_state and candidates:
            for key in self.nodes:
                if key.strip().upper() == candidates[0].strip().upper():
                    target_state = key
                    break
            if not target_state:
                target_state = candidates[0]
                
        # Log details to console for debugging
        self.sidebar.log(f"Mouse: Gatilho [{trigger}] - Candidatos: {candidates} - Ativo: {active} - Selecionado: {target_state}")
                
        if target_state:
            self.handle_node_double_click(target_state)

    def check_and_start_state_timer(self, state_name):
        self.timer_trigger.stop()
        self.pending_timer_target = None
        
        if not state_name:
            return
            
        connections = self.fsm.connections.get(state_name, {})
        
        # Find all timer transitions (case-insensitive checks)
        timer_candidates = []
        for tgt, cond in connections.items():
            is_time = False
            if cond and cond.lower().endswith("s"):
                try:
                    val_str = cond[:-1].replace(",", ".")
                    float(val_str)
                    is_time = True
                except ValueError:
                    pass
            if is_time:
                timer_candidates.append((tgt, cond))
                
        # Prioritize timer transitions to nodes on canvas (robust match)
        selected_candidate = None
        for tgt, cond in timer_candidates:
            tgt_clean = tgt.strip().upper()
            found_key = None
            for key in self.nodes:
                if key.strip().upper() == tgt_clean:
                    found_key = key
                    break
            if found_key:
                selected_candidate = (found_key, cond)
                break
                
        if not selected_candidate and timer_candidates:
            fallback_tgt, fallback_cond = timer_candidates[0]
            found_key = None
            for key in self.nodes:
                if key.strip().upper() == fallback_tgt.strip().upper():
                    found_key = key
                    break
            if found_key:
                selected_candidate = (found_key, fallback_cond)
            else:
                selected_candidate = (fallback_tgt, fallback_cond)
            
        if selected_candidate:
            tgt, cond = selected_candidate
            try:
                val_str = cond[:-1].replace(",", ".")
                time_val = float(val_str)
                ms = int(time_val * 1000)
                self.pending_timer_target = tgt
                self.timer_trigger.start(ms)
                self.sidebar.log(f"Timer iniciado: Transição automática para '{tgt}' em {cond}.")
            except ValueError:
                pass

    def handle_time_transition(self):
        target = self.pending_timer_target
        if target and self.fsm.active_state:
            self.sidebar.log(f"Timer expirado! Transicionando automaticamente para '{target}'.")
            self.handle_node_double_click(target)

    def handle_selection_changed(self):
        selected = self.scene.selectedItems()
        if len(selected) == 1 and isinstance(selected[0], TransitionArrow):
            arrow = selected[0]
            src = arrow.source_node.name
            tgt = arrow.target_node.name
            cond = arrow.condition
            self.sidebar.show_transition_config(src, tgt, cond)
        else:
            self.sidebar.hide_transition_config()

    def handle_node_double_click(self, target_name):
        target_name = target_name.strip().upper()
        
        # 1. Block transitions to states that are not currently placed on the canvas
        found_target_key = None
        for key in self.nodes:
            if key.strip().upper() == target_name:
                found_target_key = key
                break
                
        if not found_target_key:
            self.sidebar.log(f"Transição bloqueada: O estado '{target_name}' não está no Canvas.", is_error=True)
            active = self.fsm.active_state
            if active:
                found_active_key = None
                for key in self.nodes:
                    if key.strip().upper() == active:
                        found_active_key = key
                        break
                if found_active_key:
                    self.nodes[found_active_key].flash_error()
            play_sound_async(220, 250)
            return

        old_active = self.fsm.active_state
        
        success, msg = self.fsm.try_transition(target_name)
        if success:
            # Update GUI states
            if old_active and old_active in self.nodes:
                self.nodes[old_active].set_active(False)
            else:
                # Fallback search for old active
                for key in self.nodes:
                    if key.strip().upper() == old_active:
                        self.nodes[key].set_active(False)
                        break
                        
            # Set target active
            self.nodes[found_target_key].set_active(True)
                
            self.sidebar.update_active_state(target_name)
            self.sidebar.log(f"Transicionado de '{old_active}' para '{target_name}'")
            play_sound_async(1200, 80)
            
            # Start timer if new state has any time transitions
            self.check_and_start_state_timer(target_name)
        else:
            # Transition invalid: flash double-clicked node in red and write error log
            self.nodes[found_target_key].flash_error()
            self.sidebar.log(msg, is_error=True)
            play_sound_async(220, 250)

    def handle_selection_deleted(self, items):
        nodes_to_delete = []
        arrows_to_delete = []
        
        for item in items:
            if isinstance(item, TransitionArrow):
                arrows_to_delete.append(item)
            elif isinstance(item, StateNode):
                nodes_to_delete.append(item)
                
        # 1. Delete transition arrows from screen and FSM model logic
        for arrow in arrows_to_delete:
            src = arrow.source_node.name
            tgt = arrow.target_node.name
            
            # Remove transition from model
            self.fsm.remove_transition(src, tgt)
            # Remove mapping
            if (src, tgt) in self.arrows:
                del self.arrows[(src, tgt)]
            arrow.disconnect()
            self.scene.removeItem(arrow)
            self.sidebar.log(f"Conexão removida: {src} -> {tgt}")
            
        # 2. Delete nodes visually from canvas (but KEEP in project/sidebar list!)
        for node in nodes_to_delete:
            name = node.name
            
            # Remove all connected visual arrows from canvas and model
            connected_arrows = node.outgoing_arrows[:] + node.incoming_arrows[:]
            for arrow in connected_arrows:
                src = arrow.source_node.name
                tgt = arrow.target_node.name
                self.fsm.remove_transition(src, tgt)
                if (src, tgt) in self.arrows:
                    del self.arrows[(src, tgt)]
                arrow.disconnect()
                self.scene.removeItem(arrow)
                
            # Remove visual node from scene and self.nodes dict
            self.scene.removeItem(node)
            if name in self.nodes:
                del self.nodes[name]
                
            self.sidebar.log(f"Nó '{name}' removido do canvas (permanece na lista do projeto).")
            
        # Update sidebar active state monitor
        self.sidebar.update_active_state(self.fsm.active_state)
        self.check_and_start_state_timer(self.fsm.active_state)
        play_sound_async(400, 150)
