@echo off
set "zipUrl=https://github.com/diyaayay/processing-language-server-extension/releases/download/v1.0/dependency.zip"
set "zipFile=jre\dependency.zip"
set "extractDir=jre\deps"
powershell -Command "Invoke-WebRequest -Uri '%zipUrl%' -OutFile '%cd%\%zipFile%'"
powershell -Command "Expand-Archive -Path '%cd%\%zipFile%' -DestinationPath '%cd%\%extractDir%'"
del "%zipFile%"