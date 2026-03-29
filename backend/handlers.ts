import { Express, Request, Response } from 'express';
import { TaskFilter, TaskStatus } from '../src/models.js';
import { ITaskRepository } from './task-repository.js';
import { isValidStatus, isValidPriority, isValidStatusTransition, isNonEmpty } from './validators.js';
import { log } from './logger.js';

function handleGetTasks(req: Request, res: Response, repository: ITaskRepository): void {
  log('handler', 'buscando todas as tarefas');
  const filter: TaskFilter = {
    status: req.query.status as TaskFilter['status'],
    priority: req.query.priority as TaskFilter['priority'],
    assignee: req.query.assignee as TaskFilter['assignee'],
  };
  const tasks = repository.findAll(filter);
  log('handler', `tarefas encontradas: ${tasks.length}`);
  res.status(200).json(tasks);
}

function handleCreateTask(req: Request, res: Response, repository: ITaskRepository): void {
  log('handler', 'criando nova tarefa');
  if (!isNonEmpty(req.body.title)) {
    res.status(400).json({ error: 'titulo obrigatorio' });
    return;
  }
  const { status, priority } = req.body;
  if (isNonEmpty(status) && !isValidStatus(status)) {
    res.status(400).json({ error: 'status invalido' });
    return;
  }
  if (isNonEmpty(priority) && !isValidPriority(priority)) {
    res.status(400).json({ error: 'prioridade invalida' });
    return;
  }
  const task = repository.create(req.body);
  res.status(201).json(task);
}

function handleGetTaskById(req: Request, res: Response, repository: ITaskRepository): void {
  const id = Number(req.params.id);
  log('handler', `buscando tarefa por id: ${id}`);
  const task = repository.findById(id);
  if (task === undefined) {
    res.status(404).json({ error: 'tarefa nao encontrada' });
    return;
  }
  res.status(200).json(task);
}

function handleUpdateTask(req: Request, res: Response, repository: ITaskRepository): void {
  const id = Number(req.params.id);
  log('handler', `atualizando tarefa id: ${id}`);
  const existing = repository.findById(id);
  if (existing === undefined) {
    res.status(404).json({ error: 'tarefa nao encontrada' });
    return;
  }
  if (!isNonEmpty(req.body.title ?? existing.title)) {
    res.status(400).json({ error: 'titulo obrigatorio' });
    return;
  }
  const status = req.body.status ?? existing.status;
  const priority = req.body.priority ?? existing.priority;
  if (!isValidStatus(status)) {
    res.status(400).json({ error: 'status invalido' });
    return;
  }
  if (!isValidPriority(priority)) {
    res.status(400).json({ error: 'prioridade invalida' });
    return;
  }
  const updated = repository.update(id, req.body);
  res.status(200).json(updated);
}

function handleUpdateTaskStatus(req: Request, res: Response, repository: ITaskRepository): void {
  const id = Number(req.params.id);
  log('handler', `atualizando status da tarefa id: ${id}`);
  const task = repository.findById(id);
  if (task === undefined) {
    res.status(404).json({ error: 'tarefa nao encontrada' });
    return;
  }
  const newStatus: unknown = req.body.status;
  if (!isValidStatus(newStatus)) {
    res.status(400).json({ error: 'status invalido' });
    return;
  }
  const from: TaskStatus = task.status;
  if (!isValidStatusTransition(from, newStatus)) {
    res.status(400).json({ error: 'transicao de status invalida' });
    return;
  }
  const updated = repository.updateStatus(id, newStatus);
  res.status(200).json(updated);
}

function handleDeleteTask(req: Request, res: Response, repository: ITaskRepository): void {
  const id = Number(req.params.id);
  log('handler', `removendo tarefa id: ${id}`);
  const task = repository.findById(id);
  if (task === undefined) {
    res.status(404).json({ error: 'tarefa nao encontrada' });
    return;
  }
  repository.remove(id);
  res.status(200).json({ message: 'tarefa removida com sucesso' });
}

function handleGetStats(_req: Request, res: Response, repository: ITaskRepository): void {
  log('handler', 'buscando estatisticas');
  const stats = repository.getStats();
  res.status(200).json(stats);
}

export function registerRoutes(app: Express, repository: ITaskRepository): void {
  app.get('/api/tasks', (req: Request, res: Response) => {
    handleGetTasks(req, res, repository);
  });
  app.post('/api/tasks', (req: Request, res: Response) => {
    handleCreateTask(req, res, repository);
  });
  app.get('/api/tasks/:id', (req: Request, res: Response) => {
    handleGetTaskById(req, res, repository);
  });
  app.put('/api/tasks/:id', (req: Request, res: Response) => {
    handleUpdateTask(req, res, repository);
  });
  app.patch('/api/tasks/:id/status', (req: Request, res: Response) => {
    handleUpdateTaskStatus(req, res, repository);
  });
  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    handleDeleteTask(req, res, repository);
  });
  app.get('/api/stats', (req: Request, res: Response) => {
    handleGetStats(req, res, repository);
  });
}
