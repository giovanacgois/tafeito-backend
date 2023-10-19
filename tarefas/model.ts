import util from "util";
import { Usuario } from "../usuarios/model";
import { UsuarioNaoAutenticado } from "../shared/erros";

interface Tarefa {
  id: IdTarefa;
  descricao: string;
  loginDoUsuario: string;
}

export type DadosTarefa = {
  descricao: string;
};

type IdTarefa = number;

const tarefas: Tarefa[] = [];
const pausar = util.promisify(setTimeout);
let sequencial: IdTarefa = 0;

export async function cadastrarTarefa(
  usuario: Usuario | null,
  dados: DadosTarefa
): Promise<IdTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  tarefas.push({
    id: sequencial,
    ...dados,
    loginDoUsuario: usuario.login,
  });
  return idTarefa;
}
export async function carregarTarefas(
  usuario: Usuario | null,
  termo?: string
): Promise<Tarefa[]> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  await pausar(100);
  return tarefas
    .filter((tarefa) => tarefa.loginDoUsuario === usuario.login)
    .filter((tarefa) => !termo || tarefa.descricao.includes(termo));
}
