"""Disposable TLS material for loopback-only integration tests and previews."""
import subprocess


def tls_options(root):
    key, cert = root / "qa-key.pem", root / "qa-cert.pem"
    subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                    "-days", "1", "-subj", "/CN=localhost",
                    "-addext", "subjectAltName=DNS:localhost,IP:127.0.0.1",
                    "-keyout", str(key), "-out", str(cert)], check=True, capture_output=True)
    return {"ssl_certfile": str(cert), "ssl_keyfile": str(key)}
