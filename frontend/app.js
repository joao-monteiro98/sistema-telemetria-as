// Configuração de Portas e Endpoints dos Microserviços
const FLEET_API = 'http://localhost:3001/api/vehicles';
const REPORT_API = 'http://localhost:3002/api/reports';
const SSE_STREAM = 'http://localhost:3003/api/notifications/stream';
const AUTH_TOKEN = 'super-secret-token-fase1';

// Cabeçalhos HTTP comuns
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': AUTH_TOKEN
});

// Estado global da aplicação (em memória)
let state = {
    vehicles: [],
    jobs: {}, // jobId -> job details
    sagaErrorsCount: 0,
    generatedReportsCount: 0
};

// Elementos do DOM
const DOM = {
    navButtons: document.querySelectorAll('.nav-btn'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    vehiclesGrid: document.getElementById('vehicles-grid'),
    btnOpenAddModal: document.getElementById('btn-open-add-modal'),
    vehicleModal: document.getElementById('vehicle-modal'),
    btnCloseModal: document.getElementById('btn-close-modal'),
    btnCancelModal: document.getElementById('btn-cancel-modal'),
    vehicleForm: document.getElementById('vehicle-form'),
    modalTitle: document.getElementById('modal-title'),
    
    // Inputs do formulário
    vehicleIdInput: document.getElementById('vehicle-id'),
    vehiclePlateInput: document.getElementById('vehicle-plate'),
    vehicleBrandInput: document.getElementById('vehicle-brand'),
    vehicleSpeedInput: document.getElementById('vehicle-speed'),
    
    // Select de veículo para relatórios
    reportVehicleSelect: document.getElementById('report-vehicle-select'),
    btnTriggerReport: document.getElementById('btn-trigger-report'),
    jobsTableBody: document.getElementById('jobs-table-body'),
    
    // Terminal de logs
    terminalBody: document.getElementById('terminal-body'),
    btnClearLogs: document.getElementById('btn-clear-logs'),
    
    // Status de conexão
    statusFleet: document.getElementById('status-fleet'),
    statusReports: document.getElementById('status-reports'),
    statusEvents: document.getElementById('status-events'),
    
    // Contadores estatísticos
    statTotalVehicles: document.getElementById('stat-total-vehicles'),
    statActiveVehicles: document.getElementById('stat-active-vehicles'),
    statTotalReports: document.getElementById('stat-total-reports'),
    statSagaErrors: document.getElementById('stat-saga-errors')
};

// Variável para controlo de Edição
let editingVehicleId = null;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    setupTabNavigation();
    setupEventHandlers();
    setupSSEStream();
    
    // Carregar dados iniciais e correr health checks
    refreshData();
    setInterval(refreshData, 5000); // Atualiza os dados a cada 5 segundos
});

// 1. Navegação por Separadores (Tabs)
function setupTabNavigation() {
    DOM.navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            DOM.navButtons.forEach(b => b.classList.remove('active'));
            DOM.tabPanels.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// 2. Registar Event Handlers principais
function setupEventHandlers() {
    // Abertura do Modal de Adicionar
    DOM.btnOpenAddModal.addEventListener('click', () => {
        editingVehicleId = null;
        DOM.modalTitle.innerText = "Registar Veículo na Frota";
        DOM.vehicleIdInput.disabled = false;
        DOM.vehicleForm.reset();
        DOM.vehicleModal.classList.add('open');
    });

    // Fecho do Modal
    const closeModal = () => {
        DOM.vehicleModal.classList.remove('open');
        editingVehicleId = null;
    };
    DOM.btnCloseModal.addEventListener('click', closeModal);
    DOM.btnCancelModal.addEventListener('click', closeModal);

    // Submissão do Formulário (Salvar ou Editar)
    DOM.vehicleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const vehicleData = {
            id: DOM.vehicleIdInput.value.trim(),
            licensePlate: DOM.vehiclePlateInput.value.trim(),
            brand: DOM.vehicleBrandInput.value.trim(),
            currentSpeed: parseInt(DOM.vehicleSpeedInput.value, 10)
        };

        try {
            if (editingVehicleId) {
                // Editar (PUT)
                const res = await fetch(`${FLEET_API}/${editingVehicleId}`, {
                    method: 'PUT',
                    headers: getHeaders(),
                    body: JSON.stringify(vehicleData)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Falha ao atualizar o veículo.");
                }
                appendLog('INFO', `Veículo '${editingVehicleId}' atualizado via REST API com sucesso.`, 'REST_API');
            } else {
                // Criar (POST)
                const res = await fetch(FLEET_API, {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify(vehicleData)
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Falha ao criar o veículo.");
                }
                appendLog('INFO', `Veículo '${vehicleData.id}' registado via REST API. Status inicial: PENDING.`, 'REST_API');
            }
            
            closeModal();
            refreshData();
        } catch (error) {
            alert(`Erro: ${error.message}`);
            appendLog('ERROR', `Erro na submissão de veículo: ${error.message}`, 'API_ERROR');
        }
    });

    // Solicitar criação de relatório
    DOM.btnTriggerReport.addEventListener('click', async () => {
        const vehicleId = DOM.reportVehicleSelect.value;
        if (!vehicleId) {
            alert("Selecione um veículo válido para gerar o relatório.");
            return;
        }

        DOM.btnTriggerReport.disabled = true;
        DOM.btnTriggerReport.innerHTML = `<span class="spinner"></span> A processar...`;

        try {
            const res = await fetch(`${REPORT_API}/generate`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ vehicleId })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Falha ao submeter job.");
            }

            const data = await res.json();
            appendLog('INFO', `Job de relatório gerado: ID ${data.jobId} (Web-Queue-Worker).`, 'REPORT_SERVICE');
            
            // Adicionar job ao estado e iniciar polling
            state.jobs[data.jobId] = {
                id: data.jobId,
                vehicleId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'PENDING'
            };
            
            renderJobsTable();
            startPollingJob(data.jobId);
        } catch (error) {
            alert(`Erro ao solicitar relatório: ${error.message}`);
        } finally {
            DOM.btnTriggerReport.disabled = false;
            DOM.btnTriggerReport.innerText = "Gerar Relatório";
        }
    });

    // Limpar logs
    DOM.btnClearLogs.addEventListener('click', () => {
        DOM.terminalBody.innerHTML = '';
        appendLog('SYSTEM', 'Terminal limpo pelo utilizador.', 'CONSOLE');
    });
}

// 3. Subscrição do Canal SSE (Server-Sent Events) do Notification Service
function setupSSEStream() {
    appendLog('SYSTEM', 'A ligar ao servidor SSE de eventos em tempo real (Porta 3003)...', 'SSE_CLIENT');
    
    let eventSource;
    try {
        eventSource = new EventSource(SSE_STREAM);
        
        eventSource.onopen = () => {
            DOM.statusEvents.classList.add('online');
            appendLog('SUCCESS', 'Ligação SSE estabelecida! A ouvir o broker RabbitMQ em tempo real.', 'SSE_CLIENT');
        };

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // É uma mensagem de log retransmitida do microserviço
            if (data.formatted) {
                // Imprime a linha completa na consola de eventos
                appendLog(data.level, data.message, data.correlationId || 'BROKER');
                
                // Tratar estatísticas com base nos eventos e logs recebidos
                if (data.message.includes('Saga Rollback') || data.message.includes('Falha crítica')) {
                    state.sagaErrorsCount++;
                    DOM.statSagaErrors.innerText = state.sagaErrorsCount;
                }
                if (data.message.includes('Relatório gerado com sucesso')) {
                    state.generatedReportsCount++;
                    DOM.statTotalReports.innerText = state.generatedReportsCount;
                }
                
                // Força atualização da grid caso eventos modifiquem status
                if (data.message.includes('Saga Commit') || data.message.includes('Saga Rollback') || data.message.includes('removido')) {
                    setTimeout(refreshData, 500);
                }
            } else if (data.message) {
                // Mensagem de sistema da ligação SSE
                appendLog('SYSTEM', data.message, 'SSE_SYSTEM');
            }
        };

        eventSource.onerror = (err) => {
            DOM.statusEvents.classList.remove('online');
            appendLog('ERROR', 'Perda de ligação SSE com o Notification Service. Tentando reconectar...', 'SSE_CLIENT');
        };
    } catch (error) {
        appendLog('ERROR', `Falha ao iniciar EventSource SSE: ${error.message}`, 'SSE_ERROR');
    }
}

// 4. Polling dinâmico para os Jobs de Relatório
function startPollingJob(jobId) {
    const interval = setInterval(async () => {
        try {
            const res = await fetch(`${REPORT_API}/${jobId}`, {
                headers: getHeaders()
            });

            if (!res.ok) {
                clearInterval(interval);
                return;
            }

            const job = await res.json();
            state.jobs[jobId] = job;
            renderJobsTable();

            if (job.status === 'DONE' || job.status === 'FAILED') {
                clearInterval(interval);
                appendLog(
                    job.status === 'DONE' ? 'SUCCESS' : 'ERROR', 
                    `Job ${jobId} finalizado. Status: ${job.status}.`, 
                    job.correlationId || 'WQW'
                );
            }
        } catch (error) {
            console.error(`Erro no polling do job ${jobId}:`, error);
        }
    }, 1500); // Polling a cada 1.5s
}

// 5. Atualizar Dados da Frota (REST Calls & Healthcheck)
async function refreshData() {
    let fleetOnline = false;
    let reportsOnline = false;

    // A) Health Check & Listagem do Fleet Service
    try {
        const res = await fetch(FLEET_API, { headers: getHeaders() });
        if (res.ok) {
            state.vehicles = await res.json();
            fleetOnline = true;
            renderVehicles();
            updateStats();
        }
    } catch (e) {
        DOM.statusFleet.classList.remove('online');
    }
    
    if (fleetOnline) {
        DOM.statusFleet.classList.add('online');
    } else {
        DOM.statusFleet.classList.remove('online');
    }

    // B) Health Check do Report Service
    try {
        const res = await fetch(`${REPORT_API}/FAIL`, { headers: getHeaders() });
        // Qualquer resposta HTTP (mesmo 404 para fail) significa que o servidor está vivo na porta
        if (res.status !== 502 && res.status !== 504) {
            reportsOnline = true;
        }
    } catch (e) {
        DOM.statusReports.classList.remove('online');
    }

    if (reportsOnline) {
        DOM.statusReports.classList.add('online');
    } else {
        DOM.statusReports.classList.remove('online');
    }
}

// Renderizar lista de veículos na Grid
function renderVehicles() {
    DOM.vehiclesGrid.innerHTML = '';
    
    // Atualizar o select de relatórios
    const currentSelected = DOM.reportVehicleSelect.value;
    DOM.reportVehicleSelect.innerHTML = '<option value="">Selecione um veículo...</option><option value="FAIL">SIMULAR FALHA (Marca \'FAIL\')</option>';

    if (state.vehicles.length === 0) {
        DOM.vehiclesGrid.innerHTML = `
            <div class="empty-state">
                <p>Nenhum veículo registado no sistema. Clique no botão acima para adicionar.</p>
            </div>
        `;
        return;
    }

    state.vehicles.forEach(v => {
        // Adicionar opção ao select de relatórios (apenas se ativo ou pendente para simulações)
        const opt = document.createElement('option');
        opt.value = v.id;
        opt.innerText = `${v.id} (${v.licensePlate} - ${v.brand})`;
        DOM.reportVehicleSelect.appendChild(opt);

        // Criar o card do veículo
        const card = document.createElement('div');
        card.className = `vehicle-card status-${v.status.toLowerCase()}`;
        
        const speedPercent = Math.min((v.currentSpeed / 180) * 100, 100);
        let speedColor = 'var(--success)';
        if (v.currentSpeed > 120) speedColor = 'var(--danger)';
        else if (v.currentSpeed > 80) speedColor = 'var(--warning)';

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h4 class="vehicle-brand-name">${v.brand}</h4>
                    <span class="vehicle-plate-num">${v.licensePlate}</span>
                </div>
                <span class="badge badge-${v.status.toLowerCase()}">${v.status}</span>
            </div>
            
            <div class="speed-meter">
                <span class="speed-num">${v.currentSpeed} km/h</span>
                <div class="speed-gauge-bar">
                    <div class="speed-gauge-fill" style="width: ${speedPercent}%; background-color: ${speedColor};"></div>
                </div>
            </div>
            
            <div class="card-footer">
                <button class="btn btn-outline" onclick="openEditModal('${v.id}')" style="font-size: 12px; padding: 6px 12px;">Editar</button>
                <button class="btn btn-danger" onclick="deleteVehicle('${v.id}')" style="font-size: 12px; padding: 6px 12px;">Eliminar</button>
                <button class="btn btn-secondary btn-primary" onclick="requestReportDirectly('${v.id}')" style="margin-left: auto; font-size:12px; padding: 6px 12px;">Relatório</button>
            </div>
        `;
        DOM.vehiclesGrid.appendChild(card);
    });

    if (currentSelected) {
        DOM.reportVehicleSelect.value = currentSelected;
    }
}

// Renderizar Tabela de Jobs
function renderJobsTable() {
    const jobsArray = Object.values(state.jobs).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (jobsArray.length === 0) {
        DOM.jobsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">Nenhum job de relatório submetido.</td>
            </tr>
        `;
        return;
    }

    DOM.jobsTableBody.innerHTML = '';
    jobsArray.forEach(job => {
        let statusColor = 'var(--text-muted)';
        let statusText = job.status;
        
        if (job.status === 'DONE') statusColor = 'var(--success)';
        else if (job.status === 'PROCESSING') statusColor = 'var(--warning)';
        else if (job.status === 'FAILED') statusColor = 'var(--danger)';

        const formatTime = (isoString) => {
            if (!isoString) return '-';
            const d = new Date(isoString);
            return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
        };

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-family: monospace; font-size: 12px; color: var(--text-muted);">${job.id}</td>
            <td><strong class="success-text">${job.vehicleId}</strong></td>
            <td>${formatTime(job.createdAt)}</td>
            <td>${formatTime(job.updatedAt)}</td>
            <td><span class="badge" style="background: rgba(255,255,255,0.03); color: ${statusColor}; border: 1px solid ${statusColor};">${statusText}</span></td>
            <td>
                ${job.status === 'DONE' ? `
                    <button class="btn btn-outline btn-primary" onclick="showReportResult('${job.id}')" style="font-size: 11px; padding: 4px 10px;">Ver Resultados</button>
                ` : job.status === 'FAILED' ? `
                    <span class="danger-text" style="font-size: 12px;">Erro: ${job.result && job.result.error ? job.result.error : 'Falha na execução'}</span>
                ` : `
                    <span class="spinner" style="width:12px; height:12px;"></span> Em processamento...
                `}
            </td>
        `;
        DOM.jobsTableBody.appendChild(tr);
    });
}

// 6. Funções utilitárias e interações CRUD acessíveis globalmente
window.openEditModal = (id) => {
    const v = state.vehicles.find(item => item.id === id);
    if (!v) return;

    editingVehicleId = id;
    DOM.modalTitle.innerText = `Editar Veículo: ${id}`;
    
    // Popular inputs
    DOM.vehicleIdInput.value = v.id;
    DOM.vehicleIdInput.disabled = true; // Não permite alterar o ID chave
    DOM.vehiclePlateInput.value = v.licensePlate;
    DOM.vehicleBrandInput.value = v.brand;
    DOM.vehicleSpeedInput.value = v.currentSpeed;
    
    DOM.vehicleModal.classList.add('open');
};

window.deleteVehicle = async (id) => {
    if (!confirm(`Tem a certeza que deseja remover o veículo '${id}' da frota?`)) {
        return;
    }

    try {
        const res = await fetch(`${FLEET_API}/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || "Falha ao remover o veículo.");
        }

        appendLog('WARNING', `Veículo '${id}' removido via REST API com sucesso.`, 'REST_API');
        refreshData();
    } catch (e) {
        alert(`Erro ao eliminar: ${e.message}`);
    }
};

window.requestReportDirectly = (id) => {
    DOM.reportVehicleSelect.value = id;
    // Mudar para o separador de relatórios
    document.querySelector('[data-tab="reports-tab"]').click();
    DOM.btnTriggerReport.focus();
};

window.showReportResult = (jobId) => {
    const job = state.jobs[jobId];
    if (!job || !job.result) return;
    
    const res = job.result;
    const vehicleInfo = res.targetVehicle ? `
        Detalhes do Veículo no Relatório:
        - ID: ${res.targetVehicle.id}
        - Matrícula: ${res.targetVehicle.licensePlate}
        - Marca: ${res.targetVehicle.brand}
        - Estado: ${res.targetVehicle.status}
    ` : '\nVeículo correspondente não encontrado na frota ativa no momento da extração.';

    alert(`
        DADOS DO RELATÓRIO (Job ID: ${jobId})
        
        Gerado em: ${formatISO(res.generatedAt)}
        URL Download: ${res.reportUrl}
        Veículos Totais na Frota: ${res.vehicleCount}
        ${vehicleInfo}
    `);
};

// Outras funções utilitárias
function formatISO(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleTimeString() + ' ' + d.toLocaleDateString();
}

function updateStats() {
    DOM.statTotalVehicles.innerText = state.vehicles.length;
    DOM.statActiveVehicles.innerText = state.vehicles.filter(v => v.status === 'ACTIVE').length;
}

// Escrever linhas coloridas no Terminal Simulator
function appendLog(level, message, source = 'SYSTEM') {
    const line = document.createElement('div');
    line.className = `log-line ${level.toLowerCase()}`;
    
    const time = new Date().toLocaleTimeString();
    line.innerText = `[${time}] [${level}] [${source}] ${message}`;
    
    DOM.terminalBody.appendChild(line);
    DOM.terminalBody.scrollTop = DOM.terminalBody.scrollHeight;
}
