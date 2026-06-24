import threading
import customtkinter as ctk
from config import COLOR_TEXT_PRIMARY, COLOR_TEXT_MUTED, COLOR_BORDER, COLOR_ACCENT

try:
    import winsound
except ImportError:
    winsound = None

# Configuração global de áudio
SOUND_ENABLED = False

def play_sound_async(sound_type: str):
    """Toca um feedback sonoro retrô em segundo plano de forma assíncrona."""
    if not SOUND_ENABLED or winsound is None:
        return
        
    def run():
        try:
            if sound_type == "click":
                winsound.Beep(900, 30)
            elif sound_type == "tab":
                winsound.Beep(1000, 35)
            elif sound_type == "success":
                # Arpejo retro-MIDI ascendente
                winsound.Beep(523, 60)   # Dó (C5)
                winsound.Beep(659, 60)   # Mi (E5)
                winsound.Beep(784, 90)   # Sol (G5)
            elif sound_type == "warning":
                # Alerta descendente
                winsound.Beep(350, 100)
                winsound.Beep(250, 150)
            elif sound_type == "remove":
                winsound.Beep(500, 40)
                winsound.Beep(400, 40)
            elif sound_type == "boot":
                winsound.Beep(800, 50)
                winsound.Beep(1200, 80)
        except Exception:
            pass
            
    threading.Thread(target=run, daemon=True).start()

class GlowEntry(ctk.CTkEntry):
    """CTkEntry customizado que brilha (muda de borda) ao receber foco."""
    def __init__(self, master, **kwargs):
        if "border_width" not in kwargs:
            kwargs["border_width"] = 1
        if "border_color" not in kwargs:
            kwargs["border_color"] = COLOR_BORDER
        super().__init__(master, **kwargs)
        self.bind("<FocusIn>", self._on_focus_in)
        self.bind("<FocusOut>", self._on_focus_out)
        
    def _on_focus_in(self, event):
        self.configure(border_color=COLOR_ACCENT)
        
    def _on_focus_out(self, event):
        self.configure(border_color=COLOR_BORDER)

class PlaceholderTextbox(ctk.CTkTextbox):
    """
    Subclasse de CTkTextbox que gerencia placeholders nativamente e
    brilha ao receber foco.
    """
    def __init__(self, master, placeholder_text="", **kwargs):
        if "border_width" not in kwargs:
            kwargs["border_width"] = 1
        if "border_color" not in kwargs:
            kwargs["border_color"] = COLOR_BORDER
            
        super().__init__(master, **kwargs)
        self.placeholder_text = placeholder_text
        self.is_showing_placeholder = False
        
        self.bind("<FocusIn>", self._clear_placeholder)
        self.bind("<FocusOut>", self._show_placeholder)
        self.apply_placeholder()
        
    def apply_placeholder(self):
        current_content = self.get("1.0", "end-1c").strip()
        if not current_content:
            self.is_showing_placeholder = True
            self.configure(text_color=COLOR_TEXT_MUTED)
            self.delete("1.0", "end")
            self.insert("1.0", self.placeholder_text)
            
    def _clear_placeholder(self, event):
        self.configure(border_color=COLOR_ACCENT)  # Glow
        if self.is_showing_placeholder:
            self.delete("1.0", "end")
            self.configure(text_color=COLOR_TEXT_PRIMARY)
            self.is_showing_placeholder = False
            
    def _show_placeholder(self, event):
        self.configure(border_color=COLOR_BORDER)  # Volta ao normal
        self.apply_placeholder()
        
    def get_text(self) -> str:
        if self.is_showing_placeholder:
            return ""
        return self.get("1.0", "end-1c").strip()
        
    def set_text(self, text: str):
        self.delete("1.0", "end")
        text_strip = str(text).strip()
        if not text_strip:
            self.apply_placeholder()
        else:
            self.is_showing_placeholder = False
            self.configure(text_color=COLOR_TEXT_PRIMARY)
            self.insert("1.0", text_strip)
            
    def clear_text(self):
        self.delete("1.0", "end")
        self.apply_placeholder()
