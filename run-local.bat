@echo off
echo ==========================================
echo A iniciar o Sistema de Telemetria (Local)
echo ==========================================

start cmd /k "echo A iniciar o Fleet Service... && cd fleet-service && npm install && npm start"
start cmd /k "echo A iniciar o Report Service... && cd report-service && npm install && npm start"
start cmd /k "echo A iniciar o Notification Service... && cd notification-service && npm install && npm start"
start cmd /k "echo A iniciar o Frontend Dashboard... && cd frontend && npm install && npm start"

echo Todos os servicos (incluindo o Frontend) foram iniciados em novas janelas cmd!
pause
