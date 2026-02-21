import paramiko
import time
import sys

# Server Details
IP = "40.81.240.147"
USER = "azureuser"
PASS = "Crusherbolt365"

def deploy():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        print(f"Connecting to {IP}...")
        client.connect(IP, username=USER, password=PASS, timeout=30)
        
        def run(cmd, sudo=False):
            if sudo:
                cmd = f"sudo {cmd}"
            print(f">>> {cmd}")
            stdin, stdout, stderr = client.exec_command(cmd)
            out = stdout.read().decode().strip()
            err = stderr.read().decode().strip()
            if out: print(out)
            if err: print("ERR:", err)
            return out, err

        # 1. Install dependencies
        print("--- Installing Dependencies ---")
        run("apt-get update", sudo=True)
        run("apt-get install -y strongswan strongswan-pki libcharon-extra-plugins libcharon-extauth-plugins libstrongswan-extra-plugins", sudo=True)

        # 2. PKI Setup (Logic from strongvpn.sh)
        print("--- PKI Setup ---")
        run("mkdir -p ~/pki/{cacerts,certs,private}", sudo=False)
        run("chmod 700 ~/pki", sudo=False)
        
        # CA key & cert
        run("ipsec pki --gen --type rsa --size 4096 --outform pem > ~/pki/private/ca-key.pem", sudo=False)
        run(f'ipsec pki --self --ca --lifetime 3650 --in ~/pki/private/ca-key.pem --type rsa --dn "CN=VPN root CA" --outform pem > ~/pki/cacerts/ca-cert.pem', sudo=False)
        
        # Server key & cert
        run("ipsec pki --gen --type rsa --size 4096 --outform pem > ~/pki/private/server-key.pem", sudo=False)
        run(f'ipsec pki --pub --in ~/pki/private/server-key.pem --type rsa | ipsec pki --issue --lifetime 1825 --cacert ~/pki/cacerts/ca-cert.pem --cakey ~/pki/private/ca-key.pem --dn "CN={IP}" --san "{IP}" --flag serverAuth --flag ikeIntermediate --outform pem > ~/pki/certs/server-cert.pem', sudo=False)

        # Copy to strongswan dir
        run("cp -r ~/pki/* /etc/ipsec.d/", sudo=True)

        # 3. Configure IPsec (Logic from strongvpn.sh)
        print("--- Configuring IPsec ---")
        ipsec_conf = f"""
config setup
    charondebug="ike 1, knl 1, cfg 0"
    uniqueids=never

conn ikev2-vpn
    auto=add
    compress=no
    type=tunnel
    keyexchange=ikev2
    fragmentation=yes
    forceencaps=yes
    dpdaction=clear
    dpddelay=300s
    rekey=no
    left=%any
    leftid={IP}
    leftcert=server-cert.pem
    leftsendcert=always
    leftsubnet=0.0.0.0/0
    right=%any
    rightid=%any
    rightauth=eap-mschapv2
    rightsourceip=10.10.10.0/24
    rightdns=8.8.8.8,8.8.4.4
    rightsendcert=never
    eap_identity=%identity
"""
        cmd_conf = f"echo '{ipsec_conf}' | sudo tee /etc/ipsec.conf"
        client.exec_command(cmd_conf)

        # Secrets (initial user: arot / pass: arot123)
        secrets = f"""
: RSA "server-key.pem"
arot : EAP "arot123"
"""
        cmd_secrets = f"echo '{secrets}' | sudo tee /etc/ipsec.secrets"
        client.exec_command(cmd_secrets)

        # 4. Networking (IPTables & Sysctl)
        print("--- Networking Setup ---")
        run("sysctl -w net.ipv4.ip_forward=1", sudo=True)
        run("sysctl -w net.ipv4.conf.all.forwarding=1", sudo=True)
        
        # Iptables rules (NAT)
        run("iptables -F", sudo=True)
        run("iptables -t nat -F", sudo=True)
        run("iptables -t nat -A POSTROUTING -s 10.10.10.0/24 -o eth0 -j MASQUERADE", sudo=True)
        # Fix for MSS (common VPN MTU issue)
        run("iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -s 10.10.10.0/24 -j TCPMSS --set-mss 1360", sudo=True)

        # 5. Restart Services
        print("--- Restarting Services ---")
        run("systemctl restart strongswan-starter", sudo=True)
        run("systemctl enable strongswan-starter", sudo=True)
        
        print("=== DEPLOYMENT COMPLETE ===")
        
        # Fetch CA cert for client
        out, _ = run("cat ~/pki/cacerts/ca-cert.pem")
        if "-----BEGIN CERTIFICATE-----" in out:
            with open("strongvpn_ca.crt", "w") as f:
                f.write(out)
            print("Successfully saved strongvpn_ca.crt")

    except Exception as e:
        print(f"Error during deployment: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
