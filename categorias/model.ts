import knex from "../shared/queryBuilder";

type Categoria = {
  id: number;
  descricao: string;
};

declare module "knex/types/tables" {
  interface Tables {
    categorias: Categoria;
  }
}

export async function buscarCategorias(): Promise<Categoria[]> {
  return await knex("categorias").select("id", "descricao");
}
