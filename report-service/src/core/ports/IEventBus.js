// report-service/src/core/ports/IEventBus.js

class IEventBus {
    publish(eventName, payload, correlationId) {
        throw new Error("Método 'publish' não implementado.");
    }

    subscribe(eventName, handler) {
        throw new Error("Método 'subscribe' não implementado.");
    }
}

module.exports = IEventBus;
