// notification-service/src/composition.js

const ConsoleLogger = require('./infrastructure/logging/ConsoleLogger');
const RabbitMQEventBus = require('./infrastructure/events/RabbitMQEventBus');
const NotificationConsumer = require('./core/consumers/NotificationConsumer');
const AuditConsumer = require('./core/consumers/AuditConsumer');

const logger = new ConsoleLogger();

// RabbitMQ EventBus (identificado como 'notification-service')
const eventBus = new RabbitMQEventBus(logger, 'notification-service');

const notificationConsumer = new NotificationConsumer(eventBus, logger);
const auditConsumer = new AuditConsumer(eventBus, logger);

async function initialize() {
    // 1. Inicializar EventBus (RabbitMQ)
    await eventBus.init();

    // 2. Ativar os consumidores de eventos
    notificationConsumer.start();
    auditConsumer.start();
    
    logger.info('Consumidores de Auditoria e Notificações ativados com sucesso!', 'NOTIFICATION_SERVICE');
}

module.exports = {
    initialize,
    logger
};
