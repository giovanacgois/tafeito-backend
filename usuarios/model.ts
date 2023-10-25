import util from "util";
import { v4 as uuidv4 } from "uuid";
import { DadosDeEntradaInvalidos, TokenInvalido } from "../shared/erros";
import knex from "../shared/queryBuilder";
import bcrypt from "bcrypt";

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Login = string;
type Autenticacao = {
  id_usuario: number;
  id: IdAutenticacao;
};

export interface Usuario {
  id: number;
  login: Login;
  nome: string;
  senha: string; //temporário
  admin: boolean;
}

declare module "knex/types/tables" {
  interface Tables {
    usuarios: Usuario;
    autenticacao: Autenticacao;
  }
}
export async function autenticar(
  login: Login,
  senha: string
): Promise<IdAutenticacao> {
  const usuario = await knex("usuarios")
    .select("id", "login", "senha", "nome", "admin")
    .where("login", login)
    .first();

  if (usuario === undefined || !(await bcrypt.compare(senha, usuario.senha))) {
    console.log(usuario);
    console.log(usuario?.senha);
    throw new DadosDeEntradaInvalidos(
      "LOGIN_OU_SENHA_INVALIDOS",
      "Login ou senha inválidos"
    );
  }
  const id = uuidv4();
  await knex("autenticacoes").insert({ id, id_usuario: usuario.id });
  return id;
}

export async function recuperarLoginDoUsuarioAutenticado(token: IdAutenticacao): Promise<Usuario> {
  const usuario = await knex("autenticacoes")
    .join("usuarios", "usuarios.id", "autenticacoes.id_usuario")
    .select<Usuario>("usuarios.id", "login", "senha", "nome", "admin")
    .where("autenticacoes.id", token)
    .first();
  if (usuario === undefined) {
    throw new TokenInvalido();
  }
  return usuario;
}

export async function alterarNome(
  usuario: Usuario,
  novoNome: string
): Promise<void> {
  await pausar(100);
  usuario.nome = novoNome;
}
