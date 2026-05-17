// report-service/src/infrastructure/queue/InMemoryDLQ.js

const IDLQ = require('../../core/ports/IDLQ');

class InMemoryDLQ extends IDLQ {
    constructor(logger) {
        super();
        this.deadMessages = [];
        this.logger = logger;
    }

    push(jobId, payload, error, correlationId) {
        const deadMessage = {
            jobId,
            payload,
            error,
            correlationId,
            failedAt: new Date().toISOString()
        };

        this.deadMessages.push(deadMessage);
        
        this.logger.error(`[DLQ] Mensagem movida para a Dead-Letter Queue. JobID: ${jobId}`, correlationId);
    }

    getAll() {
        return this.deadMessages;
    }
}

module.exports = InMemoryDLQ;
