import fastify from "fastify";
import { DadosTarefa, cadastrarTarefa, carregarTarefas } from "./tarefas/model";

const app = fastify({ logger: true });

app.post("/tarefas", async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const idTarefa = await cadastrarTarefa(dados);
  resp.status(201);
  return { id: idTarefa };
});

app.get("/tarefas", async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  return await carregarTarefas(termo);
});

async function main() {
  try {
    app.listen({ port: 3000 });
  } catch (err: any) {
    app.log.error(err);
    process.exit();
  }
}

main();
