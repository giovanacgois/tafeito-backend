import OpenAI from "openai";
import { Chatbot, OpcoesDePergunta } from "./api";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";

const OPENAI_API_KEY = (() => {
  const env = process.env.OPENAI_API_KEY;
  if (env === undefined || env === "") {
    throw new Error("Env OPENAI_API_KEY não definida.");
  }
  return env;
})();

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

async function perguntar(
  modeladorDeResposta: string,
  opcoesDePergunta: OpcoesDePergunta
): Promise<string> {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: modeladorDeResposta },
  ];
  if (opcoesDePergunta.contexto) {
    messages.push({ role: "system", content: opcoesDePergunta.contexto });
  }

  if (opcoesDePergunta.entrada) {
    messages.push({
      role: "user",
      content: opcoesDePergunta.entrada,
    });
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages,
  });

  const resposta = response.choices[0];
  const conteudoDaResposta = resposta.message.content;

  if (conteudoDaResposta === undefined || conteudoDaResposta === null) {
    throw new Error("Resposta inesperada da api OpenAi");
  }
  return conteudoDaResposta;
}

const chatbot: Chatbot = {
  async obterListaDeFrases(opcoesDePergunta) {
    return JSON.parse(
      await perguntar(
        "A saída deve obrigatoriamente ser um vetor de strings formatado em JSON. Os itens devem estar em uma linguagem objetiva, sem nenhum texto adicional, para serem adicionados em uma checklist.",
        opcoesDePergunta
      )
    );
  },

  async obterFraseUnica(opcoesDePergunta) {
    return await perguntar(
      "A saída deve obrigatoriamente ser uma única frase, contendo apenas a tarefa, como se fosse um item para uma checklist - deve estar em linguagem prática, sem nenhum texto adicional.",
      opcoesDePergunta
    );
  },

  async obterDuracaoDeTempo(opcoesDePergunta) {
    return JSON.parse(
      await perguntar(
        "O formato esperado da resposta é um JSON com os atributos horas e minutos da estimativa.",
        opcoesDePergunta
      )
    );
  },
};

export default chatbot;
