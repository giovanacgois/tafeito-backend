import util from "util";
import { v4 as uuidv4 } from "uuid";
import { DadosDeEntradaInvalidos, TokenInvalido } from "../shared/erros";
import sequelize from "../shared/orm";

import sequelizeLib, { Model } from "sequelize";

const pausar = util.promisify(setTimeout);

type UUIDString = string;
type IdAutenticacao = UUIDString;
type Login = string;

export interface Usuario {
  login: Login;
  nome: string;
  senha: string; //temporário
}

const usuarios: {
  [key: Login]: Usuario | undefined;
} = {
  clara: {
    login: "clara",
    nome: "clara",
    senha: "123456",
  },
  pedro: {
    login: "pedro",
    nome: "pedro",
    senha: "234567",
  },
};

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {
  "98017dc1-e90f-43af-8348-43d459f00c29": usuarios["clara"] as Usuario,
  "d12026f4-471d-4863-9a2c-d7efc8835947": usuarios["pedro"] as Usuario,
};

class UsuarioORM extends Model {
  public id!: number;
  public nome!: string;
  public login!: string;
  public senha!: string;
  public admin!: string;
}

UsuarioORM.init(
  {
    nome: sequelizeLib.STRING,
    login: sequelizeLib.STRING,
    admin: sequelizeLib.BOOLEAN,
    senha: sequelizeLib.STRING,
  },
  {
    sequelize,
    tableName: "usuarios",
  }
);

export async function autenticar(
  login: Login,
  senha: string
): Promise<IdAutenticacao> {
  const usuario = await UsuarioORM.findOne({ where: { login } });

  if (usuario === null || usuario.senha !== senha) {
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
