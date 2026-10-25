import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { alterarUsuario, excluirUsuario } from '../servicos/api';
import { Botao, Campo, Mensagem, Voltar, cores, estilos } from '../componentes/ui';

export default function TelaEditarUsuario({ usuario, podeEditar, aoVoltar, aoSalvar, aoExcluir }) {
  const [nome, setNome] = useState(usuario.nome ?? '');
  const [sobrenome, setSobrenome] = useState(usuario.sobrenome ?? '');
  const [email, setEmail] = useState(usuario.email ?? '');
  const [login, setLogin] = useState(usuario.usuario ?? '');

  const [mensagem, setMensagem] = useState(null); // { texto, tipo }
  const [salvando, setSalvando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  async function salvar() {
    const novos = {
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      email: email.trim(),
      usuario: login.trim(),
    };

    if (!novos.nome || !novos.sobrenome || !novos.email || !novos.usuario) {
      setMensagem({ texto: 'Nenhum campo pode ficar vazio.', tipo: 'erro' });
      return;
    }
    if (!novos.email.includes('@')) {
      setMensagem({ texto: 'Digite um e-mail válido.', tipo: 'erro' });
      return;
    }

    // Manda só o que mudou
    const alterados = {};
    for (const campo of Object.keys(novos)) {
      if (novos[campo] !== (usuario[campo] ?? '')) alterados[campo] = novos[campo];
    }
    if (Object.keys(alterados).length === 0) {
      setMensagem({ texto: 'Nada foi alterado.', tipo: 'erro' });
      return;
    }

    setMensagem(null);
    setSalvando(true);
    try {
      await alterarUsuario(usuario.id, alterados);
      aoSalvar({ ...usuario, ...alterados });
      setMensagem({ texto: 'Alterações salvas.', tipo: 'sucesso' });
    } catch (e) {
      if (e.status === 401) return;
      setMensagem({ texto: e.message, tipo: 'erro' });
    }
    setSalvando(false);
  }

  async function excluir() {
    setExcluindo(true);
    try {
      await excluirUsuario(usuario.id);
      aoExcluir(usuario);
    } catch (e) {
      if (e.status === 401) return;
      setMensagem({ texto: e.message, tipo: 'erro' });
      setExcluindo(false);
      setConfirmando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.conteudoRolavel} keyboardShouldPersistTaps="handled">
      <Voltar onPress={aoVoltar} />
      <Text style={estilos.titulo}>{podeEditar ? 'Minha conta' : 'Usuário'}</Text>
      <Text style={estilos.subtitulo}>@{usuario.usuario}</Text>

      {!podeEditar && (
        <Mensagem texto="Você só pode alterar ou excluir a sua própria conta." tipo="erro" />
      )}
      <Mensagem texto={mensagem?.texto} tipo={mensagem?.tipo} />

      <Campo rotulo="Nome" value={nome} onChangeText={setNome} editable={podeEditar} style={!podeEditar && locais.somenteLeitura} />
      <Campo rotulo="Sobrenome" value={sobrenome} onChangeText={setSobrenome} editable={podeEditar} style={!podeEditar && locais.somenteLeitura} />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={podeEditar}
        style={!podeEditar && locais.somenteLeitura}
      />
      <Campo rotulo="Usuário" value={login} onChangeText={setLogin} autoCapitalize="none" editable={podeEditar} style={!podeEditar && locais.somenteLeitura} />

      {podeEditar && (
        <>
          <Botao titulo="Salvar alterações" onPress={salvar} carregando={salvando} desativado={excluindo} />

          <View style={locais.zonaExcluir}>
            {confirmando ? (
              <View style={locais.caixaConfirmacao}>
                <Text style={locais.textoConfirmacao}>
                  Excluir a sua conta? Você vai sair do app e isso não pode ser desfeito.
                </Text>
                <Botao titulo="Sim, excluir" tipo="perigo" onPress={excluir} carregando={excluindo} />
                <Botao
                  titulo="Cancelar"
                  tipo="secundario"
                  onPress={() => setConfirmando(false)}
                  desativado={excluindo}
                />
              </View>
            ) : (
              <Botao
                titulo="Excluir minha conta"
                tipo="perigo"
                onPress={() => setConfirmando(true)}
                desativado={salvando}
              />
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const locais = StyleSheet.create({
  somenteLeitura: {
    backgroundColor: cores.fundo,
    color: cores.textoSuave,
  },
  zonaExcluir: {
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
  },
  caixaConfirmacao: {
    backgroundColor: cores.erroFundo,
    borderRadius: 8,
    padding: 14,
  },
  textoConfirmacao: {
    color: cores.erroTexto,
    fontSize: 15,
    marginBottom: 4,
  },
});