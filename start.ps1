$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir
powershell -ExecutionPolicy Bypass -File (Join-Path $scriptDir "server.ps1")
