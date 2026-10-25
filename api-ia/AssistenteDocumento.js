const fs = require('node:fs');
const path = require('node:path');
const { GoogleGenAI } = require('@google/genai');

// Texto extraído do PDF do guia (102 KB em vez de 4,8 MB). Mandar o texto deixa cada
// pergunta mais rápida e mais leve do que mandar o PDF, que a Gemini lê página por página
// como imagem. O caminho usa __dirname para funcionar igual na sua máquina e na Vercel.
const CAMINHO_TEXTO_PADRAO = path.join(__dirname, 'documentos', 'guia-estudante-ufpr-2026.txt');

const INSTRUCAO_SISTEMA = [
  'Você responde perguntas sobre o documento enviado junto com a pergunta, o Guia do Estudante da UFPR 2026.',
  'O texto do documento vem entre as marcas <documento> e </documento>, dividido em páginas pelas linhas "===== Página N =====".',
  'Responda somente com base nesse documento, sem usar conhecimento de fora dele.',
  'Cite a seção e a página do documento de onde tirou a resposta.',
  'Se a resposta não estiver no documento, diga exatamente: "Não encontrei isso no documento".',
  'Responda em português, em poucas frases.',
].join(' ');

// Prazo total para a Gemini responder, contando as novas tentativas, e quantas vezes
// tentar de novo em erro passageiro (429, 503...). Sem isso, o SDK tenta até 4 vezes e a
// requisição pode ficar mais de um minuto pendurada.
// O prazo é controlado aqui, e não pela opção `timeout` do SDK, porque nos testes com o
// @google/genai 2.31.0 ela às vezes nunca disparava.
// 120 s: o app no navegador espera o tempo que for, e a Vercel permite bem mais que isso.
// Sem novas tentativas: cada uma gasta uma pergunta da cota diária e dobra o tempo.
const TEMPO_LIMITE_MS = 120000;
const TENTATIVAS_EXTRAS = 0;

class AssistenteDocumento {
  /**
   * @param {object} opcoes
   * @param {string} opcoes.apiKey  chave da Gemini API
   * @param {string} opcoes.modelo  nome do modelo (ex.: gemini-3.8-flash)
   * @param {string} [opcoes.caminhoTexto]  caminho do texto do guia (padrão: documentos/guia-estudante-ufpr-2026.txt)
   */
  constructor({ apiKey, modelo, caminhoTexto = CAMINHO_TEXTO_PADRAO }) {
    if (!apiKey) {
      throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
    }
    if (!modelo) {
      throw new Error('A variável de ambiente GEMINI_MODELO não está definida.');
    }

    this.ai = new GoogleGenAI({ apiKey });
    this.modelo = modelo;

    // O texto é lido uma única vez, quando o assistente é criado,
    // e vai junto de cada pergunta.
    const texto = fs.readFileSync(caminhoTexto, { encoding: 'utf8' });
    this.documento = `<documento>\n${texto}\n</documento>`;
  }

  /**
   * Envia o texto do guia e a pergunta ao modelo.
   * @param {string} pergunta
   * @returns {Promise<{ resposta: string, tokens: number }>}
   */
  async perguntar(pergunta) {
    const controle = new AbortController();
    const inicio = Date.now();
    let cronometro;

    // Se o prazo acabar, cancela a chamada e avisa com um erro de tempo esgotado.
    const prazo = new Promise((_, rejeitar) => {
      cronometro = setTimeout(() => {
        controle.abort();
        const erro = new Error(`A Gemini API não respondeu em ${TEMPO_LIMITE_MS / 1000} s.`);
        erro.name = 'TimeoutError';
        rejeitar(erro);
      }, TEMPO_LIMITE_MS);
    });

    const chamada = this.ai.interactions.create({
      model: this.modelo,
      system_instruction: INSTRUCAO_SISTEMA,
      input: [
        { type: 'text', text: this.documento },
        { type: 'text', text: pergunta },
      ],
      // Menos "raciocínio" antes de responder: mais rápido e suficiente para consultar o guia.
      generation_config: { thinking_level: 'low' },
      // Cada pergunta é independente: não precisa guardar a interação no servidor do Google.
      store: false,
    }, {
      signal: controle.signal,
      maxRetries: TENTATIVAS_EXTRAS,
    });

    try {
      const interacao = await Promise.race([chamada, prazo]);
      return {
        resposta: interacao.output_text ?? '',
        tokens: interacao.usage?.total_tokens ?? 0,
      };
    } finally {
      clearTimeout(cronometro);
      // Aparece nos logs da Vercel: mostra quanto a Gemini realmente demorou.
      console.log(`Chamada à Gemini levou ${((Date.now() - inicio) / 1000).toFixed(1)} s.`);
    }
  }
}

module.exports = AssistenteDocumento;