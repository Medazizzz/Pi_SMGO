@echo off
REM =========================================
REM SMGO Application Startup Script (Windows)
REM =========================================
REM This script starts all required services for the SMGO application
REM Prerequisites: Java 17, Maven, Node.js, MongoDB

set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"

echo.
echo =============================================
echo SMGO Application Startup Script
echo =============================================
echo.

REM Check if MongoDB is running
echo [1/3] Checking MongoDB on port 27017...
netstat -tuln 2>nul | findstr 27017 >nul
if errorlevel 1 (
    echo WARNING: MongoDB may not be running on port 27017
    echo Please ensure MongoDB is running (mongod or docker-compose up -d)
    echo.
    pause
) else (
    echo ✓ MongoDB is running
    echo.
)

REM Build Backend if needed
echo [2/3] Checking backend build...
if not exist "backend\target\content-management-0.0.1-SNAPSHOT.jar" (
    echo Building backend...
    cd backend
    call mvn clean package -DskipTests >nul 2>&1
    if errorlevel 1 (
        echo ✗ Backend build failed
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo ✓ Backend built successfully
) else (
    echo ✓ Backend JAR exists
)
echo.

REM Check frontend dependencies
echo [3/3] Checking frontend dependencies...
cd frontend
if not exist "node_modules" (
    echo Installing npm dependencies...
    call npm install >nul 2>&1
    if errorlevel 1 (
        echo ✗ npm install failed
        cd ..
        pause
        exit /b 1
    )
) else (
    echo ✓ Frontend dependencies present
)
cd ..
echo.

REM Start services
echo =============================================
echo Starting Services...
echo =============================================
echo.

echo Starting Backend on port 8090...
start "SMGO Backend" cmd /k "cd backend && java -jar target/content-management-0.0.1-SNAPSHOT.jar"
timeout /t 3 /nobreak

echo Starting Frontend on port 4200...
start "SMGO Frontend" cmd /k "cd frontend && npm start"
timeout /t 2 /nobreak

echo Populating test data...
start "SMGO Data Population" cmd /k "node populate-db.js"
timeout /t 1 /nobreak

echo.
echo =============================================
echo Services are starting...
echo =============================================
echo.
echo Access the application at:
echo   - Frontend: http://localhost:4200
echo   - Backend API: http://localhost:8090
echo   - API Documentation: http://localhost:8090/swagger-ui.html
echo.
echo Wait 10-15 seconds for all services to fully start
echo.
pause
