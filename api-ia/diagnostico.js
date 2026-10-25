// Diagnóstico: mede quanto a Gemini demora, sem o prazo da API.
// Faz 2 chamadas (gasta 2 da cota diária):
//   1) só texto, sem o PDF  -> mostra se o modelo em si está respondendo rápido
//   2) com o PDF            -> mostra quanto o PDF pesa no tempo
// Uso: node diagnostico.js            (modelo do .env)
//      node diagnostico.js <modelo>   (outro modelo, para comparar)

require('dotenv').config({ quiet: true });

const fs = require('node:fs');
const path = require('node:path');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// Pode passar outro modelo para comparar: node diagnostico.js gemini-3.5-flash-lite
const modelo = process.argv[2] || process.env.GEMINI_MODELO;
const caminhoPdf = path.join(__dirname, 'documentos', 'guia-estudante-ufpr-2026.pdf');
const LIMITE_MS = 180000; // espera até 3 minutos

async function medir(nome, input) {
  const controle = new AbortController();
  const cronometro = setTimeout(() => controle.abort(), LIMITE_MS);
  const inicio = Date.now();
  try {
    const r = await ai.interactions.create(
      {
        model: modelo,
        input,
        generation_config: { thinking_level: 'low' },
        store: false,
      },
      { signal: controle.signal, maxRetries: 0 }
    );
    const s = ((Date.now() - inicio) / 1000).toFixed(1);
    console.log(`\n[${nome}] OK em ${s} s`);
    console.log('  tokens:', JSON.stringify(r.usage));
    console.log('  resposta:', (r.output_text ?? '').slice(0, 200));
  } catch (e) {
    const s = ((Date.now() - inicio) / 1000).toFixed(1);
    console.log(`\n[${nome}] FALHOU em ${s} s`);
    console.log('  status:', e.status ?? e.name);
    console.log('  detalhe:', JSON.stringify(e.error ?? e.message));
  } finally {
    clearTimeout(cronometro);
  }
}

(async () => {
  const bytes = fs.statSync(caminhoPdf).size;
  console.log(`Modelo: ${modelo}`);
  console.log(`PDF: ${(bytes / 1024 / 1024).toFixed(2)} MB`);

  await medir('só texto', 'Responda apenas: ok');

  const pdfBase64 = fs.readFileSync(caminhoPdf, { encoding: 'base64' });
  await medir('com PDF', [
    { type: 'document', data: pdfBase64, mime_type: 'application/pdf' },
    { type: 'text', text: 'Qual é a frequência mínima para aprovação em uma disciplina? Responda em uma frase.' },
  ]);
})();
