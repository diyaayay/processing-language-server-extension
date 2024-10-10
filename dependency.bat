@echo off
set "zipUrl=https://github.com/diyaayay/processing-language-server-extension/releases/download/v1.2/dependency.zip"
set "zipFile=jre\dependency.zip"
set "extractDir=jre\deps"
powershell -Command "Invoke-WebRequest -Uri '%zipUrl%' -OutFile '%cd%\%zipFile%'"
powershell -Command "Expand-Archive -Path '%cd%\%zipFile%' -DestinationPath '%cd%\%extractDir%'"
del "%zipFile%"


@REM //Cross platform script

@REM @echo off

@REM :: Define variables for URLs and paths
@REM set "zipUrl=https://github.com/diyaayay/processing-language-server-extension/releases/download/v1.0/dependency.zip"
@REM set "zipFile=jre\dependency.zip"
@REM set "extractDir=jre\deps"

@REM :: Check if running on Windows
@REM ver | findstr /i "Windows" > nul
@REM if %errorlevel% == 0 (
@REM     :: Windows: use PowerShell to download and extract
@REM     powershell -Command "Invoke-WebRequest -Uri '%zipUrl%' -OutFile '%cd%\%zipFile%'"
@REM     powershell -Command "Expand-Archive -Path '%cd%\%zipFile%' -DestinationPath '%cd%\%extractDir%'"
@REM     del "%zipFile%"
@REM ) else (
@REM     :: Linux: use wget and unzip
@REM     wget "%zipUrl%" -O "%zipFile%"
@REM     mkdir -p "%extractDir%"
@REM     unzip "%zipFile%" -d "%extractDir%"
@REM     rm "%zipFile%"
@REM )

@REM echo Script execution completed.
