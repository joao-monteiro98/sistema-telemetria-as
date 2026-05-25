// notification-service/src/infrastructure/logging/ConsoleLogger.js

const ILogger = require('../../core/ports/ILogger');

class ConsoleLogger extends ILogger {
    constructor() {
        super();
        this.listeners = [];
    }

    onLog(callback) {
        this.listeners.push(callback);
    }

    _format(level, message, correlationId) {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [CorrelationID: ${correlationId}] ${message}`;
    }

    info(message, correlationId = 'N/A') {
        const formatted = this._format('INFO', message, correlationId);
        console.info(formatted);
        this.listeners.forEach(cb => cb({ level: 'INFO', message, correlationId, formatted }));
    }

    error(message, correlationId = 'N/A', errorObj = null) {
        let formatted = this._format('ERROR', message, correlationId);
        if (errorObj && errorObj.stack) {
            formatted += `\nStack Trace: ${errorObj.stack}`;
        }
        console.error(formatted);
        this.listeners.forEach(cb => cb({ level: 'ERROR', message, correlationId, formatted }));
    }
}

module.exports = ConsoleLogger;
