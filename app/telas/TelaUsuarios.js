import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { listarUsuarios } from '../servicos/api';
import { Mensagem, Voltar, cores, estilos } from '../componentes/ui';

// Tira acentos e deixa minúsculo, para "joao" achar "João"
function normalizar(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function TelaUsuarios({ aoVoltar, aoSelecionar }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    listarUsuarios()
      .then((lista) => {
        if (ativo) setUsuarios(lista);
      })
      .catch((e) => {
        if (ativo && e.status !== 401) setErro(e.message);
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim());
    if (!termo) return usuarios;
    return usuarios.filter((u) => normalizar(`${u.nome} ${u.sobrenome}`).includes(termo));
  }, [usuarios, busca]);

  return (
    <View style={estilos.tela}>
      <Voltar onPress={aoVoltar} />
      <Text style={[estilos.titulo, { marginBottom: 16 }]}>Usuários</Text>

      <TextInput
        style={[estilos.campo, { marginBottom: 14 }]}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar pelo nome"
        placeholderTextColor={cores.textoSuave}
        autoCorrect={false}
      />

      <Mensagem texto={erro} />

      {carregando ? (
        <ActivityIndicator color={cores.primaria} style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={filtrados}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            !erro ? (
              <Text style={locais.vazio}>
                {busca ? 'Nenhum usuário com esse nome.' : 'Nenhum usuário cadastrado.'}
              </Text>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => aoSelecionar(item)}
              style={({ pressed }) => [locais.item, pressed && { opacity: 0.7 }]}
            >
              <Text style={locais.nome}>
                {item.nome} {item.sobrenome}
              </Text>
              <Text style={locais.detalhe} numberOfLines={1}>
                @{item.usuario} · {item.email}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const locais = StyleSheet.create({
  item: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    padding: 14,
  },
  nome: {
    fontSize: 16,
    fontWeight: '600',
    color: cores.texto,
  },
  detalhe: {
    fontSize: 14,
    color: cores.textoSuave,
    marginTop: 2,
  },
  vazio: {
    textAlign: 'center',
    color: cores.textoSuave,
    marginTop: 24,
  },
});