# Keep the Windows entry point on the same authenticated API as the web clients.
$ErrorActionPreference = "Stop"
if (-not $env:INZENITY_TLS_CERT -or -not $env:INZENITY_TLS_KEY) {
    throw "Set INZENITY_TLS_CERT and INZENITY_TLS_KEY to a trusted local certificate and its private key."
}
$port = if ($env:PORT) { [int]$env:PORT } else { 8080 }
Push-Location $PSScriptRoot
try {
    python -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port $port --no-proxy-headers --ssl-certfile $env:INZENITY_TLS_CERT --ssl-keyfile $env:INZENITY_TLS_KEY
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
