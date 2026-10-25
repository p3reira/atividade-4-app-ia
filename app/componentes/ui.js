import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export const cores = {
  fundo: '#f4f6f8',
  cartao: '#ffffff',
  primaria: '#2563eb',
  texto: '#1f2937',
  textoSuave: '#6b7280',
  borda: '#d1d5db',
  perigo: '#dc2626',
  erroTexto: '#b91c1c',
  erroFundo: '#fee2e2',
  sucessoTexto: '#15803d',
  sucessoFundo: '#dcfce7',
};

export const estilos = StyleSheet.create({
  // Telas fixas (sem rolagem)
  tela: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 20,
  },
  // Conteúdo de ScrollView (formulários)
  conteudoRolavel: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 48,
    paddingBottom: 32,
  },
  centralizado: {
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 26,
    fontWeight: '700',
    color: cores.texto,
    marginBottom: 4,
  },
  subtitulo: {
    fontSize: 15,
    color: cores.textoSuave,
    marginBottom: 24,
  },
  grupoCampo: {
    marginBottom: 14,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
    color: cores.texto,
    marginBottom: 6,
  },
  campo: {
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: cores.texto,
    backgroundColor: cores.cartao,
  },
  botao: {
    minHeight: 46,
    borderRadius: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botaoPrimario: {
    backgroundColor: cores.primaria,
  },
  botaoSecundario: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.primaria,
  },
  botaoPerigo: {
    backgroundColor: cores.perigo,
  },
  botaoApertado: {
    opacity: 0.7,
  },
  botaoTexto: {
    fontSize: 16,
    fontWeight: '600',
  },
  link: {
    color: cores.primaria,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  voltar: {
    color: cores.primaria,
    fontSize: 16,
    marginBottom: 12,
  },
  mensagem: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    fontSize: 14,
  },
  mensagemErro: {
    backgroundColor: cores.erroFundo,
    color: cores.erroTexto,
  },
  mensagemSucesso: {
    backgroundColor: cores.sucessoFundo,
    color: cores.sucessoTexto,
  },
});

export function Campo({ rotulo, style, ...props }) {
  return (
    <View style={estilos.grupoCampo}>
      <Text style={estilos.rotulo}>{rotulo}</Text>
      <TextInput
        style={[estilos.campo, style]}
        placeholderTextColor={cores.textoSuave}
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

export function Botao({ titulo, onPress, tipo = 'primario', carregando = false, desativado = false, style }) {
  const bloqueado = carregando || desativado;
  const fundo = {
    primario: estilos.botaoPrimario,
    secundario: estilos.botaoSecundario,
    perigo: estilos.botaoPerigo,
  }[tipo];
  const corTexto = tipo === 'secundario' ? cores.primaria : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      disabled={bloqueado}
      style={({ pressed }) => [estilos.botao, fundo, (pressed || bloqueado) && estilos.botaoApertado, style]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[estilos.botaoTexto, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Mensagem({ texto, tipo = 'erro' }) {
  if (!texto) return null;
  return (
    <Text style={[estilos.mensagem, tipo === 'sucesso' ? estilos.mensagemSucesso : estilos.mensagemErro]}>
      {texto}
    </Text>
  );
}

export function Voltar({ onPress }) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
      <Text style={estilos.voltar}>‹ Voltar</Text>
    </Pressable>
  );
}