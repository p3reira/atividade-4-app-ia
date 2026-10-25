// Só deixa passar se o usuário do token for o mesmo do :id da rota.
// Usar DEPOIS do middleware autenticar, que preenche req.usuarioLogado.
module.exports = function somenteDono(req, res, next) {
  const idLogado = req.usuarioLogado?.id;

  if (!idLogado) {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido. Faça login novamente.',
      dados: null,
    });
  }

  if (String(idLogado) !== String(req.params.id)) {
    return res.status(403).json({
      sucesso: false,
      mensagem: 'Você só pode alterar ou excluir a sua própria conta.',
      dados: null,
    });
  }

  next();
};