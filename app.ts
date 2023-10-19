import fastify from "fastify";

import { cadastrarTarefa, carregarTarefas, DadosTarefa } from "./tarefas/model";
import {
  autenticar,
  recuperarLoginDoUsuarioAutenticado,
} from "./usuarios/model";
import {
  DadosDeEntradaInvalidos,
  TokenInvalido,
  UsuarioNaoAutenticado,
} from "./shared/erros";

const app = fastify({ logger: true });

app.decorateRequest("usuario", null);
app.removeContentTypeParser("text/plain");

app.setNotFoundHandler((req, resp) => {
  resp.status(404).send("Recurso não encontrado");
});

app.setErrorHandler((erro, req, resp) => {
  if (erro instanceof DadosDeEntradaInvalidos) {
    resp.status(422).send({ codigo: erro.codigo, mensagem: erro.message });
  } else if (erro instanceof TokenInvalido) {
    resp.status(401).send({ codigo: "TOKEN_INVALIDO" });
  } else if (erro instanceof UsuarioNaoAutenticado) {
    resp.status(401).send({ codigo: "USUARIO_NAO_AUTENTICADO" });
  } else resp.send(erro);
});

app.addHook("preParsing", async (req, resp) => {
  const { authorization } = req.headers;
  if (authorization !== undefined) {
    const token = authorization.replace("Bearer ", "");
    const usuario = await recuperarLoginDoUsuarioAutenticado(token);
    req.usuario = usuario;
  }
});

app.post("/tarefas", async (req, resp) => {
  const dados = req.body as DadosTarefa;
  const idTarefa = await cadastrarTarefa(req.usuario, dados);
  resp.status(201);
  console.log(req.usuario);
  return { id: idTarefa };
});

app.get("/tarefas", async (req, resp) => {
  const { termo } = req.query as { termo?: string };
  return await carregarTarefas(req.usuario, termo);
});

app.post("/usuarios/login", async (req, resp) => {
  const { login, senha } = req.body as { login: string; senha: string };
  const idAutenticacao = await autenticar(login, senha);
  resp.status(201);
  return { token: idAutenticacao };
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
