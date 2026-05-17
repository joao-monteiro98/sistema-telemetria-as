// report-service/src/infrastructure/queue/InMemoryJobQueue.js

const IJobQueue = require('../../core/ports/IJobQueue');
const crypto = require('crypto');

class InMemoryJobQueue extends IJobQueue {
    constructor() {
        super();
        this.handlers = {};
    }

    async add(jobName, payload, correlationId) {
        const jobId = crypto.randomUUID();
        const job = { id: jobId, name: jobName, payload, correlationId };

        // Simulamos o comportamento de uma fila real.
        // setImmediate garante que o processamento sai do ciclo atual (Event Loop).
        setImmediate(() => {
            if (this.handlers[jobName]) {
                this.handlers[jobName](job); // Entrega o job ao Worker em background
            }
        });

        return jobId;
    }

    async process(jobName, handler) {
        this.handlers[jobName] = handler; // Regista o Worker que vai ouvir esta fila
    }
}

module.exports = InMemoryJobQueue;
