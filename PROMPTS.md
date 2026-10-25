# Prompts usados

## api-usuarios

### Prompt 1 — criar a API de usuários a partir da API de tarefas (Claude)

```
Vou te mandar em anexo o código de uma API de tarefas feita pelo meu professor, em Node.js,
Express 5 e PostgreSQL (CommonJS). A estrutura de pastas é esta:

server.js
package.json
src/config/database.js
src/constants/status.js
src/controllers/TarefaController.js
src/models/TarefaModel.js
src/routes/tarefaRoutes.js
src/utils/respostas.js

O QUE EU QUERO
Transformar essa API de tarefas numa API de cadastro de usuários, que vai servir de login
para um aplicativo de celular. Mantenha a mesma organização em camadas (rotas, controlador,
modelo, config) e o mesmo formato de resposta (sucesso, mensagem, dados).

O BANCO
PostgreSQL, banco app_usuarios, uma tabela só, usuarios, com: id, nome, sobrenome, email,
usuario, senha, ativo (verdadeiro por padrão), data de criação e data de alteração. E-mail e
usuário não podem se repetir. Me dê o script para criar a tabela num arquivo banco.sql.

AS ROTAS, em /api/usuarios
Cadastrar e fazer login ficam abertas. Listar todos, buscar por id, alterar e excluir só
funcionam para quem fez login.

A SEGURANÇA, que é obrigatória
- A senha é guardada criptografada com a biblioteca bcryptjs, nunca como texto.
- A senha nunca volta em nenhuma resposta da API.
- O login confere a senha e devolve um token JWT (biblioteca jsonwebtoken), válido por
 1 hora, dentro de dados.token.
- As rotas fechadas só respondem com o token no cabeçalho Authorization: Bearer <token>.
 Sem token, ou com token inválido, respondem 401.
- A chave secreta do token fica no .env (JWT_SECRET).
- Crie um .gitignore que deixe de fora o node_modules e o .env.

PARA RODAR E TESTAR
- Mantenha o nodemon como dependência de desenvolvimento, com o script npm run dev.
- No .env, use o usuário postgres e a senha postgres do banco local.
- Crie um arquivo testes.http para a extensão REST Client do VS Code, com um pedido para
 cada rota, nesta ordem: cadastrar, login, listar sem token (tem que dar 401), listar com
 token, buscar por id, alterar, excluir. O token do login tem que ser reaproveitado
 sozinho nos pedidos seguintes (use # @name login).

COMO ME DEVOLVER
Cada arquivo completo, do começo ao fim, num bloco de código separado, com o caminho do
arquivo escrito em cima. Diga quais arquivos são novos, quais mudaram e quais eu devo
apagar. No fim, os comandos para rodar, em ordem.
```

(Anexei os arquivos da api-tarefas do professor.)

### O que conferi

- Rodei o `testes.http` em ordem: cadastro 201, login 200 com `dados.token`, listar sem token 401, listar com token 200. Buscar, alterar e excluir funcionaram.
- A senha não volta em nenhuma resposta: o login tira o campo `senha` e as outras rotas usam `COLUNAS_PUBLICAS`.
- No pgAdmin, a coluna `senha` guarda o hash do bcrypt (`$2b$...`).
- E-mail repetido dá 409 ("Este e-mail já está cadastrado").

### O que a IA errou ou decidiu sozinha

- Corrigiu sem eu pedir dois bugs do código do professor: o `buscarPorId` que nunca dava 404 e o `req.body` undefined do Express 5.
- Criou regras por conta própria: login por e-mail ou usuário, e-mail e usuário em minúsculas, senha de 6 a 72 caracteres, 403 para usuário inativo, paginação no listar e PUT parcial (`COALESCE`).
- Deixou um `JWT_SECRET` de exemplo no `.env`, que precisei trocar.
- **Erro grave:** conferia só se o token era válido, não se a pessoa era dona do id. Qualquer usuário logado alterava ou excluía outra conta (ver prompt 2).

### O que fiz

- Apaguei os arquivos de tarefas, criei o banco, rodei o `banco.sql` e troquei o `JWT_SECRET`.
- Resolvi um erro de senha do PostgreSQL (28P01) acertando a senha no `.env`. O ChatGPT ajudou a achar onde olhar.

### Prompt 2 — falha de autorização (Claude, mesmo chat das telas do app)

```
eu logado consigo alterar/exlcuir dados de outro usuario
```

Depois, quando a API parou de subir, colei o erro e o meu `usuarioRoutes.js`:

```
ReferenceError: controller is not defined
    at Object.<anonymous> (C:\Projetos\projeto-app\api-usuarios\src\routes\usuarioRoutes.js:17:45)
```

(Colei o log completo do nodemon e, na mensagem seguinte, o arquivo `src/routes/usuarioRoutes.js`.)

### O que conferi

- Criei os testes 8 a 10 no `testes.http`: cadastrar o Bruno e a Ana tentar alterar e excluir o Bruno.
- O teste 9 deu 500 ("O token não tem o id do usuário."): o `somenteDono.js` lia `req.usuario`, mas o meu código guarda em `req.usuarioLogado`.
- Depois da correção, os testes 9 e 10 dão 403, e alterar ou excluir a própria conta dá 200, também pelo app.

### O que a IA errou ou decidiu sozinha

- **Chutou nomes sem ver o meu código** (`controller.alterar` e `req.usuario?.id`), e a API caiu com `ReferenceError`. Ela admitiu o chute.
- Mandou só as linhas novas das rotas. Colei sem apagar as antigas, que continuariam liberando tudo. Ela percebeu e mandou o `usuarioRoutes.js` completo.
- Escolheu responder 403 (e não 404) quando o id é de outra pessoa.

### O que fiz

- Criei o `somenteDono.js` e usei o `usuarioRoutes.js` completo.
- Corrigi o `somenteDono.js` para ler `req.usuarioLogado?.id` e troquei o 500 de "token sem id" por 401.
- Os testes 5 a 7 passaram a usar o id do login, para não quebrar quando o cadastro dá 409.
- O ChatGPT explicou a causa dos erros, mas a correção veio do Claude.

## app

### Prompt 1 — diferenças entre React e React Native (Claude)

```
Pesquise nas duas documentações oficiais, react.dev (React) e reactnative.dev (React Native), e me explique o que muda para quem já fez uma interface em React para o navegador e agora vai fazer um app de celular em React Native. Quero uma tabela curta, de no máximo 8 linhas, com três colunas: o que eu usava no React web, o que uso no React Native, e uma frase explicando a diferença. Foque no que aparece num app simples: os elementos da tela, o texto, a imagem, o campo de digitar, o botão e o clique, o estilo (CSS) e onde o app roda. No fim, cite os links das páginas da documentação que você usou.
```

### O que conferi

- A tabela veio com 8 linhas e os links de reactnative.dev e react.dev.
- Nas páginas de `Text` e `TextInput`, confirmei que todo texto fica dentro de `<Text>` e que o `onChangeText` entrega o texto direto.

### O que a IA errou ou decidiu sozinha

- Acrescentou, fora da tabela, que o estilo do React Native parece CSS mas não é igual.

### O que fiz

- Usei a tabela como referência. Depois troquei o `Button` por um botão feito com `Pressable`.

### Prompt 2 — primeira versão do app, checando a API (Claude, mesmo chat)

```
Agora quero criar um app em React Native, com Expo e em JavaScript, que vai conversar com uma API de usuários que eu já fiz, em Node.js e Express. A API roda em http://localhost:3000 e tem a rota GET /saude, que responde {"status":"OK"}. A estrutura de pastas vai ser esta, com a API e o app lado a lado: projeto-app/ api-tarefas/ (o original do professor, não mexer) api-usuarios/ (a API de usuários, já pronta) app/ (o app novo) O QUE EU QUERO NESTA PRIMEIRA VERSÃO Uma tela só, que chama GET /saude a cada 5 segundos e mostra: - em verde, "API conectada", quando a API responde; - em vermelho, "Sem conexão com a API", quando não responde. Deixe o endereço da API numa constante no topo do arquivo, com um comentário. COMO VOU RODAR No navegador, com o Expo para web, no meu computador com Windows. COMO ME DEVOLVER 1. Os comandos para criar o projeto na pasta app, usando o template blank, e para instalar o que falta para rodar no navegador. 2. O App.js completo, do começo ao fim. 3. O comando para rodar.
```

### O que conferi

- Com a API ligada, aparece "API conectada" em verde. Desligada, muda para "Sem conexão com a API" em vermelho em até 5 s. Religada, volta ao verde.
- A constante `API_URL` ficou no topo do `App.js`, com comentário.

### O que a IA errou ou decidiu sozinha

- Acrescentou um estado "Verificando a API..." e um limite de 3 s por requisição.
- Mandou instalar o `cors` na api-usuarios, que já tinha.

### O que fiz

- Criei o projeto com `npx create-expo-app@latest app --template blank`, instalei `react-dom react-native-web @expo/metro-runtime` e rodei com `npx expo start --web`.

### Prompt 3 — telas de login, cadastro, principal, usuários e edição (Claude)

```
Vou continuar um app em React Native, com Expo e em JavaScript, que conversa com uma API de usuários que eu
já fiz, em Node.js e Express. O app já existe: foi criado com o template blank, já tem o react-dom e o
react-native-web instalados e roda no navegador, com o Expo para web, no meu computador com Windows. Hoje o
App.js só mostra se a API está no ar.

A estrutura de pastas é esta:

projeto-app/
 api-tarefas/ (o original do professor, não mexer)
 api-usuarios/ (a API de usuários, pronta, roda em http://localhost:3000)
 app/ (o app)

A API responde sempre no formato { sucesso, mensagem, dados }. No fim desta mensagem está o testes.http
dela, com todas as rotas e o que cada uma recebe.

O QUE EU QUERO
As telas do app, ligadas à API:
1. Login: usuário e senha. Se a API recusar, mostrar a mensagem que ela devolveu.
2. Cadastro: nome, sobrenome, e-mail, usuário e senha. Cadastrou, volta para o login.
3. Principal: só aparece depois do login, com "Olá, <nome>", um botão para a tela de usuários e um botão de
sair. O resto da tela fica em branco por enquanto, porque é onde vai entrar um chat depois.
4. Usuários: a lista de usuários que vem da API, com um campo para buscar pelo nome.
5. Editar usuário: abre ao tocar num usuário da lista. Altera nome, sobrenome, e-mail e usuário, e tem um
botão de excluir, que pede confirmação antes.

O LOGIN E O TOKEN
- O login devolve o token em dados.token. Guarde o token só na memória do app, enquanto ele estiver aberto.
- Todo pedido às rotas fechadas leva o cabeçalho Authorization: Bearer <token>.
- Se a API responder 401, volte para o login com a mensagem "Sua sessão expirou, entre de novo".
- Sair apaga o token e volta para o login.
- O token e a senha nunca aparecem na tela.

COMO ORGANIZAR
- Sem biblioteca de navegação: o App.js guarda qual tela está aberta e troca a tela por estado.
- Um arquivo por tela, na pasta app/telas/.
- Todas as chamadas à API num arquivo só, app/servicos/api.js, com o endereço da API numa constante no
topo.
- Visual simples e limpo, que caiba numa tela de celular.

COMO ME DEVOLVER
1. A árvore dos arquivos novos e dos alterados.
2. Cada arquivo completo, do começo ao fim, num bloco de código separado, com o caminho escrito em cima.
3. Se precisar instalar alguma coisa, o comando.

O TESTES.HTTP DA MINHA API
```

(Colei o `testes.http` da api-usuarios no fim.)

### O que conferi

- O cadastro volta para o login com "Cadastro feito! Agora é só entrar."
- Senha errada mostra a mensagem da API ("Login ou senha inválidos").
- No F12 > Rede, listar usuários leva o cabeçalho `Authorization: Bearer ...`, e o token não aparece na tela.
- Sair zera o token e volta para o login.
- A busca filtra pelo nome, tocar num usuário abre a edição e o excluir pede confirmação.

### O que a IA errou ou decidiu sozinha

- Criou o `app/componentes/ui.js` sem eu pedir, com cores e componentes.
- Tirou do `App.js` a checagem de "API no ar".
- Fez a confirmação de exclusão dentro da tela, porque o `Alert.alert` com botões não funciona no navegador.
- Fez o `entrar()` buscar o nome na lista caso o login não trouxesse `dados.usuario` (o meu traz).
- Separou os dois 401: no login é senha errada, e nas rotas fechadas é sessão expirada.
- Depois da falha de autorização, deixou só o dono editar (`podeEditar`).
- **Erro:** mandou só o trecho do `case 'editar'`. Colei por cima do `App.js` e deu `SyntaxError`. Ela reconheceu e mandou o arquivo completo.

### O que fiz

- Usei o `App.js` completo e testei de novo o login, a lista, a edição e a exclusão.
- Abrindo outro usuário, os campos ficam só para leitura, sem os botões de salvar e excluir.

## api-ia

### Prompt 1 — criar a api-ia (Claude)

```
Pesquise na documentação oficial da Gemini API (ai.google.dev) como mandar um PDF junto com uma pergunta
usando a biblioteca oficial de JavaScript, e use o jeito que a documentação mostra hoje, não o de versões
antigas.

Quero uma API nova, em Node.js e Express, em JavaScript (CommonJS), que responde perguntas sobre um
documento em PDF usando a Gemini API. Ela vai ficar na pasta api-ia, ao lado das outras:

projeto-app/
 api-tarefas/ (o original do professor, não mexer)
 api-usuarios/ (a API de usuários, roda na minha máquina)
 app/ (o app em React Native, roda no navegador)
 api-ia/ (a API nova)

O DOCUMENTO
O PDF fica em api-ia/documentos/guia-estudante-ufpr-2026.pdf. É o Guia do Estudante da UFPR 2026.

O QUE EU QUERO
- POST /perguntar, que recebe { "pergunta": "..." } e devolve { sucesso, mensagem, dados }, com
dados.resposta e dados.tokens (quantos tokens a pergunta gastou, que a Gemini API informa na resposta).
- GET /saude, que responde { "status": "OK" }.
- A cada pergunta, mandar ao modelo o PDF e a pergunta, com esta instrução de sistema: responda só com base
no documento; cite o artigo ou a seção de onde tirou a resposta; se a resposta não estiver no documento,
diga "Não encontrei isso no documento"; responda em português, em poucas frases.
- Recusar pergunta vazia ou com mais de 500 caracteres, com status 400.
- Se a Gemini API recusar por limite de uso, responder 429 com uma mensagem clara.
- Liberar o CORS, porque o app vai chamar a API pelo navegador.

COMO ORGANIZAR
- Uma classe AssistenteDocumento, num arquivo próprio, que carrega o PDF uma vez e tem um método
perguntar(pergunta).
- A chave fica na variável de ambiente GEMINI_API_KEY e o nome do modelo em GEMINI_MODELO, as duas no .env,
que não sobe para o git nem para a hospedagem.
- Crie o .gitignore e o .vercelignore deixando de fora o node_modules e o .env.
- Nodemon como dependência de desenvolvimento, com o script npm run dev.
- Um testes.http para o REST Client, com uma pergunta que o regulamento responde e uma que ele não
responde.

ONDE VAI RODAR
Primeiro na minha máquina, para testar, e depois na Vercel, de graça, que roda Express sem configuração. A
porta vem de process.env.PORT, com 3001 como padrão, porque a 3000 é da api-usuarios.

COMO ME DEVOLVER
1. A árvore dos arquivos.
2. Cada arquivo completo, do começo ao fim, num bloco de código separado, com o caminho escrito em cima.
3. Os comandos para instalar e rodar.
4. Os links da documentação que você usou.
```

No mesmo chat fiz várias perguntas curtas durante o deploy e os testes (colando a saída do terminal), por exemplo:

```
nao deveria ter um vercel.json?
```

```
mas pq recebo read ECONNRESET no vs?
```

```
esta 0 la, e demora uns 35s pra dar  ECONNRESET  nas duas perguntas
```

(Também colei os logs do build e do `vercel logs`, e um print da tela de limites do AI Studio.)

### O que conferi

- `/saude` responde `{"status":"OK"}`. A raiz dá o 404 da própria API.
- A pergunta da frequência mínima respondeu "mais de 75% das aulas", citando as seções das páginas 21 e 22 (44.359 tokens).
- A do bolo de cenoura respondeu "Não encontrei isso no documento" (44.195 tokens).
- Pergunta vazia ou com mais de 500 caracteres dá 400.
- O `.env` e o `.env.local` ficam fora do git e da Vercel. A chave e o modelo estão nas variáveis da Vercel.
- No travamento, o AI Studio mostrou erros 503 e o limite gratuito: 20 perguntas por dia (eu estava em 18), 5 por minuto e 250 mil tokens por minuto.

### O que a IA errou ou decidiu sozinha

- Usou a Interactions API (`ai.interactions.create`) em vez do `generateContent`, que virou legado.
- Mandou o PDF inteiro a cada pergunta (uns 44 mil tokens), em vez de usar a Files API.
- Escolheu o `gemini-3.8-flash`, o modelo dos exemplos da documentação.
- Disse que não precisava de `vercel.json`. Funcionou.
- **Errou a ordem dos comandos da Vercel** (`env add` antes do `link`). Admitiu e corrigiu.
- Lembrou de pôr o `.env.local` no `.vercelignore`.
- **Errou o diagnóstico do ECONNRESET várias vezes** (falta de logs, proxy, acentos, limite 429). A causa era a Gemini sobrecarregada (503), com o SDK tentando de novo até passar dos ~35 s do REST Client.
- Na 1.1.0, colocou prazo e respostas 503 e 504. Na 1.2.0, viu que o tempo limite do SDK falhava, passou a controlar o prazo na classe e acrescentou `thinking_level: "low"` e `store: false`.
- Apontou que a resposta vem com Markdown, que aparece com asteriscos no app.

### O que fiz

- Fiz o deploy com `vercel link`, `vercel env add` (chave como Secret, depois o modelo) e `vercel --prod`.
- Colei a chave no lugar do nome da variável. Gerei uma chave nova, porque a antiga ficou exposta.
- Testei pelo PowerShell (`Invoke-RestMethod`) quando o REST Client dava ECONNRESET.
- Aumentei o prazo (`TEMPO_LIMITE_MS`) de 28 s para 50 s, porque com o PDF a resposta podia passar de 28 s. A mensagem do 504 continua a mesma.

### Prompt (chat da IA dentro do app)

```
Tenho um app em React Native, com Expo e em JavaScript, que roda no navegador. Ele já tem login, e depois do login abre a tela principal, que está no fim desta mensagem. Quero colocar nela um chat que conversa com uma API de IA que eu já fiz e que está on-line.

A API DA IA
- O endereço fica numa constante no topo de um arquivo novo, app/servicos/ia.js, separado do api.js que já existe. O endereço é https://api-ia-rouge.vercel.app (sem barra no fim).
- POST /perguntar, com o corpo { "pergunta": "..." }.
- Responde { sucesso, mensagem, dados }, com a resposta em dados.resposta e os tokens gastos em dados.tokens.
- Se der erro, sucesso vem false e o motivo vem em mensagem (por exemplo, 429 quando passa do limite de uso).
- Esta API não precisa do token do login.

O QUE EU QUERO NA TELA PRINCIPAL
- Manter o "Olá, <nome>" e os botões de usuários e de sair, que já existem.
- Embaixo, o chat: as mensagens em balões, as minhas à direita e as da IA à esquerda, um campo para digitar e um botão de enviar.
- Enquanto a IA responde, mostrar "Pensando..." e não deixar mandar outra pergunta.
- Embaixo de cada resposta da IA, em letra pequena e cinza, quantos tokens ela gastou.
- Se a API der erro, mostrar a mensagem dela no chat, em vermelho.
- A conversa fica só na memória: sair do app apaga.

COMO ME DEVOLVER
1. Os arquivos novos e os alterados.
2. Cada arquivo completo, do começo ao fim, num bloco de código separado, com o caminho escrito em cima.

A TELA PRINCIPAL DE HOJE (app/telas/TelaPrincipal.js)
```

(Colei o `TelaPrincipal.js` daquele momento no fim.)

### O que conferi

- O topo continuou igual ("Olá", usuários e sair).
- As minhas mensagens ficam à direita e as da IA à esquerda. Enquanto espera, aparece "Pensando..." e o envio fica bloqueado.
- Os tokens aparecem em letra pequena e cinza embaixo da resposta.
- O erro 504 aparece em vermelho no chat.
- O `POST /perguntar` vai sem o cabeçalho `Authorization`.
- Sair apaga a conversa.

### O que a IA errou ou decidiu sozinha

- Fez um botão próprio com `Pressable` em vez do meu `Botao`, com cor provisória.
- Fez o Enter enviar, com um `enviandoRef` para impedir envio duplo.
- Fez o `formatarTokens` aceitar número ou objeto, porque não sabia o formato (é número).
- Avisou do CORS, que a api-ia já liberava.

### O que fiz

- Criei o `app/servicos/ia.js`, troquei o `TelaPrincipal.js` e testei com a API on-line.

### Prompt (revisão em outra IA)

Mandei o `server.js` e o `AssistenteDocumento.js` para o Gemini com este prompt:

```
Você vai revisar um código que outra IA escreveu. É uma API em Node.js e Express que responde perguntas sobre um PDF usando a Gemini API, e que vai ficar pública na internet, de graça, na Vercel. Quem chama essa API é um app de celular.

Revise como um revisor de código experiente, olhando três coisas:

1. Orientação a objetos: a classe faz uma coisa só? Tem algo no lugar errado?
2. Boas práticas: tratamento de erro, validação, configuração, organização.
3. Segurança: o que alguém mal-intencionado poderia fazer com essa API no ar?

Aponte só problemas reais, do mais grave ao menos grave. Para cada um: o trecho, o problema em uma frase e a correção. Não reescreva o código inteiro.
```

O Gemini apontou três problemas:

1. **Sem limite por IP (segurança):** qualquer pessoa pode gastar a cota gratuita da Gemini. Correção: `express-rate-limit`.
2. **`fs.readFileSync` no construtor (boas práticas):** bloquearia o event loop no cold start. Correção: leitura assíncrona.
3. **Classe acoplada ao PDF (orientação a objetos):** a classe conhece o caminho e lê o arquivo. Correção: receber o conteúdo pronto.

### O que conferi

- Item 1: real e o mais grave. Com 20 perguntas por dia, qualquer um com a URL zera a cota.
- Item 2: fraco. O `readFileSync` roda uma vez só, quando a função sobe.
- Item 3: certo em parte. O caminho já é parâmetro do construtor, mas a classe ainda lê o arquivo.

### O que a IA errou ou decidiu sozinha

- Citou um trecho que não existe no meu código (`new Instanciacao...`).
- Não falou do CORS aberto (`*`) nem do Markdown nas respostas.

### O que fiz

- Nenhuma das três correções estava aplicada no código.
- Não apliquei os itens 2 e 3, pelos motivos acima.
- Apliquei o item 1: `express-rate-limit` (8.7.1), com 10 perguntas por IP por hora no `POST /perguntar` e 429 no formato da API.
- Coloquei `app.set('trust proxy', 1)` para a Vercel enxergar o IP de cada pessoa.
- Testei com 11 perguntas vazias, que não gastam cota: as 10 primeiras deram 400 e a 11ª deu 429.
- Limitação: na Vercel a contagem fica na memória de cada instância e zera quando ela reinicia.

### Prompt — Gemini lenta e troca de modelo (Claude, mesmo chat da api-ia)

No dia seguinte, com a cota zerada, o chat continuava dando 504. Fiz perguntas curtas no mesmo chat, por exemplo:

```
A cota da Gemini já deveria ter sido renovada, mas o chat continua retornando erro 504. Verifique o que pode estar acontecendo e como podemos descobrir a causa.
```

```
É possível converter o PDF para texto antes de enviar ao Gemini? Avalie se isso realmente ajudaria neste caso ou se o problema pode estar no modelo ou na API.
```

```
O modelo gemini-3.8-flash esta demorando varios minutos para responder. Como podemos testar isso e comparar com outro modelo?
```

(Também colei prints da tela de limites do AI Studio, a saída do `vercel logs` e a do `diagnostico.js`.)

### O que conferi

- Com a cota zerada (2 de 20), a pergunta ainda dava 504. O RPD subia, mas o TPM ficava em 0: a Gemini recebia a pergunta e não terminava.
- Com o prazo em 120 s, o `vercel logs` mostrou "Chamada à Gemini levou 120.0 s." sem resposta.
- O `diagnostico.js` mostrou a causa. O `gemini-3.8-flash` levou 260,7 s para responder só "ok" e, com o PDF, deu 503 ("currently experiencing high demand"). O `gemini-3.5-flash-lite` respondeu em 1,2 s e, com o PDF, em 7,4 s, citando os 75%.
- Depois da troca de modelo na Vercel, o chat do app voltou a responder.

### O que a IA errou ou decidiu sozinha

- Culpou o tamanho do PDF e propôs converter para texto e aumentar o prazo antes de medir. Nenhuma das duas coisas resolveu, porque a causa era o modelo sobrecarregado.
- Levantou a hipótese de que as próprias mudanças (`thinking_level` e `signal`) causavam o travamento. O diagnóstico descartou: o flash-lite respondeu com o mesmo código.
- Não conseguiu rodar o diagnóstico sozinha, porque o terminal dela no meu computador não tem internet. Escreveu o `diagnostico.js` e eu rodei.
- Extraiu o texto do PDF com o `pdftotext`, página por página, com a marca `===== Página N =====`, e mudou a instrução para citar a seção e a página.
- Tirou a nova tentativa (`TENTATIVAS_EXTRAS = 0`), porque cada uma gasta cota, e fez cada chamada registrar o tempo no log.

### O que fiz

- Dei acesso à pasta `C:\Projetos\projeto-app` para ela analisar o código.
- Publiquei a versão com o texto do guia e o prazo de 120 s.
- Rodei `node diagnostico.js` e `node diagnostico.js gemini-3.5-flash-lite`.
- Troquei o `GEMINI_MODELO` para `gemini-3.5-flash-lite` na Vercel (`vercel env rm` e `vercel env add`) e no `.env`, e publiquei de novo.
