// Serviço da API de IA, separado do api.js (esta API não usa o token do login).
const URL_IA = 'https://api-ia-rouge.vercel.app';

/**
 * Envia uma pergunta para a IA.
 * Retorna { resposta, tokens } quando dá certo.
 * Lança um Error com a mensagem da API quando dá errado.
 */
export async function perguntarIA(pergunta) {
  let resposta;

  try {
    resposta = await fetch(`${URL_IA}/perguntar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pergunta }),
    });
  } catch {
    throw new Error('Não foi possível conectar à IA. Verifique sua internet.');
  }

  let corpo;
  try {
    corpo = await resposta.json();
  } catch {
    throw new Error(`A IA devolveu uma resposta inválida (HTTP ${resposta.status}).`);
  }

  if (!resposta.ok || !corpo?.sucesso) {
    throw new Error(corpo?.mensagem || `Erro ao falar com a IA (HTTP ${resposta.status}).`);
  }

  return {
    resposta: corpo.dados?.resposta ?? '',
    tokens: corpo.dados?.tokens,
  };
}