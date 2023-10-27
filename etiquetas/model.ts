import { Knex } from "knex";

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
  uow: Knex
): Promise<number> {
  const res = await uow("etiquetas")
    .select("id")
    .where("descricao", descricao)
    .first();

  let id: number;

  if (res !== undefined) {
    id = res.id;
  } else {
    const respostaInsert = await uow("etiquetas")
      .insert({ descricao, cor: gerarCorAleatoria() })
      .returning<{ id: number }[]>("id");
    id = respostaInsert[0].id;
  }

  return id;
}

export async function buscarEtiquetas(
  uow: Knex
): Promise<Pick<Etiqueta, "descricao" | "cor">[]> {
  return await uow("etiquetas").select("descricao", "cor");
}

function gerarCorAleatoria(): Cor {
  const num = Math.round(0xffffff * Math.random());
  const r = num >> 16;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r, g, b];
}
