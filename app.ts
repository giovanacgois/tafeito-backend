import fastify from "fastify";

import { recuperarLoginDoUsuarioAutenticado } from "./usuarios/model";
import {
  AcessoNegado,
  DadosDeEntradaInvalidos,
  TokenInvalido,
  UsuarioNaoAutenticado,
} from "./shared/erros";

import euRouter from "./usuarios/router";
import tarefasRouter from "./tarefas/router";
import categoriasRouter from "./categorias/router";
import etiquetasRouter from "./etiquetas/router";
import knex from "./shared/queryBuilder";

const app = fastify({ logger: true });

app.decorateRequest("usuario", null);

app.removeContentTypeParser("text/plain");

app.setNotFoundHandler((req, resp) => {
  resp.status(404).send("Recurso não encontrado");
});

app.register(euRouter, { prefix: "/usuarios" });
app.register(tarefasRouter, { prefix: "/tarefas" });
app.register(categoriasRouter, { prefix: "/categorias" });
app.register(etiquetasRouter, { prefix: "/etiquetas" });

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
  const { authorization } = req.headers as { authorization?: string };
  if (authorization !== undefined) {
    const token = authorization.replace("Bearer ", "");
    const usuario = await recuperarLoginDoUsuarioAutenticado(token);
    req.usuario = usuario;
  }
});

app.decorateRequest("uow", null);

app.addHook("preHandler", (req, resp, done) => {
  knex.transaction((trx) => {
    req.uow = trx;
    done();
  });
});

app.addHook("onSend", async (req) => {
  if (req.uow && !req.uow.isCompleted()) {
    console.log("commit");
    await req.uow.commit();
  }
});

app.addHook("onError", async (req) => {
  console.log("rollback");
  await req.uow.rollback();
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
