// report-service/src/infrastructure/database/MongoJobStore.js

const IJobStore = require('../../core/ports/IJobStore');
const { MongoClient } = require('mongodb');

class MongoJobStore extends IJobStore {
    constructor(logger) {
        super();
        this.logger = logger;
        this.uri = process.env.MONGODB_URI || 'mongodb://report-db:27017/report_db';
        this.client = null;
        this.db = null;
        this.jobsCollection = null;
    }

    async init() {
        let retries = 5;
        while (retries > 0) {
            try {
                this.logger.info(`A ligar à base de dados MongoDB em ${this.uri}...`, 'DATABASE');
                this.client = await MongoClient.connect(this.uri);
                this.db = this.client.db();
                this.jobsCollection = this.db.collection('jobs');
                this.logger.info('Ligado ao MongoDB e coleção de jobs inicializada!', 'DATABASE');
                break;
            } catch (err) {
                this.logger.error(`Falha ao ligar ao MongoDB. Tentativas restantes: ${retries - 1}. Erro: ${err.message}`, 'DATABASE');
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }

    async save(jobId, status, correlationId) {
        if (!this.jobsCollection) throw new Error("MongoJobStore não inicializado.");
        
        await this.jobsCollection.insertOne({
            _id: jobId,
            status,
            correlationId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            result: null
        });
    }

    async get(jobId) {
        if (!this.jobsCollection) throw new Error("MongoJobStore não inicializado.");
        
        const doc = await this.jobsCollection.findOne({ _id: jobId });
        if (!doc) return null;
        
        return {
            id: doc._id,
            status: doc.status,
            correlationId: doc.correlationId,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
            result: doc.result
        };
    }

    async updateStatus(jobId, status, result = null) {
        if (!this.jobsCollection) throw new Error("MongoJobStore não inicializado.");
        
        const updateDoc = {
            $set: {
                status,
                updatedAt: new Date().toISOString()
            }
        };
        
        if (result !== null) {
            updateDoc.$set.result = result;
        }

        await this.jobsCollection.updateOne({ _id: jobId }, updateDoc);
    }
}

module.exports = MongoJobStore;
