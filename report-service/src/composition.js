// report-service/src/composition.js

const ConsoleLogger = require('./infrastructure/logging/ConsoleLogger');
const MongoJobStore = require('./infrastructure/database/MongoJobStore');
const RabbitMQEventBus = require('./infrastructure/events/RabbitMQEventBus');
const InMemoryJobQueue = require('./infrastructure/queue/InMemoryJobQueue');
const InMemoryDLQ = require('./infrastructure/queue/InMemoryDLQ');
const GrpcVehicleClient = require('./infrastructure/grpc/GrpcVehicleClient');
const ReportWorker = require('./core/workers/ReportWorker');

const logger = new ConsoleLogger();
const jobQueue = new InMemoryJobQueue();
const jobStore = new MongoJobStore(logger);
const dlq = new InMemoryDLQ(logger);

// RabbitMQ EventBus (identificado como 'report-service')
const eventBus = new RabbitMQEventBus(logger, 'report-service');

// Cliente gRPC para o Fleet Service
const vehicleDataClient = new GrpcVehicleClient(logger);

const reportWorker = new ReportWorker(jobQueue, jobStore, eventBus, logger, dlq, vehicleDataClient);

const reportRoutes = require('./api/routes/reportRoutes')(jobQueue, jobStore);

async function initialize() {
    // 1. Inicializar Job Store (MongoDB)
    await jobStore.init();

    // 2. Inicializar EventBus (RabbitMQ)
    await eventBus.init();

    // 3. Inicializar Cliente gRPC
    vehicleDataClient.init();

    // 4. Iniciar Worker
    reportWorker.start();
}

module.exports = {
    initialize,
    reportRoutes,
    logger
};
