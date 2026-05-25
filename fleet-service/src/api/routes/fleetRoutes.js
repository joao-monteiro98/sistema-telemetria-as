// fleet-service/src/api/routes/fleetRoutes.js

const express = require('express');

module.exports = (fleetService, authService) => {
    const router = express.Router();

    // Middleware de Autenticação
    const requireAuth = (req, res, next) => {
        const token = req.headers['authorization'];
        if (!token || !authService.validateToken(token)) {
            return res.status(401).json({ error: "Acesso não autorizado. Token inválido." });
        }
        next();
    };

    // POST: Registar um novo veículo
    router.post('/', requireAuth, async (req, res) => {
        try {
            const vehicle = await fleetService.registerVehicle(req.body, req.correlationId);
            res.status(201).json(vehicle);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // GET: Listar todos os veículos
    router.get('/', requireAuth, async (req, res) => {
        try {
            const vehicles = await fleetService.listAllVehicles();
            res.status(200).json(vehicles);
        } catch (error) {
            res.status(500).json({ error: "Erro interno do servidor." });
        }
    });

    // GET: Obter detalhes de um veículo
    router.get('/:id', requireAuth, async (req, res) => {
        try {
            const vehicle = await fleetService.getVehicleDetails(req.params.id);
            if (!vehicle) {
                return res.status(404).json({ error: "Veículo não encontrado." });
            }
            res.status(200).json(vehicle);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // PUT: Atualizar um veículo existente
    router.put('/:id', requireAuth, async (req, res) => {
        try {
            const vehicle = await fleetService.updateVehicle(req.params.id, req.body, req.correlationId);
            if (!vehicle) {
                return res.status(404).json({ error: "Veículo não encontrado." });
            }
            res.status(200).json(vehicle);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    });

    // DELETE: Remover um veículo
    router.delete('/:id', requireAuth, async (req, res) => {
        try {
            const deleted = await fleetService.deleteVehicle(req.params.id, req.correlationId);
            if (!deleted) {
                return res.status(404).json({ error: "Veículo não encontrado." });
            }
            res.status(200).json({ message: "Veículo removido com sucesso." });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
