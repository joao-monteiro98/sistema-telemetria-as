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

    return router;
};
