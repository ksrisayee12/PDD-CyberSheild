# start.ps1 — One-click CyberShield startup

$PYTHON  = "C:\Users\SRISAYEE\Desktop\Sai\PDD\Dinesh\venv\Scripts\python.exe"
$BACKEND = "C:\Users\SRISAYEE\Desktop\Sai\PDD\Dinesh\CyberSheild\CyberBully\cybershield\backend"
$NGROK   = "C:\ngrok\ngrok.exe"

Write-Host "Starting CyberShield Backend..." -ForegroundColor Cyan
Start-Process -FilePath $PYTHON `
    -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000" `
    -WorkingDirectory $BACKEND `
    -WindowStyle Normal

Start-Sleep 3

Write-Host "Starting ngrok tunnel (permanent URL)..." -ForegroundColor Cyan
Start-Process -FilePath $NGROK `
    -ArgumentList "http", "8000", "--domain=platonic-avert-guileless.ngrok-free.dev" `
    -WindowStyle Normal

Start-Sleep 2

Write-Host ""
Write-Host "Done! Two windows opened." -ForegroundColor Green
Write-Host "Backend : http://localhost:8000" -ForegroundColor White
Write-Host "Tunnel  : https://platonic-avert-guileless.ngrok-free.dev" -ForegroundColor White
Write-Host "App URL : https://cybersheild-chi.vercel.app" -ForegroundColor White
Write-Host ""
