import util from "util";

interface Tarefa {
  id: IdTarefa;
  descricao: string;
}

export type DadosTarefa = {
  descricao: string;
};

type IdTarefa = number;

const tarefas: Tarefa[] = [];
const pausar = util.promisify(setTimeout);
let sequencial: IdTarefa = 0;

export async function cadastrarTarefa(dados: DadosTarefa): Promise<IdTarefa> {
  await pausar(100);
  sequencial++;
  const idTarefa = sequencial;
  tarefas.push({
    id: sequencial,
    ...dados,
  });
  return idTarefa;
}
export async function carregarTarefas(termo?: string): Promise<Tarefa[]> {
  await pausar(100);
  return tarefas.filter((tarefa) => !termo || tarefa.descricao.includes(termo));
}
