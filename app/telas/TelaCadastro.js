import { useState } from 'react';
import { Pressable, ScrollView, Text } from 'react-native';
import { cadastrar } from '../servicos/api';
import { Botao, Campo, Mensagem, estilos } from '../componentes/ui';

export default function TelaCadastro({ aoCadastrar, aoVoltar }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [email, setEmail] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    const dados = {
      nome: nome.trim(),
      sobrenome: sobrenome.trim(),
      email: email.trim(),
      usuario: usuario.trim(),
      senha,
    };

    if (!dados.nome || !dados.sobrenome || !dados.email || !dados.usuario || !dados.senha) {
      setErro('Preencha todos os campos.');
      return;
    }
    if (!dados.email.includes('@')) {
      setErro('Digite um e-mail válido.');
      return;
    }

    setErro('');
    setCarregando(true);
    try {
      await cadastrar(dados);
      aoCadastrar();
    } catch (e) {
      setErro(e.message);
      setCarregando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={estilos.conteudoRolavel} keyboardShouldPersistTaps="handled">
      <Text style={estilos.titulo}>Criar conta</Text>
      <Text style={estilos.subtitulo}>Preencha seus dados.</Text>

      <Mensagem texto={erro} />

      <Campo rotulo="Nome" value={nome} onChangeText={setNome} placeholder="Ana" />
      <Campo rotulo="Sobrenome" value={sobrenome} onChangeText={setSobrenome} placeholder="Souza" />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="ana@email.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Campo
        rotulo="Usuário"
        value={usuario}
        onChangeText={setUsuario}
        placeholder="ana.souza"
        autoCapitalize="none"
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Crie uma senha"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={enviar}
      />

      <Botao titulo="Cadastrar" onPress={enviar} carregando={carregando} />

      <Pressable onPress={aoVoltar}>
        <Text style={estilos.link}>Já tenho conta</Text>
      </Pressable>
    </ScrollView>
  );
}