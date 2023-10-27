import { Knex } from "knex";
import { Usuario } from "./usuarios/model.js";

/* necessário para atribuirmos o tipo Usuario à request já que o Fastify não oferece esse suporte nativamente.
 * a definição da interface FastifyRequest não substitui a original, mas a incrementa.
 */
declare module "fastify" {
  interface FastifyRequest {
    usuario: null | Usuario;
    uow: Knex.Transaction;
  }
}
