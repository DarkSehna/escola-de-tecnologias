# Core FSM Logic Model

class FSMModel:
    def __init__(self):
        self.states = set()  # set of state names
        self.connections = {}  # dict: state_name -> dict(target_state_name -> condition)
        self.active_state = None

    def add_state(self, name):
        name = name.strip().upper()
        if not name:
            return False, "Nome do estado não pode ser vazio."
        if name in self.states:
            return False, f"Estado '{name}' já existe."
        self.states.add(name)
        if name not in self.connections:
            self.connections[name] = {}
        return True, f"Estado '{name}' adicionado."

    def remove_state(self, name):
        name = name.strip().upper()
        if name not in self.states:
            return False, f"Estado '{name}' não existe."
        
        self.states.remove(name)
        if name in self.connections:
            del self.connections[name]
            
        # Remove any connections pointing to this state
        for src in self.connections:
            if name in self.connections[src]:
                del self.connections[src][name]
                
        if self.active_state == name:
            self.active_state = None
            # Set another active state if possible
            if self.states:
                self.active_state = sorted(list(self.states))[0]
                
        return True, f"Estado '{name}' removido."

    def add_transition(self, source, target, condition="NONE"):
        source = source.strip().upper()
        target = target.strip().upper()
        if source not in self.states or target not in self.states:
            return False, "Origem ou destino não pertencem a este modelo."
        
        if target in self.connections[source]:
            return False, f"Transição de '{source}' para '{target}' já existe."
            
        self.connections[source][target] = condition
        return True, f"Transição '{source}' -> '{target}' criada."

    def remove_transition(self, source, target):
        source = source.strip().upper()
        target = target.strip().upper()
        if source in self.connections and target in self.connections[source]:
            del self.connections[source][target]
            return True, f"Transição '{source}' -> '{target}' removida."
        return False, f"Transição '{source}' -> '{target}' não encontrada."

    def set_transition_condition(self, source, target, condition):
        source = source.strip().upper()
        target = target.strip().upper()
        if source in self.connections and target in self.connections[source]:
            self.connections[source][target] = condition
            return True, f"Condição da transição '{source}' -> '{target}' atualizada para '{condition}'."
        return False, f"Transição '{source}' -> '{target}' não encontrada."

    def try_transition(self, target):
        target = target.strip().upper()
        if not self.active_state:
            return False, "Nenhum estado ativo definido."
        if target not in self.states:
            return False, f"Estado destino '{target}' não existe."
            
        # A transition is valid if it exists in connections dict
        if target in self.connections.get(self.active_state, {}):
            old_active = self.active_state
            self.active_state = target
            return True, f"Transição efetuada: '{old_active}' -> '{target}'."
        else:
            return False, f"Transição inválida: Não há conexão direta de '{self.active_state}' para '{target}'."

    def set_active(self, name):
        name = name.strip().upper()
        if name in self.states:
            self.active_state = name
            return True
        return False
