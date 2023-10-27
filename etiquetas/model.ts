import { Knex } from "knex";
import knex from "../shared/queryBuilder";

type FatorRGB = number; // 0-255
type Cor = [FatorRGB, FatorRGB, FatorRGB];

type Etiqueta = {
  id: number;
  descricao: string;
  cor: Cor;
};

declare module "knex/types/tables" {
  interface Tables {
    etiquetas: Etiqueta;
  }
}

export async function cadastrarEtiquetaSeNecessario(
  descricao: string,
): Promise<number> {
  const res = await knex("etiquetas")
    .select("id")
    .where("descricao", descricao)
    .first();

  let id: number;

  if (res !== undefined) {
    id = res.id;
  } else {
    const respostaInsert = await knex("etiquetas")
      .insert({ descricao, cor: gerarCorAleatoria() })
      .returning<{ id: number }[]>("id");
    id = respostaInsert[0].id;
  }

  return id;
}

function gerarCorAleatoria(): Cor {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
}
