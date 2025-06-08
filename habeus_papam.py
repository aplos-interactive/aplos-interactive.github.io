import tkinter as tk
from tkinter import font as tkFont
import time

# --- Game Data (Copied from your JS, adapted for Python) ---
DOCUMENTS = {
    "intro_briefing": {
        "title": "Your First Briefing: The State of the Church",
        "content": "Welcome, Your Holiness, to the Chair of St. Peter. The realm faces numerous challenges, from distant heresies to disputes among our loyal monarchs. Your wisdom will guide us. Let us begin with your first pressing matter.",
        "source": "Cardinal Secretary of State",
        "options": [
            {"text": 'Begin my holy duties.', "consequences": {}, "next_doc_id": 'crusade_appeal'}
        ]
    },
    "crusade_appeal": {
        "title": "Urgent Appeal: Holy Land Under Threat!",
        "content": "A desperate plea has arrived from the Latin Patriarch of Jerusalem. The Saracens press hard upon the Holy Land. Without immediate divine intervention, or perhaps a new crusade, all may be lost! The Kings of Europe await your decree.",
        "source": "Patriarch of Jerusalem",
        "options": [
            {"text": 'Call for a new Crusade! Rally the faithful to arms.',
              "consequences": {"Piety": 15, "Gold": -30, "PublicOpinion": 10, "CardinalFavor": 5},
              "next_doc_id": 'crusade_funding_request'},
            {"text": 'Send only financial aid and blessings. Avoid direct military involvement.',
              "consequences": {"Piety": 5, "Gold": -10, "PublicOpinion": -5, "CardinalFavor": -5},
              "next_doc_id": 'papal_states_revolt'}
        ]
    },
    "crusade_funding_request": {
        "title": "Funding Request: Equipping the Crusade",
        "content": "Your Holiness's call for a new Crusade has stirred the hearts of many! However, the costs of equipping such an expedition are immense. We require significant funds to provision the armies and secure passage. The treasury is not limitless.",
        "source": "Head of Papal Treasury",
        "options": [
            {"text": 'Grant a substantial sum from the treasury for the Crusade.',
              "consequences": {"Gold": -50, "Authority": 10},
              "next_doc_id": 'papal_states_revolt'},
            {"text": 'Seek donations from wealthy nobles and merchants.',
              "consequences": {"PublicOpinion": -5, "Piety": 5, "Gold": 10},
              "next_doc_id": 'papal_states_revolt'}
        ]
    },
    "papal_states_revolt": {
        "title": "Revolt in the Papal States!",
        "content": "News has reached us that a rebellious lord in the Papal States has declared independence from your rule! His audacity threatens the very foundation of our temporal power. Immediate action is required to quell this uprising.",
        "source": "Swiss Guard Commander",
        "options": [
            {"text": 'Send the Papal Guard to brutally suppress the revolt.',
              "consequences": {"Authority": 15, "PublicOpinion": -15, "Gold": -20},
              "next_doc_id": 'end_of_demo'},
            {"text": 'Attempt peaceful negotiations, offering concessions.',
              "consequences": {"Authority": -10, "CardinalFavor": -5, "Piety": 10},
              "next_doc_id": 'end_of_demo'}
        ]
    },
    "end_of_demo": {
        "title": "End of Demo",
        "content": "This concludes the demo for Habeus Papam. You've experienced the core gameplay loop of receiving documents, making decisions, and seeing their immediate consequences. Imagine how deep the branching paths could become!",
        "source": "Your Future Self",
        "options": [
            {"text": 'Restart Demo', "consequences": {}, "next_doc_id": 'intro_briefing'}
        ]
    }
}

class HabeusPapamApp:
    def __init__(self, master):
        self.master = master
        master.title("Habeus Papam Demo")
        master.geometry("1000x700") # Fixed size for pixel art feel
        master.resizable(False, False) # Non-resizable
        master.configure(bg="#1c140c") # Dark background

        # Define pixel font (Tkinter usually uses system fonts, find a monospace one)
        # We try to use 'Press Start 2P' if available, otherwise a generic monospace
        try:
            self.pixel_font_large = tkFont.Font(family="Press Start 2P", size=16, weight="bold")
            self.pixel_font_medium = tkFont.Font(family="Press Start 2P", size=12)
            self.pixel_font_small = tkFont.Font(family="Press Start 2P", size=10)
        except tkFont.TclError:
            print("Press Start 2P font not found. Using Courier New.")
            self.pixel_font_large = tkFont.Font(family="Courier New", size=16, weight="bold")
            self.pixel_font_medium = tkFont.Font(family="Courier New", size=12)
            self.pixel_font_small = tkFont.Font(family="Courier New", size=10)


        self.papal_metrics = {
            "Piety": 50,
            "Authority": 50,
            "Gold": 100,
            "PublicOpinion": 50,
            "CardinalFavor": 50
        }
        self.current_document_id = "intro_briefing"
        self.game_day = 0

        self._create_widgets()
        self._load_document(self.current_document_id)
        self._update_metrics_display()

    def _create_widgets(self):
        # --- Desk Frame (Main container for game elements) ---
        # Simulate desk with fixed background and border
        self.desk_frame = tk.Frame(self.master, bg="#6a4933", bd=4, relief="solid",
                                    highlightbackground="#2e241c", highlightthickness=4)
        self.desk_frame.pack(expand=True, fill="both", padx=30, pady=30) # Fixed padding for pixel feel
        self.desk_frame.pack_propagate(False) # Prevent frame from shrinking to contents

        # Use grid layout for desk contents
        self.desk_frame.grid_rowconfigure(0, weight=1)
        self.desk_frame.grid_columnconfigure(0, weight=0, minsize=200) # Fixed width left
        self.desk_frame.grid_columnconfigure(1, weight=1) # Expandable center
        self.desk_frame.grid_columnconfigure(2, weight=0, minsize=200) # Fixed width right

        # --- Left Panel ---
        self.left_panel = tk.Frame(self.desk_frame, bg="#6a4933") # Match desk bg
        self.left_panel.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self.left_panel.grid_rowconfigure(0, weight=1)
        self.left_panel.grid_rowconfigure(1, weight=1)
        self.left_panel.grid_columnconfigure(0, weight=1)

        # Metrics Panel
        self.metrics_panel = tk.Frame(self.left_panel, bg="#a09d84", bd=2, relief="solid",
                                      highlightbackground="#5a4b3f", highlightthickness=2)
        self.metrics_panel.grid(row=0, column=0, sticky="nsew", padx=5, pady=5)
        self.metrics_panel.grid_propagate(False)

        tk.Label(self.metrics_panel, text="Papal Metrics", font=self.pixel_font_medium, fg="#6a0000", bg="#a09d84",
                 anchor="w").pack(fill="x", pady=(0, 5))
        self.metric_labels = {}
        for i, (metric, value) in enumerate(self.papal_metrics.items()):
            frame = tk.Frame(self.metrics_panel, bg="#a09d84")
            frame.pack(fill="x")
            tk.Label(frame, text=f"{metric}:", font=self.pixel_font_small, fg="#2e2e2e", bg="#a09d84", anchor="w").pack(side="left")
            self.metric_labels[metric] = tk.Label(frame, text=str(value), font=self.pixel_font_small, fg="#008000", bg="#a09d84", anchor="e")
            self.metric_labels[metric].pack(side="right")

        # In-Tray
        self.in_tray = tk.Frame(self.left_panel, bg="#7a6e5b", bd=2, relief="solid",
                                highlightbackground="#4f3624", highlightthickness=2)
        self.in_tray.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
        self.in_tray.pack_propagate(False)
        tk.Label(self.in_tray, text="Incoming", font=self.pixel_font_small, fg="#2e241c", bg="#7a6e5b").pack(pady=5)
        self.in_paper_stack = tk.Frame(self.in_tray, bg="#d0c8b0", bd=1, relief="solid",
                                      highlightbackground="#888", highlightthickness=1,
                                      width=100, height=50) # Simulate paper stack
        self.in_paper_stack.pack(pady=(0,5))
        self.in_paper_stack.pack_propagate(False)

        # --- Right Panel ---
        self.right_panel = tk.Frame(self.desk_frame, bg="#6a4933") # Match desk bg
        self.right_panel.grid(row=0, column=2, sticky="nsew", padx=5, pady=5)
        self.right_panel.grid_rowconfigure(0, weight=0) # Game day
        self.right_panel.grid_rowconfigure(1, weight=0) # Map button
        self.right_panel.grid_rowconfigure(2, weight=1) # Out tray
        self.right_panel.grid_columnconfigure(0, weight=1)


        # Game Day Counter
        self.game_day_label = tk.Label(self.right_panel, text="Day 1", font=self.pixel_font_medium,
                                       fg="#4f3624", bg="#a09d84", bd=2, relief="solid",
                                       highlightbackground="#5a4b3f", highlightthickness=2)
        self.game_day_label.grid(row=0, column=0, sticky="ew", padx=5, pady=5)

        # Map Button
        self.map_button = tk.Button(self.right_panel, text="MAP", font=self.pixel_font_medium,
                                    bg="#8b6b4b", fg="#f0e6d2", bd=2, relief="solid",
                                    highlightbackground="#5a0000", highlightthickness=2,
                                    command=self._show_map)
        self.map_button.grid(row=1, column=0, sticky="ew", padx=5, pady=5)
        self.map_button.bind("<Enter>", lambda e: self._button_hover(self.map_button, True))
        self.map_button.bind("<Leave>", lambda e: self._button_hover(self.map_button, False))
        self.map_button.bind("<Button-1>", lambda e: self._button_active(self.map_button, True))
        self.map_button.bind("<ButtonRelease-1>", lambda e: self._button_active(self.map_button, False))

        # Out-Tray
        self.out_tray = tk.Frame(self.right_panel, bg="#7a6e5b", bd=2, relief="solid",
                                 highlightbackground="#4f3624", highlightthickness=2)
        self.out_tray.grid(row=2, column=0, sticky="nsew", padx=5, pady=5)
        self.out_tray.pack_propagate(False)
        tk.Label(self.out_tray, text="Processed", font=self.pixel_font_small, fg="#2e241c", bg="#7a6e5b").pack(pady=5)
        self.out_paper_stack = tk.Frame(self.out_tray, bg="#fffaf0", bd=1, relief="solid",
                                       highlightbackground="#bbb", highlightthickness=1,
                                       width=100, height=50) # Simulate paper stack
        self.out_paper_stack.pack(pady=(0,5))
        self.out_paper_stack.pack_propagate(False)

        # --- Document Area ---
        self.document_area = tk.Frame(self.desk_frame, bg="#fffaf0", bd=3, relief="solid",
                                      highlightbackground="#8b0000", highlightthickness=3)
        self.document_area.grid(row=0, column=1, sticky="nsew", padx=15, pady=15)
        self.document_area.grid_propagate(False) # Prevent shrinking
        self.document_area.grid_rowconfigure(0, weight=0) # Title
        self.document_area.grid_rowconfigure(1, weight=1) # Content
        self.document_area.grid_rowconfigure(2, weight=0) # Source
        self.document_area.grid_rowconfigure(3, weight=0) # Options
        self.document_area.grid_columnconfigure(0, weight=1)

        # Document Seal (Canvas for pixel art drawing)
        self.doc_seal_canvas = tk.Canvas(self.document_area, width=20, height=20, bg="#fffaf0", highlightthickness=0)
        self.doc_seal_canvas.place(x=8, y=8) # Position relative to document_area
        self._draw_document_seal(self.doc_seal_canvas)

        self.doc_title_label = tk.Label(self.document_area, text="", font=self.pixel_font_large, fg="#6a0000", bg="#fffaf0",
                                        justify="center", wraplength=450)
        self.doc_title_label.grid(row=0, column=0, pady=(10, 10), sticky="ew")

        # Use Text widget for scrollable content
        self.doc_content_text = tk.Text(self.document_area, wrap="word", font=self.pixel_font_small, fg="#2e2e2e",
                                         bg="#fffaf0", bd=0, highlightthickness=0, relief="flat",
                                         yscrollcommand=lambda *args: self.doc_content_scrollbar.set(*args))
        self.doc_content_text.grid(row=1, column=0, sticky="nsew", padx=5, pady=5)
        self.doc_content_text.configure(state="disabled") # Make it read-only

        self.doc_content_scrollbar = tk.Scrollbar(self.document_area, command=self.doc_content_text.yview,
                                                  width=6, bg="#f0e6d2", troughcolor="#f0e6d2",
                                                  highlightbackground="#7a6e5b", highlightthickness=1)
        self.doc_content_scrollbar.grid(row=1, column=1, sticky="ns")
        self.doc_content_scrollbar.configure(activebackground="#8b6b4b") # Scrollbar thumb hover color

        self.doc_source_label = tk.Label(self.document_area, text="", font=self.pixel_font_small, fg="#444", bg="#fffaf0",
                                         justify="right", anchor="e")
        self.doc_source_label.grid(row=2, column=0, pady=(10, 0), sticky="ew")

        self.options_frame = tk.Frame(self.document_area, bg="#fffaf0")
        self.options_frame.grid(row=3, column=0, pady=(10, 0), sticky="ew")
        self.options_frame.grid_columnconfigure(0, weight=1)

        # --- Decorative Elements (Canvases for pixel art) ---
        # Quill & Inkwell
        self.quill_inkwell_canvas = tk.Canvas(self.desk_frame, width=50, height=80, bg="#6a4933", highlightthickness=0)
        self.quill_inkwell_canvas.place(x=60, y=self.desk_frame.winfo_height() - 80) # Position bottom-left
        self._draw_quill_inkwell(self.quill_inkwell_canvas)
        self.desk_frame.bind("<Configure>", self._update_quill_inkwell_position) # Update on resize

        # Decorative Scroll
        self.decorative_scroll_canvas = tk.Canvas(self.desk_frame, width=120, height=30, bg="#6a4933", highlightthickness=0)
        self.decorative_scroll_canvas.place(x=self.desk_frame.winfo_width() - 150, y=self.desk_frame.winfo_height() - 80) # Position bottom-right
        self._draw_decorative_scroll(self.decorative_scroll_canvas)
        self.desk_frame.bind("<Configure>", self._update_decorative_scroll_position) # Update on resize

        # --- Map Overlay (Toplevel window for simplicity) ---
        self.map_overlay = tk.Toplevel(self.master)
        self.map_overlay.title("Map of Medieval Europe")
        self.map_overlay.geometry("700x500")
        self.map_overlay.resizable(False, False)
        self.map_overlay.withdraw() # Hide initially
        self.map_overlay.transient(self.master) # Make it appear on top of main window
        self.map_overlay.grab_set() # Modal

        self.map_frame = tk.Frame(self.map_overlay, bg="#f0e6d2", bd=3, relief="solid",
                                  highlightbackground="#6a0000", highlightthickness=3)
        self.map_frame.pack(expand=True, fill="both", padx=10, pady=10)

        tk.Label(self.map_frame, text="Map of Medieval Europe", font=self.pixel_font_large, fg="#6a0000", bg="#f0e6d2").pack(pady=10)
        tk.Label(self.map_frame, text="Strategic overview of the realm.", font=self.pixel_font_small, fg="#2e2e2e", bg="#f0e6d2").pack(pady=5)

        self.pixel_map_canvas = tk.Canvas(self.map_frame, width=600, height=350, bg="#b0aa90", bd=2, relief="solid",
                                        highlightbackground="#333", highlightthickness=2)
        self.pixel_map_canvas.pack(pady=10)
        self._draw_pixel_map(self.pixel_map_canvas)

        self.close_map_button = tk.Button(self.map_frame, text="X", font=self.pixel_font_medium,
                                         bg="#6a0000", fg="white", bd=2, relief="solid",
                                         highlightbackground="#4a0000", highlightthickness=2,
                                         command=self._hide_map, width=3, height=1)
        self.close_map_button.place(relx=1.0, rely=0.0, x=-10, y=10, anchor="ne")
        self.close_map_button.bind("<Enter>", lambda e: self._button_hover(self.close_map_button, True))
        self.close_map_button.bind("<Leave>", lambda e: self._button_hover(self.close_map_button, False))
        self.close_map_button.bind("<Button-1>", lambda e: self._button_active(self.close_map_button, True))
        self.close_map_button.bind("<ButtonRelease-1>", lambda e: self._button_active(self.close_map_button, False))


    # --- Drawing functions for pixel art on canvas ---
    def _draw_document_seal(self, canvas):
        # Red wax block
        canvas.create_rectangle(0, 0, 20, 20, fill="#8b0000", outline="#5a0000", width=1)
        # Pixel cross
        canvas.create_rectangle(8, 3, 12, 17, fill="#f0e6d2", outline="#f0e6d2", width=0) # Vertical
        canvas.create_rectangle(3, 8, 17, 12, fill="#f0e6d2", outline="#f0e6d2", width=0) # Horizontal

    def _draw_quill_inkwell(self, canvas):
        canvas.delete("all") # Clear previous drawings

        # Inkwell body
        canvas.create_rectangle(5, 25, 45, 75, fill="#3a2b1f", outline="#2e241c", width=2)

        # Quill feather (simple block)
        canvas.create_rectangle(22, 0, 28, 70, fill="#e0e0e0", outline="#ccc", width=1, tags="quill_feather")
        # Rotate effect (simulated by a slight tilt and shift)
        canvas.coords("quill_feather", 20, 0, 26, 70) # x1, y1, x2, y2 for tilt effect

        # Quill nib
        canvas.create_rectangle(23, 50, 27, 75, fill="black", outline="black", width=0)

    def _draw_decorative_scroll(self, canvas):
        canvas.delete("all") # Clear previous drawings

        # Scroll body
        canvas.create_rectangle(10, 5, 110, 25, fill="#d0c8b0", outline="#7a6e5b", width=2)

        # Rolled ends (left)
        canvas.create_rectangle(0, 5, 10, 25, fill="#b0a890", outline="#7a6e5b", width=1)
        canvas.create_rectangle(2, 7, 8, 23, fill="#908870", outline="#7a6e5b", width=0) # Inner shadow

        # Rolled ends (right)
        canvas.create_rectangle(110, 5, 120, 25, fill="#b0a890", outline="#7a6e5b", width=1)
        canvas.create_rectangle(112, 7, 118, 23, fill="#908870", outline="#7a6e5b", width=0) # Inner shadow

    def _draw_pixel_map(self, canvas):
        canvas.delete("all") # Clear previous drawings

        # Base map background
        canvas.create_rectangle(0, 0, 600, 350, fill="#a09d84", outline="#706d5c", width=1)

        # Example regions (blocky rectangles)
        canvas.create_rectangle(30, 20, 150, 100, fill="#6a9b5f", outline="#4c7043", width=1) # Green Kingdom
        canvas.create_rectangle(180, 50, 300, 120, fill="#ab7668", outline="#8a5c4e", width=1) # Red Empire
        canvas.create_rectangle(350, 150, 450, 200, fill="#7d7b93", outline="#5d5b70", width=1) # Blue States
        canvas.create_rectangle(480, 20, 580, 100, fill="#8b6b4b", outline="#6a4c30", width=1) # Brown Duchy
        canvas.create_rectangle(100, 200, 180, 250, fill="#8B0000", outline="#5a0000", width=1) # Papal States (Red)

        # Simple pixel roads/borders
        canvas.create_line(120, 60, 250, 160, fill="#333", width=2)
        canvas.create_line(400, 180, 520, 80, fill="#333", width=2)

    # --- Position update functions for decorative elements on resize ---
    def _update_quill_inkwell_position(self, event=None):
        # Place based on the desk_frame's current size
        self.quill_inkwell_canvas.place(x=60, y=self.desk_frame.winfo_height() - 80)
        self.quill_inkwell_canvas.lift() # Ensure it's on top

    def _update_decorative_scroll_position(self, event=None):
        # Place based on the desk_frame's current size
        self.decorative_scroll_canvas.place(x=self.desk_frame.winfo_width() - 150, y=self.desk_frame.winfo_height() - 80)
        self.decorative_scroll_canvas.lift() # Ensure it's on top


    # --- Game Logic Functions ---
    def _update_metrics_display(self, changes=None):
        if changes is None:
            changes = {}

        for metric, label_widget in self.metric_labels.items():
            old_value = int(label_widget.cget("text"))
            new_value = self.papal_metrics[metric]

            label_widget.config(text=str(new_value))

            if metric in changes:
                if new_value > old_value:
                    label_widget.config(fg="#00ff00") # Bright green
                elif new_value < old_value:
                    label_widget.config(fg="#ff0000") # Bright red
                self.master.after(500, lambda m=metric: self.metric_labels[m].config(fg="#008000")) # Reset after 0.5s

    def _load_document(self, doc_id):
        doc = DOCUMENTS.get(doc_id)
        if not doc:
            print(f"Error: Document '{doc_id}' not found.")
            return

        self.current_document_id = doc_id
        self._hide_map() # Ensure map is closed when new document loads

        # Update document content
        self.doc_title_label.config(text=doc["title"])
        self.doc_content_text.config(state="normal") # Enable for editing
        self.doc_content_text.delete("1.0", tk.END)
        self.doc_content_text.insert(tk.END, doc["content"])
        self.doc_content_text.config(state="disabled") # Disable after inserting
        self.doc_source_label.config(text=f"— {doc['source']}")

        # Clear old options
        for widget in self.options_frame.winfo_children():
            widget.destroy()

        # Add new option buttons
        for option in doc["options"]:
            button = tk.Button(self.options_frame, text=option["text"], font=self.pixel_font_small,
                               bg="#3a2b1f", fg="#f0e6d2", bd=2, relief="solid",
                               highlightbackground="#2e241c", highlightthickness=2,
                               command=lambda opt=option: self._handle_decision(opt))
            button.pack(fill="x", pady=2) # Pixel-like padding
            # Bind hover/active effects
            button.bind("<Enter>", lambda e, b=button: self._button_hover(b, True))
            button.bind("<Leave>", lambda e, b=button: self._button_hover(b, False))
            button.bind("<Button-1>", lambda e, b=button: self._button_active(b, True))
            button.bind("<ButtonRelease-1>", lambda e, b=button: self._button_active(b, False))

        # Increment day counter
        if doc_id == "intro_briefing" and self.game_day == 0:
            self.game_day = 1
        elif doc_id == "intro_briefing" and self.game_day > 0: # Restart Demo
            self.papal_metrics = { "Piety": 50, "Authority": 50, "Gold": 100, "PublicOpinion": 50, "CardinalFavor": 50 }
            self.game_day = 1
            self._update_metrics_display() # Reset metrics display
        else:
            self.game_day += 1
        self.game_day_label.config(text=f"Day {self.game_day}")

    def _handle_decision(self, option):
        changes = {}
        for metric, value_change in option["consequences"].items():
            if metric in self.papal_metrics:
                old_value = self.papal_metrics[metric]
                self.papal_metrics[metric] += value_change
                # Clamp values between 0 and 100
                self.papal_metrics[metric] = max(0, min(100, self.papal_metrics[metric]))
                changes[metric] = self.papal_metrics[metric] - old_value # Track actual change

        self._update_metrics_display(changes)

        if option.get("next_doc_id"):
            self._load_document(option["next_doc_id"])
        else:
            print("No next document specified. End of path.") # Should not happen with demo logic

    # --- Button Hover/Active Effects (Simulate CSS hover/active) ---
    def _button_hover(self, button, is_hover):
        if is_hover:
            button.config(bg="#4f3624", relief="solid", highlightbackground="#2e241c", highlightthickness=3)
        else:
            button.config(bg="#3a2b1f", relief="solid", highlightbackground="#2e241c", highlightthickness=2)
        # Reset if currently in active state (this handles quick mouse out)
        if button.cget("text") == self.map_button.cget("text"): # Special handling for map button
            if not is_hover and button.cget("relief") == "sunken": # If it's still sunken and mouse left
                 button.config(bg="#8b6b4b", relief="solid", highlightbackground="#5a0000", highlightthickness=2)
        elif button.cget("text") == self.close_map_button.cget("text"):
             if not is_hover and button.cget("relief") == "sunken":
                button.config(bg="#6a0000", relief="solid", highlightbackground="#4a0000", highlightthickness=2)


    def _button_active(self, button, is_active):
        if is_active:
            button.config(relief="sunken", bg="#2e241c", highlightbackground="#1a1a1a", highlightthickness=1)
        else:
            # Reapply hover state if still hovering, otherwise default
            if button.cget("text") == self.map_button.cget("text"):
                button.config(bg="#8b6b4b", relief="solid", highlightbackground="#5a0000", highlightthickness=2)
            elif button.cget("text") == self.close_map_button.cget("text"):
                button.config(bg="#6a0000", relief="solid", highlightbackground="#4a0000", highlightthickness=2)
            else: # For document options
                button.config(bg="#3a2b1f", relief="solid", highlightbackground="#2e241c", highlightthickness=2)


    # --- Map Overlay Functions ---
    def _show_map(self):
        self.map_overlay.deiconify() # Show the Toplevel window
        self.map_overlay.grab_set() # Make it modal

    def _hide_map(self):
        self.map_overlay.withdraw() # Hide the Toplevel window
        self.map_overlay.grab_release() # Release modal focus

# --- Main execution ---
if __name__ == "__main__":
    root = tk.Tk()
    app = HabeusPapamApp(root)
    root.mainloop()
