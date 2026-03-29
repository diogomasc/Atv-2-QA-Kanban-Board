import { Task, TaskPriority, TaskStatus, TaskFilter, UpdateTaskData, TASK_STATUS } from './models.js';
import {
  fetchAllTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  fetchStats,
} from './client.js';

// --- Constantes e Mapas ---
const PRIORITY_COLORS: Readonly<Record<TaskPriority, string>> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const PRIORITY_LABELS: Readonly<Record<TaskPriority, string>> = {
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa',
};

const DEFAULT_PRIORITY_COLOR = '#6b7280';

const COLUMN_IDS: readonly string[] = ['col-open', 'col-in-progress', 'col-done'];

const COLUMN_STATUS_MAP: Readonly<Record<string, TaskStatus>> = {
  'col-open': TASK_STATUS.OPEN,
  'col-in-progress': TASK_STATUS.IN_PROGRESS,
  'col-done': TASK_STATUS.DONE,
};

const STATUS_COLUMN_MAP: Record<string, 'open' | 'inProgress' | 'done'> = {
  'open': 'open',
  'in-progress': 'inProgress',
  'done': 'done',
};

// --- Estado ---
let currentEditId: number | null = null;
let allTasks: Task[] = [];

// --- Funções auxiliares (< 30 linhas cada) ---
function getPriorityColor(priority: TaskPriority): string {
  return PRIORITY_COLORS[priority] ?? DEFAULT_PRIORITY_COLOR;
}

function getPriorityLabel(priority: TaskPriority): string {
  return PRIORITY_LABELS[priority] ?? priority;
}

function buildDeadlineHtml(deadline: string, status: TaskStatus): string {
  if (!deadline || deadline.trim() === '') {
    return '';
  }
  const d = new Date(deadline);
  const today = new Date();
  const isOverdue = d < today && status !== TASK_STATUS.DONE;
  const cls = isOverdue ? 'deadline overdue' : 'deadline';
  return `<span class='${cls}'>📅 ${deadline}</span>`;
}

function buildAssigneeHtml(assignee: string): string {
  if (!assignee || assignee.trim() === '') {
    return '';
  }
  return `<span class='assignee'>👤 ${assignee}</span>`;
}

function buildCardInnerHtml(task: Task): string {
  const color = getPriorityColor(task.priority);
  const label = getPriorityLabel(task.priority);
  const assignee = buildAssigneeHtml(task.assignee);
  const deadline = buildDeadlineHtml(task.deadline, task.status);
  const desc = task.description || '';

  return `<div class='card-header'>` +
    `<span class='priority-badge' style='background:${color}'>${label}</span>` +
    `<div class='card-actions'>` +
    `<button class='btn-edit' data-id='${task.id}'>✏️</button>` +
    `<button class='btn-delete' data-id='${task.id}'>🗑️</button>` +
    `</div></div>` +
    `<h3 class='card-title'>${task.title}</h3>` +
    `<p class='card-desc'>${desc}</p>` +
    `<div class='card-meta'>${assignee}${deadline}</div>` +
    buildStatusSelectHtml(task);
}

function buildStatusSelectHtml(task: Task): string {
  const sel = (v: string): string => task.status === v ? ' selected' : '';
  return `<select class='card-status-select' data-id='${task.id}'>` +
    `<option value='open'${sel('open')}>🔵 Aberta</option>` +
    `<option value='in-progress'${sel('in-progress')}>🟡 Em andamento</option>` +
    `<option value='done'${sel('done')}>🟢 Concluída</option>` +
    `</select>`;
}

function getColumns(): { open: HTMLElement; inProgress: HTMLElement; done: HTMLElement } | null {
  const open = document.getElementById('col-open');
  const inProgress = document.getElementById('col-in-progress');
  const done = document.getElementById('col-done');
  if (open === null || inProgress === null || done === null) {
    return null;
  }
  return { open, inProgress, done };
}

function clearColumns(): void {
  const cols = getColumns();
  if (cols === null) {
    return;
  }
  cols.open.innerHTML = '';
  cols.inProgress.innerHTML = '';
  cols.done.innerHTML = '';
}

function showEmptyMessage(): void {
  const cols = getColumns();
  if (cols === null) {
    return;
  }
  const msg = "<p class='empty'>Nenhuma tarefa</p>";
  cols.open.innerHTML = msg;
  cols.inProgress.innerHTML = msg;
  cols.done.innerHTML = msg;
}

function appendCardToColumn(task: Task, cols: { open: HTMLElement; inProgress: HTMLElement; done: HTMLElement }): void {
  const colKey = STATUS_COLUMN_MAP[task.status] ?? 'open';
  const card = buildTaskCard(task);
  cols[colKey].appendChild(card);
}

function distributeTasksByColumn(tasks: Task[]): void {
  const cols = getColumns();
  if (cols === null) {
    return;
  }
  clearColumns();
  if (tasks.length === 0) {
    showEmptyMessage();
    return;
  }
  for (const task of tasks) {
    appendCardToColumn(task, cols);
  }
}

function setupCardDrag(card: HTMLElement, taskId: number): void {
  card.addEventListener('dragstart', (e: DragEvent): void => {
    e.dataTransfer?.setData('text/plain', String(taskId));
    card.classList.add('dragging');
  });
  card.addEventListener('dragend', (): void => {
    card.classList.remove('dragging');
  });
}

function setupCardStatusSelect(card: HTMLElement, task: Task): void {
  const select = card.querySelector('.card-status-select') as HTMLSelectElement | null;
  if (select === null) {
    return;
  }
  select.addEventListener('mousedown', (e: Event): void => {
    e.stopPropagation();
  });
  select.addEventListener('change', async (e: Event): Promise<void> => {
    e.stopPropagation();
    const newStatus = (e.target as HTMLSelectElement).value as TaskStatus;
    if (newStatus === task.status) {
      return;
    }
    const updated = await updateTaskStatus(task.id, newStatus);
    if (updated !== null) {
      await renderBoard();
    } else {
      alert('Erro ao atualizar status');
    }
  });
}

function setupCardButtons(card: HTMLElement, task: Task): void {
  const editBtn = card.querySelector('.btn-edit');
  const deleteBtn = card.querySelector('.btn-delete');

  if (editBtn !== null) {
    editBtn.addEventListener('click', (): void => {
      openEditModal(task);
    });
  }
  if (deleteBtn !== null) {
    deleteBtn.addEventListener('click', async (): Promise<void> => {
      if (confirm(`Deseja remover a tarefa '${task.title}'?`)) {
        const ok = await deleteTask(task.id);
        if (ok) {
          await renderBoard();
        } else {
          alert('Erro ao remover tarefa');
        }
      }
    });
  }
}

function buildTaskCard(task: Task): HTMLElement {
  const card = document.createElement('div');
  card.className = 'task-card';
  card.setAttribute('data-id', String(task.id));
  card.setAttribute('draggable', 'true');
  card.innerHTML = buildCardInnerHtml(task);

  setupCardDrag(card, task.id);
  setupCardStatusSelect(card, task);
  setupCardButtons(card, task);
  return card;
}

// --- Render Stats ---
async function renderStats(): Promise<void> {
  const stats = await fetchStats();
  const el = document.getElementById('stats-bar');
  if (el === null || stats === null) {
    return;
  }
  el.innerHTML =
    `<span>Total: ${stats.total}</span>` +
    ` | <span>Abertas: ${stats.byStatus.open}</span>` +
    ` | <span>Em andamento: ${stats.byStatus.inProgress}</span>` +
    ` | <span>Concluídas: ${stats.byStatus.done}</span>` +
    ` | <span>🔴 Alta: ${stats.byPriority.high}</span>` +
    ` | <span>🟡 Média: ${stats.byPriority.medium}</span>` +
    ` | <span>🟢 Baixa: ${stats.byPriority.low}</span>`;
}

// --- Board principal ---
export async function renderBoard(): Promise<void> {
  allTasks = await fetchAllTasks();
  await renderStats();
  distributeTasksByColumn(allTasks);
}

// --- Drag & Drop das Colunas ---
export function setupColumns(): void {
  for (const colId of COLUMN_IDS) {
    const col = document.getElementById(colId);
    if (col === null) {
      continue;
    }
    col.addEventListener('dragover', (e: Event): void => {
      e.preventDefault();
      (e.currentTarget as HTMLElement).classList.add('drag-over');
    });
    col.addEventListener('dragleave', (e: Event): void => {
      (e.currentTarget as HTMLElement).classList.remove('drag-over');
    });
    col.addEventListener('drop', async (e: Event): Promise<void> => {
      e.preventDefault();
      const target = e.currentTarget as HTMLElement;
      target.classList.remove('drag-over');
      const taskId = (e as DragEvent).dataTransfer?.getData('text/plain');
      if (!taskId || taskId === '') {
        return;
      }
      const newStatus = COLUMN_STATUS_MAP[target.id];
      const updated = await updateTaskStatus(Number(taskId), newStatus);
      if (updated !== null) {
        await renderBoard();
      }
    });
  }
}

// --- Formulário de Criação ---
function getInputValue(id: string, fallback: string = ''): string {
  const el = document.getElementById(id) as HTMLInputElement | null;
  return el !== null ? el.value : fallback;
}

function clearInputs(ids: readonly string[]): void {
  for (const id of ids) {
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (el !== null) {
      el.value = '';
    }
  }
}

export function setupCreateForm(): void {
  const form = document.getElementById('create-form');
  if (form === null) {
    return;
  }
  form.addEventListener('submit', async (e: Event): Promise<void> => {
    e.preventDefault();
    const title = getInputValue('input-title');
    if (title === '') {
      alert('Título é obrigatório');
      return;
    }
    const task = await createTask({
      title,
      description: getInputValue('input-desc'),
      assignee: getInputValue('input-assignee'),
      deadline: getInputValue('input-deadline'),
      status: getInputValue('input-status', 'open') as TaskStatus,
      priority: getInputValue('input-priority', 'medium') as TaskPriority,
    });
    if (task !== null) {
      clearInputs(['input-title', 'input-desc', 'input-assignee', 'input-deadline']);
      closeCreateModal();
      await renderBoard();
    } else {
      alert('Erro ao criar tarefa. Verifique os dados.');
    }
  });
}

// --- Modal de Edição ---
const EDIT_FIELD_DEFAULTS: ReadonlyArray<[string, keyof Task, string]> = [
  ['edit-title', 'title', ''],
  ['edit-desc', 'description', ''],
  ['edit-assignee', 'assignee', ''],
  ['edit-deadline', 'deadline', ''],
  ['edit-status', 'status', 'open'],
  ['edit-priority', 'priority', 'medium'],
];

function populateEditFields(task: Task): void {
  for (const [id, key, fallback] of EDIT_FIELD_DEFAULTS) {
    setInputValue(id, String(task[key] || fallback));
  }
}

function openEditModal(task: Task): void {
  currentEditId = task.id;
  const modal = document.getElementById('edit-modal');
  if (modal === null) {
    return;
  }
  populateEditFields(task);
  modal.classList.add('open');
}

function setInputValue(id: string, value: string): void {
  const el = document.getElementById(id) as HTMLInputElement | null;
  if (el !== null) {
    el.value = value;
  }
}

function collectEditFormData(): UpdateTaskData {
  return {
    title: getInputValue('edit-title'),
    description: getInputValue('edit-desc'),
    assignee: getInputValue('edit-assignee'),
    deadline: getInputValue('edit-deadline'),
    status: getInputValue('edit-status', 'open') as TaskStatus,
    priority: getInputValue('edit-priority', 'medium') as TaskPriority,
  };
}

async function handleEditSubmit(e: Event): Promise<void> {
  e.preventDefault();
  if (currentEditId === null) {
    return;
  }
  const data = collectEditFormData();
  if (data.title === '') {
    alert('Título é obrigatório');
    return;
  }
  const updated = await updateTask(currentEditId, data);
  if (updated !== null) {
    closeEditModal();
    await renderBoard();
  } else {
    alert('Erro ao atualizar tarefa');
  }
}

export function setupEditForm(): void {
  const form = document.getElementById('edit-form');
  if (form === null) {
    return;
  }
  form.addEventListener('submit', handleEditSubmit);
  const closeBtn = document.getElementById('edit-modal-close');
  if (closeBtn !== null) {
    closeBtn.addEventListener('click', (): void => {
      closeEditModal();
    });
  }
}

function closeEditModal(): void {
  const modal = document.getElementById('edit-modal');
  if (modal !== null) {
    modal.classList.remove('open');
  }
  currentEditId = null;
}

// --- Modal de Criação ---
export function setupCreateModal(): void {
  const openBtn = document.getElementById('btn-open-create');
  const closeBtn = document.getElementById('create-modal-close');

  if (openBtn !== null) {
    openBtn.addEventListener('click', (): void => {
      const modal = document.getElementById('create-modal');
      if (modal !== null) {
        modal.classList.add('open');
      }
    });
  }
  if (closeBtn !== null) {
    closeBtn.addEventListener('click', (): void => {
      closeCreateModal();
    });
  }
}

function closeCreateModal(): void {
  const modal = document.getElementById('create-modal');
  if (modal !== null) {
    modal.classList.remove('open');
  }
}

// --- Filtros ---
export function setupFilters(): void {
  const btnFilter = document.getElementById('btn-filter');
  const btnClear = document.getElementById('btn-clear-filter');

  if (btnFilter !== null) {
    btnFilter.addEventListener('click', async (): Promise<void> => {
      const filter: TaskFilter = {
        status: getInputValue('filter-status') as TaskFilter['status'] || undefined,
        priority: getInputValue('filter-priority') as TaskFilter['priority'] || undefined,
        assignee: getInputValue('filter-assignee') || undefined,
      };
      const filtered = await fetchAllTasks(filter);
      distributeTasksByColumn(filtered);
    });
  }
  if (btnClear !== null) {
    btnClear.addEventListener('click', (): void => {
      clearInputs(['filter-status', 'filter-priority', 'filter-assignee']);
      void renderBoard();
    });
  }
}
