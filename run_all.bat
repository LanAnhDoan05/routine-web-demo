@echo off
title Routine Fashion - Khoi chay toan bo he thong
echo =====================================================================
echo   ROUTINE FASHION - KHOI CHAY HE THONG
echo   1. Backend API (Express.js)       : http://localhost:5001
echo   2. Frontend Storefront (Next.js)  : http://localhost:3000
echo   (AI Vector 2D da duoc tich hop Native truc tiep trong Backend Node.js)
echo =====================================================================
echo.

cd /d %~dp0

echo [1/2] Dang khoi dong Backend API (Port 5001)...
start "Routine - Backend (Port 5001)" cmd /k "cd backend && npm start"

echo [2/2] Dang khoi dong Frontend Next.js (Port 3000)...
start "Routine - Frontend (Port 3000)" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo   DA KHOI DONG THANH CONG HE THONG!
echo   - Web Khach hang : http://localhost:3000
echo   - Admin Portal   : http://localhost:3000/admin
echo   - API Backend    : http://localhost:5001
echo   - Vector 2D API  : http://localhost:5001/api/v1/search/vector
echo =====================================================================
timeout /t 5
