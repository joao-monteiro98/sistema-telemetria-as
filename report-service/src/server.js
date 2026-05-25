// report-service/src/server.js

const express = require('express');
const tracingMiddleware = require('./api/middlewares/tracingMiddleware');
const { initialize, reportRoutes, logger } = require('./composition');

const app = express();

app.use(express.json());

// Middleware de CORS customizado para evitar dependências extras
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(tracingMiddleware);

app.use('/api/reports', reportRoutes);

const PORT = process.env.PORT || 3002;

async function start() {
    try {
        // Inicializa todas as dependências de BD, Eventos, gRPC e inicia o Worker
        await initialize();
        
        app.listen(PORT, () => {
            logger.info(`Servidor HTTP do Report Service a correr na porta ${PORT}`);
        });
    } catch (err) {
        console.error('Falha crítica ao iniciar o Report Service:', err);
        process.exit(1);
    }
}

start();
