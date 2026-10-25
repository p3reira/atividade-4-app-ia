import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Botao, estilos } from '../componentes/ui';
import { perguntarIA } from '../servicos/ia';

function formatarTokens(tokens) {
  if (tokens === undefined || tokens === null) return null;
  if (typeof tokens === 'number') return `${tokens} tokens`;
  // Caso a API devolva um objeto (ex.: { total: 123 }), tenta achar o total.
  if (typeof tokens === 'object') {
    const total = tokens.total ?? tokens.totalTokens ?? tokens.total_tokens;
    if (total !== undefined) return `${total} tokens`;
  }
  return `${tokens} tokens`;
}

function Balao({ mensagem }) {
  const minha = mensagem.autor === 'eu';
  const erro = mensagem.autor === 'erro';
  const textoTokens = mensagem.autor === 'ia' ? formatarTokens(mensagem.tokens) : null;

  return (
    <View style={[locais.linha, minha ? locais.linhaDireita : locais.linhaEsquerda]}>
      <View
        style={[
          locais.balao,
          minha && locais.balaoMeu,
          mensagem.autor === 'ia' && locais.balaoIA,
          erro && locais.balaoErro,
        ]}
      >
        <Text style={[locais.textoBalao, minha && locais.textoMeu, erro && locais.textoErro]}>
          {mensagem.texto}
        </Text>
      </View>
      {textoTokens && <Text style={locais.tokens}>{textoTokens}</Text>}
    </View>
  );
}

export default function TelaPrincipal({ usuario, aoAbrirUsuarios, aoSair }) {
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const enviandoRef = useRef(false); // evita duplo envio antes do estado atualizar
  const listaRef = useRef(null);
  const proximoId = useRef(1);

  function adicionar(mensagem) {
    const id = String(proximoId.current++);
    setMensagens((atuais) => [...atuais, { id, ...mensagem }]);
  }

  async function enviar() {
    const pergunta = texto.trim();
    if (!pergunta || enviandoRef.current) return;

    enviandoRef.current = true;
    setPensando(true);
    setTexto('');
    adicionar({ autor: 'eu', texto: pergunta });

    try {
      const { resposta, tokens } = await perguntarIA(pergunta);
      adicionar({ autor: 'ia', texto: resposta, tokens });
    } catch (erro) {
      adicionar({ autor: 'erro', texto: erro.message });
    } finally {
      enviandoRef.current = false;
      setPensando(false);
    }
  }

  const podeEnviar = texto.trim().length > 0 && !pensando;

  return (
    <View style={estilos.tela}>
      <View style={locais.cabecalho}>
        <Text style={[estilos.titulo, locais.ola]} numberOfLines={1}>
          Olá, {usuario?.nome}
        </Text>
        <Botao titulo="Sair" tipo="secundario" onPress={aoSair} style={locais.botaoSair} />
      </View>

      <Botao titulo="Ver usuários" onPress={aoAbrirUsuarios} />

      <KeyboardAvoidingView
        style={locais.areaChat}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={listaRef}
          data={mensagens}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <Balao mensagem={item} />}
          style={locais.lista}
          contentContainerStyle={locais.conteudoLista}
          onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            !pensando && (
              <Text style={locais.vazio}>Faça uma pergunta para a IA.</Text>
            )
          }
          ListFooterComponent={
            pensando && (
              <View style={[locais.linha, locais.linhaEsquerda]}>
                <View style={[locais.balao, locais.balaoIA, locais.balaoPensando]}>
                  <ActivityIndicator size="small" color="#666" />
                  <Text style={[locais.textoBalao, locais.textoPensando]}>Pensando...</Text>
                </View>
              </View>
            )
          }
        />

        <View style={locais.barraEnvio}>
          <TextInput
            style={locais.campo}
            value={texto}
            onChangeText={setTexto}
            placeholder={pensando ? 'Aguarde a resposta...' : 'Digite sua pergunta...'}
            placeholderTextColor="#999"
            onSubmitEditing={enviar}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <Pressable
            onPress={enviar}
            disabled={!podeEnviar}
            style={({ pressed }) => [
              locais.botaoEnviar,
              !podeEnviar && locais.botaoEnviarDesativado,
              pressed && podeEnviar && locais.botaoEnviarPressionado,
            ]}
          >
            <Text style={locais.textoBotaoEnviar}>Enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const locais = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ola: {
    flex: 1,
    marginBottom: 0,
    marginRight: 12,
  },
  botaoSair: {
    marginTop: 0,
    minHeight: 38,
  },
  areaChat: {
    flex: 1,
    marginTop: 16,
  },
  lista: {
    flex: 1,
  },
  conteudoLista: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  vazio: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
  linha: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  linhaDireita: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  linhaEsquerda: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  balao: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
  },
  balaoMeu: {
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  balaoIA: {
    backgroundColor: '#f1f1f1',
    borderBottomLeftRadius: 4,
  },
  balaoErro: {
    backgroundColor: '#fdecec',
    borderWidth: 1,
    borderColor: '#f5c2c2',
    borderBottomLeftRadius: 4,
  },
  balaoPensando: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textoBalao: {
    fontSize: 15,
    color: '#222',
  },
  textoMeu: {
    color: '#fff',
  },
  textoErro: {
    color: '#c62828',
  },
  textoPensando: {
    marginLeft: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  tokens: {
    fontSize: 11,
    color: '#999',
    marginTop: 3,
    marginLeft: 4,
  },
  barraEnvio: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e5',
  },
  campo: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 22,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#222',
    backgroundColor: '#fff',
  },
  botaoEnviar: {
    marginLeft: 8,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoEnviarDesativado: {
    backgroundColor: '#9db5ee',
  },
  botaoEnviarPressionado: {
    backgroundColor: '#1d4ed8',
  },
  textoBotaoEnviar: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});