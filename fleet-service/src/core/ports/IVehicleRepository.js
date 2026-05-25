// fleet-service/src/core/ports/IVehicleRepository.js

class IVehicleRepository {
    async save(vehicle) {
        throw new Error("O método 'save' tem de ser implementado.");
    }

    async findById(id) {
        throw new Error("O método 'findById' tem de ser implementado.");
    }

    async findAll() {
        throw new Error("O método 'findAll' tem de ser implementado.");
    }

    async updateStatus(id, status) {
        throw new Error("O método 'updateStatus' tem de ser implementado.");
    }

    async update(vehicle) {
        throw new Error("O método 'update' tem de ser implementado.");
    }

    async delete(id) {
        throw new Error("O método 'delete' tem de ser implementado.");
    }
}

module.exports = IVehicleRepository;
