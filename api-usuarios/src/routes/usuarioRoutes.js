const express = require('express')
const UsuarioController = require('../controllers/UsuarioController')
const autenticar = require('../middlewares/autenticacao')
const somenteDono = require('../middlewares/somenteDono')

const router = express.Router()

// Rotas abertas
router.post('/', UsuarioController.cadastrar)
router.post('/login', UsuarioController.login)

// Rotas fechadas: passam primeiro pelo middleware de autenticação
router.get('/', autenticar, UsuarioController.listarTodos)
router.get('/:id', autenticar, UsuarioController.buscarPorId)

// Alterar e excluir: além de logado, só o próprio dono da conta
router.put('/:id', autenticar, somenteDono, UsuarioController.alterar)
router.delete('/:id', autenticar, somenteDono, UsuarioController.excluir)

module.exports = router