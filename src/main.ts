import {
  renderBoard,
  setupColumns,
  setupCreateForm,
  setupCreateModal,
  setupEditForm,
  setupFilters,
} from './board.js';

document.addEventListener('DOMContentLoaded', async (): Promise<void> => {
  setupCreateModal();
  setupColumns();
  setupCreateForm();
  setupEditForm();
  setupFilters();
  await renderBoard();
});
