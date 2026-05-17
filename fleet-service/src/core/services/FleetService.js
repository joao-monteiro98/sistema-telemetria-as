// fleet-service/src/core/services/FleetService.js

const Vehicle = require('../domain/Vehicle');

class FleetService {
    constructor(vehicleRepository, eventBus, logger) {
        this.vehicleRepository = vehicleRepository;
        this.eventBus = eventBus;
        this.logger = logger;
    }

    async registerVehicle(vehicleData, correlationId) {
        // 1. Criar o veículo com status PENDING
        const vehicle = new Vehicle({ ...vehicleData, status: 'PENDING' });

        // 2. Guardar na base de dados
        const savedVehicle = await this.vehicleRepository.save(vehicle);
        this.logger.info(`🚗 Veículo ${savedVehicle.id} registado como PENDING na base de dados.`, correlationId);

        // 3. Publicar evento assíncrono de criação
        this.eventBus.publish('VehicleCreated', {
            id: savedVehicle.id,
            licensePlate: savedVehicle.licensePlate,
            brand: savedVehicle.brand,
            currentSpeed: savedVehicle.currentSpeed,
            status: savedVehicle.status
        }, correlationId);
        
        this.logger.info(`📤 Evento 'VehicleCreated' publicado para o veículo ${savedVehicle.id}.`, correlationId);

        return savedVehicle;
    }

    async getVehicleDetails(id) {
        return await this.vehicleRepository.findById(id);
    }
    
    async listAllVehicles() {
        return await this.vehicleRepository.findAll();
    }

    async handleVehicleSetupCompleted(vehicleId, correlationId) {
        this.logger.info(`🔄 Saga Commit: Veículo ${vehicleId} configurado com sucesso. Atualizar para ACTIVE.`, correlationId);
        await this.vehicleRepository.updateStatus(vehicleId, 'ACTIVE');
    }

    async handleVehicleSetupFailed(vehicleId, errorMsg, correlationId) {
        this.logger.error(`🔄 Saga Rollback: Falha na configuração do veículo ${vehicleId}. Motivo: ${errorMsg}. Atualizar para CANCELLED.`, correlationId);
        await this.vehicleRepository.updateStatus(vehicleId, 'CANCELLED');
    }
}

module.exports = FleetService;
