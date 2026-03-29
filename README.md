# Atv-2-QA — Kanban Board

Projeto de **Kanban Board** desenvolvido como atividade prática da disciplina de **Qualidade de Software** (IFBA). O projeto demonstra a aplicação de técnicas de refatoração, princípios SOLID, análise estática com ESLint e testes automatizados com Jest, visando melhoria contínua da qualidade do código.

---

## Tecnologias

- **TypeScript** — Linguagem principal (frontend e backend)
- **Vite** — Bundler e dev server do frontend
- **Express** — Servidor backend (API REST)
- **Better-SQLite3** — Banco de dados local (SQLite)
- **ESLint** — Análise estática de código
- **Jest + ts-jest** — Testes unitários e de integração

---

## Estrutura do Projeto

```
/
├── backend/
│   ├── __tests__/                ← Testes automatizados do backend
│   │   ├── validators.test.ts    ← Testes dos validadores
│   │   ├── query-builder.test.ts ← Testes do query builder
│   │   ├── task-repository.test.ts ← Testes do repositório (in-memory SQLite)
│   │   └── handlers.test.ts      ← Testes de integração dos handlers
│   ├── database.ts               ← DatabaseService com interface IDatabaseService
│   ├── database.old.ts           ← Versão original (code smells preservados)
│   ├── handlers.ts               ← Handlers decompostos (7 funções nomeadas)
│   ├── handlers.old.ts           ← Versão original (330 linhas monolíticas)
│   ├── logger.ts                 ← Logger utilitário (substitui console.log)
│   ├── query-builder.ts          ← Construtor dinâmico de queries SQL
│   ├── server.ts                 ← Entry point com injeção de dependências
│   ├── server.old.ts             ← Versão original
│   ├── task-repository.ts        ← TaskRepository com ITaskRepository (DI)
│   └── validators.ts             ← Validadores com type guards TypeScript
├── src/
│   ├── board.ts                  ← Renderização do board (funções auxiliares extraídas)
│   ├── board.old.ts              ← Versão original (452 linhas monolíticas)
│   ├── client.ts                 ← Cliente HTTP tipado com TaskFilter
│   ├── client.old.ts             ← Versão original (com code smells)
│   ├── main.ts                   ← Entry point do frontend
│   ├── models.ts                 ← Tipos fortes, union types, interfaces
│   └── models.old.ts             ← Versão original (todos os campos com `any`)
├── .eslintrc.cjs                 ← Configuração do ESLint
├── jest.config.cjs               ← Configuração do Jest
├── tsconfig.json                 ← TSConfig do frontend
├── tsconfig.backend.json         ← TSConfig do backend
├── package.json
└── README.md
```

---

## Como Rodar

```bash
# Instalar dependências
npm install

# Rodar em modo desenvolvimento (frontend + backend)
npm run dev

# A aplicação sobe em: http://localhost:5173
# O backend roda em: http://localhost:3000
```

### Scripts Disponíveis

| Comando                | O que faz                            |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Sobe frontend + backend juntos       |
| `npm run dev:frontend` | Só o Vite (frontend)                 |
| `npm run dev:backend`  | Só o servidor Express                |
| `npm run build`        | Gera o build de produção             |
| `npm run lint`         | Roda o ESLint em `src/` e `backend/` |
| `npm test`             | Executa testes com cobertura         |
| `npm run test:watch`   | Testes em modo watch                 |
| `npm run preview`      | Visualiza o build localmente         |

---

## Análise Estática (ESLint)

### Regras Configuradas

| Regra | Nível | Limite |
|-------|-------|--------|
| `complexity` | warn | max: 5 |
| `max-lines-per-function` | warn | max: 30 |
| `no-duplicate-imports` | error | — |
| `@typescript-eslint/no-explicit-any` | warn | — |
| `@typescript-eslint/no-unused-vars` | error | — |
| `@typescript-eslint/explicit-function-return-type` | warn | — |
| `eqeqeq` | error | — |
| `no-console` | warn | — |
| `no-var` | error | — |
| `prefer-const` | error | — |
| `max-depth` | warn | max: 3 |
| `max-params` | warn | max: 4 |

### Como Executar

```bash
npm run lint
# Resultado esperado: ✓ 0 problems
```

---

## Testes e Cobertura (Jest)

### Como Executar

```bash
# Com cobertura
npm test

# Em modo watch
npm run test:watch
```

### Estrutura dos Testes

| Arquivo | O que testa |
|---------|-------------|
| `validators.test.ts` | `isValidStatus`, `isValidPriority`, `isValidStatusTransition`, `isNonEmpty` |
| `query-builder.test.ts` | Geração de SQL com 0, 1, 2 e 3 filtros |
| `task-repository.test.ts` | CRUD completo com SQLite in-memory |
| `handlers.test.ts` | Integração HTTP de todos os 7 endpoints |

### Cobertura

| Módulo | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **Total** | **97.28%** | **90.32%** | **100%** | **97.28%** |
| validators.ts | 100% | 100% | 100% | 100% |
| query-builder.ts | 100% | 100% | 100% | 100% |
| task-repository.ts | 100% | 100% | 100% | 100% |
| handlers.ts | 94.62% | 86.84% | 100% | 94.62% |

---

## Resultados das Métricas Antes e Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Problemas ESLint** | 305 (214 erros, 91 warnings) | **0** |
| Violações `eqeqeq` (`==` → `===`) | 106 | 0 |
| Violações `no-var` | 105 | 0 |
| Violações `no-explicit-any` | 42 | 0 |
| Violações `no-console` | 32 | 0 |
| Violações `max-lines-per-function` | 10 | 0 |
| Violações `complexity` | 7 | 0 |
| **Complexidade ciclomática máxima** | ≥ 8 | **≤ 5** |
| **Linhas por função máximo** | ~100 (`buildTaskCard`) | **≤ 30** |
| **Uso de `any`** | 42 ocorrências | **0** |
| **Cobertura de testes** | 0% | **97.28%** |
| **Arquivos de teste** | 0 | 4 |
| **Casos de teste** | 0 | 57 |

---

## Relação com ISO/IEC 25010

| Característica ISO/IEC 25010 | Melhoria Aplicada |
|------------------------------|-------------------|
| **Manutenibilidade — Modularidade** | Decomposição de `handlers.ts` (330 linhas) em 6 módulos com responsabilidade única |
| **Manutenibilidade — Reusabilidade** | Extração de `validators.ts`, `query-builder.ts`, `logger.ts` — módulos reutilizáveis |
| **Manutenibilidade — Analisabilidade** | Redução da complexidade ciclomática de ≥8 para ≤5; funções com no máximo 30 linhas |
| **Manutenibilidade — Modificabilidade** | Injeção de dependência via `ITaskRepository` e `IDatabaseService`; query builder extensível |
| **Manutenibilidade — Testabilidade** | Interfaces para mocking; banco in-memory para testes; cobertura de 97.28% |
| **Confiabilidade — Maturidade** | Eliminação de 214 erros e 91 warnings; type guards que previnem erros em runtime |
| **Confiabilidade — Tolerância a falhas** | Validação robusta de entrada com type guards TypeScript |
| **Segurança — Integridade** | Eliminação de `==` (106 usos → 0) previne coerção de tipo e bugs sutis |

---

## Principais Melhorias Aplicadas

### Refatorações e Padrões

| Padrão | Onde aplicado | Antes → Depois |
|--------|--------------|----------------|
| **Extract Class** | `handlers.ts` → `TaskRepository`, `validators.ts`, `query-builder.ts` | 330 linhas em 1 arquivo → 4 arquivos especializados |
| **Extract Method** | `board.ts` → `getPriorityColor`, `buildDeadlineHtml`, `buildCardInnerHtml`, etc. | 452 linhas → 20+ funções focadas |
| **Move Method** | SQL de `handlers.ts` → `task-repository.ts` | Handlers sem SQL direto |
| **Replace Conditional with Data Structure** | Validação de transição de status | 6 `if` → mapa `ALLOWED_TRANSITIONS` |
| **Replace Algorithm** | Query com filtros | 8 `if/else if` → `buildFilterQuery` dinâmico |
| **Introduce Parameter Object** | `fetchAllTasks(status, priority, assignee)` → `fetchAllTasks(filter: TaskFilter)` | 3 parâmetros → 1 objeto tipado |
| **Replace Magic String/Number** | Magic strings e cores | `TASK_STATUS`, `TASK_PRIORITY`, `PRIORITY_COLORS`, `HTTP_STATUS` |
| **Dependency Injection** | `handlers.ts` recebe `ITaskRepository` | Desacoplamento completo do banco |
| **Rename Variable** | `var db`, `var task: any` | `const`, `let` com tipos explícitos |

### Princípios SOLID

| Princípio | Aplicação no Projeto |
|-----------|---------------------|
| **S** — Single Responsibility | `handlers.ts` dividido em handlers, repository, validators, query-builder |
| **O** — Open/Closed | `buildFilterQuery` extensível sem modificação; mapas `PRIORITY_COLORS` extensíveis |
| **L** — Liskov Substitution | `ITaskRepository` permite mock em testes sem alterar handlers |
| **I** — Interface Segregation | `IDatabaseService` expõe apenas `setup()` e `getInstance()` |
| **D** — Dependency Inversion | Handlers dependem de `ITaskRepository`, não de implementação concreta |

---

## Sobre os Arquivos `.old.ts`

Os arquivos com sufixo `.old.ts` contêm a **versão original do código antes da refatoração**. Eles existem exclusivamente como comparativo histórico para fins de análise e documentação.

**Regras:**
- **Nunca são importados** por nenhum outro arquivo do projeto
- **Excluídos do ESLint** (via `ignorePatterns` no `.eslintrc.cjs`)
- **Excluídos da compilação TypeScript** (via `exclude` nos `tsconfig.json`)
- **Devem permanecer no repositório** como evidência do estado anterior

### Arquivos Preservados

| Original | Refatorado |
|----------|------------|
| `src/models.old.ts` | `src/models.ts` |
| `src/client.old.ts` | `src/client.ts` |
| `src/board.old.ts` | `src/board.ts` |
| `backend/database.old.ts` | `backend/database.ts` |
| `backend/handlers.old.ts` | `backend/handlers.ts` |
| `backend/server.old.ts` | `backend/server.ts` |

---

## Lições Aprendidas

### Princípios SOLID no contexto deste projeto

A aplicação dos princípios SOLID demonstrou que mesmo em projetos pequenos, a separação de responsabilidades traz benefícios tangíveis. A injeção de dependência (`ITaskRepository`) permitiu testar os handlers isoladamente com banco in-memory, algo impossível no código original onde `getDb()` era chamado diretamente.

### Trade-offs encontrados

- **Injeção de dependência vs simplicidade**: o código refatorado tem mais arquivos e interfaces, mas cada parte é independente e testável. O custo de complexidade estrutural é compensado pela facilidade de manutenção e teste.
- **Número de funções vs funções longas**: extrair helpers como `buildDeadlineHtml` e `buildAssigneeHtml` cria mais pontos de navegação, mas cada função tem responsabilidade clara e pode ser compreendida isoladamente.

### Valor real da análise estática automatizada

O ESLint identificou 305 problemas automaticamente — muitos seriam invisíveis em revisão manual. Regras como `complexity` e `max-lines-per-function` funcionaram como guardiões arquiteturais, forçando a decomposição de funções monolíticas.

### Como code smells acumulados dificultam testes

No código original, era impossível testar handlers sem inicializar o banco SQLite real. A chamada direta a `getDb()` criava acoplamento forte. Após a refatoração com DI, os testes usam banco in-memory (`:memory:`), rodando em milissegundos sem efeitos colaterais.

### A relação entre complexidade ciclomática e dificuldade de teste

Funções com complexidade ciclomática ≥ 8 (como a validação de transição de status com 6 `if`) requeriam muitos casos de teste para cobertura completa. Após substituir por um mapa de transições, a validação ficou trivial de testar — basta verificar as transições no mapa.

---

## Portas

| Serviço           | Porta  |
| ----------------- | ------ |
| Frontend (Vite)   | `5173` |
| Backend (Express) | `3000` |
