import { Usuario } from "../usuarios/model";
import {
  AcessoNegado,
  DadosDeEntradaInvalidos,
  UsuarioNaoAutenticado,
} from "../shared/erros";
import { readFile, writeFile } from "fs/promises";

interface Tarefa {
  id: IdTarefa;
  descricao: string;
  loginDoUsuario: string;
  dataConclusao: Date | null;
}

export type DadosTarefa = {
  descricao: string;
  dataConclusao: Date | null;
};

type IdTarefa = number;

type Identificavel = {
  id: number;
};

type Dados = {
  sequencial: number;
  tarefas: Tarefa[];
};
async function carregarTarefas(): Promise<Dados> {
  const dados = await readFile("dados.json", "utf-8");
  return JSON.parse(dados);
}

async function armazenarTarefa(dados: Dados): Promise<void> {
  await writeFile("dados.json", JSON.stringify(dados), "utf-8");
}

export async function cadastrarTarefa(
  usuario: Usuario | null,
  dados: DadosTarefa
): Promise<IdTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  let { sequencial, tarefas } = await carregarTarefas();
  sequencial++;
  const idTarefa = sequencial;
  const tarefa = {
    id: sequencial,
    ...dados,
    loginDoUsuario: usuario.login,
    dataConclusao: null,
  };
  tarefas.push(tarefa);
  await armazenarTarefa({ sequencial, tarefas });
  return idTarefa;
}

export async function consultarTarefas(
  usuario: Usuario | null,
  termo?: string
): Promise<(DadosTarefa & Identificavel)[]> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  const { tarefas } = await carregarTarefas();
  return tarefas
    .filter((tarefa) => tarefa.loginDoUsuario === usuario.login)
    .filter((tarefa) => !termo || tarefa.descricao.includes(termo))
    .map((tarefa) => ({
      id: tarefa.id,
      descricao: tarefa.descricao,
      dataConclusao: tarefa.dataConclusao,
    }));
}

export async function carregarTarefaPorId(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<DadosTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  const { tarefas } = await carregarTarefas();
  const tarefa = tarefas.find((tarefa) => tarefa.id === id);
  if (tarefa === undefined) {
    throw new DadosDeEntradaInvalidos(
      "NAO_ENCONTRADO",
      "Tarefa não encontrada"
    );
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }
  return { descricao: tarefa.descricao, dataConclusao: tarefa.dataConclusao };
}

export async function concluirTarefa(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  const {sequencial, tarefas } = await carregarTarefas();
  const tarefa = tarefas.find((tarefa) => tarefa.id === id);
  if (tarefa === undefined) {
    throw new DadosDeEntradaInvalidos(
      "NAO_ENCONTRADO",
      "Tarefa não encontrada"
    );
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }

  tarefa.dataConclusao = new Date();
  await armazenarTarefa({ sequencial, tarefas });
}

export async function reabrirTarefa(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }
  const {sequencial, tarefas } = await carregarTarefas();
  const tarefa = tarefas.find((tarefa) => tarefa.id === id);
  if (tarefa === undefined) {
    throw new DadosDeEntradaInvalidos(
      "NAO_ENCONTRADO",
      "Tarefa não encontrada"
    );
  }
  if (tarefa.loginDoUsuario !== usuario.login) {
    throw new AcessoNegado();
  }

  tarefa.dataConclusao = null;
  await armazenarTarefa({ sequencial, tarefas });
}
