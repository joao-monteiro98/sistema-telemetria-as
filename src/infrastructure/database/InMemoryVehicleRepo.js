// src/infrastructure/database/InMemoryVehicleRepo.js

// Importamos o contrato do Core
const IVehicleRepository = require('../../core/ports/IVehicleRepository');

class InMemoryVehicleRepo extends IVehicleRepository {
    constructor() {
        super();
        // Array simula a tabela da base de dados real
        this.vehicles = []; 
    }

    async save(vehicle) {
        this.vehicles.push(vehicle);
        return vehicle; // Devolve o objeto guardado
    }

    // método findById
    async findById(id) {
        return this.vehicles.find(v => v.id === id) || null;
    }

    // método findAll
    async findAll() {
        return this.vehicles;
    }

    async update(vehicle) {
        const index = this.vehicles.findIndex(v => v.id === vehicle.id);
        if (index === -1) return null;
        this.vehicles[index] = vehicle;
        return vehicle;
    }

    async delete(id) {
        const index = this.vehicles.findIndex(v => v.id === id);
        if (index === -1) return null;
        const deleted = this.vehicles[index];
        this.vehicles.splice(index, 1);
        return deleted;
    }

    async updateStatus(id, status) {
        const vehicle = this.vehicles.find(v => v.id === id);
        if (!vehicle) return null;
        vehicle.status = status;
        return vehicle;
    }
}

module.exports = InMemoryVehicleRepo;