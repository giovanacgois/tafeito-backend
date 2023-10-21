import fastify from "fastify";

import {
  cadastrarTarefa,
  carregarTarefaPorId,
  carregarTarefas,
  DadosTarefa,
} from "./tarefas/model";
import { recuperarLoginDoUsuarioAutenticado } from "./usuarios/model";
import {
  AcessoNegado,
  DadosDeEntradaInvalidos,
  TokenInvalido,
  UsuarioNaoAutenticado,
} from "./shared/erros";

import euRouter from "./eu/router";
import tarefasRouter from "./tarefas/router";

const app = fastify({ logger: true });

app.decorateRequest("usuario", null);

app.removeContentTypeParser("text/plain");

app.setNotFoundHandler((req, resp) => {
  resp.status(404).send("Recurso não encontrado");
});

app.register(euRouter, { prefix: "/usuarios" });
app.register(tarefasRouter, { prefix: "/tarefas" });

app.setErrorHandler((erro, req, resp) => {
  if (erro instanceof DadosDeEntradaInvalidos) {
    resp.status(422).send({ codigo: erro.codigo, mensagem: erro.message });
  } else if (erro instanceof TokenInvalido) {
    resp.status(401).send({ codigo: "TOKEN_INVALIDO" });
  } else if (erro instanceof UsuarioNaoAutenticado) {
    resp.status(401).send({ codigo: "USUARIO_NAO_AUTENTICADO" });
  } else if (erro instanceof AcessoNegado) {
    resp.status(403).send({ mensagem: erro.message });
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



async function main() {
  try {
    app.listen({ port: 3000 });
  } catch (err: any) {
    app.log.error(err);
    process.exit();
  }
}

main();
