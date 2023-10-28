import { Usuario } from "../usuarios/model";
import {
  AcessoNegado,
  DadosDeEntradaInvalidos,
  DadosOuEstadoInvalido,
  UsuarioNaoAutenticado,
} from "../shared/erros";
import { cadastrarEtiquetaSeNecessario } from "../etiquetas/model";
import { Knex } from "knex";
import { Chatbot } from "../chatbot/api";

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

type TarefaDetalhada = Tarefa & {
  etiquetas: string[];
};

declare module "knex/types/tables" {
  interface Tables {
    tarefas: Tarefa;
  }
}

export async function cadastrarTarefa(
  usuario: Usuario | null,
  dados: DadosTarefa,
  uow: Knex
): Promise<IdTarefa> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  const res = await uow("tarefas")
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
  uow: Knex,
  termo?: string
): Promise<TarefaDetalhada[]> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  let query = uow("tarefas").select(
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
  const tarefas = await query;

  const tarefasDetalhadas: TarefaDetalhada[] = [];

  const idsTarefas = tarefas.map((x) => x.id);
  const registrosDeEtiqueta = await uow("etiquetas")
    .select("descricao", "tarefa_etiqueta.id_tarefa")
    .join("tarefa_etiqueta", "etiquetas.id", "tarefa_etiqueta.id_etiqueta")
    .whereIn("tarefa_etiqueta.id_tarefa", idsTarefas);

  for (const tarefa of tarefas) {
    tarefasDetalhadas.push({
      ...tarefa,
      etiquetas: registrosDeEtiqueta
        .filter((x) => x.id_tarefa === tarefa.id)
        .map((etiqueta) => etiqueta.descricao),
    });
  }
  return tarefasDetalhadas;
}

export async function carregarTarefaPorId(
  usuario: Usuario | null,
  id: IdTarefa,
  uow: Knex
): Promise<TarefaDetalhada> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  const tarefa = await uow("tarefas")
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

  const registrosDeEtiqueta = await uow("etiquetas")
    .select("descricao")
    .join("tarefa_etiqueta", "etiquetas.id", "tarefa_etiqueta.id_etiqueta")
    .where("tarefa_etiqueta.id_tarefa", id);

  return {
    ...tarefa,
    etiquetas: registrosDeEtiqueta.map((etiqueta) => etiqueta.descricao),
  };
}

export async function concluirTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  uow: Knex
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow("tarefas").where("id", id).update({ data_conclusao: new Date() });
}

export async function reabrirTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  uow: Knex
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow("tarefas").where("id", id).update({ data_conclusao: null });
}

export async function alterarTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  alteracoes: Partial<DadosTarefa>,
  uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  if (Object.keys(alteracoes).length > 0) {
    await uow("tarefas")
      .update({
        descricao: alteracoes.descricao,
        id_categoria: alteracoes.id_categoria,
      })
      .where("id", id);
  }
}

export async function excluirTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  uow: Knex
): Promise<void> {
  if (usuario == null) {
    throw new UsuarioNaoAutenticado();
  }

  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  await uow("tarefa_etiqueta").where("id_tarefa", id).delete();
  await uow("tarefas").where("id", id).delete();
}

async function asseguraExistenciaDaTarefaEAcessoDeEdicao(
  usuario: Usuario,
  id: IdTarefa,
  uow: Knex
): Promise<void> {
  const res = await uow("tarefas").select("id_usuario").where("id", id).first();
  if (res === undefined) {
    throw new DadosOuEstadoInvalido("Tarefa não encontrada", {
      codigo: "TAREFA_NAO_ENCONTRADA",
    });
  }
  if (!usuario.admin && usuario.id !== res.id_usuario) {
    throw new AcessoNegado();
  }
}

export async function vincularEtiquetaNaTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  etiqueta: string,
  uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta, uow);

  await uow("tarefa_etiqueta")
    .insert({
      id_tarefa: id,
      id_etiqueta: idEtiqueta,
    })
    .onConflict(["id_tarefa", "id_etiqueta"])
    .ignore();
}

export async function desvincularEtiquetaDaTarefa(
  usuario: Usuario | null,
  id: IdTarefa,
  etiqueta: string,
  uow: Knex
): Promise<void> {
  if (usuario === null) {
    throw new UsuarioNaoAutenticado();
  }
  await asseguraExistenciaDaTarefaEAcessoDeEdicao(usuario, id, uow);
  const idEtiqueta = await cadastrarEtiquetaSeNecessario(etiqueta, uow);

  await uow("tarefa_etiqueta")
    .insert({
      id_tarefa: id,
      id_etiqueta: idEtiqueta,
    })
    .onConflict(["id_tarefa", "id_etiqueta"])
    .ignore();
}

export async function planejarTarefasDoProjeto(
  descricao: string,
  chat: Chatbot
): Promise<string[]> {
  const resposta = await chat.obterListaDeFrases({
    contexto: `Tafeito é um sistema de gestão de tarefas individual.  Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma simples frase com no máximo 150 caracteres. Entenda a frase do usuário como o projeto ou objetivo que ele deseja atingir e escreva uma ou mais tarefas para o Tafeito, em formato de array de strings em Javascript.`,
    entrada: descricao,
  });
  return resposta;
}

export async function sugerirProximaTarefa(
  usuario: Usuario,
  uow: Knex,
  chatbot: Chatbot
): Promise<string> {
  const historico = await uow("tarefas")
    .select("descricao")
    .where("id_usuario", usuario.id)
    .orderBy("id", "desc")
    .limit(10);
  return await chatbot.obterFraseUnica({
    contexto: `Tafeito é um sistema de gestão de tarefas (TODO) individual.
      Você é um gerador de tarefas para o Tafeito. Uma tarefa do Tafeito é uma
      simples frase com no máximo 150 caracteres. Você vai sugerir a tarefa que 
      faria mais sentido ser a próxima para este usuário, baseando-se nas seguintes
      tarefas presentes no seu histórico:

      ${historico.map((tarefa) => tarefa.descricao).join("\n")}`,
  });
}
