import {
  renderBoard,
  setupColumns,
  setupCreateForm,
  setupCreateModal,
  setupEditForm,
  setupFilters,
} from "./board.js";

console.log("kanban app iniciando...");

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM carregado, inicializando componentes");

  setupCreateModal();
  setupColumns();
  setupCreateForm();
  setupEditForm();
  setupFilters();

  await renderBoard();

  console.log("app inicializado com sucesso");
});
