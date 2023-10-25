import util from "util";
import { v4 as uuidv4 } from "uuid";
import { DadosDeEntradaInvalidos, TokenInvalido } from "../shared/erros";
import knex from "../shared/queryBuilder";
const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Login = string;

export interface Usuario {
  login: Login;
  nome: string;
  senha: string; //temporário
  admin: boolean;
}

const usuarios: {
  [key: Login]: Usuario | undefined;
} = {
  clara: {
    login: "clara",
    nome: "clara",
    senha: "123456",
    admin: true
  },
  pedro: {
    login: "pedro",
    nome: "pedro",
    senha: "234567",
    admin: false
  },
};

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {
  "98017dc1-e90f-43af-8348-43d459f00c29": usuarios["clara"] as Usuario,
  "d12026f4-471d-4863-9a2c-d7efc8835947": usuarios["pedro"] as Usuario,
};

declare module "knex/types/tables" {
  interface Tables {
    usuarios: Usuario;
  }
}
export async function autenticar(
  login: Login,
  senha: string
): Promise<IdAutenticacao> {
  const usuario = await knex("usuarios")
    .select("login", "senha", "nome", "admin")
    .where("login", login)
    .first();

  if (usuario === undefined || usuario.senha !== senha) {
    console.log(usuario);
    console.log(usuario?.senha);
    throw new DadosDeEntradaInvalidos(
      "LOGIN_OU_SENHA_INVALIDOS",
      "Login ou senha inválidos"
    );
  }
  const id = uuidv4();
  autenticacoes[id] = { ...usuario };
  return id;
}

export async function recuperarLoginDoUsuarioAutenticado(
  token: IdAutenticacao
): Promise<Usuario> {
  await pausar(100);
  const usuario = autenticacoes[token];
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
