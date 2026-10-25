// Endereço da API de usuários
const API_URL = 'http://localhost:3000/api/usuarios';

// O token fica só na memória: some quando o app é fechado ou recarregado.
let token = null;
let aoExpirarSessao = null;

export class ErroApi extends Error {
  constructor(mensagem, status) {
    super(mensagem);
    this.status = status;
  }
}

// O App.js registra aqui o que fazer quando uma rota fechada responder 401.
export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

export function estaLogado() {
  return token !== null;
}

export function sair() {
  token = null;
}

async function requisitar(caminho, { metodo = 'GET', corpo, autenticado = true } = {}) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';
  if (autenticado && token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(API_URL + caminho, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
    });
  } catch {
    throw new ErroApi('Não foi possível falar com a API. Ela está no ar?', 0);
  }

  let json = null;
  try {
    json = await resposta.json();
  } catch {
    json = null;
  }

  // 401 numa rota fechada = sessão expirada. No login, 401 é só senha errada.
  if (autenticado && resposta.status === 401) {
    token = null;
    if (aoExpirarSessao) aoExpirarSessao();
    throw new ErroApi('Sua sessão expirou, entre de novo', 401);
  }

  if (!resposta.ok || (json && json.sucesso === false)) {
    throw new ErroApi(json?.mensagem || `Erro ${resposta.status} na API.`, resposta.status);
  }

  return json ? json.dados : null;
}

// ---------- Rotas abertas ----------

export async function entrar(login, senha) {
  const dados = await requisitar('/login', {
    metodo: 'POST',
    corpo: { login, senha },
    autenticado: false,
  });

  if (!dados?.token) {
    throw new ErroApi('A API não devolveu o token.', 0);
  }
  token = dados.token;

  // Tenta achar o nome na resposta do login (sem levar o token junto)...
  const { token: _token, ...resto } = dados;
  const candidato =
    resto.usuario && typeof resto.usuario === 'object' ? resto.usuario : resto;
  if (candidato.nome) return candidato;

  // ...se não veio, procura o usuário na lista pelo login digitado.
  const lista = await listarUsuarios();
  const achado = lista.find((u) => u.usuario === login || u.email === login);
  return achado ?? { nome: login, usuario: login };
}

export function cadastrar({ nome, sobrenome, email, usuario, senha }) {
  return requisitar('', {
    metodo: 'POST',
    corpo: { nome, sobrenome, email, usuario, senha },
    autenticado: false,
  });
}

// ---------- Rotas fechadas ----------

export async function listarUsuarios() {
  const dados = await requisitar('');
  if (Array.isArray(dados)) return dados;
  return Array.isArray(dados?.usuarios) ? dados.usuarios : [];
}

export function buscarUsuario(id) {
  return requisitar(`/${id}`);
}

export function alterarUsuario(id, campos) {
  return requisitar(`/${id}`, { metodo: 'PUT', corpo: campos });
}

export function excluirUsuario(id) {
  return requisitar(`/${id}`, { metodo: 'DELETE' });
}