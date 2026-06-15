# start.ps1 — One-click startup for CyberShield
# Starts backend + ngrok tunnel together
# Run this every time you want to use the app

$BACKEND = "C:\Users\SRISAYEE\Desktop\Sai\PDD\Dinesh\CyberSheild\CyberBully\cybershield\backend"
$NGROK   = "C:\ngrok\ngrok.exe"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CyberShield AI — Starting Up" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start backend in a new window
Write-Host "[1/2] Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BACKEND'; .\venv\Scripts\activate; python -m uvicorn main:app --host 0.0.0.0 --port 8000" -WindowStyle Normal

Start-Sleep 3

# Start ngrok with permanent static domain
Write-Host "[2/2] Starting ngrok tunnel (permanent URL)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$NGROK' http 8000 --domain=platonic-avert-guileless.ngrok-free.dev" -WindowStyle Normal

Start-Sleep 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host " CyberShield is LIVE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host " Backend URL : https://platonic-avert-guileless.ngrok-free.dev" -ForegroundColor White
Write-Host " Frontend    : https://cybersheild-chi.vercel.app" -ForegroundColor White
Write-Host ""
Write-Host " This URL is PERMANENT — never changes!" -ForegroundColor Green
Write-Host " Close the two PowerShell windows to stop." -ForegroundColor Gray
Write-Host ""
