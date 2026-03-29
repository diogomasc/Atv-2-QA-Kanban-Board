import { Express, Request, Response } from "express";
import { getDb } from "./database.js";

export function registerRoutes(app: Express): any {
  app.get("/api/tasks", function (req: Request, res: Response) {
    console.log("buscando todas as tarefas");
    var db = getDb();

    var status = req.query.status;
    var priority = req.query.priority;
    var assignee = req.query.assignee;

    var tasks: any[] = [];

    if (status && priority && assignee) {
      tasks = db
        .prepare(
          "SELECT * FROM tasks WHERE status = ? AND priority = ? AND assignee = ?"
        )
        .all(status, priority, assignee);
    } else if (status && priority) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE status = ? AND priority = ?")
        .all(status, priority);
    } else if (status && assignee) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE status = ? AND assignee = ?")
        .all(status, assignee);
    } else if (priority && assignee) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE priority = ? AND assignee = ?")
        .all(priority, assignee);
    } else if (status) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE status = ?")
        .all(status);
    } else if (priority) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE priority = ?")
        .all(priority);
    } else if (assignee) {
      tasks = db
        .prepare("SELECT * FROM tasks WHERE assignee = ?")
        .all(assignee);
    } else {
      tasks = db.prepare("SELECT * FROM tasks").all();
    }

    console.log("tarefas encontradas: " + tasks.length);
    res.status(200).json(tasks);
  });

  app.post("/api/tasks", function (req: Request, res: Response) {
    console.log("criando nova tarefa", req.body);
    var db = getDb();

    var title = req.body.title;
    var description = req.body.description;
    var assignee = req.body.assignee;
    var deadline = req.body.deadline;
    var status = req.body.status;
    var priority = req.body.priority;

    if (title == null || title == "" || title == undefined) {
      res.status(400).json({ error: "titulo obrigatorio" });
      return;
    }

    if (
      status != "open" &&
      status != "in-progress" &&
      status != "done" &&
      status != null &&
      status != undefined
    ) {
      res.status(400).json({ error: "status invalido" });
      return;
    }

    if (
      priority != "low" &&
      priority != "medium" &&
      priority != "high" &&
      priority != null &&
      priority != undefined
    ) {
      res.status(400).json({ error: "prioridade invalida" });
      return;
    }

    var finalStatus = status;
    if (status == null || status == undefined || status == "") {
      finalStatus = "open";
    }

    var finalPriority = priority;
    if (priority == null || priority == undefined || priority == "") {
      finalPriority = "medium";
    }

    var createdAt = new Date().toISOString();

    var result = db
      .prepare(
        "INSERT INTO tasks (title, description, assignee, deadline, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
      .run(
        title,
        description || "",
        assignee || "",
        deadline || "",
        finalStatus,
        finalPriority,
        createdAt
      );

    var task = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(result.lastInsertRowid);

    console.log("tarefa criada com id: " + result.lastInsertRowid);
    res.status(201).json(task);
  });

  app.get("/api/tasks/:id", function (req: Request, res: Response) {
    console.log("buscando tarefa por id: " + req.params.id);
    var db = getDb();

    var id = req.params.id;
    var task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (task == null || task == undefined) {
      console.log("tarefa nao encontrada");
      res.status(404).json({ error: "tarefa nao encontrada" });
      return;
    }

    res.status(200).json(task);
  });

  app.put("/api/tasks/:id", function (req: Request, res: Response) {
    console.log("atualizando tarefa id: " + req.params.id, req.body);
    var db = getDb();

    var id = req.params.id;
    var task: any = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (task == null || task == undefined) {
      res.status(404).json({ error: "tarefa nao encontrada" });
      return;
    }

    var title = req.body.title != undefined ? req.body.title : task.title;
    var description =
      req.body.description != undefined
        ? req.body.description
        : task.description;
    var assignee =
      req.body.assignee != undefined ? req.body.assignee : task.assignee;
    var deadline =
      req.body.deadline != undefined ? req.body.deadline : task.deadline;
    var priority =
      req.body.priority != undefined ? req.body.priority : task.priority;
    var status = req.body.status != undefined ? req.body.status : task.status;

    if (title == null || title == "" || title == undefined) {
      res.status(400).json({ error: "titulo obrigatorio" });
      return;
    }

    if (
      status != "open" &&
      status != "in-progress" &&
      status != "done"
    ) {
      res.status(400).json({ error: "status invalido" });
      return;
    }

    if (
      priority != "low" &&
      priority != "medium" &&
      priority != "high"
    ) {
      res.status(400).json({ error: "prioridade invalida" });
      return;
    }

    db.prepare(
      "UPDATE tasks SET title = ?, description = ?, assignee = ?, deadline = ?, status = ?, priority = ? WHERE id = ?"
    ).run(title, description, assignee, deadline, status, priority, id);

    var updated: any = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(id);

    console.log("tarefa atualizada");
    res.status(200).json(updated);
  });

  app.patch("/api/tasks/:id/status", function (req: Request, res: Response) {
    console.log("atualizando status da tarefa id: " + req.params.id);
    var db = getDb();

    var id = req.params.id;
    var newStatus = req.body.status;

    var task: any = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (task == null || task == undefined) {
      res.status(404).json({ error: "tarefa nao encontrada" });
      return;
    }

    if (
      newStatus != "open" &&
      newStatus != "in-progress" &&
      newStatus != "done"
    ) {
      res.status(400).json({ error: "status invalido" });
      return;
    }

    var allowed = false;
    if (task.status == "open" && newStatus == "in-progress") {
      allowed = true;
    }
    if (task.status == "open" && newStatus == "done") {
      allowed = true;
    }
    if (task.status == "in-progress" && newStatus == "done") {
      allowed = true;
    }
    if (task.status == "in-progress" && newStatus == "open") {
      allowed = true;
    }
    if (task.status == "done" && newStatus == "open") {
      allowed = true;
    }
    if (task.status == "done" && newStatus == "in-progress") {
      allowed = true;
    }
    if (newStatus == task.status) {
      allowed = false;
    }

    if (!allowed) {
      res.status(400).json({ error: "transicao de status invalida" });
      return;
    }

    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(newStatus, id);

    var updated: any = db
      .prepare("SELECT * FROM tasks WHERE id = ?")
      .get(id);

    console.log("status atualizado para: " + newStatus);
    res.status(200).json(updated);
  });

  app.delete("/api/tasks/:id", function (req: Request, res: Response) {
    console.log("removendo tarefa id: " + req.params.id);
    var db = getDb();

    var id = req.params.id;
    var task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);

    if (task == null || task == undefined) {
      res.status(404).json({ error: "tarefa nao encontrada" });
      return;
    }

    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

    console.log("tarefa removida com sucesso");
    res.status(200).json({ message: "tarefa removida com sucesso" });
  });

  app.get("/api/stats", function (req: Request, res: Response) {
    console.log("buscando estatisticas");
    var db = getDb();

    var total: any = db
      .prepare("SELECT COUNT(*) as count FROM tasks")
      .get();
    var open: any = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'open'")
      .get();
    var inProgress: any = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE status = 'in-progress'"
      )
      .get();
    var done: any = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'done'")
      .get();
    var high: any = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE priority = 'high'"
      )
      .get();
    var medium: any = db
      .prepare(
        "SELECT COUNT(*) as count FROM tasks WHERE priority = 'medium'"
      )
      .get();
    var low: any = db
      .prepare("SELECT COUNT(*) as count FROM tasks WHERE priority = 'low'")
      .get();

    var stats = {
      total: total.count,
      byStatus: {
        open: open.count,
        inProgress: inProgress.count,
        done: done.count,
      },
      byPriority: {
        high: high.count,
        medium: medium.count,
        low: low.count,
      },
    };

    console.log("estatisticas: " + JSON.stringify(stats));
    res.status(200).json(stats);
  });
}
