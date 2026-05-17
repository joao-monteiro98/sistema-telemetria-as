// fleet-service/src/infrastructure/grpc/GrpcServer.js

const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');

class GrpcServer {
    constructor(fleetService, logger) {
        this.fleetService = fleetService;
        this.logger = logger;
        this.server = new grpc.Server();
        this.port = process.env.GRPC_PORT || '50051';
    }

    start() {
        const protoPath = path.join(__dirname, 'fleet.proto');
        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });
        const fleetProto = grpc.loadPackageDefinition(packageDefinition).fleet;

        this.server.addService(fleetProto.VehicleService.service, {
            getVehicles: this.getVehicles.bind(this)
        });

        this.server.bindAsync(`0.0.0.0:${this.port}`, grpc.ServerCredentials.createInsecure(), (err, port) => {
            if (err) {
                this.logger.error(`Erro ao iniciar servidor gRPC: ${err.message}`, 'GRPC');
                return;
            }
            this.logger.info(`Servidor gRPC a correr na porta ${port}`, 'GRPC');
        });
    }

    async getVehicles(call, callback) {
        const correlationId = call.request.correlationId || 'N/A';
        this.logger.info(`📥 Chamada gRPC 'GetVehicles' recebida.`, correlationId);
        
        try {
            const vehicles = await this.fleetService.listAllVehicles();
            
            // Mapeia as entidades de domínio para as mensagens protobuf
            const vehicleMessages = vehicles.map(v => ({
                id: v.id,
                licensePlate: v.licensePlate,
                brand: v.brand,
                currentSpeed: v.currentSpeed,
                status: v.status
            }));
            
            this.logger.info(`📤 A responder gRPC com ${vehicleMessages.length} veículos.`, correlationId);
            callback(null, { vehicles: vehicleMessages });
        } catch (error) {
            this.logger.error(`Erro na execução gRPC 'GetVehicles': ${error.message}`, correlationId);
            callback({
                code: grpc.status.INTERNAL,
                details: error.message
            });
        }
    }
}

module.exports = GrpcServer;
