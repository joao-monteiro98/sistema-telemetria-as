// notification-service/src/index.js

const { initialize, logger } = require('./composition');

async function start() {
    try {
        await initialize();
        logger.info('Serviço de Notificações e Auditoria iniciado com sucesso.');
    } catch (err) {
        console.error('Falha crítica ao iniciar o Notification Service:', err);
        process.exit(1);
    }
}

start();
