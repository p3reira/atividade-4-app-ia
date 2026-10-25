require('dotenv').config({ quiet: true });

const express = require('express');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const AssistenteDocumento = require('./AssistenteDocumento');

const LIMITE_CARACTERES = 500;
const CODIGOS_LIMITE_DE_USO = ['rate_limit_exceeded', 'quota_exceeded', 'too_many_requests'];

const assistente = new AssistenteDocumento({
  apiKey: process.env.GEMINI_API_KEY,
  modelo: process.env.GEMINI_MODELO,
});

const app = express();

// Na Vercel a requisição passa por um proxy. Sem isto, todo mundo pareceria ter o
// mesmo IP (o do proxy) e o limite abaixo valeria para todos juntos.
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

function responder(res, status, sucesso, mensagem, dados = null) {
  return res.status(status).json({ sucesso, mensagem, dados });
}

// Lê o status HTTP e o código de erro que a Gemini API devolveu.
function codigoDoErro(erro) {
  return erro?.error?.error?.code ?? erro?.error?.code ?? erro?.code;
}

function ehLimiteDeUso(erro) {
  return erro?.status === 429 || CODIGOS_LIMITE_DE_USO.includes(codigoDoErro(erro));
}

function ehSobrecarga(erro) {
  return erro?.status === 503 || codigoDoErro(erro) === 'service_unavailable';
}

function ehDemora(erro) {
  return /timeout/i.test(erro?.name ?? '') || erro?.status === 504;
}

app.get('/saude', (req, res) => {
  res.json({ status: 'OK' });
});

// Limite de perguntas por IP: a API é pública e o plano gratuito da Gemini tem poucas
// perguntas por dia. Sem isto, uma pessoa ou um script esgotaria a cota de todo mundo.
// Obs.: na Vercel a contagem fica na memória de cada instância da função, então ela
// zera quando a função reinicia. Protege contra rajadas, não é um limite exato.
const limitePerguntas = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 10, // até 10 perguntas por IP a cada hora
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res) =>
    responder(
      res,
      429,
      false,
      'Você fez muitas perguntas seguidas. Espere um pouco e tente de novo.'
    ),
});

app.post('/perguntar', limitePerguntas, async (req, res) => {
  const { pergunta } = req.body ?? {};

  if (typeof pergunta !== 'string' || pergunta.trim() === '') {
    return responder(res, 400, false, 'Envie uma pergunta no campo "pergunta".');
  }

  const texto = pergunta.trim();

  if (texto.length > LIMITE_CARACTERES) {
    return responder(
      res,
      400,
      false,
      `A pergunta tem ${texto.length} caracteres. O máximo é ${LIMITE_CARACTERES}.`
    );
  }

  try {
    const { resposta, tokens } = await assistente.perguntar(texto);
    return responder(res, 200, true, 'Pergunta respondida.', { resposta, tokens });
  } catch (erro) {
    console.error('Erro ao consultar a Gemini API:', erro?.status ?? erro?.name, codigoDoErro(erro) ?? erro?.message);

    if (ehLimiteDeUso(erro)) {
      return responder(
        res,
        429,
        false,
        'O limite de uso da Gemini API foi atingido. Espere um pouco e tente de novo.'
      );
    }

    if (ehSobrecarga(erro)) {
      return responder(
        res,
        503,
        false,
        'A Gemini API está sobrecarregada no momento. Tente de novo em alguns instantes.'
      );
    }

    if (ehDemora(erro)) {
      return responder(
        res,
        504,
        false,
        'A Gemini API demorou demais para responder. Tente de novo em alguns instantes.'
      );
    }

    return responder(res, 500, false, 'Não foi possível responder a pergunta agora.');
  }
});

// Rota que não existe.
app.use((req, res) => {
  responder(res, 404, false, 'Rota não encontrada.');
});

// JSON mal formado no corpo e outros erros que não foram tratados.
app.use((erro, req, res, next) => {
  if (erro.type === 'entity.parse.failed') {
    return responder(res, 400, false, 'O corpo da requisição não é um JSON válido.');
  }
  console.error(erro);
  return responder(res, 500, false, 'Erro interno no servidor.');
});

// Na sua máquina o servidor sobe numa porta; na Vercel o app é só exportado.
if (require.main === module) {
  const PORTA = process.env.PORT || 3001;
  app.listen(PORTA, () => {
    console.log(`api-ia rodando em http://localhost:${PORTA}`);
  });
}

module.exports = app;