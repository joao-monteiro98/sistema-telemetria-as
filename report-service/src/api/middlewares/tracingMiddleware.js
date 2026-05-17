// report-service/src/api/middlewares/tracingMiddleware.js

const crypto = require('crypto');

const tracingMiddleware = (req, res, next) => {
    // Lê dos headers ou cria um novo se não existir
    const correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    
    // Injeta no request para os controladores usarem
    req.correlationId = correlationId;
    
    // Devolve no response para o cliente saber qual é o seu ID de rastreio
    res.setHeader('x-correlation-id', correlationId);
    
    console.log(`[CorrelationID: ${correlationId}] 📥 Recebido pedido: ${req.method} ${req.url}`);
    next();
};

module.exports = tracingMiddleware;
