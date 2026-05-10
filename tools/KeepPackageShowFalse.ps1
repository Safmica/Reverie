param(
    [Parameter(Mandatory = $true)]
    [string]$PackagePath,

    [int]$LifetimeHours = 8
)

$ErrorActionPreference = "SilentlyContinue"

function Set-PackageShowFalse {
    if (-not (Test-Path -LiteralPath $PackagePath)) {
        return
    }

    try {
        $json = Get-Content -Raw -LiteralPath $PackagePath | ConvertFrom-Json
        if ($null -eq $json) {
            return
        }

        if (-not $json.PSObject.Properties["window"] -or $null -eq $json.window) {
            $json | Add-Member -NotePropertyName "window" -NotePropertyValue ([pscustomobject]@{}) -Force
        }

        if (-not $json.window.PSObject.Properties["show"]) {
            $json.window | Add-Member -NotePropertyName "show" -NotePropertyValue $false -Force
        } elseif ($json.window.show -ne $false) {
            $json.window.show = $false
        } else {
            return
        }

        $text = $json | ConvertTo-Json -Depth 100
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($PackagePath, $text + [Environment]::NewLine, $utf8NoBom)
    } catch {
    }
}

$root = Split-Path -Parent $PackagePath
$file = Split-Path -Leaf $PackagePath
$pidPath = Join-Path $root ".package-show-false-watcher.pid"
$deadline = (Get-Date).AddHours($LifetimeHours)

try {
    if (Test-Path -LiteralPath $pidPath) {
        $existingText = (Get-Content -Raw -LiteralPath $pidPath).Trim()
        $existingPid = 0
        if ([int]::TryParse($existingText, [ref]$existingPid)) {
            if (Get-Process -Id $existingPid) {
                exit
            }
        }
    }

    Set-Content -LiteralPath $pidPath -Value $PID -Encoding ASCII
    Set-PackageShowFalse

    $watcher = New-Object System.IO.FileSystemWatcher
    $watcher.Path = $root
    $watcher.Filter = $file
    $watcher.NotifyFilter = [System.IO.NotifyFilters]"LastWrite, FileName, Size"
    $watcher.EnableRaisingEvents = $true

    Register-ObjectEvent -InputObject $watcher -EventName Changed -SourceIdentifier "ReveriePackageShowFalseChanged" | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Created -SourceIdentifier "ReveriePackageShowFalseCreated" | Out-Null
    Register-ObjectEvent -InputObject $watcher -EventName Renamed -SourceIdentifier "ReveriePackageShowFalseRenamed" | Out-Null

    while ((Get-Date) -lt $deadline) {
        $event = Wait-Event -Timeout 2
        if ($event) {
            Remove-Event -EventIdentifier $event.EventIdentifier
            Start-Sleep -Milliseconds 120
        }
        Set-PackageShowFalse
    }
} finally {
    if ($watcher) {
        $watcher.Dispose()
    }

    if (Test-Path -LiteralPath $pidPath) {
        $currentPid = (Get-Content -Raw -LiteralPath $pidPath).Trim()
        if ($currentPid -eq "$PID") {
            Remove-Item -LiteralPath $pidPath -Force
        }
    }
}
