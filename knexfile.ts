import type { Knex } from "knex";

const config: { [key: string]: Knex.Config } = {
  development: {
    client: "pg",
    connection: "postgres://postgres:postgres@localhost:5432/postgres",
    debug: true,
    migrations: {
      tableName: "knex_migrations",
      extension: "ts",
    },
  },
};

export default config;
