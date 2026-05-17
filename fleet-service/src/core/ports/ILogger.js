// fleet-service/src/core/ports/ILogger.js

class ILogger {
    // Regista uma mensagem informativa
    info(message, correlationId = 'N/A') {
        throw new Error("Método 'info' não implementado.");
    }

    // Regista uma mensagem de erro
    error(message, correlationId = 'N/A', errorObj = null) {
        throw new Error("Método 'error' não implementado.");
    }
}

module.exports = ILogger;
