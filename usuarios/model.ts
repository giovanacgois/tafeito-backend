import util from 'util';
import { v4 as uuidv4 } from 'uuid';
import { DadosDeEntradaInvalidos, TokenInvalido } from '../shared/erros';

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
    login: 'clara',
    nome: 'clara',
    senha: '123456',
  },
  pedro: {
    login: 'pedro',
    nome: 'pedro',
    senha: '234567',
  },
};

const autenticacoes: { [key: IdAutenticacao]: Usuario } = {
  '98017dc1-e90f-43af-8348-43d459f00c29': usuarios['clara'] as Usuario,
  'd12026f4-471d-4863-9a2c-d7efc8835947': usuarios['pedro'] as Usuario,
};

export async function autenticar(
  login: Login,
  senha: string
): Promise<IdAutenticacao> {
  await pausar(100);
  const usuario = usuarios[login];

  if (usuario?.senha !== senha) {
    throw new DadosDeEntradaInvalidos('LOGIN_OU_SENHA_INVALIDOS', 'Login ou senha inválidos');
  }
  const id = uuidv4();
  autenticacoes[id] = usuario;
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
  return usuario ;
}
