// report-service/src/core/ports/IVehicleDataClient.js

class IVehicleDataClient {
    async getVehicles(correlationId) {
        throw new Error("O método 'getVehicles' tem de ser implementado.");
    }
}

module.exports = IVehicleDataClient;
