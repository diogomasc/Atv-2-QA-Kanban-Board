import express from "express";
import cors from "cors";
import { setupDatabase } from "./database.js";
import { registerRoutes } from "./handlers.js";

var app = express();
var PORT = 3000;

app.use(cors());
app.use(express.json());

setupDatabase();
registerRoutes(app);

app.listen(PORT, function () {
  console.log("servidor rodando na porta " + PORT);
});
