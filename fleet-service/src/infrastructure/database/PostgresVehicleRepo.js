// fleet-service/src/infrastructure/database/PostgresVehicleRepo.js

const IVehicleRepository = require('../../core/ports/IVehicleRepository');
const Vehicle = require('../../core/domain/Vehicle');
const { Pool } = require('pg');

class PostgresVehicleRepo extends IVehicleRepository {
    constructor(logger) {
        super();
        this.logger = logger;
        
        const connectionString = process.env.DATABASE_URL || 'postgresql://fleet_user:fleet_pass@fleet-db:5432/fleet_db';
        this.pool = new Pool({ connectionString });
        
        this.pool.on('error', (err) => {
            this.logger.error('Erro inesperado no cliente PostgreSQL', 'DATABASE', err);
        });
    }

    // Inicializa a tabela no arranque da aplicação
    async init() {
        let retries = 5;
        while (retries > 0) {
            try {
                this.logger.info('A ligar à base de dados PostgreSQL e a inicializar tabelas...', 'DATABASE');
                await this.pool.query(`
                    CREATE TABLE IF NOT EXISTS vehicles (
                        id VARCHAR(50) PRIMARY KEY,
                        license_plate VARCHAR(20) UNIQUE NOT NULL,
                        brand VARCHAR(50),
                        current_speed INT DEFAULT 0,
                        status VARCHAR(20) DEFAULT 'PENDING'
                    );
                `);
                this.logger.info('Tabela de veículos inicializada com sucesso!', 'DATABASE');
                break;
            } catch (err) {
                this.logger.error(`Falha ao ligar ao PostgreSQL. Tentativas restantes: ${retries - 1}. Erro: ${err.message}`, 'DATABASE');
                retries--;
                if (retries === 0) throw err;
                await new Promise(resolve => setTimeout(resolve, 5000)); // Aguarda 5 segundos
            }
        }
    }

    async save(vehicle) {
        const query = `
            INSERT INTO vehicles (id, license_plate, brand, current_speed, status)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) 
            DO UPDATE SET 
                license_plate = EXCLUDED.license_plate,
                brand = EXCLUDED.brand,
                current_speed = EXCLUDED.current_speed,
                status = EXCLUDED.status
            RETURNING *;
        `;
        const values = [
            vehicle.id,
            vehicle.licensePlate,
            vehicle.brand,
            vehicle.currentSpeed,
            vehicle.status
        ];

        const res = await this.pool.query(query, values);
        const row = res.rows[0];
        
        return new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        });
    }

    async findById(id) {
        const res = await this.pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
        if (res.rows.length === 0) return null;
        
        const row = res.rows[0];
        return new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        });
    }

    async findAll() {
        const res = await this.pool.query('SELECT * FROM vehicles');
        return res.rows.map(row => new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        }));
    }

    async updateStatus(id, status) {
        const res = await this.pool.query(
            'UPDATE vehicles SET status = $2 WHERE id = $1 RETURNING *',
            [id, status]
        );
        if (res.rows.length === 0) return null;
        
        const row = res.rows[0];
        return new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        });
    }

    async update(vehicle) {
        const query = `
            UPDATE vehicles 
            SET license_plate = $2, brand = $3, current_speed = $4, status = $5
            WHERE id = $1
            RETURNING *;
        `;
        const values = [
            vehicle.id,
            vehicle.licensePlate,
            vehicle.brand,
            vehicle.currentSpeed,
            vehicle.status
        ];

        const res = await this.pool.query(query, values);
        if (res.rows.length === 0) return null;
        
        const row = res.rows[0];
        return new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        });
    }

    async delete(id) {
        const res = await this.pool.query('DELETE FROM vehicles WHERE id = $1 RETURNING *', [id]);
        if (res.rows.length === 0) return null;
        
        const row = res.rows[0];
        return new Vehicle({
            id: row.id,
            licensePlate: row.license_plate,
            brand: row.brand,
            currentSpeed: row.current_speed,
            status: row.status
        });
    }
}

module.exports = PostgresVehicleRepo;
