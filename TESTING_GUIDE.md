# Guia de Testes e Instruções da API - Sistema de Telemetria 🚀

Este guia fornece instruções detalhadas para testar as APIs do **Sistema de Telemetria e Gestão de Frota (Fase 3)** utilizando o **Postman**, comandos **cURL** no terminal e **testes automatizados (Jest)**.

---

## 🛠️ 1. Configurando o Postman (Sem Erro de Autenticação)

Como analisado, o backend utiliza um validador estrito que espera o token exato `"super-secret-token-fase1"` sem qualquer prefixo (como `Bearer `)

### Como configurar manualmente no Postman:
1. Abra a aba **Authorization** do seu pedido e defina o **Type** como **No Auth**.
2. Vá para a aba **Headers** (ao lado de *Params*, *Authorization*, *Body*).
3. Adicione um novo cabeçalho:
   * **Key (Chave):** `Authorization`
   * **Value (Valor):** `super-secret-token-fase1`
4. Vá para a aba **Body**, selecione **raw** e mude o tipo de texto para **JSON**.
5. Cole o corpo do pedido (JSON) correspondente e envie!

---

## 📥 2. Importar a Coleção Pronta no Postman (Recomendado)

Para facilitar, criei uma **Collection do Postman** configurada corretamente com todos os cenários de teste, rotas, corpos JSON e cabeçalhos de autorização corretos na raiz do projeto.

### Como Importar:
1. No Postman, clique no botão **Import** (canto superior esquerdo).
2. Arraste ou selecione o ficheiro localizado na raiz do projeto:  
   `telemetria-collection.postman_collection.json`
3. A coleção **"Sistema de Telemetria - Fase 3"** será importada com todos os pedidos listados abaixo organizados em pastas!

---

## 🗺️ 3. Endpoints e Fluxos de Teste (cURL e Manual)

Certifique-se de que os contentores Docker estão a correr:
```bash
docker compose up --build
```

### 📍 A. Fleet Service (`http://localhost:3001`)

#### 1. Registar Veículo - Fluxo de Sucesso (Saga Commit)
Submete um novo veículo válido. A Saga do `NotificationService` processa o setup com sucesso e atualiza o estado para `ACTIVE`.

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/vehicles`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: super-secret-token-fase1`
* **Body (JSON):**
```json
{
  "id": "v-sucesso",
  "licensePlate": "AA-00-OK",
  "brand": "Tesla",
  "currentSpeed": 60
}
```

* **Comando cURL (PowerShell / Windows):**
```powershell
curl.exe -X POST http://localhost:3001/api/vehicles `
  -H "Content-Type: application/json" `
  -H "Authorization: super-secret-token-fase1" `
  -d '{\"id\": \"v-sucesso\", \"licensePlate\": \"AA-00-OK\", \"brand\": \"Tesla\", \"currentSpeed\": 60}'
```

* **Comando cURL (Linux / macOS / Git Bash):**
```bash
curl -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: super-secret-token-fase1" \
  -d '{"id": "v-sucesso", "licensePlate": "AA-00-OK", "brand": "Tesla", "currentSpeed": 60}'
```

---

#### 2. Registar Veículo - Fluxo de Compensação (Saga Rollback)
Submete um veículo com a marca `"FAIL"`. A Saga do `NotificationService` falha de propósito e o estado do veículo no PostgreSQL é revertido de forma assíncrona para `CANCELLED`.

* **Método:** `POST`
* **URL:** `http://localhost:3001/api/vehicles`
* **Headers:**
  * `Content-Type: application/json`
  * `Authorization: super-secret-token-fase1`
* **Body (JSON):**
```json
{
  "id": "v-falha",
  "licensePlate": "XX-99-ERR",
  "brand": "FAIL",
  "currentSpeed": 0
}
```

* **Comando cURL (PowerShell / Windows):**
```powershell
curl.exe -X POST http://localhost:3001/api/vehicles `
  -H "Content-Type: application/json" `
  -H "Authorization: super-secret-token-fase1" `
  -d '{\"id\": \"v-falha\", \"licensePlate\": \"XX-99-ERR\", \"brand\": \"FAIL\", \"currentSpeed\": 0}'
```

* **Comando cURL (Linux / macOS / Git Bash):**
```bash
curl -X POST http://localhost:3001/api/vehicles \
  -H "Content-Type: application/json" \
  -H "Authorization: super-secret-token-fase1" \
  -d '{"id": "v-falha", "licensePlate": "XX-99-ERR", "brand": "FAIL", "currentSpeed": 0}'
```

---

#### 3. Obter Todos os Veículos
Lista todos os veículos registados na base de dados PostgreSQL do `fleet-service`.

* **Método:** `GET`
* **URL:** `http://localhost:3001/api/vehicles`
* **Headers:**
  * `Authorization: super-secret-token-fase1`

* **Comando cURL:**
```bash
curl -X GET http://localhost:3001/api/vehicles \
  -H "Authorization: super-secret-token-fase1"
```

---

### 📍 B. Report Service (`http://localhost:3002`)

O `ReportService` utiliza a arquitetura **Web-Queue-Worker (WQW)**. Ao submeter a geração de um relatório, o pedido é imediatamente aceite com código `202 Accepted` e um `jobId`, sendo processado em background.

#### 1. Solicitar Geração de Relatório
Gera um relatório. Se o ID do veículo for `"FAIL"`, simula um erro persistente para testar a **Dead-Letter Queue (DLQ)**.

* **Método:** `POST`
* **URL:** `http://localhost:3002/api/reports/generate`
* **Headers:**
  * `Content-Type: application/json`
* **Body (JSON):**
```json
{
  "vehicleId": "v-sucesso"
}
```

* **Comando cURL (PowerShell / Windows):**
```powershell
curl.exe -X POST http://localhost:3002/api/reports/generate `
  -H "Content-Type: application/json" `
  -d '{\"vehicleId\": \"v-sucesso\"}'
```

* **Comando cURL (Linux / macOS / Git Bash):**
```bash
curl -X POST http://localhost:3002/api/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"vehicleId": "v-sucesso"}'
```

---

#### 2. Consultar Estado de um Relatório (Job Status)
Permite verificar o estado de processamento (`PENDING`, `COMPLETED`, `FAILED`) e obter os resultados finais armazenados na base de dados NoSQL MongoDB.

* **Método:** `GET`
* **URL:** `http://localhost:3002/api/reports/<jobId>` (Substitua `<jobId>` pelo ID retornado no passo anterior)

* **Comando cURL:**
```bash
curl -X GET http://localhost:3002/api/reports/substitua-com-o-seu-job-id
```

---

## 🧪 4. Testes Automatizados (Jest)

Pode validar as regras de negócio cruciais e o domínio isolado de infraestruturas correndo a suíte de testes unitários localmente.

### Como correr os testes unitários no Windows (contornando restrições do PowerShell):

Se receber o erro `File C:\Program Files\nodejs\npm.ps1 cannot be loaded because running scripts is disabled`, pode contornar isso de três formas simples no seu terminal:

* **Opção A: Usar `npm.cmd` (Mais recomendada e rápida)**
  Basta acrescentar `.cmd` ao comando para instruir o PowerShell a usar o executável do Windows em vez do script de PowerShell wrapper (`.ps1`). Funciona sem qualquer configuração prévia:
  ```powershell
  npm.cmd install
  npm.cmd test
  ```

* **Opção B: Desbloquear temporariamente a sessão do PowerShell**
  Execute este comando para dar permissão de execução de scripts apenas na janela atual do terminal (não afeta o resto do sistema e não precisa de administrador):
  ```powershell
  Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
  ```
  Depois disso, os comandos normais `npm install` e `npm test` funcionarão perfeitamente na mesma janela de terminal.

* **Opção C: Usar o Prompt de Comando clássico (CMD)**
  Abra um terminal CMD normal em vez do PowerShell e corra os comandos normais:
  ```cmd
  npm install
  npm test
  ```

### Estrutura de Testes:
Os testes estão localizados na pasta [tests/unit/](file:///c:/Users/jmmon/Documents/Escola/Mestrado/Arquitetura%20de%20Software/Trabalho%20Final/sistema-telemetria-as/tests/unit) e avaliam regras como:
* Validação de velocidades não negativas.
* Registo correto de veículos com portas mockadas.
* Garantia de tempo de execução rápido (RNF de Testabilidade).
