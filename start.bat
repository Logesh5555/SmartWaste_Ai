@echo off
echo ========================================================
echo  Starting EcoNexa Full-Stack Platform
echo ========================================================
echo.
echo 1. Launching Python ML FastAPI Service (Port 5001)...
start "EcoNexa ML Service" cmd /k "cd ml_service && python -m uvicorn app:app --port 5001 --reload"

echo 2. Launching Node.js Express & Socket.IO Backend (Port 5000)...
start "EcoNexa Backend" cmd /k "cd backend && npm run dev"

echo 3. Launching React Vite Frontend (Port 5173)...
start "EcoNexa Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services launched!
echo - Frontend:  http://localhost:5173
echo - Backend:   http://localhost:5000
echo - ML Engine: http://localhost:5001/docs
echo ========================================================
