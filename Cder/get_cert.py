import paramiko

IP = "20.244.84.153"
USER = "azureuser"
PASS = "Crusherbolt365"

def get_cert():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(IP, username=USER, password=PASS)
        sftp = client.open_sftp()
        # The file is in azureuser's home under pki/cacerts/ca-cert.pem
        remote_path = "/home/azureuser/pki/cacerts/ca-cert.pem"
        local_path = "strongvpn_ca.crt"
        sftp.get(remote_path, local_path)
        sftp.close()
        print(f"Successfully downloaded {local_path} via SFTP.")
        
        with open(local_path, "r") as f:
            print(f.read())
    except Exception as e:
        print(f"Error: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    get_cert()
