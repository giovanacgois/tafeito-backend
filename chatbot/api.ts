export type OpcoesDePergunta = {
  contexto?: string;
  entrada?: string;
};

export interface HoraMinuto {
  horas: number;
  minutos: number;
}

export interface Chatbot {
  obterListaDeFrases(opcoesDePergunta: OpcoesDePergunta): Promise<string[]>;
  obterFraseUnica(opcoesDePergunta: OpcoesDePergunta): Promise<string>;
  obterDuracaoDeTempo(opcoesDePergunta: OpcoesDePergunta): Promise<HoraMinuto>;
}
