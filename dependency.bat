@echo off
set "zipUrl=https://github.com/diyaayay/processing-language-server-extension/releases/download/v1.0/dependency.zip"
set "zipFile=jre\dependency.zip"
set "extractDir=jre\deps"
powershell -Command "Invoke-WebRequest -Uri '%zipUrl%' -OutFile '%cd%\%zipFile%'"
powershell -Command "Expand-Archive -Path '%cd%\%zipFile%' -DestinationPath '%cd%\%extractDir%'"
del "%zipFile%"


//Cross platform script

@echo off

:: Define variables for URLs and paths
set "zipUrl=https://github.com/diyaayay/processing-language-server-extension/releases/download/v1.0/dependency.zip"
set "zipFile=jre\dependency.zip"
set "extractDir=jre\deps"

:: Check if running on Windows
ver | findstr /i "Windows" > nul
if %errorlevel% == 0 (
    :: Windows: use PowerShell to download and extract
    powershell -Command "Invoke-WebRequest -Uri '%zipUrl%' -OutFile '%cd%\%zipFile%'"
    powershell -Command "Expand-Archive -Path '%cd%\%zipFile%' -DestinationPath '%cd%\%extractDir%'"
    del "%zipFile%"
) else (
    :: Linux: use wget and unzip
    wget "%zipUrl%" -O "%zipFile%"
    mkdir -p "%extractDir%"
    unzip "%zipFile%" -d "%extractDir%"
    rm "%zipFile%"
)

echo Script execution completed.
