echo off
echo ==================================================
echo INSPECAO DE BASES DE DADOS (SISTEMA DE TELEMETRIA)
echo ==================================================
echo.

echo 1. Listando dados no POSTGRESQL (Tabela de Veiculos - fleet-service)
echo --------------------------------------------------
docker exec -t fleet-db psql -U fleet_user -d fleet_db -c "SELECT * FROM vehicles;"
echo.

echo 2. Listando dados no MONGO DB (Fila de Jobs - report-service)
echo --------------------------------------------------
docker exec -t report-db mongosh --eval "db.getSiblingDB('report_db').jobs.find().pretty();"
echo.

echo 3. Status dos volumes persistentes no Docker
echo --------------------------------------------------
docker volume ls
echo.

pause
