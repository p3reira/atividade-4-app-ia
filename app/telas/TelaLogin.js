import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { entrar } from '../servicos/api';
import { Botao, Campo, Mensagem, estilos } from '../componentes/ui';

export default function TelaLogin({ aviso, aoEntrar, aoIrParaCadastro }) {
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrarNoApp() {
    if (!login.trim() || !senha) {
      setErro('Preencha usuário e senha.');
      return;
    }
    setErro('');
    setCarregando(true);
    try {
      const usuario = await entrar(login.trim(), senha);
      aoEntrar(usuario);
    } catch (e) {
      setErro(e.message);
      setSenha('');
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={[estilos.conteudoRolavel, estilos.centralizado]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={estilos.titulo}>Entrar</Text>
      <Text style={estilos.subtitulo}>Use seu usuário e sua senha.</Text>

      {erro ? <Mensagem texto={erro} /> : <Mensagem texto={aviso?.texto} tipo={aviso?.tipo} />}

      <Campo
        rotulo="Usuário"
        value={login}
        onChangeText={setLogin}
        placeholder="ana.souza"
        autoCapitalize="none"
        returnKeyType="next"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Sua senha"
        secureTextEntry
        autoCapitalize="none"
        returnKeyType="go"
        onSubmitEditing={entrarNoApp}
      />

      <Botao titulo="Entrar" onPress={entrarNoApp} carregando={carregando} />

      <Pressable onPress={aoIrParaCadastro}>
        <Text style={estilos.link}>Não tem conta? Cadastre-se</Text>
      </Pressable>
    </ScrollView>
  );
}