@echo off
echo ===========================================
echo    INSTALADOR DOCUMENTOSPRO
echo ===========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo.
    echo 📥 Baixe e instale Node.js de: https://nodejs.org/
    echo    Recomendado: Versão LTS (18.x ou superior)
    echo.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado!
node --version
echo.

echo Verificando npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm não encontrado!
    echo.
    pause
    exit /b 1
)

echo ✅ npm encontrado!
npm --version
echo.

echo Verificando package.json...
if not exist "package.json" (
    echo ❌ package.json não encontrado!
    echo Renomeando package-deploy.json...
    if exist "package-deploy.json" (
        move package-deploy.json package.json
        echo ✅ Arquivo renomeado com sucesso!
    ) else (
        echo ❌ package-deploy.json também não encontrado!
        pause
        exit /b 1
    )
)

echo ✅ package.json encontrado!
echo.

echo Instalando dependências...
npm install

if %errorlevel% neq 0 (
    echo ❌ Erro na instalação das dependências!
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Instalação concluída com sucesso!
echo.
echo Para executar em desenvolvimento:
echo   npm run dev
echo.
echo Para executar em produção:
echo   npm start
echo.
echo Acesse: http://localhost:3000
echo Login: admin@admin.com / admin123
echo.
pause</content>
<parameter name="filePath">c:\Users\vitor\OneDrive\Documentos\DocumentosPro\DocumentosPro\install.bat