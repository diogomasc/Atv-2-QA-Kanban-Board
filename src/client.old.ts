import { Task, CreateTaskData, UpdateTaskData, Stats } from "./models.js";

var BASE_URL = "http://localhost:5173/api";

export async function fetchAllTasks(status?: any, priority?: any, assignee?: any): Promise<any> {
  console.log("buscando tarefas...");
  var url = BASE_URL + "/tasks";
  var params: any[] = [];

  if (status != null && status != "" && status != undefined) {
    params.push("status=" + status);
  }
  if (priority != null && priority != "" && priority != undefined) {
    params.push("priority=" + priority);
  }
  if (assignee != null && assignee != "" && assignee != undefined) {
    params.push("assignee=" + assignee);
  }

  if (params.length > 0) {
    url = url + "?" + params.join("&");
  }

  var response = await fetch(url);

  if (response.status == 200) {
    var data = await response.json();
    console.log("tarefas recebidas: " + data.length);
    return data;
  } else if (response.status == 404) {
    console.log("nenhuma tarefa encontrada");
    return [];
  } else if (response.status == 500) {
    console.log("erro interno do servidor");
    return [];
  } else {
    console.log("erro desconhecido");
    return [];
  }
}

export async function createTask(data: CreateTaskData): Promise<any> {
  console.log("criando tarefa...", data);
  var response = await fetch(BASE_URL + "/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status == 201) {
    var task: Task = await response.json();
    console.log("tarefa criada com id: " + task.id);
    return task;
  } else if (response.status == 400) {
    var err = await response.json();
    console.log("erro ao criar tarefa: " + err.error);
    return null;
  } else {
    console.log("falha inesperada ao criar tarefa");
    return null;
  }
}

export async function updateTask(id: number, data: UpdateTaskData): Promise<any> {
  console.log("atualizando tarefa id: " + id, data);
  var response = await fetch(BASE_URL + "/tasks/" + id, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 404) {
    console.log("tarefa nao encontrada para atualizar");
    return null;
  } else if (response.status == 400) {
    console.log("dados invalidos para atualizacao");
    return null;
  } else {
    console.log("falha inesperada ao atualizar");
    return null;
  }
}

export async function updateTaskStatus(id: number, status: any): Promise<any> {
  console.log("atualizando status da tarefa id: " + id + " para: " + status);
  var response = await fetch(BASE_URL + "/tasks/" + id + "/status", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: status }),
  });

  if (response.status == 200) {
    return await response.json();
  } else if (response.status == 404) {
    console.log("tarefa nao encontrada");
    return null;
  } else if (response.status == 400) {
    console.log("status invalido ou transicao nao permitida");
    return null;
  } else {
    console.log("erro ao atualizar status");
    return null;
  }
}

export async function deleteTask(id: number): Promise<any> {
  console.log("removendo tarefa id: " + id);
  var response = await fetch(BASE_URL + "/tasks/" + id, {
    method: "DELETE",
  });

  if (response.status == 200) {
    console.log("tarefa removida");
    return true;
  } else if (response.status == 404) {
    console.log("tarefa nao encontrada para remover");
    return false;
  } else {
    console.log("erro ao remover tarefa");
    return false;
  }
}

export async function fetchStats(): Promise<Stats | null> {
  console.log("buscando estatisticas...");
  var response = await fetch(BASE_URL + "/stats");

  if (response.status == 200) {
    return await response.json();
  } else {
    console.log("erro ao buscar estatisticas");
    return null;
  }
}
