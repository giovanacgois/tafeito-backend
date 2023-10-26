import { Usuario } from "../usuarios/model";
import {
  AcessoNegado,
  DadosDeEntradaInvalidos,
  DadosOuEstadoInvalido,
  UsuarioNaoAutenticado,
} from "../shared/erros";
import { readFile, writeFile } from "fs/promises";
import knex from "../shared/queryBuilder";
import { totalmem } from "os";

export interface DadosTarefa {
  descricao: string;
  id_categoria: number;
  data_conclusao: Date | null;
}

type IdTarefa = number;

type Tarefa = DadosTarefa & {
  id: IdTarefa;
  id_usuario: number;
  data_conclusao: Date | null;
};

declare module "knex/types/tables" {
  interface Tables {
    tarefas: Tarefa;
  }
}

/* async function carregarTarefas(): Promise<Dados> {
  const dados = await readFile("dados.json", "utf-8");
  return JSON.parse(dados);
}

async function armazenarTarefa(dados: Dados): Promise<void> {
  await writeFile("dados.json", JSON.stringify(dados), "utf-8");
}
 */
export async function cadastrarTarefa(
  usuario: Usuario | null,
  dados: DadosTarefa
): Promise<IdTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  const res = await knex("tarefas")
    .insert({
      ...dados,
      id_usuario: usuario.id,
    })
    .returning<Pick<Tarefa, "id">[]>("id");
  if (res.length === 0) {
    throw new Error("Erro ao cadastrar a tarefa. res === undefined");
  }
  return res[0].id;
}
export async function consultarTarefas(
  usuario: Usuario | null,
  termo?: string
): Promise<DadosTarefa[]> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  let query = knex("tarefas").select(
    "id",
    "descricao",
    "id_categoria",
    "id_usuario",
    "data_conclusao"
  );

  if (!usuario.admin) {
    query = query.where("id_usuario", usuario.id);
  }

  if (termo !== undefined) {
    query = query.where("descricao", "ilike", `%${termo}%`);
  }

  return await query;
}

export async function carregarTarefaPorId(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<DadosTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  const tarefa = await knex("tarefas")
    .select("id", "descricao", "id_categoria", "id_usuario", "data_conclusao")
    .where("id", id)
    .first();

  if (tarefa === undefined) {
    throw new DadosDeEntradaInvalidos(
      "NAO_ENCONTRADO",
      "Tarefa não encontrada"
    );
  }

  if (!usuario.admin && tarefa.id_usuario !== usuario.id) {
    throw new AcessoNegado();
  }
  return tarefa;
}

export async function concluirTarefa(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  await knex("tarefas").where("id", id).update({ data_conclusao: new Date() });
}

export async function reabrirTarefa(
  usuario: Usuario | null,
  id: IdTarefa
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  await knex("tarefas").where("id", id).update({ data_conclusao: null });
}

export async function alterarTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  alteracoes: Partial<DadosTarefa>
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id);
  if (Object.keys(alteracoes).length > 0) {
    await knex("tarefas")
      .update({
        descricao: alteracoes.descricao,
        id_categoria: alteracoes.id_categoria,
      })
      .where("id", id);
  }
}

async function asseguraExistenciaDaTarefaEAcessoDeEdicao(
  usuario: Usuario,
  id: IdTarefa
): Promise<void> {
  const res = await knex("tarefas")
    .select("id_usuario")
    .where("id", id)
    .first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido("Tarefa não encontrada", {
      codigo: "TAREFA_NAO_ENCONTRADA",
    });
  }
  if (!usuario.admin && usuario.id !== res.id_usuario) {
    throw new AcessoNegado();
  }
}
