# Guia UFPR com IA

## O que o app faz

App em React Native (Expo, rodando no navegador) em que o estudante se cadastra, entra com usuário e senha, vê e busca os usuários cadastrados, altera ou exclui a própria conta e conversa com uma IA que responde dúvidas sobre o **Guia do Estudante da UFPR 2026**. A IA só responde com base no guia e cita a seção e a página de onde tirou a resposta; quando o guia não traz a resposta, ela avisa que não encontrou.

O projeto tem três partes:

| pasta | o que é | onde roda |
|---|---|---|
| `api-usuarios` | API de cadastro e login (Node + Express + PostgreSQL, senha com bcrypt, token JWT) | na sua máquina, porta 3000 |
| `app` | o app com as telas de cadastro, login, principal (com o chat da IA), usuários e editar | na sua máquina, no navegador |
| `api-ia` | API que manda o texto do guia e a pergunta para a Gemini API | on-line, na Vercel |

## Como instalar e rodar

Antes de tudo, instale:

- [Node.js](https://nodejs.org) 20 ou mais novo (vem com o `npm`);
- [PostgreSQL](https://www.postgresql.org/download/) (anote a senha do usuário `postgres` que você criar na instalação);
- [Git](https://git-scm.com).

Clone o repositório e entre na pasta:

```
git clone https://github.com/p3reira/atividade-4-app-ia.git
cd atividade-4-app-ia
```

Cada parte roda num terminal separado.

### api-usuarios

1. Crie o banco `app_usuarios`. No terminal (ou no pgAdmin, em Query Tool):
   ```
   psql -U postgres -c "CREATE DATABASE app_usuarios;"
   ```
2. Crie a tabela rodando o `banco.sql` dentro desse banco:
   ```
   cd api-usuarios
   psql -U postgres -d app_usuarios -f banco.sql
   ```
3. Crie o arquivo `.env` a partir do exemplo:
   ```
   copy .env.exemplo .env
   ```
   Abra o `.env` e preencha:
   - `DB_PASSWORD` = a senha do usuário `postgres`;
   - `JWT_SECRET` = uma chave longa e aleatória. Para gerar uma:
     ```
     node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
     ```
   As outras variáveis (`PORT=3000`, `DB_HOST=localhost`, `DB_PORT=5432`, `DB_NAME=app_usuarios`, `DB_USER=postgres`) já vêm com valores que funcionam numa instalação padrão.
4. Instale as dependências e rode:
   ```
   npm install
   npm run dev
   ```
5. Confira: `http://localhost:3000/saude` deve mostrar `{"status":"OK", ...}`. O arquivo `testes.http` tem um pedido para cada rota (use a extensão REST Client do VS Code).

### app

Com a `api-usuarios` rodando, abra **outro terminal** na raiz do repositório:

```
cd app
npm install
npx expo start --web
```

O app abre no navegador (normalmente em `http://localhost:8081`). Se não abrir sozinho, aperte `w` no terminal. O app não tem `.env`: o endereço da api-usuarios (`http://localhost:3000/api/usuarios`) está em `app/servicos/api.js` e o da api-ia, em `app/servicos/ia.js`.

### api-ia

A api-ia já está on-line (veja a próxima seção) e o app usa esse endereço. Para rodar na sua máquina ou publicar a sua própria:

1. Crie uma chave grátis da Gemini API no [Google AI Studio](https://aistudio.google.com/apikey) (não pede cartão).
2. Em **outro terminal**:
   ```
   cd api-ia
   copy .env.exemplo .env
   ```
   Abra o `.env` e troque `cole-sua-chave-aqui` pela sua chave. O `GEMINI_MODELO` já vem preenchido.
3. Instale e rode:
   ```
   npm install
   npm run dev
   ```
   A API sobe em `http://localhost:3001` (a 3000 é da api-usuarios).
4. Para publicar na Vercel (grátis):
   ```
   npx vercel login
   npx vercel
   npx vercel env add GEMINI_API_KEY
   npx vercel env add GEMINI_MODELO
   npx vercel --prod
   ```
   O `npx vercel --prod` mostra o endereço de produção, terminado em `.vercel.app`.

## A api-ia on-line

**Endereço:** https://api-ia-rouge.vercel.app

- Saúde: https://api-ia-rouge.vercel.app/saude → `{"status":"OK"}`

**Pedido de exemplo** (copie e cole no `testes.http` ou no REST Client):

```
POST https://api-ia-rouge.vercel.app/perguntar
Content-Type: application/json

{
  "pergunta": "Qual a frequencia minima para aprovacao em uma disciplina?"
}
```

A resposta vem neste formato:

```
{
  "sucesso": true,
  "mensagem": "Pergunta respondida.",
  "dados": { "resposta": "...", "tokens": 1234 }
}
```

**IA e modelo:** Gemini API, modelo `gemini-3.5-flash-lite`. Escolhi a Gemini porque tem plano gratuito sem cartão de crédito. O modelo fica na variável `GEMINI_MODELO`, então dá para trocar sem mexer no código.

Comecei com o `gemini-3.8-flash`, mas ele ficou sobrecarregado: num teste, levou 260 s para responder só "ok", e na pergunta com o guia devolveu erro 503 (*"currently experiencing high demand"*). Com a mesma chave e o mesmo código, o `gemini-3.5-flash-lite` respondeu em 1,2 s sem o guia e em 7,4 s com o PDF inteiro. O teste está no `api-ia/diagnostico.js` (`node diagnostico.js <modelo>`).

**Texto em vez de PDF:** no começo o PDF do guia (4,8 MB, 83 páginas) ia junto de cada pergunta, e a Gemini lia as páginas como imagem (cerca de 44 mil tokens por pergunta). Agora a API manda o texto extraído do PDF (102 KB), com a marca `===== Página N =====` antes de cada página para a IA poder citar a página. Isso deixa a resposta mais rápida e gasta menos tokens. A perda é o que só existe como imagem no guia (fotos, organograma), que não entra no texto. O texto foi extraído com o `pdftotext` (do pacote Poppler), página por página.

**Prazo:** se a Gemini não responder em 120 s, a API desiste e devolve 504 com uma mensagem. Se ela estiver sobrecarregada, devolve 503; se a cota da Gemini acabar, 429. Cada chamada registra no log da Vercel quanto tempo a Gemini levou.

**Limite de uso:** cada IP pode fazer até 10 perguntas por hora (`express-rate-limit` no `server.js`), para proteger a cota gratuita da Gemini. Passando disso, a API devolve 429 com uma mensagem pedindo para esperar.

**Limite da IA:** ela responde só com base no Guia do Estudante da UFPR 2026. Se a pergunta não é respondida pelo guia, ela responde "Não encontrei isso no documento", em vez de inventar.

## Onde está

| o quê | arquivo |
|---|---|
| guarda o token depois do login | `app/servicos/api.js`, função `entrar` (`token = dados.token`) |
| manda o token nas rotas fechadas | `app/servicos/api.js`, função `requisitar` (cabeçalho `Authorization: Bearer`) |
| apaga o token ao sair | `app/servicos/api.js`, função `sair` (`token = null`), chamada pelo botão Sair via `voltarParaLogin` em `app/App.js` |
| mostra a mensagem de erro que a API devolveu no login | `app/telas/TelaLogin.js` (estado `erro`) e `app/servicos/api.js` (`ErroApi` com a `mensagem` da API) |
| endereço da api-ia no app | `app/servicos/ia.js` (`URL_IA`) |
| criptografa a senha | `api-usuarios/src/controllers/UsuarioController.js` (`bcrypt.hash` no cadastro e na alteração, `bcrypt.compare` no login) |
| gera o token | `api-usuarios/src/controllers/UsuarioController.js` (`jwt.sign` no login) |
| confere o token nas rotas fechadas | `api-usuarios/src/middlewares/autenticacao.js` (`jwt.verify`), aplicado em `api-usuarios/src/routes/usuarioRoutes.js` |
| só o dono altera ou exclui a conta | `api-usuarios/src/middlewares/somenteDono.js` |
| lê a chave da IA | `api-ia/server.js` (`process.env.GEMINI_API_KEY` e `process.env.GEMINI_MODELO`) |
| instrução de sistema | `api-ia/AssistenteDocumento.js` (constante `INSTRUCAO_SISTEMA`) |
| o texto do guia (o que vai para a IA) | `api-ia/documentos/guia-estudante-ufpr-2026.txt` |
| o PDF original do guia | `api-ia/documentos/guia-estudante-ufpr-2026.pdf` |
