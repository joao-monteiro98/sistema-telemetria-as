// fleet-service/src/infrastructure/logging/ConsoleLogger.js

const ILogger = require('../../core/ports/ILogger');

class ConsoleLogger extends ILogger {
    
    // Formata a mensagem para garantir que o prefixo do Tracing está sempre presente
    _format(level, message, correlationId) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [CorrelationID: ${correlationId}] ${message}`;
    }

    info(message, correlationId = 'N/A') {
        console.info(this._format('INFO', message, correlationId));
    }

    error(message, correlationId = 'N/A', errorObj = null) {
        let fullMessage = this._format('ERROR', message, correlationId);
        if (errorObj && errorObj.stack) {
            fullMessage += `\nStack Trace: ${errorObj.stack}`;
        }
        console.error(fullMessage);
    }
}

module.exports = ConsoleLogger;
