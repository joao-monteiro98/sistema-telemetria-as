// report-service/src/core/ports/IJobStore.js

class IJobStore {
    async save(jobId, status, correlationId) {
        throw new Error("Método 'save' não implementado.");
    }
    async get(jobId) {
        throw new Error("Método 'get' não implementado.");
    }
    async updateStatus(jobId, status, result = null) {
        throw new Error("Método 'updateStatus' não implementado.");
    }
}

module.exports = IJobStore;
