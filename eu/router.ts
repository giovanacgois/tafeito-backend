import { FastifyInstance } from "fastify";
import { UsuarioNaoAutenticado } from "../shared/erros";
import { autenticar, alterarNome } from "../usuarios/model";

export default async (app: FastifyInstance) => {
  app.post("/login", async (req, resp) => {
    const { login, senha } = req.body as { login: string; senha: string };
    const idAutenticacao = await autenticar(login, senha);
    resp.status(201);
    return { token: idAutenticacao };
  });

  app.get("/", async (req, resp) => {
    if (req.usuario === null) {
      throw new UsuarioNaoAutenticado();
    }
    return { nome: req.usuario?.nome };
  });

  app.put("/nome", async (req, resp) => {
    if (req.usuario === null) {
      throw new UsuarioNaoAutenticado();
    }

    const { nome } = req.body as { nome: string };
    await alterarNome(req.usuario, nome);
    resp.status(204);
  });
};
