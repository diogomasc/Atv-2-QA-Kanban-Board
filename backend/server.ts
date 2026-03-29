import express from 'express';
import cors from 'cors';
import { databaseService } from './database.js';
import { TaskRepository } from './task-repository.js';
import { registerRoutes } from './handlers.js';
import { log } from './logger.js';

const PORT: number = Number(process.env.PORT) || 3000;
const app = express();

app.use(cors());
app.use(express.json());

databaseService.setup();

const repository = new TaskRepository(databaseService);

registerRoutes(app, repository);

app.listen(PORT, (): void => {
  log('server', `servidor rodando na porta ${PORT}`);
});
