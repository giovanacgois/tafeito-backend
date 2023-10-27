import { FastifyInstance, FastifySchema } from "fastify";
import {
  DadosTarefa,
  alterarTarefa,
  cadastrarTarefa,
  carregarTarefaPorId,
  concluirTarefa,
  consultarTarefas,
  desvincularEtiquetaDaTarefa,
  excluirTarefa,
  reabrirTarefa,
  vincularEtiquetaNaTarefa,
} from "./model";

export default async (app: FastifyInstance) => {
  const postSchema: FastifySchema = {
    body: {
      type: "object",
      properties: {
        descricao: { type: "string" },
        id_categoria: { type: "number" },
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
    const idTarefa = await cadastrarTarefa(req.usuario, dados, req.uow);
    resp.status(201);
    return { id: idTarefa };
  });

  app.get("/", { schema: getSchema }, async (req, resp) => {
    const { termo } = req.query as { termo?: string };
    const tarefas = await consultarTarefas(req.usuario, req.uow, termo);
    return tarefas.map((tarefa) => ({
      descricao: tarefa.descricao,
      concluida: tarefa.data_conclusao !== null,
    }));
  });

  app.get("/:id", { schema: getSingleSchema }, async (req, resp) => {
    const { id: idStr } = req.params as { id: string };
    const id = Number(idStr);
    const tarefa = await carregarTarefaPorId(req.usuario, id, req.uow);
    return {
      descricao: tarefa.descricao,
      concluida: tarefa.data_conclusao !== null,
    };
  });

  app.patch("/:id", { schema: getSingleSchema }, async (req, resp) => {
    const { id: idStr } = req.params as { id: string };
    const idTarefa = Number(idStr);
    const alteracoes = req.body as Partial<DadosTarefa>;
    await alterarTarefa(req.usuario, idTarefa, alteracoes, req.uow);
    resp.status(204);
  });

  app.delete("/:id", async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await excluirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.post("/:id/concluir", async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await concluirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.post("/:id/reabrir", async (req, resp) => {
    const { id } = req.params as { id: string };
    const idTarefa = Number(id);
    await reabrirTarefa(req.usuario, idTarefa, req.uow);
    resp.status(204);
  });

  app.post("/:id/etiquetas/:etiqueta", async (req, resp) => {
    const { id, etiqueta } = req.params as { id: string; etiqueta: string };
    const idTarefa = Number(id);
    await vincularEtiquetaNaTarefa(req.usuario, idTarefa, etiqueta, req.uow);
    resp.status(204);
  });

  app.delete("/:id/etiquetas/:etiqueta", async (req, resp) => {
    const { id, etiqueta } = req.params as { id: string; etiqueta: string };
    const idTarefa = Number(id);
    await desvincularEtiquetaDaTarefa(req.usuario, idTarefa, etiqueta, req.uow);
    resp.status(204);
  });
};
