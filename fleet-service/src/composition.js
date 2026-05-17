// fleet-service/src/composition.js

const ConsoleLogger = require('./infrastructure/logging/ConsoleLogger');
const PostgresVehicleRepo = require('./infrastructure/database/PostgresVehicleRepo');
const RabbitMQEventBus = require('./infrastructure/events/RabbitMQEventBus');
const FleetService = require('./core/services/FleetService');
const BasicAuthToken = require('./infrastructure/auth/BasicAuthToken');
const GrpcServer = require('./infrastructure/grpc/GrpcServer');

const logger = new ConsoleLogger();
const authService = new BasicAuthToken();
const vehicleRepo = new PostgresVehicleRepo(logger);

// RabbitMQ EventBus (identificado como 'fleet-service')
const eventBus = new RabbitMQEventBus(logger, 'fleet-service');

const fleetService = new FleetService(vehicleRepo, eventBus, logger);
const grpcServer = new GrpcServer(fleetService, logger);

const fleetRoutes = require('./api/routes/fleetRoutes')(fleetService, authService);

async function initialize() {
    // 1. Inicializar Repositório (PostgreSQL)
    await vehicleRepo.init();

    // 2. Inicializar EventBus (RabbitMQ)
    await eventBus.init();

    // 3. Subscrever os Eventos da Saga
    await eventBus.subscribe('VehicleSetupFailed', async ({ payload, correlationId }) => {
        const { vehicleId, error } = payload;
        await fleetService.handleVehicleSetupFailed(vehicleId, error, correlationId);
    });

    await eventBus.subscribe('VehicleSetupCompleted', async ({ payload, correlationId }) => {
        const { vehicleId } = payload;
        await fleetService.handleVehicleSetupCompleted(vehicleId, correlationId);
    });

    // 4. Iniciar Servidor gRPC
    grpcServer.start();
}

module.exports = {
    initialize,
    fleetRoutes,
    logger
};
