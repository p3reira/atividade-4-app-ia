const jwt = require('jsonwebtoken')

const { responderNaoAutorizado } = require('../utils/respostas')

// Protege as rotas fechadas: só deixa passar quem mandar
// o cabeçalho  Authorization: Bearer <token>  com um token válido.
const autenticar = (req, res, next) => {
    const cabecalho = req.headers.authorization

    if (!cabecalho) {
        return responderNaoAutorizado(res, 'Token não informado')
    }

    const partes = cabecalho.match(/^Bearer\s+(\S+)$/i)

    if (!partes) {
        return responderNaoAutorizado(res, 'Formato do token inválido. Use: Bearer <token>')
    }

    try {
        const conteudo = jwt.verify(partes[1], process.env.JWT_SECRET, {
            algorithms: ['HS256'],
        })

        // Deixa disponível para os controladores saberem quem está logado
        req.usuarioLogado = {
            id: Number(conteudo.sub),
            usuario: conteudo.usuario,
        }

        return next()
    } catch (error) {
        const mensagem = error.name === 'TokenExpiredError'
            ? 'Token expirado. Faça login novamente'
            : 'Token inválido'

        return responderNaoAutorizado(res, mensagem)
    }
}

module.exports = autenticar