// report-service/src/core/ports/ILogger.js

class ILogger {
    info(message, correlationId = 'N/A') {
        throw new Error("Método 'info' não implementado.");
    }

    error(message, correlationId = 'N/A', errorObj = null) {
        throw new Error("Método 'error' não implementado.");
    }
}

module.exports = ILogger;
