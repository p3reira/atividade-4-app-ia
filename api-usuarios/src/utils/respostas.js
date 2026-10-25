const ehDesenvolvimento = () => process.env.NODE_ENV === 'development';

const responderErro = (res, codigo, mensagem, error) => {

  const corpo = { sucesso: false, mensagem };

  if (error && ehDesenvolvimento()) {
    corpo.erro = error.message;
  }

  return res.status(codigo).json(corpo);
};

const responderRequisicaoInvalida = (res, mensagem) =>
  responderErro(res, 400, mensagem);

// 401: não está logado (sem token, token inválido/expirado, ou login errado)
const responderNaoAutorizado = (res, mensagem = 'Não autorizado') =>
  responderErro(res, 401, mensagem);

// 403: sabemos quem é, mas não pode prosseguir (ex.: usuário inativo)
const responderProibido = (res, mensagem = 'Acesso negado') =>
  responderErro(res, 403, mensagem);

const responderNaoEncontrado = (res, mensagem = 'Recurso não encontrado') =>
  responderErro(res, 404, mensagem);

// 409: conflito com o que já existe (ex.: e-mail repetido)
const responderConflito = (res, mensagem) =>
  responderErro(res, 409, mensagem);

const responderErroInterno = (res, mensagem, error) => {
  console.error(`${mensagem}:`, error);
  return responderErro(res, 500, mensagem, error);
};

module.exports = {
  ehDesenvolvimento,
  responderErro,
  responderRequisicaoInvalida,
  responderNaoAutorizado,
  responderProibido,
  responderNaoEncontrado,
  responderConflito,
  responderErroInterno,
};