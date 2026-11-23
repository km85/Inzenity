"""Security boundaries shared by the FastAPI routes."""
import base64
import binascii
import io
import os
from pathlib import Path
import re
from urllib.parse import urlsplit

from cryptography.exceptions import InvalidKey
from cryptography.hazmat.primitives.kdf.argon2 import Argon2id
from fastapi import HTTPException
from PIL import Image, UnidentifiedImageError
from starlette.datastructures import Headers
from starlette.responses import JSONResponse

SESSION_SECONDS = 8 * 60 * 60
MAX_IMAGE_BYTES = 4 * 1024 * 1024
MAX_REQUEST_BYTES = 17 * 1024 * 1024
PRIVATE_FOLDERS = {"registrations", "attendance", "payments"}
IMAGE_TYPES = {"png": "PNG", "jpeg": "JPEG", "webp": "WEBP", "gif": "GIF"}


def hash_password(value):
    if not isinstance(value, str) or not value or len(value.encode()) > 1024:
        raise HTTPException(400, "Password must be between 1 and 1024 bytes")
    return Argon2id(salt=os.urandom(16), length=32, iterations=2,
                    lanes=1, memory_cost=19456).derive_phc_encoded(value.encode())


def password_matches(encoded, value):
    if not encoded or not isinstance(value, str) or len(value.encode()) > 1024:
        return False
    try:
        Argon2id.verify_phc_encoded(value.encode(), encoded)
        return True
    except (InvalidKey, ValueError):
        return False


def configured_origins():
    origins = [v.strip() for v in os.getenv("INZENITY_CORS_ORIGINS", "").split(",") if v.strip()]
    for origin in origins:
        url = urlsplit(origin)
        if (url.scheme != "https" or not url.hostname or url.username or url.password
                or "*" in origin or origin != "https://" + url.netloc):
            raise RuntimeError("CORS origins must be explicit HTTPS origins")
    return origins


class TransportBoundary:
    def __init__(self, app, origins):
        self.app = app
        self.origins = origins

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        # Protect HTML login forms as well as authenticated routes.
        headers = Headers(scope=scope)
        health_probe = scope["path"] == "/api/health" and not any(
            key in headers for key in ("cookie", "authorization", "x-api-token"))
        if scope["scheme"] != "https" and not health_probe:
            return await JSONResponse({"detail": "HTTPS required"}, 403)(scope, receive, send)
        if scope["method"] in ("POST", "PUT", "PATCH", "DELETE"):
            origin = headers.get("origin")
            if origin and origin != "https://" + headers.get("host", "") and origin not in self.origins:
                return await JSONResponse({"detail": "Origin denied"}, 403)(scope, receive, send)
            # Count actual bytes, including chunked bodies, before FastAPI parses JSON.
            content = bytearray()
            while True:
                msg = await receive()
                if msg["type"] == "http.disconnect":
                    return
                chunk = msg.get("body", b"")
                if len(content) + len(chunk) > MAX_REQUEST_BYTES:
                    return await JSONResponse({"detail": "Request too large"}, 413)(scope, receive, send)
                content.extend(chunk)
                if not msg.get("more_body"):
                    break

            original_receive = receive
            async def buffered_receive():
                nonlocal content
                if content is None:
                    return await original_receive()
                body, content = bytes(content), None
                return {"type": "http.request", "body": body, "more_body": False}
            receive = buffered_receive
        async def secure_send(message):
            if message["type"] == "http.response.start":
                extra = [(b"x-content-type-options", b"nosniff"),
                         (b"referrer-policy", b"same-origin")]
                if scope["path"].startswith("/api/"):
                    extra.append((b"cache-control", b"no-store"))
                message = {**message, "headers": [*message.get("headers", []), *extra]}
            await send(message)
        await self.app(scope, receive, secure_send)


def read_image(raw, expected=None):
    if not raw or len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Invalid image size")
    try:
        with Image.open(io.BytesIO(raw), formats=list(IMAGE_TYPES.values())) as img:
            fmt = img.format
            if (expected and expected != fmt) or img.width * img.height > 12_000_000:
                raise ValueError()
            img.verify()
        with Image.open(io.BytesIO(raw)) as img:
            img.load()
            # A fresh raster drops trailing content and embedded metadata.
            clean = img.convert("RGBA" if fmt == "PNG" else "RGB")
            clean.info.clear()
            output = io.BytesIO()
            clean.save(output, format=fmt)
            if output.tell() > MAX_IMAGE_BYTES:
                raise HTTPException(413, "Image too large")
            return fmt.lower(), output.getvalue()
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError, Image.DecompressionBombError) as err:
        raise HTTPException(400, "Invalid or unsupported image") from err


def decode_image(uri):
    if not isinstance(uri, str):
        raise HTTPException(400, "Image data required")
    if len(uri) > 4 * ((MAX_IMAGE_BYTES + 2) // 3) + 40:
        raise HTTPException(413, "Image too large")
    header, sep, payload = uri.partition(",")
    match = re.fullmatch(r"data:image/(png|jpeg|webp|gif);base64", header)
    if not sep or not match:
        raise HTTPException(400, "Unsupported image type")
    try:
        raw = base64.b64decode(payload, validate=True)
    except (ValueError, binascii.Error) as err:
        raise HTTPException(400, "Invalid image encoding") from err
    return read_image(raw, IMAGE_TYPES[match[1]])


def private_root(public):
    public = Path(public).resolve()
    root = Path(os.environ.get("INZENITY_PRIVATE_DIR", public.parent / "private-uploads")).resolve()
    if root == public or root.is_relative_to(public) or public.is_relative_to(root):
        raise RuntimeError("Private upload directory must be separate from public files")
    return root
