// notification-service/src/core/consumers/AuditConsumer.js

class AuditConsumer {
    constructor(eventBus, logger) {
        this.eventBus = eventBus;
        this.logger = logger;
    }

    start() {
        // Auditoria do Relatório
        this.eventBus.subscribe('RelatorioGerado', async ({ payload, correlationId }) => {
            this.logger.info(`🛡️ [Auditoria] Registo: Relatório gerado com sucesso em ${payload.reportUrl}`, correlationId);
        });

        // Auditoria da Criação de Veículos
        this.eventBus.subscribe('VehicleCreated', async ({ payload, correlationId }) => {
            this.logger.info(`🛡️ [Auditoria] Registo: Nova tentativa de registo de veículo. ID: ${payload.id}, Matrícula: ${payload.licensePlate}`, correlationId);
        });

        // Auditoria de Falhas na Saga
        this.eventBus.subscribe('VehicleSetupFailed', async ({ payload, correlationId }) => {
            this.logger.error(`🛡️ [Auditoria] Alerta Saga: Falha no setup do veículo ${payload.vehicleId}. Motivo: ${payload.error}`, correlationId);
        });

        // Auditoria de Sucessos na Saga
        this.eventBus.subscribe('VehicleSetupCompleted', async ({ payload, correlationId }) => {
            this.logger.info(`🛡️ [Auditoria] Registo Saga: Setup do veículo ${payload.vehicleId} concluído com sucesso.`, correlationId);
        });
    }
}

module.exports = AuditConsumer;
