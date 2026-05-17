// notification-service/src/core/consumers/NotificationConsumer.js

class NotificationConsumer {
    constructor(eventBus, logger) {
        this.eventBus = eventBus;
        this.logger = logger;
    }

    start() {
        // 1. Manter a funcionalidade da Fase 2 (Notificação de relatório pronto)
        this.eventBus.subscribe('RelatorioGerado', async ({ payload, correlationId }) => {
            this.logger.info(`📧 [Notificação] Alerta: O relatório do veículo está pronto em ${payload.reportUrl}`, correlationId);
        });

        // 2. Implementação da Saga da Fase 3
        this.eventBus.subscribe('VehicleCreated', async ({ payload, correlationId }) => {
            const { id: vehicleId, brand } = payload;
            this.logger.info(`📩 [Notificação] A processar configuração inicial do veículo ${vehicleId} (marca: ${brand})...`, correlationId);

            // Simula um pequeno atraso no processamento do setup
            await new Promise(resolve => setTimeout(resolve, 1500));

            // INJEÇÃO DE FALHA CONTROLADA (DEMONSTRAÇÃO DE ROLLBACK DA SAGA)
            if (brand === 'FAIL') {
                this.logger.error(`🚨 [Notificação] Falha crítica ao configurar telemetria para o veículo ${vehicleId}! Marca 'FAIL' inválida.`, correlationId);
                
                // Publica o evento de compensação (Saga Rollback)
                this.eventBus.publish('VehicleSetupFailed', { 
                    vehicleId, 
                    error: "Sensor de telemetria incompatível com marca 'FAIL'." 
                }, correlationId);
            } else {
                this.logger.info(`✅ [Notificação] Telemetria ativada com sucesso para o veículo ${vehicleId}.`, correlationId);
                
                // Publica o evento de sucesso (Saga Commit)
                this.eventBus.publish('VehicleSetupCompleted', { vehicleId }, correlationId);
            }
        });
    }
}

module.exports = NotificationConsumer;
