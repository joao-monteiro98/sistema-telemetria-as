// report-service/src/core/ports/IDLQ.js

class IDLQ {
    push(jobId, payload, error, correlationId) {
        throw new Error("Método 'push' não implementado.");
    }

    getAll() {
        throw new Error("Método 'getAll' não implementado.");
    }
}

module.exports = IDLQ;
