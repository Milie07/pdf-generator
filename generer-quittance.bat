@echo off
chcp 65001 >nul

cd /d "%~dp0"

if not exist node_modules (
    echo Installation des dependances...
    call npm install
)

echo Bonjour Mon Maître 🫅 ! 
echo Je génère les quittances de loyer du mois en cours pour vous...
echo --------------------------------------
echo ""
node src/generatePdf.js

echo.
echo J'ai terminé mon Maître. Les PDFs sont à votre disposition dans le dossier output. N'oubliez pas de les vérifier et de les enregistrer !!! 
echo ❤️❤️❤️
pause