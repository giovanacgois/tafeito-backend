import fastify from "fastify";

const app = fastify({logger: true});

async function main() {
    try{
        app.listen ({ port: 3000});
    }
    catch(err: any) {
        app.log.error(err);
        process.exit();
    }
}

main();