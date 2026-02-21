#!/bin/bash
set -e

# Config
IP="40.81.240.147"
USER_ID="arot"
USER_PASS="arot123"

echo "=== StrongVPN: Starting Deployment ==="

# 1. PKI Generation
mkdir -p ~/pki/{cacerts,certs,private}
chmod 700 ~/pki

echo "Generating CA..."
pki --gen --type rsa --size 4096 --outform pem > ~/pki/private/ca-key.pem
pki --self --ca --lifetime 3650 --in ~/pki/private/ca-key.pem --type rsa --dn "CN=VPN root CA" --outform pem > ~/pki/cacerts/ca-cert.pem

echo "Generating Server Certificate..."
pki --gen --type rsa --size 4096 --outform pem > ~/pki/private/server-key.pem
pki --pub --in ~/pki/private/server-key.pem --type rsa | pki --issue --lifetime 1825 --cacert ~/pki/cacerts/ca-cert.pem --cakey ~/pki/private/ca-key.pem --dn "CN=$IP" --san "$IP" --flag serverAuth --flag ikeIntermediate --outform pem > ~/pki/certs/server-cert.pem

# 2. StrongSwan Direct Configuration
echo "Copying to IPsec directories..."
sudo cp -r ~/pki/* /etc/ipsec.d/

echo "Writing /etc/ipsec.conf..."
cat <<EOF | sudo tee /etc/ipsec.conf
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
    leftid=$IP
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
EOF

echo "Writing /etc/ipsec.secrets..."
cat <<EOF | sudo tee /etc/ipsec.secrets
: RSA "server-key.pem"
$USER_ID : EAP "$USER_PASS"
EOF

# 3. Networking
echo "Enabling IP Forwarding..."
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

echo "Configuring Iptables NAT..."
sudo iptables -F
sudo iptables -t nat -F
sudo iptables -t nat -A POSTROUTING -s 10.10.10.0/24 -o eth0 -j MASQUERADE
sudo iptables -t mangle -A FORWARD -p tcp --tcp-flags SYN,RST SYN -s 10.10.10.0/24 -j TCPMSS --set-mss 1360

# 4. Restart
echo "Restarting StrongSwan..."
sudo systemctl restart strongswan-starter
sudo systemctl enable strongswan-starter

echo "=== StrongVPN: Deployment Complete ==="
EOF
