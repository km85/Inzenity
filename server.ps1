$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicDir = Join-Path $root "public"
$dataDir = Join-Path $root "data"
$seedPath = Join-Path $dataDir "seed.json"
$dbPath = Join-Path $dataDir "db.json"
$port = if ($env:PORT) { [int]$env:PORT } else { 8080 }

function Initialize-Database {
    if (-not (Test-Path $dbPath)) {
        Copy-Item -Path $seedPath -Destination $dbPath -Force
    }
}

function Load-Db {
    return (Get-Content -Raw $dbPath | ConvertFrom-Json)
}

function Save-Db($db) {
    $db | ConvertTo-Json -Depth 10 | Set-Content -Path $dbPath
}

function New-Response($statusCode, $contentType, [byte[]]$bodyBytes) {
    return [PSCustomObject]@{
        StatusCode = $statusCode
        ContentType = $contentType
        BodyBytes = $bodyBytes
    }
}

function Json-Response($statusCode, $payload) {
    $json = $payload | ConvertTo-Json -Depth 10
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return (New-Response $statusCode "application/json; charset=utf-8" $bytes)
}

function Text-Response($statusCode, $contentType, $text) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($text)
    return (New-Response $statusCode $contentType $bytes)
}

function Get-MimeType($filePath) {
    switch ([System.IO.Path]::GetExtension($filePath).ToLowerInvariant()) {
        ".html" { return "text/html; charset=utf-8" }
        ".css" { return "text/css; charset=utf-8" }
        ".js" { return "application/javascript; charset=utf-8" }
        ".json" { return "application/json; charset=utf-8" }
        default { return "application/octet-stream" }
    }
}

function Read-JsonBody($request) {
    if ([string]::IsNullOrWhiteSpace($request.Body)) {
        return $null
    }
    return ($request.Body | ConvertFrom-Json)
}

function Resolve-StaticPath($path) {
    if ($path -eq "/") {
        return (Join-Path $publicDir "index.html")
    }

    if ($path -eq "/admin" -or $path -eq "/admin/") {
        return (Join-Path $publicDir "admin.html")
    }

    $candidate = Join-Path $publicDir ($path.TrimStart("/") -replace "/", "\")
    if (Test-Path $candidate) {
        return $candidate
    }

    return $null
}

function Handle-Login($request) {
    $body = Read-JsonBody $request
    $phone = if ($body) { "$($body.phone)".Trim() } else { "" }
    if ([string]::IsNullOrWhiteSpace($phone)) {
        return (Json-Response 400 @{ error = "Phone number is required" })
    }

    $db = Load-Db
    $user = $db.users | Where-Object { $_.phone -eq $phone } | Select-Object -First 1

    if (-not $user) {
        $id = [int]$db.nextIds.users
        $suffix = if ($phone.Length -ge 4) { $phone.Substring($phone.Length - 4) } else { $phone }
        $user = [PSCustomObject]@{
            id = $id
            name = if ($body.name) { "$($body.name)".Trim() } else { "Member $suffix" }
            phone = $phone
            role = "member"
            city = "Jakarta"
        }
        $db.users += $user
        $db.nextIds.users = $id + 1
        Save-Db $db
    }

    return (Json-Response 200 @{ user = $user })
}

function Handle-Collection($request, $key) {
    $db = Load-Db
    if ($request.Method -eq "GET") {
        return (Json-Response 200 $db.$key)
    }

    if ($request.Method -eq "POST") {
        $body = Read-JsonBody $request
        $id = [int]$db.nextIds.$key
        $item = [ordered]@{ id = $id }
        foreach ($property in $body.PSObject.Properties.Name) {
            if ($property -ne "id") {
                $item[$property] = $body.$property
            }
        }
        $db.$key += [PSCustomObject]$item
        $db.nextIds.$key = $id + 1
        Save-Db $db
        return (Json-Response 201 ([PSCustomObject]$item))
    }

    return (Json-Response 405 @{ error = "Method not allowed" })
}

function Handle-Item($request, $key, $id) {
    $db = Load-Db
    $items = @($db.$key)
    $item = $items | Where-Object { [int]$_.id -eq [int]$id } | Select-Object -First 1

    if (-not $item) {
        return (Json-Response 404 @{ error = "Not found" })
    }

    if ($request.Method -eq "GET") {
        return (Json-Response 200 $item)
    }

    if ($request.Method -eq "PUT") {
        $body = Read-JsonBody $request
        foreach ($property in $body.PSObject.Properties.Name) {
            if ($property -ne "id") {
                $item.$property = $body.$property
            }
        }
        Save-Db $db
        return (Json-Response 200 $item)
    }

    if ($request.Method -eq "DELETE") {
        $db.$key = @($items | Where-Object { [int]$_.id -ne [int]$id })
        if ($key -eq "users") {
            foreach ($event in $db.events) {
                $event.rsvps = @($event.rsvps | Where-Object { [int]$_.userId -ne [int]$id })
            }
        }
        Save-Db $db
        return (Json-Response 200 @{ success = $true })
    }

    return (Json-Response 405 @{ error = "Method not allowed" })
}

function Handle-Rsvp($request, $eventId) {
    if ($request.Method -ne "POST") {
        return (Json-Response 405 @{ error = "Method not allowed" })
    }

    $db = Load-Db
    $event = $db.events | Where-Object { [int]$_.id -eq [int]$eventId } | Select-Object -First 1
    if (-not $event) {
        return (Json-Response 404 @{ error = "Event not found" })
    }

    $body = Read-JsonBody $request
    $userId = [int]$body.userId
    $status = "$($body.status)"
    if (@("Going", "Maybe", "Not Going") -notcontains $status) {
        return (Json-Response 400 @{ error = "Invalid RSVP" })
    }

    $existing = $event.rsvps | Where-Object { [int]$_.userId -eq $userId } | Select-Object -First 1
    if ($existing) {
        $existing.status = $status
    } else {
        $event.rsvps += [PSCustomObject]@{
            userId = $userId
            status = $status
        }
    }

    Save-Db $db
    return (Json-Response 200 $event)
}

function Handle-Reset($request) {
    if ($request.Method -ne "POST") {
        return (Json-Response 405 @{ error = "Method not allowed" })
    }

    Copy-Item -Path $seedPath -Destination $dbPath -Force
    return (Json-Response 200 @{ success = $true })
}

function Route-Request($request) {
    $path = $request.Path
    if ($path.StartsWith("/api/")) {
        $segments = @($path.Trim("/").Split("/", [System.StringSplitOptions]::RemoveEmptyEntries))

        if ($segments.Count -eq 2 -and $segments[1] -eq "health") {
            return (Json-Response 200 @{ status = "ok" })
        }

        if ($segments.Count -eq 2 -and $segments[1] -eq "login") {
            return (Handle-Login $request)
        }

        if ($segments.Count -eq 2 -and $segments[1] -eq "reset") {
            return (Handle-Reset $request)
        }

        if ($segments.Count -eq 2 -and @("users", "events", "announcements", "vendors") -contains $segments[1]) {
            return (Handle-Collection $request $segments[1])
        }

        if ($segments.Count -eq 3 -and @("users", "events", "announcements", "vendors") -contains $segments[1]) {
            return (Handle-Item $request $segments[1] $segments[2])
        }

        if ($segments.Count -eq 4 -and $segments[1] -eq "events" -and $segments[3] -eq "rsvp") {
            return (Handle-Rsvp $request $segments[2])
        }

        return (Json-Response 404 @{ error = "API route not found" })
    }

    $filePath = Resolve-StaticPath $path
    if (-not $filePath) {
        return (Json-Response 404 @{ error = "Not found" })
    }

    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    return (New-Response 200 (Get-MimeType $filePath) $bytes)
}

function Receive-HttpRequest($client) {
    $stream = $client.GetStream()
    $buffer = New-Object byte[] 4096
    $builder = New-Object System.Collections.Generic.List[byte]
    $headerEnd = -1

    while ($headerEnd -lt 0) {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) {
            break
        }
        for ($i = 0; $i -lt $read; $i++) {
            $builder.Add($buffer[$i])
        }

        $text = [System.Text.Encoding]::ASCII.GetString($builder.ToArray())
        $headerEnd = $text.IndexOf("`r`n`r`n")
    }

    if ($headerEnd -lt 0) {
        return $null
    }

    $allBytes = $builder.ToArray()
    $headerBytes = $allBytes[0..($headerEnd + 3)]
    $headerText = [System.Text.Encoding]::ASCII.GetString($headerBytes)
    $lines = $headerText.Split("`r`n", [System.StringSplitOptions]::None) | Where-Object { $_ -ne "" }
    $requestLine = $lines[0].Split(" ")

    $headers = @{}
    foreach ($line in $lines[1..($lines.Count - 1)]) {
        $parts = $line.Split(":", 2)
        if ($parts.Count -eq 2) {
            $headers[$parts[0].Trim().ToLowerInvariant()] = $parts[1].Trim()
        }
    }

    $contentLength = if ($headers.ContainsKey("content-length")) { [int]$headers["content-length"] } else { 0 }
    $bodyStart = $headerEnd + 4
    $bodyBytes = @()
    if ($allBytes.Length -gt $bodyStart) {
        $bodyBytes = $allBytes[$bodyStart..($allBytes.Length - 1)]
    }

    while ($bodyBytes.Length -lt $contentLength) {
        $read = $stream.Read($buffer, 0, $buffer.Length)
        if ($read -le 0) {
            break
        }
        if ($read -eq 1) {
            $bodyBytes += ,$buffer[0]
        } else {
            $bodyBytes += $buffer[0..($read - 1)]
        }
    }

    return [PSCustomObject]@{
        Method = $requestLine[0].ToUpperInvariant()
        Path = ($requestLine[1].Split("?")[0])
        Headers = $headers
        Body = if ($contentLength -gt 0) { [System.Text.Encoding]::UTF8.GetString($bodyBytes, 0, $contentLength) } else { "" }
    }
}

function Send-HttpResponse($client, $response) {
    $statusTextMap = @{
        200 = "OK"
        201 = "Created"
        400 = "Bad Request"
        404 = "Not Found"
        405 = "Method Not Allowed"
        500 = "Internal Server Error"
    }

    $statusText = $statusTextMap[$response.StatusCode]
    if (-not $statusText) {
        $statusText = "OK"
    }

    $headerText = "HTTP/1.1 $($response.StatusCode) $statusText`r`nContent-Type: $($response.ContentType)`r`nContent-Length: $($response.BodyBytes.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
    $stream = $client.GetStream()
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($response.BodyBytes, 0, $response.BodyBytes.Length)
    $stream.Flush()
}

Initialize-Database

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
$listener.Start()
Write-Host "Innova Zenix MVP running at http://localhost:$port/"

try {
    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $request = Receive-HttpRequest $client
            if (-not $request) {
                continue
            }

            $response = Route-Request $request
            Send-HttpResponse $client $response
        } catch {
            $errorResponse = Json-Response 500 @{ error = $_.Exception.Message }
            Send-HttpResponse $client $errorResponse
        } finally {
            $client.Close()
        }
    }
} finally {
    $listener.Stop()
}
