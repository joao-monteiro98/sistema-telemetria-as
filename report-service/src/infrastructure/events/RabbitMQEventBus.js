// report-service/src/infrastructure/events/RabbitMQEventBus.js

const IEventBus = require('../../core/ports/IEventBus');
const amqp = require('amqplib');

class RabbitMQEventBus extends IEventBus {
    constructor(logger, serviceName) {
        super();
        this.logger = logger;
        this.serviceName = serviceName;
        this.connection = null;
        this.channel = null;
        this.exchangeName = 'events_exchange';
        this.rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
    }

    async init() {
        let retries = 5;
        while (retries > 0) {
            try {
                this.logger.info(`A ligar ao RabbitMQ em ${this.rabbitmqUrl}...`, 'RABBITMQ');
                this.connection = await amqp.connect(this.rabbitmqUrl);
                this.channel = await this.connection.createChannel();
                
                await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
                this.logger.info('Ligado ao RabbitMQ e Exchange criada com sucesso!', 'RABBITMQ');
                break;
            } catch (err) {
                this.logger.error(`Falha ao ligar ao RabbitMQ. Tentativas restantes: ${retries - 1}. Erro: ${err.message}`, 'RABBITMQ');
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    publish(eventName, payload, correlationId = 'N/A') {
        if (!this.channel) {
            this.logger.error(`Não foi possível publicar '${eventName}': canal RabbitMQ inativo.`, correlationId);
            return;
        }

        const message = { payload, correlationId };
        const buffer = Buffer.from(JSON.stringify(message));
        
        this.channel.publish(this.exchangeName, eventName, buffer, { persistent: true });
    }

    async subscribe(eventName, handler) {
        if (!this.channel) {
            throw new Error("RabbitMQEventBus não inicializado.");
        }

        const queueName = `${this.serviceName}_${eventName}_queue`;
        await this.channel.assertQueue(queueName, { durable: true });
        await this.channel.bindQueue(queueName, this.exchangeName, eventName);

        this.channel.consume(queueName, async (msg) => {
            if (msg !== null) {
                let content;
                try {
                    content = JSON.parse(msg.content.toString());
                    await handler(content);
                    this.channel.ack(msg);
                } catch (error) {
                    const corrId = content ? content.correlationId : 'N/A';
                    this.logger.error(`Erro ao processar mensagem do evento '${eventName}': ${error.message}`, corrId, error);
                    this.channel.nack(msg, false, false);
                }
            }
        });
        
        this.logger.info(`Subscrito ao evento '${eventName}' (fila: ${queueName})`, 'RABBITMQ');
    }
}

module.exports = RabbitMQEventBus;
