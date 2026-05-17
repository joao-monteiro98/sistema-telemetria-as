// fleet-service/src/server.js

const express = require('express');
const tracingMiddleware = require('./api/middlewares/tracingMiddleware');
const { initialize, fleetRoutes, logger } = require('./composition');

const app = express();

app.use(express.json());
app.use(tracingMiddleware);

app.use('/api/vehicles', fleetRoutes);

const PORT = process.env.PORT || 3001;

async function start() {
    try {
        // Inicializar infraestrutura e subscrições da Saga e gRPC
        await initialize();
        
        app.listen(PORT, () => {
            logger.info(`Servidor HTTP do Fleet Service a correr na porta ${PORT}`);
        });
    } catch (err) {
        console.error('Falha crítica ao iniciar o Fleet Service:', err);
        process.exit(1);
    }
}

start();
