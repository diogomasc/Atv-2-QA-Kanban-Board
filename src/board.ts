import { Task } from "./models.js";
import {
  fetchAllTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  fetchStats,
} from "./client.js";

var currentEditId: any = null;
var allTasks: any[] = [];

export async function renderBoard(): Promise<any> {
  console.log("renderizando board...");
  allTasks = await fetchAllTasks();
  renderStats();

  var openCol = document.getElementById("col-open");
  var inProgressCol = document.getElementById("col-in-progress");
  var doneCol = document.getElementById("col-done");

  if (openCol == null || inProgressCol == null || doneCol == null) {
    console.log("colunas nao encontradas no DOM");
    return;
  }

  openCol.innerHTML = "";
  inProgressCol.innerHTML = "";
  doneCol.innerHTML = "";

  if (allTasks.length == 0) {
    openCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
    inProgressCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
    doneCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
    return;
  }

  for (var i = 0; i < allTasks.length; i++) {
    var task = allTasks[i];

    if (task.status == "open") {
      openCol.appendChild(buildTaskCard(task));
    } else if (task.status == "in-progress") {
      inProgressCol.appendChild(buildTaskCard(task));
    } else if (task.status == "done") {
      doneCol.appendChild(buildTaskCard(task));
    }
  }
}

function buildTaskCard(task: any): HTMLElement {
  var card = document.createElement("div");
  card.className = "task-card";
  card.setAttribute("data-id", String(task.id));
  card.setAttribute("draggable", "true");

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

  var deadlineHtml = "";
  if (task.deadline != null && task.deadline != "" && task.deadline != undefined) {
    var d = new Date(task.deadline);
    var today = new Date();
    var isOverdue = d < today && task.status != "done";
    deadlineHtml =
      "<span class='deadline " +
      (isOverdue ? "overdue" : "") +
      "'>" +
      "📅 " +
      task.deadline +
      "</span>";
  }

  var assigneeHtml = "";
  if (task.assignee != null && task.assignee != "" && task.assignee != undefined) {
    assigneeHtml = "<span class='assignee'>👤 " + task.assignee + "</span>";
  }

  card.innerHTML =
    "<div class='card-header'>" +
    "<span class='priority-badge' style='background:" + priorityColor + "'>" +
    task.priority +
    "</span>" +
    "<div class='card-actions'>" +
    "<button class='btn-edit' data-id='" + task.id + "'>✏️</button>" +
    "<button class='btn-delete' data-id='" + task.id + "'>🗑️</button>" +
    "</div>" +
    "</div>" +
    "<h3 class='card-title'>" + task.title + "</h3>" +
    "<p class='card-desc'>" + (task.description || "") + "</p>" +
    "<div class='card-meta'>" +
    assigneeHtml +
    deadlineHtml +
    "</div>";

  card.addEventListener("dragstart", function (e: any) {
    console.log("drag start tarefa id: " + task.id);
    e.dataTransfer.setData("text/plain", String(task.id));
    card.classList.add("dragging");
  });

  card.addEventListener("dragend", function () {
    card.classList.remove("dragging");
  });

  var editBtn = card.querySelector(".btn-edit");
  var deleteBtn = card.querySelector(".btn-delete");

  if (editBtn != null) {
    editBtn.addEventListener("click", function () {
      openEditModal(task);
    });
  }

  if (deleteBtn != null) {
    deleteBtn.addEventListener("click", async function () {
      if (confirm("Deseja remover a tarefa '" + task.title + "'?")) {
        var ok = await deleteTask(task.id);
        if (ok) {
          renderBoard();
        } else {
          alert("Erro ao remover tarefa");
        }
      }
    });
  }

  return card;
}

async function renderStats(): Promise<any> {
  var stats = await fetchStats();
  var el = document.getElementById("stats-bar");
  if (el == null || stats == null) {
    return;
  }
  el.innerHTML =
    "<span>Total: " + stats.total + "</span>" +
    " | <span>Abertas: " + stats.byStatus.open + "</span>" +
    " | <span>Em andamento: " + stats.byStatus.inProgress + "</span>" +
    " | <span>Concluídas: " + stats.byStatus.done + "</span>" +
    " | <span>🔴 Alta: " + stats.byPriority.high + "</span>" +
    " | <span>🟡 Média: " + stats.byPriority.medium + "</span>" +
    " | <span>🟢 Baixa: " + stats.byPriority.low + "</span>";
}

export function setupColumns(): void {
  var columns = ["col-open", "col-in-progress", "col-done"];
  var statusMap: any = {
    "col-open": "open",
    "col-in-progress": "in-progress",
    "col-done": "done",
  };

  for (var i = 0; i < columns.length; i++) {
    var colId = columns[i];
    var col = document.getElementById(colId);
    if (col == null) {
      continue;
    }

    col.addEventListener("dragover", function (e: Event) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).classList.add("drag-over");
    });

    col.addEventListener("dragleave", function (e: Event) {
      (e.currentTarget as HTMLElement).classList.remove("drag-over");
    });

    col.addEventListener("drop", async function (e: Event) {
      e.preventDefault();
      var target = e.currentTarget as HTMLElement;
      target.classList.remove("drag-over");
      var taskId = (e as DragEvent).dataTransfer?.getData("text/plain");
      if (taskId == null || taskId == "") {
        return;
      }
      var newStatus = statusMap[target.id];
      console.log("movendo tarefa " + taskId + " para status: " + newStatus);
      var updated = await updateTaskStatus(Number(taskId), newStatus);
      if (updated != null) {
        renderBoard();
      }
    });
  }
}

export function setupCreateForm(): void {
  var form = document.getElementById("create-form");
  if (form == null) {
    return;
  }

  form.addEventListener("submit", async function (e: Event) {
    e.preventDefault();

    var titleEl = document.getElementById("input-title") as HTMLInputElement;
    var descEl = document.getElementById("input-desc") as HTMLTextAreaElement;
    var assigneeEl = document.getElementById("input-assignee") as HTMLInputElement;
    var deadlineEl = document.getElementById("input-deadline") as HTMLInputElement;
    var statusEl = document.getElementById("input-status") as HTMLSelectElement;
    var priorityEl = document.getElementById("input-priority") as HTMLSelectElement;

    var title = titleEl != null ? titleEl.value : "";
    var description = descEl != null ? descEl.value : "";
    var assignee = assigneeEl != null ? assigneeEl.value : "";
    var deadline = deadlineEl != null ? deadlineEl.value : "";
    var status = statusEl != null ? statusEl.value : "open";
    var priority = priorityEl != null ? priorityEl.value : "medium";

    if (title == null || title == "") {
      alert("Título é obrigatório");
      return;
    }

    console.log("submetendo formulario de criacao");

    var task = await createTask({
      title: title,
      description: description,
      assignee: assignee,
      deadline: deadline,
      status: status,
      priority: priority,
    });

    if (task != null) {
      if (titleEl != null) titleEl.value = "";
      if (descEl != null) descEl.value = "";
      if (assigneeEl != null) assigneeEl.value = "";
      if (deadlineEl != null) deadlineEl.value = "";
      closeCreateModal();
      renderBoard();
    } else {
      alert("Erro ao criar tarefa. Verifique os dados.");
    }
  });
}

function openEditModal(task: Task): void {
  currentEditId = task.id;
  var modal = document.getElementById("edit-modal");
  var titleEl = document.getElementById("edit-title") as HTMLInputElement;
  var descEl = document.getElementById("edit-desc") as HTMLTextAreaElement;
  var assigneeEl = document.getElementById("edit-assignee") as HTMLInputElement;
  var deadlineEl = document.getElementById("edit-deadline") as HTMLInputElement;
  var statusEl = document.getElementById("edit-status") as HTMLSelectElement;
  var priorityEl = document.getElementById("edit-priority") as HTMLSelectElement;

  if (modal == null) {
    return;
  }

  if (titleEl != null) titleEl.value = task.title || "";
  if (descEl != null) descEl.value = task.description || "";
  if (assigneeEl != null) assigneeEl.value = task.assignee || "";
  if (deadlineEl != null) deadlineEl.value = task.deadline || "";
  if (statusEl != null) statusEl.value = task.status || "open";
  if (priorityEl != null) priorityEl.value = task.priority || "medium";

  modal.classList.add("open");
}

export function setupEditForm(): void {
  var form = document.getElementById("edit-form");
  if (form == null) {
    return;
  }

  form.addEventListener("submit", async function (e: Event) {
    e.preventDefault();

    if (currentEditId == null) {
      return;
    }

    var titleEl = document.getElementById("edit-title") as HTMLInputElement;
    var descEl = document.getElementById("edit-desc") as HTMLTextAreaElement;
    var assigneeEl = document.getElementById("edit-assignee") as HTMLInputElement;
    var deadlineEl = document.getElementById("edit-deadline") as HTMLInputElement;
    var statusEl = document.getElementById("edit-status") as HTMLSelectElement;
    var priorityEl = document.getElementById("edit-priority") as HTMLSelectElement;

    var title = titleEl != null ? titleEl.value : "";
    var description = descEl != null ? descEl.value : "";
    var assignee = assigneeEl != null ? assigneeEl.value : "";
    var deadline = deadlineEl != null ? deadlineEl.value : "";
    var status = statusEl != null ? statusEl.value : "open";
    var priority = priorityEl != null ? priorityEl.value : "medium";

    if (title == null || title == "") {
      alert("Título é obrigatório");
      return;
    }

    var updated = await updateTask(currentEditId, {
      title: title,
      description: description,
      assignee: assignee,
      deadline: deadline,
      status: status,
      priority: priority,
    });

    if (updated != null) {
      closeEditModal();
      renderBoard();
    } else {
      alert("Erro ao atualizar tarefa");
    }
  });

  var closeBtn = document.getElementById("edit-modal-close");
  if (closeBtn != null) {
    closeBtn.addEventListener("click", function () {
      closeEditModal();
    });
  }
}

function closeEditModal(): void {
  var modal = document.getElementById("edit-modal");
  if (modal != null) {
    modal.classList.remove("open");
  }
  currentEditId = null;
}

export function setupCreateModal(): void {
  var openBtn = document.getElementById("btn-open-create");
  var closeBtn = document.getElementById("create-modal-close");

  if (openBtn != null) {
    openBtn.addEventListener("click", function () {
      var modal = document.getElementById("create-modal");
      if (modal != null) {
        modal.classList.add("open");
      }
    });
  }

  if (closeBtn != null) {
    closeBtn.addEventListener("click", function () {
      closeCreateModal();
    });
  }
}

function closeCreateModal(): void {
  var modal = document.getElementById("create-modal");
  if (modal != null) {
    modal.classList.remove("open");
  }
}

export function setupFilters(): void {
  var filterStatus = document.getElementById("filter-status") as HTMLSelectElement;
  var filterPriority = document.getElementById("filter-priority") as HTMLSelectElement;
  var filterAssignee = document.getElementById("filter-assignee") as HTMLInputElement;
  var btnFilter = document.getElementById("btn-filter");
  var btnClear = document.getElementById("btn-clear-filter");

  if (btnFilter != null) {
    btnFilter.addEventListener("click", async function () {
      var status = filterStatus != null ? filterStatus.value : "";
      var priority = filterPriority != null ? filterPriority.value : "";
      var assignee = filterAssignee != null ? filterAssignee.value : "";

      var openCol = document.getElementById("col-open");
      var inProgressCol = document.getElementById("col-in-progress");
      var doneCol = document.getElementById("col-done");

      if (openCol == null || inProgressCol == null || doneCol == null) {
        return;
      }

      var filtered = await fetchAllTasks(
        status != "" ? status : undefined,
        priority != "" ? priority : undefined,
        assignee != "" ? assignee : undefined
      );

      openCol.innerHTML = "";
      inProgressCol.innerHTML = "";
      doneCol.innerHTML = "";

      if (filtered.length == 0) {
        openCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
        inProgressCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
        doneCol.innerHTML = "<p class='empty'>Nenhuma tarefa</p>";
        return;
      }

      for (var i = 0; i < filtered.length; i++) {
        var task = filtered[i];
        if (task.status == "open") {
          openCol.appendChild(buildTaskCard(task));
        } else if (task.status == "in-progress") {
          inProgressCol.appendChild(buildTaskCard(task));
        } else if (task.status == "done") {
          doneCol.appendChild(buildTaskCard(task));
        }
      }
    });
  }

  if (btnClear != null) {
    btnClear.addEventListener("click", function () {
      if (filterStatus != null) filterStatus.value = "";
      if (filterPriority != null) filterPriority.value = "";
      if (filterAssignee != null) filterAssignee.value = "";
      renderBoard();
    });
  }
}
