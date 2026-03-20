$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$publicDir = Join-Path $root "public"
$dataDir = Join-Path $root "data"
$seedPath = Join-Path $dataDir "seed.json"
$dbPath = Join-Path $dataDir "db.json"
$port = if ($env:PORT) { [int]$env:PORT } else { 8080 }
$sessionCookieName = "zenix_session"

function Initialize-Database {
    if (-not (Test-Path $dbPath)) {
        Copy-Item -Path $seedPath -Destination $dbPath -Force
    }
}

function Load-Db {
    return (Get-Content -Raw $dbPath | ConvertFrom-Json)
}

function Save-Db($db) {
    $db | ConvertTo-Json -Depth 12 | Set-Content -Path $dbPath
}

function New-Response($statusCode, $contentType, [byte[]]$bodyBytes, $headers = @{}) {
    return [PSCustomObject]@{
        StatusCode = $statusCode
        ContentType = $contentType
        BodyBytes = $bodyBytes
        Headers = $headers
    }
}

function Json-Response($statusCode, $payload, $headers = @{}) {
    $json = $payload | ConvertTo-Json -Depth 12
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
    return (New-Response $statusCode "application/json; charset=utf-8" $bytes $headers)
}

function File-Response($filePath, $headers = @{}) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    return (New-Response 200 (Get-MimeType $filePath) $bytes $headers)
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

function New-SessionCookie($token) {
    return "$sessionCookieName=$token; Path=/; HttpOnly; SameSite=Lax"
}

function Clear-SessionCookie() {
    return "$sessionCookieName=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax"
}

function Sanitize-User($user) {
    return [PSCustomObject]@{
        id = [int]$user.id
        name = $user.name
        username = $user.username
        role = $user.role
        phone = $user.phone
        city = $user.city
    }
}

function Get-SessionContext($request) {
    $token = if ($request.Cookies.ContainsKey($sessionCookieName)) { $request.Cookies[$sessionCookieName] } else { $null }
    if ([string]::IsNullOrWhiteSpace($token)) {
        return $null
    }

    $db = Load-Db
    $session = $db.sessions | Where-Object { $_.token -eq $token } | Select-Object -First 1
    if (-not $session) {
        return $null
    }

    $user = $db.users | Where-Object { [int]$_.id -eq [int]$session.userId } | Select-Object -First 1
    if (-not $user) {
        return $null
    }

    return [PSCustomObject]@{
        token = $token
        user = $user
        db = $db
        session = $session
    }
}

function Require-Session($request, $role = $null) {
    $context = Get-SessionContext $request
    if (-not $context) {
        return [PSCustomObject]@{
            Context = $null
            ErrorResponse = Json-Response 401 @{ error = "Authentication required" }
        }
    }

    if ($role -and $context.user.role -ne $role) {
        return [PSCustomObject]@{
            Context = $null
            ErrorResponse = Json-Response 403 @{ error = "Forbidden" }
        }
    }

    return [PSCustomObject]@{
        Context = $context
        ErrorResponse = $null
    }
}

function Resolve-StaticPath($path, $request) {
    if ($path -eq "/") {
        return (Join-Path $publicDir "index.html")
    }

    if ($path -eq "/admin" -or $path -eq "/admin/") {
        $sessionResult = Require-Session $request "admin"
        if ($sessionResult.Context) {
            return (Join-Path $publicDir "admin.html")
        }
        return (Join-Path $publicDir "admin-login.html")
    }

    $candidate = Join-Path $publicDir ($path.TrimStart("/") -replace "/", "\")
    if (Test-Path $candidate) {
        return $candidate
    }

    return $null
}

function Handle-AuthLogin($request) {
    $body = Read-JsonBody $request
    $username = if ($body) { "$($body.username)".Trim() } else { "" }
    $password = if ($body) { "$($body.password)" } else { "" }
    $scope = if ($body) { "$($body.scope)" } else { "member" }

    if ([string]::IsNullOrWhiteSpace($username) -or [string]::IsNullOrWhiteSpace($password)) {
        return (Json-Response 400 @{ error = "Username and password are required" })
    }

    $db = Load-Db
    $user = $db.users | Where-Object { $_.username -eq $username } | Select-Object -First 1
    if (-not $user -or $user.password -ne $password) {
        return (Json-Response 401 @{ error = "Invalid username or password" })
    }

    if ($scope -eq "admin" -and $user.role -ne "admin") {
        return (Json-Response 403 @{ error = "Admin access required" })
    }

    if ($scope -eq "member" -and $user.role -ne "member") {
        return (Json-Response 403 @{ error = "Member access required" })
    }

    $token = [Guid]::NewGuid().ToString("N")
    $db.sessions = @($db.sessions | Where-Object { [int]$_.userId -ne [int]$user.id })
    $db.sessions += [PSCustomObject]@{
        token = $token
        userId = [int]$user.id
        role = $user.role
        createdAt = (Get-Date).ToString("s")
    }
    Save-Db $db

    return (Json-Response 200 @{
        user = (Sanitize-User $user)
    } @{
        "Set-Cookie" = New-SessionCookie $token
    })
}

function Handle-AuthMe($request) {
    $result = Require-Session $request
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    return (Json-Response 200 @{ user = (Sanitize-User $result.Context.user) })
}

function Handle-AuthLogout($request) {
    $context = Get-SessionContext $request
    if ($context) {
        $context.db.sessions = @($context.db.sessions | Where-Object { $_.token -ne $context.token })
        Save-Db $context.db
    }

    return (Json-Response 200 @{ success = $true } @{
        "Set-Cookie" = Clear-SessionCookie
    })
}

function Handle-UsersCollection($request) {
    $result = Require-Session $request "admin"
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    $db = $result.Context.db
    if ($request.Method -eq "GET") {
        return (Json-Response 200 @($db.users))
    }

    if ($request.Method -eq "POST") {
        $body = Read-JsonBody $request
        $id = [int]$db.nextIds.users
        $item = [PSCustomObject]@{
            id = $id
            name = $body.name
            username = $body.username
            password = $body.password
            phone = $body.phone
            role = $body.role
            city = $body.city
        }
        $db.users += $item
        $db.nextIds.users = $id + 1
        Save-Db $db
        return (Json-Response 201 $item)
    }

    return (Json-Response 405 @{ error = "Method not allowed" })
}

function Handle-UsersItem($request, $id) {
    $result = Require-Session $request "admin"
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    $db = $result.Context.db
    $items = @($db.users)
    $item = $items | Where-Object { [int]$_.id -eq [int]$id } | Select-Object -First 1
    if (-not $item) {
        return (Json-Response 404 @{ error = "Not found" })
    }

    if ($request.Method -eq "GET") {
        return (Json-Response 200 $item)
    }

    if ($request.Method -eq "PUT") {
        $body = Read-JsonBody $request
        foreach ($property in @("name", "username", "password", "phone", "role", "city")) {
            $item.$property = $body.$property
        }
        Save-Db $db
        return (Json-Response 200 $item)
    }

    if ($request.Method -eq "DELETE") {
        $db.users = @($items | Where-Object { [int]$_.id -ne [int]$id })
        $db.sessions = @($db.sessions | Where-Object { [int]$_.userId -ne [int]$id })
        foreach ($event in $db.events) {
            $event.rsvps = @($event.rsvps | Where-Object { [int]$_.userId -ne [int]$id })
        }
        Save-Db $db
        return (Json-Response 200 @{ success = $true })
    }

    return (Json-Response 405 @{ error = "Method not allowed" })
}

function Handle-Collection($request, $key) {
    $result = Require-Session $request
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    $db = $result.Context.db
    if ($request.Method -eq "GET") {
        return (Json-Response 200 $db.$key)
    }

    if ($result.Context.user.role -ne "admin") {
        return (Json-Response 403 @{ error = "Forbidden" })
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
    $result = Require-Session $request
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    $db = $result.Context.db
    $items = @($db.$key)
    $item = $items | Where-Object { [int]$_.id -eq [int]$id } | Select-Object -First 1

    if (-not $item) {
        return (Json-Response 404 @{ error = "Not found" })
    }

    if ($request.Method -eq "GET") {
        return (Json-Response 200 $item)
    }

    if ($result.Context.user.role -ne "admin") {
        return (Json-Response 403 @{ error = "Forbidden" })
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
        Save-Db $db
        return (Json-Response 200 @{ success = $true })
    }

    return (Json-Response 405 @{ error = "Method not allowed" })
}

function Handle-Rsvp($request, $eventId) {
    $result = Require-Session $request "member"
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    if ($request.Method -ne "POST") {
        return (Json-Response 405 @{ error = "Method not allowed" })
    }

    $db = $result.Context.db
    $event = $db.events | Where-Object { [int]$_.id -eq [int]$eventId } | Select-Object -First 1
    if (-not $event) {
        return (Json-Response 404 @{ error = "Event not found" })
    }

    $body = Read-JsonBody $request
    $status = "$($body.status)"
    if (@("Going", "Maybe", "Not Going") -notcontains $status) {
        return (Json-Response 400 @{ error = "Invalid RSVP" })
    }

    $userId = [int]$result.Context.user.id
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
    $result = Require-Session $request "admin"
    if (-not $result.Context) {
        return $result.ErrorResponse
    }

    if ($request.Method -ne "POST") {
        return (Json-Response 405 @{ error = "Method not allowed" })
    }

    Copy-Item -Path $seedPath -Destination $dbPath -Force
    return (Json-Response 200 @{ success = $true })
}

function Route-Request($request) {
    $path = $request.Path
    if ($path.StartsWith("/api/")) {
        if ($path -like "*auth/login*") {
            return (Handle-AuthLogin $request)
        }

        if ($path -like "*auth/me*") {
            return (Handle-AuthMe $request)
        }

        if ($path -like "*auth/logout*") {
            return (Handle-AuthLogout $request)
        }

        if ($path -like "*api/reset*") {
            return (Handle-Reset $request)
        }

        $segments = @($path.Trim("/").Split("/", [System.StringSplitOptions]::RemoveEmptyEntries))

        if ($segments.Count -eq 2 -and $segments[1] -eq "health") {
            return (Json-Response 200 @{ status = "ok" })
        }

        if ($segments.Count -eq 2 -and $segments[1] -eq "users") {
            return (Handle-UsersCollection $request)
        }

        if ($segments.Count -eq 3 -and $segments[1] -eq "users") {
            return (Handle-UsersItem $request $segments[2])
        }

        if ($segments.Count -eq 2 -and @("events", "announcements", "vendors") -contains $segments[1]) {
            return (Handle-Collection $request $segments[1])
        }

        if ($segments.Count -eq 3 -and @("events", "announcements", "vendors") -contains $segments[1]) {
            return (Handle-Item $request $segments[1] $segments[2])
        }

        if ($segments.Count -eq 4 -and $segments[1] -eq "events" -and $segments[3] -eq "rsvp") {
            return (Handle-Rsvp $request $segments[2])
        }

        return (Json-Response 404 @{ error = "API route not found" })
    }

    $filePath = Resolve-StaticPath $path $request
    if (-not $filePath) {
        return (Json-Response 404 @{ error = "Not found" })
    }

    return (File-Response $filePath)
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

    $cookies = @{}
    if ($headers.ContainsKey("cookie")) {
        foreach ($piece in $headers["cookie"].Split(";")) {
            $cookieParts = $piece.Trim().Split("=", 2)
            if ($cookieParts.Count -eq 2) {
                $cookies[$cookieParts[0]] = $cookieParts[1]
            }
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

    $rawTarget = $requestLine[1].Split("?")[0]
    $normalizedPath = if ($rawTarget.StartsWith("http")) { ([Uri]$rawTarget).AbsolutePath } else { $rawTarget }

    return [PSCustomObject]@{
        Method = $requestLine[0].ToUpperInvariant()
        Path = $normalizedPath
        Headers = $headers
        Cookies = $cookies
        Body = if ($contentLength -gt 0) { [System.Text.Encoding]::UTF8.GetString($bodyBytes, 0, $contentLength) } else { "" }
    }
}

function Send-HttpResponse($client, $response) {
    $statusTextMap = @{
        200 = "OK"
        201 = "Created"
        400 = "Bad Request"
        401 = "Unauthorized"
        403 = "Forbidden"
        404 = "Not Found"
        405 = "Method Not Allowed"
        500 = "Internal Server Error"
    }

    $statusText = $statusTextMap[$response.StatusCode]
    if (-not $statusText) {
        $statusText = "OK"
    }

    $headerLines = @(
        "HTTP/1.1 $($response.StatusCode) $statusText",
        "Content-Type: $($response.ContentType)",
        "Content-Length: $($response.BodyBytes.Length)",
        "Connection: close"
    )

    foreach ($key in $response.Headers.Keys) {
        $value = $response.Headers[$key]
        if ($value -is [System.Array]) {
            foreach ($entry in $value) {
                $headerLines += "${key}: $entry"
            }
        } else {
            $headerLines += "${key}: $value"
        }
    }

    $headerText = ($headerLines -join "`r`n") + "`r`n`r`n"
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
