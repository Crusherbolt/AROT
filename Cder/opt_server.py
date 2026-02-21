import paramiko

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect("40.81.240.147", username="azureuser", password="Crusherbolt365")

config = """{
  "inbounds": [{
    "port": 443,
    "protocol": "vless",
    "settings": {
      "clients": [{
        "id": "d9a3d6f2-fc71-4f22-8de9-114334607322",
        "flow": "xtls-rprx-vision"
      }],
      "decryption": "none"
    },
    "streamSettings": {
      "network": "tcp",
      "security": "reality",
      "realitySettings": {
        "dest": "www.microsoft.com:443",
        "serverNames": ["www.microsoft.com", "microsoft.com"],
        "privateKey": "WFD3wuYnSERduB8uahj5lChoBYp01E0FeUo7FizI82g",
        "shortIds": ["abcd1234"]
      },
      "sockopt": {
        "tcpNoDelay": true,
        "tcpFastOpen": true
      }
    }
  }],
  "outbounds": [{
    "protocol": "freedom",
    "streamSettings": {
      "sockopt": {
        "tcpNoDelay": true,
        "tcpFastOpen": true
      }
    }
  }]
}"""

print("Sending config over SSH...")
stdin, stdout, stderr = client.exec_command("cat > xray_cf.json && sudo mv xray_cf.json /usr/local/etc/xray/config.json && sudo chmod 644 /usr/local/etc/xray/config.json && sudo systemctl restart xray")
stdin.write(config)
stdin.close()
print("STDOUT:", stdout.read().decode())
print("STDERR:", stderr.read().decode())
client.close()
print("Done!")
