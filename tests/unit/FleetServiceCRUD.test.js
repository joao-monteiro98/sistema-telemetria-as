// tests/unit/FleetServiceCRUD.test.js

const FleetService = require('../../fleet-service/src/core/services/FleetService');
const InMemoryVehicleRepo = require('../../src/infrastructure/database/InMemoryVehicleRepo');

describe('FleetService CRUD - Testes Unitários', () => {
    let fleetService;
    let mockRepo;
    let mockEventBus;
    let mockLogger;

    beforeEach(() => {
        mockRepo = new InMemoryVehicleRepo();
        
        // Mock do EventBus para capturar publicações
        mockEventBus = {
            publish: jest.fn(),
            subscribe: jest.fn()
        };

        // Mock do Logger
        mockLogger = {
            info: jest.fn(),
            error: jest.fn()
        };

        fleetService = new FleetService(mockRepo, mockEventBus, mockLogger);
    });

    test('Deve atualizar um veículo existente com sucesso', async () => {
        // Registar primeiro
        const originalVehicle = {
            id: 'v123',
            licensePlate: 'AA-11-BB',
            brand: 'Renault',
            currentSpeed: 50,
            status: 'ACTIVE'
        };
        await mockRepo.save(originalVehicle);

        // Atualizar
        const updateData = {
            licensePlate: 'AA-11-CC',
            brand: 'Renault Nova',
            currentSpeed: 70
        };

        const result = await fleetService.updateVehicle('v123', updateData, 'corr-123');

        expect(result.licensePlate).toBe('AA-11-CC');
        expect(result.brand).toBe('Renault Nova');
        expect(result.currentSpeed).toBe(70);

        // Verificar se foi salvo no repo
        const saved = await mockRepo.findById('v123');
        expect(saved.licensePlate).toBe('AA-11-CC');

        // Verificar se publicou o evento
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            'VehicleUpdated',
            expect.objectContaining({ id: 'v123', licensePlate: 'AA-11-CC' }),
            'corr-123'
        );
    });

    test('Deve falhar ao atualizar um veículo inexistente', async () => {
        const result = await fleetService.updateVehicle('v-none', { brand: 'Tesla' }, 'corr-123');
        expect(result).toBeNull();
        expect(mockLogger.error).toHaveBeenCalled();
    });

    test('Deve impedir velocidade negativa na atualização', async () => {
        const originalVehicle = {
            id: 'v123',
            licensePlate: 'AA-11-BB',
            brand: 'Renault',
            currentSpeed: 50,
            status: 'ACTIVE'
        };
        await mockRepo.save(originalVehicle);

        await expect(fleetService.updateVehicle('v123', { currentSpeed: -10 }, 'corr-123'))
            .rejects
            .toThrow("A velocidade do veículo não pode ser negativa.");
    });

    test('Deve remover um veículo com sucesso', async () => {
        const vehicle = {
            id: 'v123',
            licensePlate: 'AA-11-BB',
            brand: 'Renault',
            currentSpeed: 50,
            status: 'ACTIVE'
        };
        await mockRepo.save(vehicle);

        const result = await fleetService.deleteVehicle('v123', 'corr-123');
        expect(result.id).toBe('v123');

        // Verificar que não existe no repo
        const saved = await mockRepo.findById('v123');
        expect(saved).toBeNull();

        // Verificar evento publicado
        expect(mockEventBus.publish).toHaveBeenCalledWith(
            'VehicleDeleted',
            { id: 'v123' },
            'corr-123'
        );
    });

    test('Deve falhar ao remover um veículo inexistente', async () => {
        const result = await fleetService.deleteVehicle('v-none', 'corr-123');
        expect(result).toBeNull();
    });
});
