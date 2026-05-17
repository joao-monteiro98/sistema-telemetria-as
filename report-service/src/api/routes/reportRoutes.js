// report-service/src/api/routes/reportRoutes.js

const express = require('express');

module.exports = (jobQueue, jobStore) => {
    const router = express.Router();
    
    // POST: Iniciar a criação do relatório assíncrono
    router.post('/generate', async (req, res) => {
        const payload = req.body;
        const correlationId = req.correlationId;

        try {
            // 1. Põe na fila
            const jobId = await jobQueue.add('GERAR_RELATORIO', payload, correlationId);
            
            // 2. Guarda o estado inicial na base de dados
            await jobStore.save(jobId, 'PENDING', correlationId);

            // 3. Devolve 202 Accepted imediatamente
            res.status(202).json({ 
                message: "Relatório em processamento.", 
                jobId: jobId 
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // GET: Fazer Polling do estado do Job
    router.get('/:jobId', async (req, res) => {
        try {
            const job = await jobStore.get(req.params.jobId);
            if (!job) {
                return res.status(404).json({ error: "Job não encontrado." });
            }
            res.status(200).json(job);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
