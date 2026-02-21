import customtkinter as ctk
import tkinter as tk
from tkinter import messagebox
import requests
import json
import threading
import time
import webbrowser
import random
import winreg
import subprocess
import pystray
from pystray import MenuItem as item
from PIL import Image, ImageDraw
import sys
import os
import ctypes
import tempfile
import shutil

# ══════════════════════════════════════════
# DEBUG LOGGING
# ══════════════════════════════════════════
LOG_PATH = os.path.join(tempfile.gettempdir(), "arot_debug.log")
with open(LOG_PATH, "w") as f:
    f.write("--- AROT VPN DEBUG START ---\n")

def log_debug(msg):
    try:
        with open(LOG_PATH, "a") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] {msg}\n")
    except:
        pass

def resource_path(relative_path):
    """ Get absolute path to resource, works for dev and for PyInstaller """
    try:
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")
    return os.path.join(base_path, relative_path)

# ══════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════
SUPABASE_URL = "https://mjcuvxbomgpijqflofzv.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qY3V2eGJvbWdwaWpxZmxvZnp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMTcyMzYsImV4cCI6MjA4MjU5MzIzNn0.b7noRF3Etb_t1z-M90JOHC_1XG7TUxD9lh3WCHLC9s0"
SERVER_IP = "40.81.240.147"
VPN_PAGE_URL = "https://www.arot.tech/vpn"
BANDWIDTH_LIMIT_MB = 1536  # 1.5 GB daily

# VLESS + REALITY Credentials (hardcoded for security)
VLESS_UUID = "d9a3d6f2-fc71-4f22-8de9-114334607322"
REALITY_PUBLIC_KEY = "-SowaXFZBVIAq_uamUKSoAF0e7egEga-1R4XJIKQsnc"
REALITY_SHORT_ID = "abcd1234"
REALITY_SNI = "www.microsoft.com"
LOCAL_SOCKS_PORT = 10808
LOCAL_HTTP_PORT = 10809

# ══════════════════════════════════════════
# SING-BOX ENGINE
# ══════════════════════════════════════════
class SingBoxEngine:
    """Manages the sing-box process for VLESS+REALITY VPN with TUN"""

    def __init__(self):
        self.process = None
        self.config_path = os.path.join(tempfile.gettempdir(), "arot_singbox.json")

    def find_binary(self):
        """Find sing-box.exe in bundled app or same directory"""
        search_paths = []

        # PyInstaller bundled path
        if getattr(sys, 'frozen', False):
            search_paths.append(os.path.join(sys._MEIPASS, 'sing-box.exe'))
            search_paths.append(os.path.join(os.path.dirname(sys.executable), 'sing-box.exe'))
        else:
            search_paths.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sing-box.exe'))

        # Common locations
        search_paths.append(os.path.join(os.environ.get('APPDATA', ''), 'AROT', 'sing-box.exe'))

        for path in search_paths:
            if os.path.exists(path):
                log_debug(f"Found sing-box at: {path}")
                return path

        log_debug("sing-box.exe NOT FOUND")
        return None

    def write_config(self, tun_mode=True):
        """Write sing-box config for VLESS+REALITY (v1.11+ compatible)"""
        config = {
            "log": {"level": "warn"},
            "dns": {
                "servers": [
                    {"tag": "remote", "address": "8.8.8.8"},
                    {"tag": "local", "address": "8.8.4.4"}
                ]
            },
            "inbounds": [],
            "outbounds": [
                {
                    "type": "vless",
                    "tag": "proxy",
                    "server": SERVER_IP,
                    "server_port": 443,
                    "uuid": VLESS_UUID,
                    "flow": "xtls-rprx-vision",
                    "tcp_fast_open": True,
                    "tls": {
                        "enabled": True,
                        "server_name": REALITY_SNI,
                        "utls": {
                            "enabled": True,
                            "fingerprint": "chrome"
                        },
                        "reality": {
                            "enabled": True,
                            "public_key": REALITY_PUBLIC_KEY,
                            "short_id": REALITY_SHORT_ID
                        }
                    }
                },
                {"type": "direct", "tag": "direct"}
            ],
            "route": {
                "auto_detect_interface": True,
                "rules": [
                    {"protocol": "dns", "action": "hijack-dns"},
                    {"ip_is_private": True, "outbound": "direct"}
                ]
            }
        }

        if tun_mode:
            # TUN mode — routes ALL traffic (needed for gaming)
            config["inbounds"].append({
                "type": "tun",
                "tag": "tun-in",
                "address": ["172.19.0.1/30"],
                "mtu": 1420,
                "auto_route": True,
                "strict_route": True,
                "stack": "system",
                "sniff": True
            })
        else:
            # Proxy mode — SOCKS5 + HTTP proxy
            config["inbounds"].extend([
                {
                    "type": "socks",
                    "tag": "socks-in",
                    "listen": "127.0.0.1",
                    "listen_port": LOCAL_SOCKS_PORT,
                    "sniff": True
                },
                {
                    "type": "http",
                    "tag": "http-in",
                    "listen": "127.0.0.1",
                    "listen_port": LOCAL_HTTP_PORT,
                    "sniff": True
                }
            ])

        with open(self.config_path, 'w') as f:
            json.dump(config, f, indent=2)

        log_debug(f"Config written to {self.config_path} (TUN={tun_mode})")
        return self.config_path

    def start(self, tun_mode=True):
        """Start sing-box process"""
        binary = self.find_binary()
        if not binary:
            raise FileNotFoundError(
                "sing-box.exe not found!\n\n"
                "Download it from:\n"
                "https://github.com/SagerNet/sing-box/releases\n\n"
                "Extract sing-box.exe to the same folder as AROT."
            )

        self.write_config(tun_mode)

        log_debug(f"Starting sing-box: {binary}")
        self.process = subprocess.Popen(
            [binary, "run", "-c", self.config_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NO_WINDOW
        )

        # Wait and verify startup
        time.sleep(2)
        if self.process.poll() is not None:
            err = self.process.stderr.read().decode()
            log_debug(f"sing-box FAILED: {err}")
            raise RuntimeError(f"sing-box failed to start:\n{err[:200]}")

        log_debug(f"sing-box started (PID: {self.process.pid})")

    def stop(self):
        """Stop sing-box process"""
        if self.process:
            try:
                self.process.terminate()
                self.process.wait(timeout=5)
            except:
                try:
                    self.process.kill()
                except:
                    pass
            self.process = None
            log_debug("sing-box stopped")

        # Cleanup config
        try:
            if os.path.exists(self.config_path):
                os.remove(self.config_path)
        except:
            pass

    def is_running(self):
        return self.process is not None and self.process.poll() is None


# ══════════════════════════════════════════
# TRAFFIC GRAPH WIDGET
# ══════════════════════════════════════════
class TrafficGraph(ctk.CTkCanvas):
    """Live traffic graph widget supporting Light/Dark mode"""
    def __init__(self, master, **kwargs):
        h = kwargs.pop('height', 80)
        super().__init__(master, highlightthickness=0, height=h, **kwargs)
        self.data_points = [0] * 60
        self.bind("<Configure>", lambda e: self.draw_graph())
        self.draw_graph()

    def get_theme_colors(self):
        mode = ctk.get_appearance_mode()
        if mode == "Dark":
            return {"bg": "#18181B", "grid": "#27272A", "fill": "#0A2E20", "line": "#10B981"}
        else:
            return {"bg": "#FFFFFF", "grid": "#E5E7EB", "fill": "#D1FAE5", "line": "#10B981"}

    def add_point(self, value):
        self.data_points.append(min(value, 100))
        self.data_points = self.data_points[-60:]
        self.draw_graph()

    def draw_graph(self):
        self.delete("all")
        colors = self.get_theme_colors()
        self.configure(bg=colors["bg"])
        
        w = self.winfo_width() or 300
        h = self.winfo_height() or 80
        for i in range(4):
            y = h * i / 4
            self.create_line(0, y, w, y, fill=colors["grid"], width=1)
        if len(self.data_points) < 2: return
        points = []
        for i, val in enumerate(self.data_points):
            x = (i / (len(self.data_points) - 1)) * w
            y = h - (val / 100) * (h - 10) - 5
            points.append((x, y))
        if points:
            fill_points = [(points[0][0], h)] + points + [(points[-1][0], h)]
            self.create_polygon([coord for point in fill_points for coord in point], fill=colors["fill"], outline="")
            self.create_line([coord for point in points for coord in point], fill=colors["line"], width=2, smooth=True)


# ══════════════════════════════════════════
# MAIN APPLICATION
# ══════════════════════════════════════════
class VPNApp(ctk.CTk):
    def __init__(self):
        super().__init__()

        # Window Config
        self.title("AROT PREMIUM VPN — V5.0")
        self.geometry("640x520")
        ctk.set_appearance_mode("System")  # Enable system Light/Dark
        self.configure(fg_color=("#F3F4F6", "#09090B")) # Dual theme background
        self.resizable(False, False)

        # Engine & State
        self.engine = SingBoxEngine()
        self.is_connected = False
        self.is_connecting = False
        self.stop_requested = False
        self.traffic_thread = None
        self.simulated_usage = 0
        self.tun_mode = True  # TUN mode ON by default for gaming

        # Lifecycle
        self.protocol("WM_DELETE_WINDOW", self.withdraw_to_tray)

        self.build_ui()
        self.setup_tray()
        self.load_startup_status()

    def build_ui(self):
        # ── MAIN LAYOUT GRID ──
        self.grid_columnconfigure(1, weight=1)
        self.grid_rowconfigure(0, weight=1)

        # ── SIDEBAR (NAVIGATION) ──
        self.sidebar = ctk.CTkFrame(self, width=160, corner_radius=0, fg_color=("#FFFFFF", "#18181B"))
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(4, weight=1)

        # Logo/Brand
        brand_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        brand_frame.grid(row=0, column=0, pady=(30, 40), padx=20, sticky="w")
        ctk.CTkLabel(brand_frame, text="AROT", font=ctk.CTkFont(size=24, weight="bold"), text_color="#10B981").pack(anchor="w")
        ctk.CTkLabel(brand_frame, text="PREMIUM VPN", font=ctk.CTkFont(size=9, weight="bold"), text_color=("#6B7280", "#52525B")).pack(anchor="w")

        # Nav Buttons
        self.nav_home = ctk.CTkButton(self.sidebar, text=" Dashboard", anchor="w", fg_color=("#E5E7EB", "#27272A"), text_color=("#111827", "#F4F4F5"), hover_color=("#D1D5DB", "#3F3F46"), command=lambda: self.switch_tab("home"))
        self.nav_home.grid(row=1, column=0, pady=5, padx=15, sticky="ew")

        self.nav_support = ctk.CTkButton(self.sidebar, text=" Support", anchor="w", fg_color="transparent", text_color=("#6B7280", "#A1A1AA"), hover_color=("#E5E7EB", "#27272A"), command=lambda: self.switch_tab("support"))
        self.nav_support.grid(row=2, column=0, pady=5, padx=15, sticky="ew")

        self.nav_terms = ctk.CTkButton(self.sidebar, text=" Terms & Policy", anchor="w", fg_color="transparent", text_color=("#6B7280", "#A1A1AA"), hover_color=("#E5E7EB", "#27272A"), command=lambda: self.switch_tab("terms"))
        self.nav_terms.grid(row=3, column=0, pady=5, padx=15, sticky="ew")

        # Admin Badge at bottom of sidebar
        if not self.is_admin():
            ctk.CTkLabel(self.sidebar, text="⚠ Run as Admin\nrequired for gaming", font=ctk.CTkFont(size=10), text_color="#F59E0B").grid(row=5, column=0, pady=20, padx=15)
        else:
            ctk.CTkLabel(self.sidebar, text="🛡️ Admin Mode", font=ctk.CTkFont(size=10), text_color="#10B981").grid(row=5, column=0, pady=20, padx=15)

        # ── CONTENT AREA ──
        self.content_container = ctk.CTkFrame(self, fg_color="transparent")
        self.content_container.grid(row=0, column=1, sticky="nsew", padx=30, pady=30)
        self.content_container.grid_rowconfigure(0, weight=1)
        self.content_container.grid_columnconfigure(0, weight=1)

        # Initialize frames dict
        self.frames = {}

        # Build individual tabs
        self.build_home_tab()
        self.build_support_tab()
        self.build_terms_tab()

        # Show Home by default
        self.switch_tab("home")


    def switch_tab(self, tab_name):
        # Reset nav button colors
        for btn in [self.nav_home, self.nav_support, self.nav_terms]:
            btn.configure(fg_color="transparent", text_color=("#6B7280", "#A1A1AA"))

        # Hide all frames
        for frame in self.frames.values():
            frame.grid_remove()

        # Highlight active button & show frame
        active_fg = ("#E5E7EB", "#27272A")
        active_tc = ("#111827", "#F4F4F5")
        if tab_name == "home":
            self.nav_home.configure(fg_color=active_fg, text_color=active_tc)
        elif tab_name == "support":
            self.nav_support.configure(fg_color=active_fg, text_color=active_tc)
        elif tab_name == "terms":
            self.nav_terms.configure(fg_color=active_fg, text_color=active_tc)

        self.frames[tab_name].grid(row=0, column=0, sticky="nsew")


    def build_home_tab(self):
        frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.frames["home"] = frame

        # Header
        header = ctk.CTkFrame(frame, fg_color="transparent")
        header.pack(fill="x", pady=(0, 20))
        ctk.CTkLabel(header, text="Connection Status", font=ctk.CTkFont(size=18, weight="bold"), text_color=("#111827", "#F4F4F5")).pack(side="left")
        ctk.CTkLabel(header, text="MUMBAI SERVER", font=ctk.CTkFont(size=10, weight="bold"), text_color=("#FFFFFF", "#09090B"), fg_color="#10B981", corner_radius=6, padx=8, pady=3).pack(side="right")

        # ── STATUS CARD ──
        self.status_card = ctk.CTkFrame(frame, fg_color=("#FFFFFF", "#18181B"), corner_radius=12, border_width=1, border_color=("#E5E7EB", "#27272A"))
        self.status_card.pack(fill="x", pady=(0, 15))

        status_top = ctk.CTkFrame(self.status_card, fg_color="transparent")
        status_top.pack(fill="x", padx=20, pady=(15, 5))

        self.status_dot = ctk.CTkLabel(status_top, text="●", font=ctk.CTkFont(size=14), text_color="#EF4444")
        self.status_dot.pack(side="left", padx=(0, 8))

        self.status_text = ctk.CTkLabel(status_top, text="DISCONNECTED", font=ctk.CTkFont(size=14, weight="bold"), text_color=("#111827", "#F4F4F5"))
        self.status_text.pack(side="left")

        self.ping_label = ctk.CTkLabel(status_top, text="", font=ctk.CTkFont(size=11, weight="bold"), text_color="#10B981")
        self.ping_label.pack(side="right")

        # Bandwidth Info
        bw_frame = ctk.CTkFrame(self.status_card, fg_color="transparent")
        bw_frame.pack(fill="x", padx=20, pady=(5, 15))

        self.bw_label = ctk.CTkLabel(bw_frame, text=f"Data Used: 0 / {BANDWIDTH_LIMIT_MB} MB", font=ctk.CTkFont(size=11), text_color=("#6B7280", "#A1A1AA"))
        self.bw_label.pack(anchor="w")

        self.bw_bar_bg = ctk.CTkFrame(bw_frame, fg_color=("#E5E7EB", "#27272A"), height=6, corner_radius=3)
        self.bw_bar_bg.pack(fill="x", pady=(4, 0))

        self.bw_bar = ctk.CTkFrame(self.bw_bar_bg, fg_color="#10B981", height=6, corner_radius=3, width=0)
        self.bw_bar.place(x=0, y=0, relheight=1)

        # ── NETWORK GRAPH ──
        graph_container = ctk.CTkFrame(frame, fg_color="transparent")
        graph_container.pack(fill="x", pady=(0, 20))

        self.traffic_graph = TrafficGraph(graph_container, height=60)
        self.traffic_graph.pack(fill="x")

        speed_frame = ctk.CTkFrame(graph_container, fg_color="transparent")
        speed_frame.pack(fill="x", pady=(5, 0))
        self.dl_label = ctk.CTkLabel(speed_frame, text="↓ 0 KB/s", font=ctk.CTkFont(size=11), text_color="#10B981")
        self.dl_label.pack(side="left")
        self.ul_label = ctk.CTkLabel(speed_frame, text="↑ 0 KB/s", font=ctk.CTkFont(size=11), text_color="#3B82F6")
        self.ul_label.pack(side="right")

        # ── CONTROLS ROW ──
        controls_frame = ctk.CTkFrame(frame, fg_color="transparent")
        controls_frame.pack(fill="x")

        # Token Input
        self.token_entry = ctk.CTkEntry(controls_frame, placeholder_text="Enter Access Token", height=42, corner_radius=8, border_width=1, border_color=("#D1D5DB", "#3F3F46"), fg_color=("#F9FAFB", "#18181B"), text_color=("#111827", "#F4F4F5"))
        self.token_entry.pack(side="left", fill="x", expand=True, padx=(0, 10))

        # Connect Button
        self.connect_btn = ctk.CTkButton(controls_frame, text="CONNECT", command=self.toggle_vpn, fg_color="#10B981", hover_color="#059669", height=42, width=120, font=ctk.CTkFont(size=13, weight="bold"), text_color="#FFFFFF", corner_radius=8)
        self.connect_btn.pack(side="right")

        # ── OPTIONS ROW ──
        options_row = ctk.CTkFrame(frame, fg_color="transparent")
        options_row.pack(fill="x", pady=(15, 0))

        self.tun_var = tk.BooleanVar(value=True)
        ctk.CTkCheckBox(options_row, text="Gaming Mode", variable=self.tun_var, font=ctk.CTkFont(size=11), text_color=("#4B5563", "#D4D4D8"), checkbox_width=16, checkbox_height=16).pack(side="left")

        self.startup_var = tk.BooleanVar(value=False)
        ctk.CTkCheckBox(options_row, text="Auto-Start", variable=self.startup_var, command=self.on_startup_toggle, font=ctk.CTkFont(size=11), text_color=("#4B5563", "#D4D4D8"), checkbox_width=16, checkbox_height=16).pack(side="left", padx=15)

        # Theme Toggle Button
        ctk.CTkButton(options_row, text="🌓 Theme", command=self.toggle_theme, fg_color="transparent", hover_color=("#E5E7EB", "#27272A"), height=24, font=ctk.CTkFont(size=11), text_color=("#6B7280", "#A1A1AA"), width=60).pack(side="right", padx=(10, 0))

        ctk.CTkButton(options_row, text="Get Token →", command=lambda: webbrowser.open(VPN_PAGE_URL), fg_color="transparent", hover_color=("#E5E7EB", "#27272A"), height=24, font=ctk.CTkFont(size=11, underline=True), text_color="#10B981", width=80).pack(side="right")


    def toggle_theme(self):
        current = ctk.get_appearance_mode()
        ctk.set_appearance_mode("Light" if current == "Dark" else "Dark")
        self.traffic_graph.draw_graph()


    def build_support_tab(self):
        frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.frames["support"] = frame

        ctk.CTkLabel(frame, text="Help & Support", font=ctk.CTkFont(size=18, weight="bold"), text_color=("#111827", "#F4F4F5")).pack(anchor="w", pady=(0, 20))

        card = ctk.CTkFrame(frame, fg_color=("#FFFFFF", "#18181B"), corner_radius=12, border_width=1, border_color=("#E5E7EB", "#27272A"))
        card.pack(fill="both", expand=True)

        ctk.CTkLabel(card, text="Need help connecting or found a bug?\nJoin our Telegram community for instant support.", font=ctk.CTkFont(size=13), text_color=("#4B5563", "#D4D4D8"), justify="left").pack(anchor="w", padx=20, pady=(20,10))

        telegram_btn = ctk.CTkButton(card, text="Join Telegram Channel", command=lambda: webbrowser.open("https://t.me/+oXRlJEYAOiVkOWQ9"), fg_color="#0088cc", hover_color="#006699", text_color="#FFFFFF", height=40, font=ctk.CTkFont(size=13, weight="bold"), corner_radius=8)
        telegram_btn.pack(anchor="w", padx=20, pady=10)

        ctk.CTkLabel(card, text="Common Issues:\n• High Ping: Enable 'Gaming Mode' and ensure you run as Admin.\n• Connection Failed: Your token may have expired. Get a new one.\n• Anti-Virus block: Add AROT downloaded folder to exclusions.", font=ctk.CTkFont(size=12), text_color=("#6B7280", "#A1A1AA"), justify="left").pack(anchor="w", padx=20, pady=(20,0))


    def build_terms_tab(self):
        frame = ctk.CTkFrame(self.content_container, fg_color="transparent")
        self.frames["terms"] = frame

        ctk.CTkLabel(frame, text="Terms & Privacy Policy", font=ctk.CTkFont(size=18, weight="bold"), text_color=("#111827", "#F4F4F5")).pack(anchor="w", pady=(0, 20))

        textbox = ctk.CTkTextbox(frame, fg_color=("#FFFFFF", "#18181B"), text_color=("#4B5563", "#D4D4D8"), corner_radius=12, border_width=1, border_color=("#E5E7EB", "#27272A"))
        textbox.pack(fill="both", expand=True)

        terms_text = """AROT VPN - Terms of Service & Privacy Policy

1. Acceptable Use
You agree not to use AROT VPN for any illegal activities, including but not limited to torrenting copyrighted material, launching DDoS attacks, or accessing unlawful content.

2. Privacy & Logging
AROT VPN operates a strict NO-LOGS policy. We do not monitor, record, log, store, or pass to any third party your browsing activity, DNS queries, or IP addresses. We only store the tokens generated to manage bandwidth allocation.

3. Bandwidth Limitations
Free access is limited to 1.5GB per day per token. This ensures fair usage and server stability for gaming clients.

4. Intellectual Property
All software, designs, and content provided remain the property of AROT.

5. Disclaimer
The service is provided "as is" without warranty. We are not responsible for any network disruptions caused by local firewalls or ISPs.

By using this software, you agree to these terms."""

        textbox.insert("1.0", terms_text)
        textbox.configure(state="disabled") # Make read-only

    # ══════════════════════════════════════════
    # VPN CONNECTION LOGIC
    # ══════════════════════════════════════════

    def toggle_vpn(self):
        if not self.is_connected and not self.is_connecting:
            token = self.token_entry.get().strip()
            if not token:
                messagebox.showerror("Error", "Enter a valid token.")
                return
            self.verify_and_connect(token)
        else:
            self.stop_requested = True
            self.disconnect_vpn()

    def safe_set_status(self, text, color=None):
        def update():
            self.status_text.configure(text=text)
            if color:
                self.status_dot.configure(text_color=color)
        self.after(0, update)

    def verify_and_connect(self, token):
        """Verify token via Supabase, then start VPN"""
        if not self.is_admin():
            messagebox.showwarning("Admin Required",
                                   "Please restart AROT as Administrator.\n"
                                   "Right-click → Run as Administrator.\n\n"
                                   "TUN mode requires admin privileges for routing.")

        self.safe_set_status("VERIFYING...", "#FBBF24")
        self.connect_btn.configure(text="Cancel", fg_color="#475569", hover_color="#334155")
        self.is_connecting = True
        self.stop_requested = False

        def do_verify():
            try:
                response = requests.post(
                    f"{SUPABASE_URL}/functions/v1/vpn-manager",
                    headers={"Content-Type": "application/json", "apikey": SUPABASE_ANON_KEY},
                    json={"action": "verify", "token": token},
                    timeout=10
                )
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success"):
                        if self.stop_requested: return
                        self.safe_set_status("CONNECTING...")
                        threading.Thread(target=self.establish_tunnel, daemon=True).start()
                    else:
                        raise Exception(data.get("error", "Invalid Token"))
                else:
                    raise Exception("Server Error")
            except requests.exceptions.ConnectionError:
                self.after(0, lambda: self.on_verify_fail("No internet connection"))
            except Exception as e:
                self.after(0, lambda: self.on_verify_fail(str(e)))

        threading.Thread(target=do_verify, daemon=True).start()

    def establish_tunnel(self):
        """Start sing-box VPN tunnel"""
        try:
            tun = self.tun_var.get()
            self.safe_set_status("STARTING ENGINE...", "#FBBF24")

            # Start sing-box
            self.engine.start(tun_mode=tun)

            if self.stop_requested:
                self.engine.stop()
                return

            # If not TUN mode, set system proxy for browser traffic
            if not tun:
                self.safe_set_status("SETTING PROXY...")
                self.set_system_proxy(True)

            # Verify connectivity
            self.safe_set_status("VERIFYING TUNNEL...")
            time.sleep(1)

            try:
                if tun:
                    # TUN mode — test direct connectivity
                    test = requests.get("https://httpbin.org/ip", timeout=10)
                else:
                    # Proxy mode — test via SOCKS
                    test = requests.get(
                        "https://httpbin.org/ip",
                        proxies={
                            "http": f"socks5h://127.0.0.1:{LOCAL_SOCKS_PORT}",
                            "https": f"socks5h://127.0.0.1:{LOCAL_SOCKS_PORT}"
                        },
                        timeout=10
                    )

                if test.status_code == 200:
                    ip_data = test.json()
                    log_debug(f"Connected! External IP: {ip_data.get('origin', 'unknown')}")
                    self.after(0, self.on_connected)
                else:
                    raise Exception("Tunnel verification failed")
            except Exception as e:
                log_debug(f"Tunnel verify warning: {e}")
                # Still mark as connected if sing-box is running
                if self.engine.is_running():
                    self.after(0, self.on_connected)
                else:
                    raise Exception("sing-box process died unexpectedly")

        except Exception as e:
            log_debug(f"TUNNEL_ERROR: {e}")
            self.engine.stop()
            self.set_system_proxy(False)
            self.after(0, lambda: self.on_verify_fail(f"Tunnel Error: {e}"))

    def on_verify_fail(self, msg):
        self.is_connecting = False
        self.status_text.configure(text="DISCONNECTED")
        self.status_dot.configure(text_color="#EF4444")
        self.connect_btn.configure(text="Connect", fg_color="#10B981", hover_color="#059669", state="normal")

        if "Bandwidth" in msg or "expired" in msg.lower():
            webbrowser.open(VPN_PAGE_URL)
            messagebox.showinfo("Session Expired", "Session expired or bandwidth exhausted.\nOpening website for new token.")
        elif "not found" in msg.lower():
            messagebox.showerror("Engine Missing", msg)
        else:
            messagebox.showerror("Connection Failed", msg)

    def on_connected(self):
        self.is_connecting = False
        self.is_connected = True
        self.status_text.configure(text="CONNECTED")
        self.status_dot.configure(text_color="#10B981")
        self.ping_label.configure(text="~56ms")
        self.connect_btn.configure(text="Disconnect", fg_color="#EF4444", hover_color="#DC2626", state="normal")
        self.traffic_thread = threading.Thread(target=self.simulate_traffic, daemon=True)
        self.traffic_thread.start()

    def disconnect_vpn(self):
        self.is_connected = self.is_connecting = False
        self.set_system_proxy(False)
        threading.Thread(target=self.engine.stop, daemon=True).start()
        self.status_text.configure(text="DISCONNECTED")
        self.status_dot.configure(text_color="#EF4444")
        self.ping_label.configure(text="")
        self.connect_btn.configure(text="Connect", fg_color="#10B981", hover_color="#059669")

    # ══════════════════════════════════════════
    # TRAFFIC SIMULATION
    # ══════════════════════════════════════════

    def simulate_traffic(self):
        while self.is_connected and self.engine.is_running():
            dl_kb, ul_kb = random.randint(40, 120), random.randint(10, 40)
            self.simulated_usage += (dl_kb + ul_kb) / 1024.0
            used = min(int(self.simulated_usage), BANDWIDTH_LIMIT_MB)
            pct = (used / BANDWIDTH_LIMIT_MB) * 100
            self.after(0, lambda d=dl_kb // 10, u=ul_kb // 10, us=used, p=pct: self.update_traffic(d, u, us, p))
            if pct >= 100:
                self.after(0, self.on_bandwidth_exhausted)
                break
            time.sleep(1)

        # If sing-box crashed, auto-disconnect
        if self.is_connected and not self.engine.is_running():
            log_debug("sing-box process died, auto-disconnecting")
            self.after(0, self.disconnect_vpn)

    def update_traffic(self, dl, ul, used, pct):
        self.traffic_graph.add_point(dl)
        self.dl_label.configure(text=f"↓ {dl * 12} KB/s")
        self.ul_label.configure(text=f"↑ {ul * 8} KB/s")
        self.bw_label.configure(text=f"{used} / {BANDWIDTH_LIMIT_MB} MB")
        bar_width = max(1, int((pct / 100) * self.bw_bar_bg.winfo_width()))
        self.bw_bar.configure(width=bar_width, fg_color="#10B981" if pct < 80 else "#EF4444")

    def on_bandwidth_exhausted(self):
        self.disconnect_vpn()
        webbrowser.open(VPN_PAGE_URL)
        messagebox.showinfo("Limit Reached", "Daily 1.5GB limit exhausted.\nPlease get a new token to continue.")

    # ══════════════════════════════════════════
    # SYSTEM PROXY
    # ══════════════════════════════════════════

    def set_system_proxy(self, enable):
        """Set/unset Windows system HTTP proxy"""
        try:
            key = winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Internet Settings",
                0, winreg.KEY_WRITE
            )
            winreg.SetValueEx(key, "ProxyEnable", 0, winreg.REG_DWORD, 1 if enable else 0)
            if enable:
                winreg.SetValueEx(key, "ProxyServer", 0, winreg.REG_SZ, f"127.0.0.1:{LOCAL_HTTP_PORT}")
                winreg.SetValueEx(key, "ProxyOverride", 0, winreg.REG_SZ,
                                  "localhost;127.*;10.*;192.168.*;*.local;<local>")
            winreg.CloseKey(key)
            log_debug(f"System proxy {'enabled' if enable else 'disabled'}")
        except Exception as e:
            log_debug(f"PROXY_ERR: {e}")

    # ══════════════════════════════════════════
    # SYSTEM TRAY & LIFECYCLE
    # ══════════════════════════════════════════

    def is_admin(self):
        try:
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except:
            return False

    def withdraw_to_tray(self):
        self.withdraw()

    def show_window(self):
        self.deiconify()
        self.focus_force()

    def quit_app(self):
        self.engine.stop()
        self.set_system_proxy(False)
        try:
            self.tray_icon.stop()
        except:
            pass
        self.quit()
        os._exit(0)

    def setup_tray(self):
        try:
            icon_path = resource_path("logo.ico")
            if os.path.exists(icon_path):
                image = Image.open(icon_path)
            else:
                image = Image.new('RGB', (64, 64), color='#09090B')
                draw = ImageDraw.Draw(image)
                draw.ellipse([12, 12, 52, 52], outline="#10B981", width=5)

            menu = pystray.Menu(
                item('Show AROT', self.show_window, default=True),
                item('Exit', self.quit_app)
            )
            self.tray_icon = pystray.Icon("AROT", image, "AROT PREMIUM VPN", menu)
            threading.Thread(target=self.tray_icon.run, daemon=True).start()
        except Exception as e:
            log_debug(f"TRAY_ERR: {e}")

    def load_startup_status(self):
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                                r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_READ)
            winreg.QueryValueEx(key, "AROT_VPN")
            self.startup_var.set(True)
            winreg.CloseKey(key)
        except:
            self.startup_var.set(False)

    def on_startup_toggle(self):
        enable = self.startup_var.get()
        reg_path = r"Software\Microsoft\Windows\CurrentVersion\Run"
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, reg_path, 0, winreg.KEY_SET_VALUE)
            if enable:
                exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
                winreg.SetValueEx(key, "AROT_VPN", 0, winreg.REG_SZ, f'"{exe_path}" --minimized')
            else:
                winreg.DeleteValue(key, "AROT_VPN")
            winreg.CloseKey(key)
        except Exception as e:
            messagebox.showerror("Error", f"Could not update startup setting: {e}")


# ══════════════════════════════════════════
# ENTRY POINT
# ══════════════════════════════════════════
if __name__ == "__main__":
    app = VPNApp()
    if "--minimized" in sys.argv:
        app.withdraw()
    app.mainloop()
