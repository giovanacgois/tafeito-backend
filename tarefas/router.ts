import { FastifyInstance, FastifySchema } from "fastify";
import {
  DadosTarefa,
  cadastrarTarefa,
  consultarTarefas,
  carregarTarefaPorId,
  concluirTarefa,
  reabrirTarefa,
} from "./model";

export default async (app: FastifyInstance) => {
  const postSchema: FastifySchema = {
    body: {
      type: "object",
      properties: {
        descricao: { type: "string" },
      },
      required: ["descricao"],
      additionalProperties: false,
    },
    response: {
      201: {
        type: "object",
        properties: {
          id: { type: "number" },
        },
        additionalProperties: false,
      },
    },
  };

  const getSchema: FastifySchema = {
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "number" },
            descricao: { type: "string" },
            concluida: { type: "boolean" },
          },
          required: ["descricao"],
          additionalProperties: false,
        },
      },
    },
  };

  const getSingleSchema: FastifySchema = {
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "number" },
          descricao: { type: "string" },
          concluida: { type: "boolean" },
        },
        required: ["descricao"],
        additionalProperties: false,
      },
    },
  };

  app.post("/", { schema: postSchema }, async (req, resp) => {
    const dados = req.body as DadosTarefa;
    const idTarefa = await cadastrarTarefa(req.usuario, dados);
    resp.status(201);
    return { id: idTarefa };
  });

  app.get("/", { schema: getSchema }, async (req, resp) => {
    const { termo } = req.query as { termo?: string };
    const tarefas = await consultarTarefas(req.usuario, termo);
    return tarefas.map((tarefa) => ({
      id: tarefa.id,
      descricao: tarefa.descricao,
      concluida: tarefa.dataConclusao !== null,
    }));
  });

  app.get("/:id", { schema: getSingleSchema }, async (req, resp) => {
    const { id: idStr } = req.params as { id: string };
    const id = Number(idStr);
    const tarefa = await carregarTarefaPorId(req.usuario, id);
    return {
      descricao: tarefa.descricao,
      concluida: tarefa.dataConclusao !== null,
    };
  });

  app.post("/:id/concluir", async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await concluirTarefa(req.usuario, idTarefa);
    resp.status(204);
  });

  app.post("/:id/reabrir", async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await reabrirTarefa(req.usuario, idTarefa);
    resp.status(204);
  });
};
