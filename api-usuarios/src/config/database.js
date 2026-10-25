const { Pool } = require('pg')

require('dotenv').config()

const pool = new Pool({

    host: process.env.DB_HOST,

    port: process.env.DB_PORT,

    database: process.env.DB_NAME,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    max: 20,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 2000,
})

pool.on('connect', () => {
    console.log("Conexão estabelecida com o banco app_usuarios")
})

pool.on('error', (err) => {
    console.error("Erro em conexão ociosa do pool (a conexão será descartada):", err.message)
})

const query = (text, params) => pool.query(text, params)

const obterCliente = () => pool.connect()

const transacao = async (operacoes) => {
    const cliente = await pool.connect()

    try {

        await cliente.query('BEGIN')

        const resultado = await operacoes(cliente)

        await cliente.query('COMMIT')
        return resultado
    } catch (error) {

        await cliente.query('ROLLBACK')
        throw error
    } finally {

        cliente.release()
    }
}

module.exports = {
    query,
    obterCliente,
    transacao,
};