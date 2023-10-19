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
