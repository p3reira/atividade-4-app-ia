-- Cria a tabela de usuários no banco app_usuarios.
-- Rode este script já conectado ao banco app_usuarios.

CREATE TABLE IF NOT EXISTS usuarios (
    id           SERIAL PRIMARY KEY,
    nome         VARCHAR(100) NOT NULL,
    sobrenome    VARCHAR(100) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    usuario      VARCHAR(30)  NOT NULL,
    senha        VARCHAR(255) NOT NULL,   -- guarda o hash do bcrypt, nunca a senha em texto
    ativo        BOOLEAN      NOT NULL DEFAULT TRUE,
    criado_em    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    alterado_em  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Os nomes destas restrições são usados no controlador
    -- para devolver uma mensagem clara quando há repetição.
    CONSTRAINT usuarios_email_unico   UNIQUE (email),
    CONSTRAINT usuarios_usuario_unico UNIQUE (usuario)
);