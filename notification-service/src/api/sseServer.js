// notification-service/src/api/sseServer.js

const http = require('http');

class SseServer {
    constructor(logger, port = 3003) {
        this.logger = logger;
        this.port = port;
        this.clients = [];
    }

    start() {
        const server = http.createServer((req, res) => {
            // Habilitar CORS
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            if (req.method === 'OPTIONS') {
                res.writeHead(200);
                res.end();
                return;
            }

            if (req.url === '/api/notifications/stream') {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                });

                // Enviar uma mensagem inicial para confirmar a conexão
                res.write(`data: ${JSON.stringify({ type: 'system', message: 'Conectado ao Stream de Eventos em Tempo Real.' })}\n\n`);

                this.clients.push(res);

                // Remover o cliente quando desligado
                req.on('close', () => {
                    this.clients = this.clients.filter(c => c !== res);
                });
            } else {
                res.writeHead(404);
                res.end('Not Found');
            }
        });

        server.listen(this.port, () => {
            this.logger.info(`Servidor SSE de Notificações a correr na porta ${this.port}`, 'SSE_SERVER');
        });

        // Registar o callback para ouvir os logs e reencaminhá-los por SSE
        if (typeof this.logger.onLog === 'function') {
            this.logger.onLog((logData) => {
                this.broadcast(logData);
            });
        }
    }

    broadcast(data) {
        const payload = `data: ${JSON.stringify(data)}\n\n`;
        this.clients.forEach(client => {
            client.write(payload);
        });
    }
}

module.exports = SseServer;
