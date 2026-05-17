// report-service/src/infrastructure/grpc/GrpcVehicleClient.js

const IVehicleDataClient = require('../../core/ports/IVehicleDataClient');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const CircuitBreaker = require('opossum');

class GrpcVehicleClient extends IVehicleDataClient {
    constructor(logger) {
        super();
        this.logger = logger;
        this.grpcHost = process.env.FLEET_GRPC_HOST || 'fleet-service:50051';
        this.client = null;
        
        // Opções de configuração do Circuit Breaker
        const breakerOptions = {
            timeout: 3000,                // 3 segundos de timeout para a chamada gRPC
            errorThresholdPercentage: 50,  // Abre o circuito se 50% das chamadas falharem
            resetTimeout: 10000            // Aguarda 10 segundos antes de passar a half-open
        };

        this.breaker = new CircuitBreaker(this._makeGrpcCall.bind(this), breakerOptions);
        
        // Registar listeners de monitorização do Circuit Breaker (fundamental para a defesa da POC)
        this.breaker.on('open', () => {
            this.logger.error('🚨 [Circuit Breaker] O circuito abriu! As chamadas ao FleetService gRPC estão bloqueadas temporariamente.', 'CIRCUIT_BREAKER');
        });
        
        this.breaker.on('halfOpen', () => {
            this.logger.info('⏳ [Circuit Breaker] O circuito está HALF-OPEN. A testar ligação gRPC com o FleetService...', 'CIRCUIT_BREAKER');
        });
        
        this.breaker.on('close', () => {
            this.logger.info('🟢 [Circuit Breaker] O circuito fechou! O FleetService está recuperado e operacional.', 'CIRCUIT_BREAKER');
        });

        // Configuração de Fallback do Circuit Breaker
        this.breaker.fallback((err) => {
            throw new Error(`Serviço de Frota indisponível (Circuit Breaker Ativo). Detalhe: ${err.message}`);
        });
    }

    init() {
        const protoPath = path.join(__dirname, 'fleet.proto');
        const packageDefinition = protoLoader.loadSync(protoPath, {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true
        });
        const fleetProto = grpc.loadPackageDefinition(packageDefinition).fleet;
        
        this.client = new fleetProto.VehicleService(
            this.grpcHost,
            grpc.credentials.createInsecure()
        );
        this.logger.info(`Cliente gRPC inicializado. Destino: ${this.grpcHost}`, 'GRPC_CLIENT');
    }

    async getVehicles(correlationId) {
        if (!this.client) {
            throw new Error("GrpcVehicleClient não inicializado.");
        }
        
        // Dispara a chamada encapsulada pelo Circuit Breaker
        return await this.breaker.fire(correlationId);
    }

    // Função interna que efetua a chamada gRPC real
    _makeGrpcCall(correlationId) {
        return new Promise((resolve, reject) => {
            this.client.getVehicles({ correlationId }, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(response.vehicles || []);
                }
            });
        });
    }
}

module.exports = GrpcVehicleClient;
