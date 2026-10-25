const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const UsuarioModel = require('../models/UsuarioModel')

const {
    responderRequisicaoInvalida,
    responderNaoAutorizado,
    responderProibido,
    responderNaoEncontrado,
    responderConflito,
    responderErroInterno,
} = require('../utils/respostas')

const LIMITE_MAXIMO = 100
const LIMITE_PADRAO = 20

const CUSTO_BCRYPT = 10        // quanto maior, mais lento (e mais difícil de quebrar)
const VALIDADE_TOKEN = '1h'

const SENHA_MINIMO = 6
const SENHA_MAXIMO = 72        // o bcrypt só considera os primeiros 72 bytes

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const REGEX_USUARIO = /^[a-z0-9._]{3,30}$/

// Nomes das restrições UNIQUE definidas no banco.sql
const MENSAGENS_DUPLICIDADE = {
    usuarios_email_unico: 'Este e-mail já está cadastrado',
    usuarios_usuario_unico: 'Este nome de usuário já está em uso',
}

const ehIdValido = (id) => /^\d+$/.test(id)

const ehTextoPreenchido = (valor) => typeof valor === 'string' && valor.trim() !== ''

// Código 23505 do PostgreSQL = tentou gravar um valor que deveria ser único
const tratarDuplicidade = (res, error) => {
    if (error.code !== '23505') return null
    return responderConflito(
        res,
        MENSAGENS_DUPLICIDADE[error.constraint] || 'E-mail ou usuário já cadastrado'
    )
}

const interpretarPaginacao = (query) => {
    const { pagina, limite } = query

    if (pagina === undefined && limite === undefined) return null

    const paginaNumero = pagina === undefined ? 1 : Number(pagina)
    const limiteNumero = limite === undefined ? LIMITE_PADRAO : Number(limite)

    if (!Number.isInteger(paginaNumero) || paginaNumero < 1) {
        return { erro: 'O parâmetro "pagina" deve ser um inteiro maior ou igual a 1' }
    }
    if (!Number.isInteger(limiteNumero) || limiteNumero < 1) {
        return { erro: 'O parâmetro "limite" deve ser um inteiro maior ou igual a 1' }
    }
    if (limiteNumero > LIMITE_MAXIMO) {
        return { erro: `O parâmetro "limite" não pode passar de ${LIMITE_MAXIMO}` }
    }

    return {
        pagina: paginaNumero,
        limite: limiteNumero,
        offset: (paginaNumero - 1) * limiteNumero,
    }
}

// Valida e normaliza os dados do usuário.
// parcial = false (cadastro): todos os campos são obrigatórios.
// parcial = true (alteração): só valida os campos que vieram.
const validarUsuario = (corpo, { parcial = false } = {}) => {
    const dados = {}
    const veio = (campo) => corpo[campo] !== undefined

    for (const campo of ['nome', 'sobrenome']) {
        if (parcial && !veio(campo)) continue
        if (!ehTextoPreenchido(corpo[campo])) {
            return { erro: `O campo "${campo}" é obrigatório e não pode ficar vazio` }
        }
        dados[campo] = corpo[campo].trim()
    }

    if (!parcial || veio('email')) {
        const email = typeof corpo.email === 'string' ? corpo.email.trim().toLowerCase() : ''
        if (!REGEX_EMAIL.test(email)) {
            return { erro: 'Informe um e-mail válido' }
        }
        dados.email = email
    }

    if (!parcial || veio('usuario')) {
        const usuario = typeof corpo.usuario === 'string' ? corpo.usuario.trim().toLowerCase() : ''
        if (!REGEX_USUARIO.test(usuario)) {
            return { erro: 'O usuário deve ter de 3 a 30 caracteres: letras, números, ponto ou sublinhado' }
        }
        dados.usuario = usuario
    }

    if (!parcial || veio('senha')) {
        const { senha } = corpo
        if (typeof senha !== 'string' || senha.length < SENHA_MINIMO || senha.length > SENHA_MAXIMO) {
            return { erro: `A senha deve ter entre ${SENHA_MINIMO} e ${SENHA_MAXIMO} caracteres` }
        }
        dados.senha = senha
    }

    // "ativo" só pode ser mudado na alteração; no cadastro o banco põe true
    if (parcial && veio('ativo')) {
        if (typeof corpo.ativo !== 'boolean') {
            return { erro: 'O campo "ativo" deve ser true ou false' }
        }
        dados.ativo = corpo.ativo
    }

    return { dados }
}

class UsuarioController {

    static async cadastrar(req, res) {
        try {
            // No Express 5, req.body fica undefined quando o pedido vem sem corpo
            const { erro, dados } = validarUsuario(req.body ?? {})

            if (erro) {
                return responderRequisicaoInvalida(res, erro)
            }

            const senhaCriptografada = await bcrypt.hash(dados.senha, CUSTO_BCRYPT)

            const novoUsuario = await UsuarioModel.criar({
                ...dados,
                senha: senhaCriptografada,
            })

            return res.status(201).json({
                sucesso: true,
                mensagem: 'Usuário cadastrado com sucesso',
                dados: novoUsuario,
            })
        } catch (error) {
            return tratarDuplicidade(res, error)
                ?? responderErroInterno(res, 'Erro ao cadastrar usuário', error)
        }
    }

    static async login(req, res) {
        try {
            const { login, senha } = req.body ?? {}

            if (!ehTextoPreenchido(login) || typeof senha !== 'string' || senha === '') {
                return responderRequisicaoInvalida(res, 'Informe o login (e-mail ou usuário) e a senha')
            }

            const usuario = await UsuarioModel.buscarParaLogin(login.trim().toLowerCase())

            const senhaConfere = usuario
                ? await bcrypt.compare(senha, usuario.senha)
                : false

            // Mesma mensagem para "não existe" e "senha errada":
            // assim ninguém descobre quais e-mails estão cadastrados.
            if (!senhaConfere) {
                return responderNaoAutorizado(res, 'Login ou senha inválidos')
            }

            if (!usuario.ativo) {
                return responderProibido(res, 'Usuário inativo')
            }

            const token = jwt.sign(
                { usuario: usuario.usuario },
                process.env.JWT_SECRET,
                {
                    subject: String(usuario.id),
                    expiresIn: VALIDADE_TOKEN,
                    algorithm: 'HS256',
                }
            )

            // Tira a senha antes de devolver os dados do usuário
            const { senha: _senha, ...usuarioSemSenha } = usuario

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Login realizado com sucesso',
                dados: {
                    token,
                    tipo: 'Bearer',
                    expiraEm: VALIDADE_TOKEN,
                    usuario: usuarioSemSenha,
                },
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao fazer login', error)
        }
    }

    static async listarTodos(req, res) {
        try {
            const paginacao = interpretarPaginacao(req.query)

            if (paginacao?.erro) {
                return responderRequisicaoInvalida(res, paginacao.erro)
            }

            if (!paginacao) {
                const usuarios = await UsuarioModel.listarTodos()
                return res.status(200).json({
                    sucesso: true,
                    quantidade: usuarios.length,
                    dados: usuarios,
                })
            }

            const [usuarios, total] = await Promise.all([
                UsuarioModel.listarTodos({
                    limite: paginacao.limite,
                    offset: paginacao.offset,
                }),
                UsuarioModel.contarTodos(),
            ])

            return res.status(200).json({
                sucesso: true,
                quantidade: usuarios.length,
                paginacao: {
                    pagina: paginacao.pagina,
                    limite: paginacao.limite,
                    total,
                    totalPaginas: Math.ceil(total / paginacao.limite),
                },
                dados: usuarios,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao listar usuários', error)
        }
    }

    static async buscarPorId(req, res) {
        try {
            const { id } = req.params

            if (!ehIdValido(id)) {
                return responderRequisicaoInvalida(res, 'ID inválido')
            }

            const usuario = await UsuarioModel.buscarPorId(id)

            if (!usuario) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                dados: usuario,
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao buscar usuário', error)
        }
    }

    static async alterar(req, res) {
        try {
            const { id } = req.params

            if (!ehIdValido(id)) {
                return responderRequisicaoInvalida(res, 'ID inválido')
            }

            const { erro, dados } = validarUsuario(req.body ?? {}, { parcial: true })

            if (erro) {
                return responderRequisicaoInvalida(res, erro)
            }

            if (Object.keys(dados).length === 0) {
                return responderRequisicaoInvalida(res, 'Informe ao menos um campo para alterar')
            }

            if (dados.senha) {
                dados.senha = await bcrypt.hash(dados.senha, CUSTO_BCRYPT)
            }

            const usuarioAlterado = await UsuarioModel.atualizar(id, dados)

            if (!usuarioAlterado) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Usuário alterado com sucesso',
                dados: usuarioAlterado,
            })
        } catch (error) {
            return tratarDuplicidade(res, error)
                ?? responderErroInterno(res, 'Erro ao alterar usuário', error)
        }
    }

    static async excluir(req, res) {
        try {
            const { id } = req.params

            if (!ehIdValido(id)) {
                return responderRequisicaoInvalida(res, 'ID inválido')
            }

            const excluido = await UsuarioModel.deletar(id)

            if (!excluido) {
                return responderNaoEncontrado(res, 'Usuário não encontrado')
            }

            return res.status(200).json({
                sucesso: true,
                mensagem: 'Usuário excluído com sucesso',
            })
        } catch (error) {
            return responderErroInterno(res, 'Erro ao excluir usuário', error)
        }
    }
}

module.exports = UsuarioController