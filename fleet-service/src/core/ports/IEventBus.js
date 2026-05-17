// fleet-service/src/core/ports/IEventBus.js

class IEventBus {
    // Publica um evento no barramento
    publish(eventName, payload, correlationId) {
        throw new Error("Método 'publish' não implementado.");
    }

    // Subscreve um evento específico
    subscribe(eventName, handler) {
        throw new Error("Método 'subscribe' não implementado.");
    }
}

module.exports = IEventBus;
