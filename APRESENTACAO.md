# Descritivo para Apresentação — Refatoração do Projeto Atv-2-QA (Kanban Board)

---

## Slide 1: Visão Geral da Refatoração

Título do slide:
Refatoração Completa do Kanban Board — Visão Geral

Resumo:
O projeto Atv-2-QA é um Kanban Board desenvolvido com TypeScript, Vite no frontend e Express + SQLite no backend. A refatoração foi executada em 13 etapas, cada uma com commit atômico, visando eliminar code smells, aplicar princípios SOLID, implementar testes automatizados e atingir zero problemas no ESLint.

Antes:
- 305 problemas no ESLint (214 erros + 91 warnings)
- 0% de cobertura de testes
- Uso massivo de `any`, `var` e `==`
- Código monolítico concentrado em poucos arquivos grandes

Depois:
- 0 problemas no ESLint
- 97,28% de cobertura de testes (57 casos de teste)
- Tipagem forte com union types e interfaces explícitas
- Código modular distribuído em 6 módulos especializados no backend

Impacto:
A base de código passou de um estado com centenas de alertas e sem testes para um nível de qualidade mensurável, com análise estática limpa, compilação TypeScript sem erros e cobertura de testes acima de 97%.

---

## Slide 2: Problemas Iniciais do Projeto

Título do slide:
Diagnóstico Inicial — Code Smells Identificados

Resumo:
A análise estática com ESLint revelou 305 problemas distribuídos entre uso de `any` sem tipagem, `var` em vez de `const`/`let`, comparações com `==` em vez de `===`, chamadas diretas a `console.log`, funções com mais de 100 linhas e complexidade ciclomática superior a 8.

Antes:
- 42 usos de `any` (ex: `Task.title: any`, `TaskStatus = any`)
- 105 usos de `var` (ex: `var db`, `var task`, `var status`)
- 106 usos de `==` em vez de `===` (ex: `task == null`, `status != "open"`)
- 32 chamadas diretas a `console.log`
- Funções com até ~100 linhas (ex: `buildTaskCard`)
- Complexidade ciclomática de até 8+ (ex: `registerRoutes`)

Depois:
- 0 usos de `any`
- 0 usos de `var`
- 0 usos de `==`
- 0 chamadas diretas a `console.log`
- Máximo de 30 linhas por função
- Complexidade ciclomática máxima de 5

Impacto:
A eliminação desses code smells reduziu drasticamente o risco de bugs de coerção de tipo, melhorou a legibilidade e viabilizou testes unitários e de integração.

Exemplo de código:
Antes:
```ts
var task: any = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
if (task == null || task == undefined) {
  console.log("tarefa nao encontrada");
  res.status(404).json({ error: "tarefa nao encontrada" });
}
```
Depois:
```ts
const task = repository.findById(id);
if (task === undefined) {
  res.status(404).json({ error: 'tarefa nao encontrada' });
  return;
}
```

---

## Slide 3: Fortalecimento de Tipos em models.ts

Título do slide:
De `any` para Union Types — Tipagem Forte em models.ts

Resumo:
O arquivo `models.ts` definia todos os campos das interfaces como `any`, anulando completamente a segurança de tipos do TypeScript. A refatoração substituiu `any` por tipos concretos: `string`, `number`, union types (`'open' | 'in-progress' | 'done'`) e interfaces genéricas tipadas.

Antes:
```ts
export type TaskStatus = any;
export type TaskPriority = any;

export var STATUS_OPEN = "open";

export interface Task {
  id: number;
  title: any;
  status: TaskStatus;  // → any
  priority: TaskPriority;  // → any
}
```
Depois:
```ts
export type TaskStatus = 'open' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export const TASK_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  DONE: 'done',
} as const;

export interface Task {
  id: number;
  title: string;
  status: TaskStatus;  // → 'open' | 'in-progress' | 'done'
  priority: TaskPriority;  // → 'low' | 'medium' | 'high'
}
```

Impacto:
- O compilador TypeScript agora detecta valores inválidos em tempo de compilação.
- Autocompletar do editor funciona corretamente.
- `var` substituído por `const` imutável.
- Os valores válidos ficaram centralizados em objetos constantes (`TASK_STATUS`, `TASK_PRIORITY`), eliminando magic strings em todo o projeto.

---

## Slide 4: Extração de DatabaseService

Título do slide:
Extract Class — De `var db` para DatabaseService com Interface

Resumo:
O acesso ao banco era feito por uma variável global `var db` e funções soltas (`setupDatabase()`, `getDb()`), ambas retornando `any`. A refatoração encapsulou tudo em uma classe `DatabaseService` que implementa a interface `IDatabaseService`, permitindo injeção de dependência e testes com banco in-memory.

Antes:
```ts
var db = new Database(path.join(__dirname, "kanban.db"));

export function setupDatabase(): any {
  console.log("iniciando banco de dados...");
  db.exec(`CREATE TABLE IF NOT EXISTS tasks (...)`);
  return db;
}

export function getDb(): any {
  return db;
}
```
Depois:
```ts
export interface IDatabaseService {
  setup(): void;
  getInstance(): Database.Database;
}

class DatabaseService implements IDatabaseService {
  private readonly db: Database.Database;

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
  }

  public setup(): void {
    log('database', 'iniciando banco de dados...');
    this.db.exec(`CREATE TABLE IF NOT EXISTS tasks (...)`);
  }

  public getInstance(): Database.Database {
    return this.db;
  }
}
```

Impacto:
- `var db` global eliminado — estado encapsulado na classe.
- Interface `IDatabaseService` permitiu criar mocks com `:memory:` para testes.
- `console.log` substituído pelo `log()` centralizado.
- Retorno `any` substituído por tipo concreto `Database.Database`.

---

## Slide 5: Criação do Logger

Título do slide:
Centralizando Logs — Extração do Logger

Resumo:
O projeto original tinha 32 chamadas diretas a `console.log` espalhadas pelo código, violando a regra `no-console` do ESLint. A solução foi criar um módulo `logger.ts` que centraliza a saída, adiciona contexto e suprime logs em produção.

Antes:
```ts
console.log("iniciando banco de dados...");
console.log("tarefa criada com id: " + result.lastInsertRowid);
console.log("buscando todas as tarefas");
console.log("erro ao atualizar status");
```
Depois:
```ts
// backend/logger.ts
const isProduction: boolean = process.env.NODE_ENV === 'production';

export function log(context: string, message: string): void {
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.log(`[${context}] ${message}`);
  }
}

// Uso:
log('database', 'iniciando banco de dados...');
log('repository', `created task id: ${result.lastInsertRowid}`);
```

Impacto:
- 32 violations de `no-console` eliminadas.
- Logs suprimidos automaticamente em produção.
- Cada mensagem tem contexto (`[database]`, `[handler]`, `[repository]`), facilitando depuração.
- Único ponto de `console.log` em todo o projeto (dentro do logger, com `eslint-disable` explícito).

---

## Slide 6: Extração de Validators

Título do slide:
Replace Conditional with Data Structure — Validadores Extraídos

Resumo:
A validação de status e prioridade era feita com cadeias de `!=` repetidas em múltiplos handlers. A transição de status usava 7 blocos `if` separados. A refatoração criou `validators.ts` com type guards e substituiu os 7 ifs por um `Map` de transições permitidas.

Antes:
```ts
// Validação de status repetida em 3 handlers:
if (status != "open" && status != "in-progress" && status != "done") {
  res.status(400).json({ error: "status invalido" });
}

// 7 ifs para validar transição:
if (task.status == "open" && newStatus == "in-progress") allowed = true;
if (task.status == "open" && newStatus == "done") allowed = true;
if (task.status == "in-progress" && newStatus == "done") allowed = true;
// ... mais 4 ifs semelhantes
```
Depois:
```ts
// validators.ts — Type guard reutilizável:
export function isValidStatus(status: unknown): status is TaskStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status);
}

// Mapa de transições no lugar de 7 ifs:
const ALLOWED_TRANSITIONS = new Map([
  [TASK_STATUS.OPEN, new Set([TASK_STATUS.IN_PROGRESS, TASK_STATUS.DONE])],
  [TASK_STATUS.IN_PROGRESS, new Set([TASK_STATUS.OPEN, TASK_STATUS.DONE])],
  [TASK_STATUS.DONE, new Set([TASK_STATUS.OPEN, TASK_STATUS.IN_PROGRESS])],
]);

export function isValidStatusTransition(from: TaskStatus, to: TaskStatus): boolean {
  if (from === to) return false;
  const allowed = ALLOWED_TRANSITIONS.get(from);
  return allowed !== undefined && allowed.has(to);
}
```

Impacto:
- Lógica de validação extraída e centralizada em um módulo reutilizável.
- Complexidade ciclomática da transição reduzida de 8 para 3.
- Type guards garantem narrowing de tipo automático pelo TypeScript.
- Adicionar um novo status futuro exige apenas alterar o `Map`, não modificar múltiplos handlers.

---

## Slide 7: Query Builder Dinâmico

Título do slide:
Replace Algorithm — De 8 if/else para Query Builder Dinâmico

Resumo:
A construção de queries SQL com filtros opcionais era feita com uma cadeia de 8 `if/else if` (todas as combinações de `status`, `priority`, `assignee`). Cada branch tinha uma query SQL quase idêntica. A refatoração substituiu por um algoritmo genérico que itera sobre os filtros dinamicamente.

Antes:
```ts
if (status && priority && assignee) {
  tasks = db.prepare(
    "SELECT * FROM tasks WHERE status = ? AND priority = ? AND assignee = ?"
  ).all(status, priority, assignee);
} else if (status && priority) {
  tasks = db.prepare(
    "SELECT * FROM tasks WHERE status = ? AND priority = ?"
  ).all(status, priority);
} else if (status && assignee) {
  // ... mais 5 variações idênticas
} else {
  tasks = db.prepare("SELECT * FROM tasks").all();
}
```
Depois:
```ts
// query-builder.ts
export function buildFilterQuery(filter: TaskFilter): FilterQueryResult {
  const conditions: string[] = [];
  const params: string[] = [];

  for (const key of Object.keys(filter) as (keyof TaskFilter)[]) {
    const value = filter[key];
    if (value !== undefined && value !== '') {
      conditions.push(`${FILTER_COLUMN_MAP[key]} = ?`);
      params.push(value);
    }
  }

  const whereClause = conditions.length > 0
    ? ` WHERE ${conditions.join(' AND ')}`
    : '';
  return { sql: `SELECT * FROM tasks${whereClause}`, params };
}
```

Impacto:
- 8 branches reduzidos para 1 loop genérico.
- Extensível: adicionar um novo campo de filtro (ex: `deadline`) requer apenas adicionar uma entrada no `FILTER_COLUMN_MAP`, sem alterar a lógica.
- Princípio Open/Closed (SOLID) aplicado: aberto para extensão, fechado para modificação.

---

## Slide 8: TaskRepository e Injeção de Dependência

Título do slide:
Dependency Injection — TaskRepository com IDatabaseService

Resumo:
Antes, cada handler acessava o banco diretamente via `getDb()`, misturando lógica de rota com SQL. A refatoração criou `TaskRepository` com interface `ITaskRepository`. O repositório recebe `IDatabaseService` por injeção de dependência no construtor, centralizando todo o SQL.

Antes:
```ts
// Dentro de cada handler:
var db = getDb();
var result = db.prepare(
  "INSERT INTO tasks (...) VALUES (?, ?, ?, ?, ?, ?, ?)"
).run(title, description, assignee, deadline, status, priority, createdAt);
var task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
```
Depois:
```ts
// task-repository.ts
export class TaskRepository implements ITaskRepository {
  private readonly dbService: IDatabaseService;

  constructor(dbService: IDatabaseService) {
    this.dbService = dbService;  // Injeção de dependência
  }

  public create(data: CreateTaskData): Task {
    const db = this.dbService.getInstance();
    const row = buildCreateRow(data);
    const result = db.prepare(INSERT_SQL).run(/* ... */);
    return this.findById(Number(result.lastInsertRowid)) as Task;
  }
}

// server.ts — Composição raiz:
const repository = new TaskRepository(databaseService);
registerRoutes(app, repository);
```

Impacto:
- Handlers ficaram livres de SQL — apenas delegam para o repository.
- Nos testes, basta injetar um `IDatabaseService` com banco `:memory:`.
- Princípio D do SOLID (Dependency Inversion): handlers dependem da interface `ITaskRepository`, não da implementação concreta.
- Todo SQL do projeto está centralizado em um único arquivo.

---

## Slide 9: Refatoração dos Handlers

Título do slide:
Decomposição de Handlers — De 330 Linhas para 7 Funções Nomeadas

Resumo:
O arquivo `handlers.ts` original era um monolito de 330 linhas com uma única função `registerRoutes()` que continha a lógica de todas as 7 rotas inline, incluindo acesso ao banco, validação e resposta HTTP. A refatoração decompos em 7 funções nomeadas, cada uma com no máximo 15 linhas.

Antes:
```ts
export function registerRoutes(app: Express): any {
  app.get("/api/tasks", function (req: Request, res: Response) {
    var db = getDb();
    var status = req.query.status;
    // ... 45 linhas de lógica inline com 8 if/else
    res.status(200).json(tasks);
  });
  app.post("/api/tasks", function (req: Request, res: Response) {
    var db = getDb();
    // ... 70 linhas de validação + insert inline
  });
  // ... mais 5 rotas com o mesmo padrão (total: 330 linhas)
}
```
Depois:
```ts
function handleCreateTask(req: Request, res: Response, repository: ITaskRepository): void {
  log('handler', 'criando nova tarefa');
  const validationError = validateCreateFields(req.body);
  if (validationError !== null) {
    res.status(400).json(validationError);
    return;
  }
  const task = repository.create(req.body);
  res.status(201).json(task);
}

export function registerRoutes(app: Express, repository: ITaskRepository): void {
  app.post('/api/tasks', (req, res) => handleCreateTask(req, res, repository));
  // ... 6 linhas similares para as outras rotas
}
```

Impacto:
- 330 linhas decompostas em funções com 8-15 linhas cada.
- `registerRoutes` recebe `ITaskRepository` por parâmetro (injeção de dependência).
- Validação delegada para `validateCreateFields()` e `validateUpdateFields()`.
- SQL delegado para `TaskRepository`.
- Complexidade ciclomática máxima reduzida de 8+ para 5.

---

## Slide 10: Refatoração do Client HTTP

Título do slide:
Typed API Client — De `any` para Tipos Explícitos no Frontend

Resumo:
O client HTTP original usava `var`, retornava `Promise<any>`, tinha URL hardcoded, construía query strings manualmente com concatenação de strings e duplicava verificações de nulidade.

Antes:
```ts
var BASE_URL = "http://localhost:5173/api";

export async function fetchAllTasks(status?: any, priority?: any, assignee?: any): Promise<any> {
  console.log("buscando tarefas...");
  var url = BASE_URL + "/tasks";
  var params: any[] = [];
  if (status != null && status != "" && status != undefined) {
    params.push("status=" + status);
  }
  // ...
  var response = await fetch(url);
  if (response.status == 200) {
    var data = await response.json();
    return data;
  }
}
```
Depois:
```ts
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '/api';

const HTTP_STATUS = { OK: 200, CREATED: 201 } as const;

export async function fetchAllTasks(filter: TaskFilter = {}): Promise<Task[]> {
  const queryString = buildQueryString(filter);
  const url = `${BASE_URL}/tasks${queryString}`;
  const response = await fetch(url);
  if (response.status === HTTP_STATUS.OK) {
    return await response.json() as Task[];
  }
  return [];
}
```

Impacto:
- 3 parâmetros soltos substituídos por `TaskFilter` (Introduce Parameter Object).
- Retorno `Promise<any>` substituído por `Promise<Task[]>`, `Promise<Task | null>`, etc.
- Magic numbers (200, 201) substituídos por constantes nomeadas (`HTTP_STATUS`).
- URL vinda de variável de ambiente com fallback; `URLSearchParams` no lugar de concatenação manual.
- `var` → `const`, `==` → `===`, `console.log` removidos.

---

## Slide 11: Refatoração do Board (Frontend)

Título do slide:
Extract Method — De 452 Linhas para 20+ Funções Focadas

Resumo:
O `board.ts` original tinha 452 linhas com a função `buildTaskCard` contendo ~100 linhas de lógica misturada: cores inline, HTML por concatenação, event listeners aninhados, tudo dentro de um bloco monolítico. A refatoração extraiu helpers dedicados e usou mapas de dados.

Antes:
```ts
var currentEditId: any = null;
var allTasks: any[] = [];

function buildTaskCard(task: any): HTMLElement {
  var priorityColor = "";
  if (task.priority == "high") {
    priorityColor = "#ef4444";
  } else if (task.priority == "medium") {
    priorityColor = "#f59e0b";
  } else if (task.priority == "low") {
    priorityColor = "#22c55e";
  } else {
    priorityColor = "#6b7280";
  }
  // ... mais ~90 linhas de HTML, drag, eventos inline
}
```
Depois:
```ts
let currentEditId: number | null = null;
let allTasks: Task[] = [];

const PRIORITY_COLORS: Readonly<Record<TaskPriority, string>> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] ?? '#6b7280';
}

function buildTaskCard(task: Task): HTMLElement {
  const card = document.createElement('div');
  card.innerHTML = buildCardInnerHtml(task);
  setupCardDrag(card, task.id);
  setupCardStatusSelect(card, task);
  setupCardButtons(card, task);
  return card;
}
```

Impacto:
- 452 linhas decompostas em 20+ funções com responsabilidade única.
- `if/else` para cores e labels substituídos por mapas (`PRIORITY_COLORS`, `PRIORITY_LABELS`).
- Parâmetros tipados: `task: Task` em vez de `task: any`.
- `var` → `let`/`const`; `==` → `===` em todo o arquivo.
- Complexidade ciclomática de cada função reduzida para ≤ 5.

---

## Slide 12: Estratégia com Arquivos `.old.ts`

Título do slide:
Preservação Histórica — Arquivos `.old.ts` como Referência

Resumo:
Cada arquivo refatorado teve sua versão original preservada com o sufixo `.old.ts` (ex: `models.old.ts`, `handlers.old.ts`). Esses arquivos existem exclusivamente como comparativo histórico — nunca são importados, compilados ou lintados.

Antes:
Não existiam versões de referência. As alterações substituíam o código anterior sem registro visual da evolução.

Depois:
- 6 arquivos `.old.ts` preservados: `models.old.ts`, `database.old.ts`, `handlers.old.ts`, `server.old.ts`, `client.old.ts`, `board.old.ts`
- Excluídos do ESLint: `"**/*.old.ts"` em `ignorePatterns`
- Excluídos da compilação TypeScript: `"**/*.old.ts"` em `exclude` dos `tsconfig.json`
- Nunca são importados por nenhum arquivo ativo do projeto

Impacto:
- Permite comparação direta antes vs. depois para documentação e apresentações.
- Sem impacto no build: não aumentam o bundle final nem geram warnings.
- Servem como evidência concreta dos code smells eliminados.

Exemplo de código:
```
# Regra no .eslintrc.cjs:
ignorePatterns: ["**/*.old.ts"]

# Regra no tsconfig.json:
"exclude": ["**/*.old.ts"]

# Arquivos preservados:
src/models.old.ts      ←→  src/models.ts
backend/handlers.old.ts ←→  backend/handlers.ts
backend/database.old.ts ←→  backend/database.ts
```

---

## Slide 13: Testes com Jest

Título do slide:
De 0% para 97,28% — Implementação do Jest do Zero

Resumo:
O projeto original não tinha nenhum teste. A refatoração implementou Jest + ts-jest com 4 suítes de teste e 57 casos de teste, usando banco SQLite in-memory para testes do repository e requests HTTP reais para testes de integração dos handlers.

Antes:
- 0 arquivos de teste
- 0% de cobertura
- Impossível testar handlers sem banco SQLite real (acoplamento via `getDb()`)

Depois:
- 4 suítes de teste (validators, query-builder, task-repository, handlers)
- 57 casos de teste
- 97,28% de cobertura de statements
- 100% de cobertura de funções

Impacto:
A injeção de dependência (`IDatabaseService`) viabilizou testes com banco in-memory que rodam em milissegundos. Sem a refatoração, testar handlers exigiria um banco SQLite real, tornando os testes lentos e frágeis.

Exemplo de código:
```ts
// Teste do repository com banco in-memory:
function createInMemoryService(): IDatabaseService {
  const db = new Database(':memory:');
  return {
    setup(): void { db.exec(`CREATE TABLE IF NOT EXISTS tasks (...)`); },
    getInstance() { return db; },
  };
}

describe('TaskRepository', () => {
  let repo: TaskRepository;
  beforeEach(() => {
    const dbService = createInMemoryService();
    dbService.setup();
    repo = new TaskRepository(dbService);  // DI em ação
  });

  it('should create a task with defaults', () => {
    const task = repo.create({ title: 'Tarefa 1' });
    expect(task.status).toBe('open');
    expect(task.priority).toBe('medium');
  });
});
```

---

## Slide 14: Métricas Antes e Depois

Título do slide:
Resultados Quantitativos — Métricas Antes vs. Depois

Resumo:
Comparação numérica direta das métricas de qualidade do projeto antes e depois da refatoração.

Antes:
| Métrica | Valor |
|---------|-------|
| Problemas ESLint | 305 (214 erros, 91 warnings) |
| Usos de `any` | 42 |
| Usos de `var` | 105 |
| Usos de `==` | 106 |
| Complexidade ciclomática máx. | ≥ 8 |
| Linhas por função máx. | ~100 |
| Cobertura de testes | 0% |
| Casos de teste | 0 |

Depois:
| Métrica | Valor |
|---------|-------|
| Problemas ESLint | 0 |
| Usos de `any` | 0 |
| Usos de `var` | 0 |
| Usos de `==` | 0 |
| Complexidade ciclomática máx. | ≤ 5 |
| Linhas por função máx. | ≤ 30 |
| Cobertura de testes | 97,28% |
| Casos de teste | 57 |

Impacto:
Todas as métricas atingiram os limites definidos nas regras do ESLint. A evolução é 100% mensurável e reproduzível executando `npm run lint` e `npm test`.

---

## Slide 15: Relação com SOLID

Título do slide:
Princípios SOLID Aplicados na Prática

Resumo:
Cada princípio SOLID foi aplicado de forma concreta durante a refatoração.

Antes:
- Uma única função `registerRoutes()` com 330 linhas fazia tudo: roteamento, validação, SQL e resposta HTTP.
- O banco era acessado via `getDb()` global, criando acoplamento direto.
- Não existiam interfaces; impossível substituir implementações.

Depois:

**S — Single Responsibility:**
Cada módulo tem uma responsabilidade: `validators.ts` valida, `query-builder.ts` constrói SQL, `task-repository.ts` acessa dados, `handlers.ts` trata requests.

**O — Open/Closed:**
`buildFilterQuery` aceita novos filtros sem modificação da lógica — basta adicionar ao `FILTER_COLUMN_MAP`. Mapas como `PRIORITY_COLORS` são extensíveis.

**L — Liskov Substitution:**
`ITaskRepository` permite usar o `TaskRepository` real ou um mock nos testes, sem alterar os handlers.

**I — Interface Segregation:**
`IDatabaseService` expõe apenas `setup()` e `getInstance()` — o mínimo necessário.

**D — Dependency Inversion:**
Handlers dependem de `ITaskRepository` (interface), não de `TaskRepository` (classe). O `server.ts` faz a composição raiz.

Exemplo de código:
```ts
// D — Dependency Inversion no server.ts:
const repository = new TaskRepository(databaseService); // Composição raiz
registerRoutes(app, repository);  // Handler recebe interface

// L — Liskov nos testes:
const mockService = createInMemoryService();  // Substitui sem quebrar
const repo = new TaskRepository(mockService);
```

Impacto:
O código ficou modular, testável e extensível. Novas features podem ser adicionadas sem alterar código existente.

---

## Slide 16: Relação com ISO/IEC 25010

Título do slide:
Alinhamento com ISO/IEC 25010 — Qualidade de Software

Resumo:
A refatoração endereçou diretamente 4 subcaracterísticas da norma ISO/IEC 25010. Cada melhoria técnica tem correspondência com um aspecto de qualidade de produto de software.

Antes:
- Código monolítico difícil de analisar, modificar e testar.
- 214 erros que poderiam causar falhas em runtime.
- 106 usos de `==` sujeitos a bugs de coerção de tipo.

Depois:

| Característica ISO/IEC 25010 | Melhoria Aplicada |
|------------------------------|-------------------|
| **Manutenibilidade — Modularidade** | `handlers.ts` (330 linhas) → 6 módulos especializados |
| **Manutenibilidade — Reusabilidade** | `validators.ts`, `query-builder.ts`, `logger.ts` reutilizáveis |
| **Manutenibilidade — Analisabilidade** | Complexidade ciclomática ≤ 5; funções com máx. 30 linhas |
| **Manutenibilidade — Modificabilidade** | DI via `ITaskRepository`; query builder extensível |
| **Manutenibilidade — Testabilidade** | Interfaces para mocking; banco in-memory; cobertura 97,28% |
| **Confiabilidade — Maturidade** | 214 erros + 91 warnings → 0 problemas |
| **Confiabilidade — Tolerância a falhas** | Type guards previnem erros em runtime |
| **Segurança — Integridade** | Eliminação de `==` previne coerção e bugs sutis |

Impacto:
A refatoração não foi apenas "limpar código" — ela endereçou características mensuráveis de qualidade definidas por uma norma internacional. Cada decisão técnica teve correspondência com um requisito de qualidade de software.

---

## Slide 17: Conclusão

Título do slide:
Conclusão — Qualidade é Mensurável e Incremental

Resumo:
A refatoração do projeto Atv-2-QA demonstrou que qualidade de software é um atributo mensurável. Através de 13 commits atômicos, o projeto evoluiu de 305 problemas e 0% de cobertura para zero problemas e 97,28% de cobertura, aplicando SOLID, eliminando code smells e validando com análise estática e testes automatizados.

Antes:
- Código funcional, mas frágil.
- Sem testes, sem tipos, sem garantias.
- Impossível de estender sem risco de regressão.

Depois:
- Código funcional, modular e testado.
- 0 erros no ESLint; 0 erros de compilação TypeScript.
- 57 testes com 97,28% de cobertura.
- Princípios SOLID aplicados; alinhamento com ISO/IEC 25010.

Impacto:
- Análise estática automatizada (ESLint) serviu como guardião arquitetural.
- Testes com banco in-memory provaram que DI não é apenas teoria acadêmica — viabiliza testes reais.
- Arquivos `.old.ts` documentam a evolução sem poluir o projeto.
- Cada melhoria é rastreável por commit atômico.

Exemplo de código:
```bash
# Verificação completa do projeto:
$ npm run lint
# ✅ 0 problems

$ npm test
# ✅ 57 tests passed — 97.28% coverage

$ npx tsc --noEmit
# ✅ Clean compilation
```

---

## Ordem Sugerida dos Slides para Apresentação

1. **Visão Geral da Refatoração** — Contextualiza o projeto e os números finais.
2. **Problemas Iniciais do Projeto** — Mostra a gravidade do ponto de partida.
3. **Fortalecimento de Tipos em models.ts** — Primeiro passo: tipagem forte.
4. **Criação do Logger** — Passo simples que resolve 32 warnings.
5. **Extração de DatabaseService** — Fundação para injeção de dependência.
6. **Extração de Validators** — Type guards e mapa de transições.
7. **Query Builder Dinâmico** — Algoritmo genérico substituindo if/else explosivo.
8. **TaskRepository e Injeção de Dependência** — Centralização do SQL com DI.
9. **Refatoração dos Handlers** — Decomposição do monolito de 330 linhas.
10. **Refatoração do Client HTTP** — Tipagem e Parameter Object no frontend.
11. **Refatoração do Board** — Extract Method no frontend mais complexo.
12. **Estratégia com Arquivos `.old.ts`** — Como preservar o histórico sem poluir.
13. **Testes com Jest** — De 0% para 97,28% com banco in-memory.
14. **Métricas Antes e Depois** — Tabela comparativa final.
15. **Relação com SOLID** — Princípios aplicados com exemplos concretos.
16. **Relação com ISO/IEC 25010** — Alinhamento com a norma.
17. **Conclusão** — Mensagem final: qualidade é mensurável e incremental.

---

*Nota: Este documento foi preparado como fonte para o NotebookLM gerar slides de apresentação. Cada bloco equivale a 1 slide. Os trechos de código são reais, extraídos diretamente dos arquivos `.old.ts` (antes) e dos arquivos refatorados (depois).*
