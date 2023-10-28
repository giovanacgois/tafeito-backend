import util from "util";
import { v4 as uuidv4 } from "uuid";
import { DadosDeEntradaInvalidos, TokenInvalido } from "../shared/erros";
import knex from "../shared/queryBuilder";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Login = string;

export interface Usuario {
  id: number;
  login: Login;
  nome: string;
  senha: string;
  admin: boolean;
}

declare module "knex/types/tables" {
  interface Tables {
    usuarios: Usuario;
  }
}

const JWT_SECRET = (() => {
  const env = process.env.JWT_SECRET;
  if (env === undefined || env === "") {
    throw new Error("Env JWT_SECRET não definida.");
  }
  return env;
})();

export async function autenticar(
  login: Login,
  senha: string
): Promise<IdAutenticacao> {
  const usuario = await knex("usuarios")
    .select("id", "login", "senha", "nome", "admin")
    .where("login", login)
    .first();

  if (usuario === undefined || (await senhaInvalida(senha, usuario.senha))) {
    throw new DadosDeEntradaInvalidos(
      "LOGIN_OU_SENHA_INVALIDOS",
      "Login ou senha inválidos"
    );
  }
  return jwt.sign(
    {
      login,
      exp:
        Math.floor(new Date().getTime() / 1000) +
        10 * 24 * 60 * 60 /* 10 dias */,
    },
    JWT_SECRET
  );
}

export async function recuperarLoginDoUsuarioAutenticado(
  token: IdAutenticacao
): Promise<Usuario> {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    const login = payload.login;
    const usuario = await knex("usuarios")
      .select("id", "login", "senha", "nome", "admin")
      .where("login", login)
      .first();
    if (usuario === undefined) {
      throw new TokenInvalido();
    }
    return usuario;
  } catch (err: any) {
    if (["jwt expired", "invalid signature"].includes(err.message)) {
      throw new TokenInvalido();
    }
    throw err;
  }
}

export async function alterarNome(
  usuario: Usuario,
  novoNome: string
): Promise<void> {
  await pausar(100);
  usuario.nome = novoNome;
}
async function senhaInvalida(senha: string, hash: string): Promise<boolean> {
  const hashCompativel = await bcrypt.compare(senha, hash);
  return !hashCompativel;
}
