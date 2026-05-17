// report-service/src/core/ports/IJobQueue.js

class IJobQueue {
    async add(jobName, payload, correlationId) {
        throw new Error("Método 'add' não implementado.");
    }
    async process(jobName, handler) {
        throw new Error("Método 'process' não implementado.");
    }
}

module.exports = IJobQueue;
