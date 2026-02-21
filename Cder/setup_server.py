"""
AROT VPN - Server Setup & Cleanup Script
Cleans old StrongSwan/ocserv, keeps Xray VLESS+REALITY, applies BBR optimizations.
Run: python setup_server.py
"""
import paramiko
import time

IP = "40.81.240.147"
USER = "azureuser"
PASS = "Crusherbolt365"

VLESS_UUID = "d9a3d6f2-fc71-4f22-8de9-114334607322"
REALITY_PRIVATE_KEY = "WFD3wuYnSERduB8uahj5lChoBYp01E0FeUo7FizI82g"
REALITY_SHORT_ID = "abcd1234"

def setup():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    try:
        print(f"Connecting to {IP}...")
        client.connect(IP, username=USER, password=PASS, timeout=30)

        def run(cmd):
            print(f">>> {cmd}")
            _, stdout, stderr = client.exec_command(cmd, timeout=60)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            if out: print(out)
            if err and "Warning" not in err: print("ERR:", err)
            return out

        # ═══════════════════════════════════════
        # 1. CLEANUP — Remove old VPN services
        # ═══════════════════════════════════════
        print("\n=== PHASE 1: CLEANUP ===")
        run("sudo systemctl stop strongswan-starter 2>/dev/null || true")
        run("sudo systemctl disable strongswan-starter 2>/dev/null || true")
        run("sudo systemctl stop ocserv 2>/dev/null || true")
        run("sudo systemctl disable ocserv 2>/dev/null || true")
        run("sudo systemctl stop dnsmasq 2>/dev/null || true")
        run("sudo systemctl disable dnsmasq 2>/dev/null || true")
        run("sudo apt-get remove -y strongswan strongswan-pki libcharon-extra-plugins libcharon-extauth-plugins libstrongswan-extra-plugins ocserv dnsmasq 2>/dev/null || true")
        run("sudo apt-get autoremove -y 2>/dev/null || true")

        # Remove old files
        run("sudo rm -rf ~/pki /etc/ipsec.d /etc/ipsec.conf /etc/ipsec.secrets /etc/ocserv")
        run("rm -f ~/gen_certs.sh ~/reset_iptables.sh ~/ipsec.conf ~/ipsec.secrets ~/17-vpn.conf")

        # ═══════════════════════════════════════
        # 2. ENSURE XRAY IS INSTALLED
        # ═══════════════════════════════════════
        print("\n=== PHASE 2: XRAY SETUP ===")
        xray_check = run("which xray 2>/dev/null || echo 'NOT_FOUND'")
        if "NOT_FOUND" in xray_check:
            print("Installing Xray...")
            run('sudo bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install')

        # Write Xray VLESS + REALITY config
        xray_config = f'''{{
  "inbounds": [{{
    "port": 443,
    "protocol": "vless",
    "settings": {{
      "clients": [{{
        "id": "{VLESS_UUID}",
        "flow": "xtls-rprx-vision"
      }}],
      "decryption": "none"
    }},
    "streamSettings": {{
      "network": "tcp",
      "security": "reality",
      "realitySettings": {{
        "dest": "www.microsoft.com:443",
        "serverNames": ["www.microsoft.com", "microsoft.com"],
        "privateKey": "{REALITY_PRIVATE_KEY}",
        "shortIds": ["{REALITY_SHORT_ID}"]
      }}
    }}
  }}],
  "outbounds": [{{
    "protocol": "freedom"
  }}]
}}'''
        run(f"echo '{xray_config}' | sudo tee /usr/local/etc/xray/config.json")
        run("sudo chmod 644 /usr/local/etc/xray/config.json")

        # ═══════════════════════════════════════
        # 3. NETWORK OPTIMIZATIONS (BBR + Tuning)
        # ═══════════════════════════════════════
        print("\n=== PHASE 3: NETWORK OPTIMIZATION ===")
        sysctl_conf = """
net.core.default_qdisc = fq
net.ipv4.tcp_congestion_control = bbr
net.ipv4.tcp_fastopen = 3
net.ipv4.tcp_slow_start_after_idle = 0
net.ipv4.tcp_notsent_lowat = 16384
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.ip_forward = 1
net.ipv4.conf.all.forwarding = 1
"""
        run(f"echo '{sysctl_conf}' | sudo tee /etc/sysctl.d/99-arot-vpn.conf")
        run("sudo sysctl --system 2>/dev/null")

        # ═══════════════════════════════════════
        # 4. FIREWALL
        # ═══════════════════════════════════════
        print("\n=== PHASE 4: FIREWALL ===")
        run("sudo ufw disable 2>/dev/null || true")
        run("sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT")
        run("sudo iptables -I INPUT -p udp --dport 443 -j ACCEPT")
        run("sudo iptables -t nat -A POSTROUTING -s 10.10.10.0/24 -o eth0 -j MASQUERADE")

        # ═══════════════════════════════════════
        # 5. START XRAY
        # ═══════════════════════════════════════
        print("\n=== PHASE 5: START XRAY ===")
        run("sudo systemctl daemon-reload")
        run("sudo systemctl enable xray")
        run("sudo systemctl restart xray")
        status = run("sudo systemctl status xray --no-pager")

        # Verify BBR
        bbr = run("sysctl net.ipv4.tcp_congestion_control")

        print("\n" + "=" * 50)
        print("   AROT VPN SERVER — SETUP COMPLETE")
        print("=" * 50)
        print(f"   Server:       {IP}")
        print(f"   Protocol:     VLESS + REALITY")
        print(f"   Port:         443")
        print(f"   UUID:         {VLESS_UUID}")
        print(f"   SNI:          www.microsoft.com")
        print(f"   ShortID:      {REALITY_SHORT_ID}")
        print(f"   BBR:          {bbr}")
        print("=" * 50)

    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    setup()
