"""Check this recovery candidate's single RSA/SHA-256 APK v2 signer and content digest."""
import hashlib
import struct
import sys
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

def length_prefixed_records(data):
    while data:
        size, = struct.unpack_from('<I', data)
        assert size <= len(data) - 4
        yield data[4:4+size]
        data = data[4+size:]

def only(data):
    record, = length_prefixed_records(data)
    return record

def le32(n):
    return struct.pack('<I', n)

apk = Path(sys.argv[1]).read_bytes()
end = apk.rindex(b'PK\x05\x06')
assert end + 22 + struct.unpack_from('<H', apk, end+20)[0] == len(apk)
central, = struct.unpack_from('<I', apk, end+16)
assert apk[central-16:central] == b'APK Sig Block 42'
size, = struct.unpack_from('<Q', apk, central-24)
start = central - size - 8
assert struct.unpack_from('<Q', apk, start)[0] == size
blocks = {}
offset = start + 8
while offset < central-24:
    length, kind = struct.unpack_from('<QI', apk, offset)
    assert kind not in blocks and length >= 4
    blocks[kind] = apk[offset+12:offset+8+length]
    offset += length + 8
assert offset == central-24
signer = only(only(blocks[0x7109871a]))
signed, signatures, public = length_prefixed_records(signer)
digest_list, certs, *extra = length_prefixed_records(signed)
signature = only(signatures)
digest = only(digest_list)
assert digest[:4] == signature[:4] == le32(0x0103)
cert = x509.load_der_x509_certificate(next(length_prefixed_records(certs)))
key = cert.public_key()
assert key.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo) == public
key.verify(only(signature[4:]), signed, padding.PKCS1v15(), hashes.SHA256())
eocd = apk[end:end+16] + le32(start) + apk[end+20:]
pieces = []
for section in (apk[:start], apk[central:end], eocd):
    for j in range(0,len(section),1048576):
        piece = section[j:j+1048576]
        pieces.append(hashlib.sha256(b'\xa5'+le32(len(piece))+piece).digest())
assert hashlib.sha256(b'\x5a'+le32(len(pieces))+b''.join(pieces)).digest() == only(digest[4:])
print('PASS APK v2 RSA signature and SHA-256 chunked content digest')
print('APK SHA-256:', hashlib.sha256(apk).hexdigest())
print('Signer certificate SHA-256:',cert.fingerprint(hashes.SHA256()).hex())
