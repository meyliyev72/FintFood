$ErrorActionPreference = "SilentlyContinue"

$listening = netstat -ano | Select-String ":5434\s.*LISTENING"
if ($listening) {
    Write-Host "PostgreSQL already listening on 5434."
    exit 0
}

Write-Host "PostgreSQL not listening; (re)starting scheduled task FintFoodPG..."
Get-Process postgres -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Remove-Item -LiteralPath "E:\fintfood-dev\pgdata\postmaster.pid" -ErrorAction SilentlyContinue

try {
    Start-ScheduledTask -TaskName "FintFoodPG"
} catch {
    Read-Host "Scheduled task FintFoodPG is missing - press Enter after starting it manually, or re-run this script."
}

for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 1
    if (netstat -ano | Select-String ":5434\s.*LISTENING") {
        Write-Host "PostgreSQL is listening on 5434."
        exit 0
    }
}

Write-Error "PostgreSQL did not come up on 5434 within 30s."
exit 1