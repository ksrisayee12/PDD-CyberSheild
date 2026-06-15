# start_tunnel.ps1
# Run this instead of cloudflared directly.
# It starts the tunnel, extracts the URL, updates vercel.json + pushes to GitHub automatically.

$CLOUDFLARED = "C:\cloudflared\cloudflared.exe"
$REPO_ROOT = "C:\Users\SRISAYEE\Desktop\Sai\PDD\Dinesh\CyberSheild\CyberBully\cybershield"
$VERCEL_JSON = "$REPO_ROOT\frontend\vercel.json"
$ENV_PROD = "$REPO_ROOT\frontend\.env.production"

Write-Host "Starting Cloudflare Tunnel..." -ForegroundColor Cyan

# Start cloudflared and capture output
$job = Start-Process -FilePath $CLOUDFLARED `
    -ArgumentList "tunnel --url http://localhost:8000" `
    -RedirectStandardError "$env:TEMP\cf_output.txt" `
    -NoNewWindow -PassThru

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow

# Poll the output file until we find the URL (up to 30 seconds)
$tunnelUrl = $null
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep 1
    if (Test-Path "$env:TEMP\cf_output.txt") {
        $content = Get-Content "$env:TEMP\cf_output.txt" -Raw -ErrorAction SilentlyContinue
        if ($content -match "https://[a-z0-9\-]+\.trycloudflare\.com") {
            $tunnelUrl = $matches[0]
            break
        }
    }
}

if (-not $tunnelUrl) {
    Write-Host "Could not detect tunnel URL. Check cloudflared output." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Green
Write-Host ""

# Update vercel.json
$vercelContent = Get-Content $VERCEL_JSON -Raw
$vercelContent = $vercelContent -replace "https://[a-z0-9\-]+\.trycloudflare\.com", $tunnelUrl
Set-Content $VERCEL_JSON $vercelContent -NoNewline
Write-Host "Updated vercel.json" -ForegroundColor Green

# Update .env.production
$wsUrl = $tunnelUrl -replace "^https://", "wss://"
Set-Content $ENV_PROD "NEXT_PUBLIC_WS_URL=$wsUrl/ws" -NoNewline
Write-Host "Updated .env.production" -ForegroundColor Green

# Git commit and push
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Set-Location $REPO_ROOT
git add -A
git commit -m "chore: update tunnel URL to $tunnelUrl"
git push origin main

Write-Host ""
Write-Host "Done! Vercel will redeploy in ~1 minute." -ForegroundColor Green
Write-Host "Tunnel URL: $tunnelUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the tunnel." -ForegroundColor Gray

# Keep script alive (tunnel runs in background job)
Wait-Process -Id $job.Id
