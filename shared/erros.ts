export class DadosDeEntradaInvalidos extends Error {
  constructor(public codigo: string, mensagem: string) {
    super(mensagem);
  }
}

export class UsuarioNaoAutenticado extends Error {
  constructor() {
    super("Usuário não autenticado");
  }
}

export class TokenInvalido extends Error {
  constructor() {
    super("Token inválido");
  }
}

export class AcessoNegado extends Error {
  constructor() {
    super("Acesso negado");
  }
}
export abstract class ErroNoProcessamento extends Error {
  readonly statusCode: number;

  constructor (message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }

  toJSON (): Record<string, any> {
    return {
      mensagem: this.message
    };
  }
}
export class DadosOuEstadoInvalido extends ErroNoProcessamento {
  readonly extra: any;

  constructor (descricao: string, extra: any) {
    super(descricao, 422);
    this.extra = extra;
  }

  toJSON () {
    return {
      ...super.toJSON(),
      extra: this.extra
    };
  }
}
