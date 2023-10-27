import { FastifyInstance } from "fastify";
import { buscarEtiquetas } from "./model";

export default async (app: FastifyInstance) => {
  app.get("/", async (req) => {
    return await buscarEtiquetas(req.uow);
  });
};
