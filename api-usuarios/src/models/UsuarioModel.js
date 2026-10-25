const db = require('../config/database')

// Todas as colunas, menos a senha. É isso que sai nas respostas da API.
const COLUNAS_PUBLICAS = 'id, nome, sobrenome, email, usuario, ativo, criado_em, alterado_em'

// Mantém o código do erro do PostgreSQL (ex.: 23505 = valor repetido)
// para o controlador conseguir tratar e-mail/usuário duplicado.
const relancar = (mensagem, error) => {
    const erro = new Error(`${mensagem}: ${error.message}`)
    erro.code = error.code
    erro.constraint = error.constraint
    return erro
}

class UsuarioModel {

    static async listarTodos({ limite, offset } = {}) {
        try {

            let query = `SELECT ${COLUNAS_PUBLICAS} FROM usuarios ORDER BY criado_em DESC, id DESC`
            const values = []

            if (limite !== undefined) {
                values.push(limite)
                query += ` LIMIT $${values.length}`
            }
            if (offset !== undefined) {
                values.push(offset)
                query += ` OFFSET $${values.length}`
            }

            const result = await db.query(query, values)

            return result.rows
        } catch (error) {
            throw relancar('Erro ao listar usuários', error)
        }
    }

    static async contarTodos() {
        try {
            const result = await db.query('SELECT COUNT(*) AS total FROM usuarios')
            return Number(result.rows[0].total)
        } catch (error) {
            throw relancar('Erro ao contar usuários', error)
        }
    }

    static async buscarPorId(id) {
        try {
            const query = `SELECT ${COLUNAS_PUBLICAS} FROM usuarios WHERE id = $1`
            const result = await db.query(query, [id])

            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao buscar usuário por ID', error)
        }
    }

    // Único método que devolve a senha (o hash), porque o login precisa conferir.
    // O controlador remove a senha antes de responder.
    static async buscarParaLogin(login) {
        try {
            const query = 'SELECT * FROM usuarios WHERE email = $1 OR usuario = $1 LIMIT 1'
            const result = await db.query(query, [login])

            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao buscar usuário para login', error)
        }
    }

    static async criar({ nome, sobrenome, email, usuario, senha }) {
        try {
            const query = `
                INSERT INTO usuarios (nome, sobrenome, email, usuario, senha)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING ${COLUNAS_PUBLICAS}
            `
            const values = [nome, sobrenome, email, usuario, senha]
            const result = await db.query(query, values)

            return result.rows[0]
        } catch (error) {
            throw relancar('Erro ao criar usuário', error)
        }
    }

    // Campos não enviados chegam como undefined, viram NULL
    // e o COALESCE mantém o valor que já estava no banco.
    static async atualizar(id, { nome, sobrenome, email, usuario, senha, ativo }) {
        try {
            const query = `
                UPDATE usuarios
                SET nome        = COALESCE($1, nome),
                    sobrenome   = COALESCE($2, sobrenome),
                    email       = COALESCE($3, email),
                    usuario     = COALESCE($4, usuario),
                    senha       = COALESCE($5, senha),
                    ativo       = COALESCE($6, ativo),
                    alterado_em = CURRENT_TIMESTAMP
                WHERE id = $7
                RETURNING ${COLUNAS_PUBLICAS}
            `
            const values = [nome, sobrenome, email, usuario, senha, ativo, id]
            const result = await db.query(query, values)

            return result.rows[0] || null
        } catch (error) {
            throw relancar('Erro ao atualizar usuário', error)
        }
    }

    static async deletar(id) {
        try {
            const result = await db.query('DELETE FROM usuarios WHERE id = $1 RETURNING id', [id])

            return result.rowCount > 0
        } catch (error) {
            throw relancar('Erro ao deletar usuário', error)
        }
    }
}

module.exports = UsuarioModel