Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting EcoNexa Full-Stack Platform" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan

Write-Host "1. Starting Python ML FastAPI Service (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml_service; python -m uvicorn app:app --port 5001 --reload"

Write-Host "2. Starting Node.js Express & Socket.IO Backend (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Write-Host "3. Starting React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host ""
Write-Host "All services started in separate processes!" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "ML Engine: http://localhost:5001/docs" -ForegroundColor White
