import { FastifyInstance } from "fastify";
import {
  DadosTarefa,
  cadastrarTarefa,
  carregarTarefas,
  carregarTarefaPorId,
} from "./model";

export default async (app: FastifyInstance) => {
  app.post("/", async (req, resp) => {
    const dados = req.body as DadosTarefa;
    const idTarefa = await cadastrarTarefa(req.usuario, dados);
    resp.status(201);
    console.log(req.usuario);
    return { id: idTarefa };
  });

  app.get("/", async (req, resp) => {
    const { termo } = req.query as { termo?: string };
    const tarefas = await carregarTarefas(req.usuario, termo);
    return tarefas.map((tarefa) => ({
      id: tarefa.id,
      descricao: tarefa.descricao,
    }));
  });

  app.get("/:id", async (req, resp) => {
    const { id: idStr } = req.params as { id: string };
    const id = Number(idStr);
    const tarefa = await carregarTarefaPorId(req.usuario, id);
    return { descricao: tarefa.descricao };
  });
};
