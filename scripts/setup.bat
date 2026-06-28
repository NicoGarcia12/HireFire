@echo off
setlocal enabledelayedexpansion

echo.
echo 🔥 HireFire — Setup Automatizado (Windows)
echo ==========================================
echo.

REM 1. Verificar Node.js
echo 📦 Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js no encontrado.
    echo    Descargar desde https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION%
echo.

REM 2. Verificar PostgreSQL
echo 🗄️  Verificando PostgreSQL...
psql --version >nul 2>&1
if errorlevel 1 (
    echo ❌ PostgreSQL no encontrado.
    echo    Descargar desde https://www.postgresql.org/download/windows/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('psql --version') do set PG_VERSION=%%i
echo ✓ %PG_VERSION%
echo.

REM 3. Crear usuario y BD
echo 🔐 Configurando usuario y base de datos...
echo.
echo    Ingresa la contraseña del usuario 'postgres' cuando se pida:
echo.

psql -U postgres -c "CREATE USER hirefire WITH PASSWORD 'hirefire';" 2>nul
if errorlevel 0 (
    echo    ✓ Usuario 'hirefire' creado
) else (
    echo    ℹ️  Usuario 'hirefire' ya existe
)

psql -U postgres -c "CREATE DATABASE hirefire OWNER hirefire;" 2>nul
if errorlevel 0 (
    echo    ✓ Base de datos 'hirefire' creada
) else (
    echo    ℹ️  Base de datos 'hirefire' ya existe
)
echo.

REM 4. Crear .env si no existe
echo ⚙️  Configurando variables de entorno...
if exist backend\.env (
    echo    backend\.env ya existe
) else (
    (
        echo DATABASE_URL=postgresql://hirefire:hirefire@localhost:5432/hirefire?schema=public
        echo PORT=3000
        echo.
        echo # Obtener en https://console.apify.com/account/integrations
        echo APIFY_TOKEN=
        echo.
        echo # Obtener en https://console.groq.com/keys
        echo GROQ_API_KEY=
    ) > backend\.env
    echo    ⚠️  backend\.env creado. Completar APIFY_TOKEN y GROQ_API_KEY
)
echo.

REM 5. Instalar dependencias
echo 📥 Instalando dependencias...
cd backend
call npm ci --silent
if errorlevel 1 (
    echo ❌ Error instalando backend
    pause
    exit /b 1
)
cd ..\frontend
call npm ci --silent
if errorlevel 1 (
    echo ❌ Error instalando frontend
    pause
    exit /b 1
)
cd ..
echo ✓ Dependencias instaladas
echo.

REM 6. Migrar BD
echo 🔄 Migrando base de datos...
cd backend
call npm run db:push
if errorlevel 1 (
    echo ❌ Error migrando BD
    pause
    exit /b 1
)
cd ..
echo ✓ BD migrada
echo.

REM 7. Resumen final
echo ✅ Setup completado!
echo.
echo 📝 Próximos pasos:
echo    1. Abrir backend\.env y completar:
echo       - APIFY_TOKEN ^(de https://console.apify.com/account/integrations^)
echo       - GROQ_API_KEY ^(de https://console.groq.com/keys^)
echo.
echo    2. Iniciar backend ^(cmd 1^):
echo       cd backend ^&^& npm run dev
echo.
echo    3. Iniciar frontend ^(cmd 2^):
echo       cd frontend ^&^& npm start
echo.
echo    4. Abrir en navegador: http://localhost:4200
echo.
pause
