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

    async updateVehicle(id, vehicleData, correlationId) {
        const existing = await this.vehicleRepository.findById(id);
        if (!existing) {
            this.logger.error(`Tentativa de atualizar veículo inexistente: ${id}`, correlationId);
            return null;
        }

        const updatedVehicle = new Vehicle({
            id: existing.id,
            licensePlate: vehicleData.licensePlate !== undefined ? vehicleData.licensePlate : existing.licensePlate,
            brand: vehicleData.brand !== undefined ? vehicleData.brand : existing.brand,
            currentSpeed: vehicleData.currentSpeed !== undefined ? vehicleData.currentSpeed : existing.currentSpeed,
            status: vehicleData.status !== undefined ? vehicleData.status : existing.status
        });

        const saved = await this.vehicleRepository.update(updatedVehicle);
        this.logger.info(`🚗 Veículo ${id} atualizado na base de dados.`, correlationId);

        this.eventBus.publish('VehicleUpdated', {
            id: saved.id,
            licensePlate: saved.licensePlate,
            brand: saved.brand,
            currentSpeed: saved.currentSpeed,
            status: saved.status
        }, correlationId);

        return saved;
    }

    async deleteVehicle(id, correlationId) {
        const deleted = await this.vehicleRepository.delete(id);
        if (!deleted) {
            this.logger.error(`Tentativa de remover veículo inexistente: ${id}`, correlationId);
            return null;
        }

        this.logger.info(`🚗 Veículo ${id} removido da base de dados.`, correlationId);

        this.eventBus.publish('VehicleDeleted', { id }, correlationId);

        return deleted;
    }
}

module.exports = FleetService;
