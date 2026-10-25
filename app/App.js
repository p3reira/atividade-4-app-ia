import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as api from './servicos/api';
import { cores } from './componentes/ui';
import TelaLogin from './telas/TelaLogin';
import TelaCadastro from './telas/TelaCadastro';
import TelaPrincipal from './telas/TelaPrincipal';
import TelaUsuarios from './telas/TelaUsuarios';
import TelaEditarUsuario from './telas/TelaEditarUsuario';

// Compara pelo id; se o login não trouxe id, compara pelo nome de usuário
function mesmaPessoa(a, b) {
  if (!a || !b) return false;
  if (a.id !== undefined && b.id !== undefined) return String(a.id) === String(b.id);
  return a.usuario !== undefined && a.usuario === b.usuario;
}

export default function App() {
  const [tela, setTela] = useState('login'); // login | cadastro | principal | usuarios | editar
  const [usuarioLogado, setUsuarioLogado] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [aviso, setAviso] = useState(null); // mensagem mostrada na tela de login

  function voltarParaLogin(novoAviso = null) {
    api.sair();
    setUsuarioLogado(null);
    setUsuarioEditando(null);
    setAviso(novoAviso);
    setTela('login');
  }

  useEffect(() => {
    api.definirAoExpirarSessao(() =>
      voltarParaLogin({ texto: 'Sua sessão expirou, entre de novo', tipo: 'erro' })
    );
    return () => api.definirAoExpirarSessao(null);
  }, []);

  const logado = usuarioLogado !== null && api.estaLogado();
  const telaProtegida = ['principal', 'usuarios', 'editar'].includes(tela);
  const telaAtual = telaProtegida && !logado ? 'login' : tela;

  let conteudo;
  switch (telaAtual) {
    case 'cadastro':
      conteudo = (
        <TelaCadastro
          aoCadastrar={() => {
            setAviso({ texto: 'Cadastro feito! Agora é só entrar.', tipo: 'sucesso' });
            setTela('login');
          }}
          aoVoltar={() => {
            setAviso(null);
            setTela('login');
          }}
        />
      );
      break;

    case 'principal':
      conteudo = (
        <TelaPrincipal
          usuario={usuarioLogado}
          aoAbrirUsuarios={() => setTela('usuarios')}
          aoSair={() => voltarParaLogin()}
        />
      );
      break;

    case 'usuarios':
      conteudo = (
        <TelaUsuarios
          aoVoltar={() => setTela('principal')}
          aoSelecionar={(u) => {
            setUsuarioEditando(u);
            setTela('editar');
          }}
        />
      );
      break;

    case 'editar':
      conteudo = (
        <TelaEditarUsuario
          key={String(usuarioEditando?.id)}
          usuario={usuarioEditando}
          podeEditar={mesmaPessoa(usuarioLogado, usuarioEditando)}
          aoVoltar={() => setTela('usuarios')}
          aoSalvar={(atualizado) => {
            setUsuarioEditando(atualizado);
            setUsuarioLogado((atual) => ({ ...atual, ...atualizado }));
          }}
          aoExcluir={() => {
            voltarParaLogin({ texto: 'Sua conta foi excluída.', tipo: 'sucesso' });
          }}
        />
      );
      break;

    default:
      conteudo = (
        <TelaLogin
          aviso={aviso}
          aoEntrar={(usuario) => {
            setUsuarioLogado(usuario);
            setAviso(null);
            setTela('principal');
          }}
          aoIrParaCadastro={() => {
            setAviso(null);
            setTela('cadastro');
          }}
        />
      );
  }

  return (
    <View style={{ flex: 1, backgroundColor: cores.fundo }}>
      {conteudo}
      <StatusBar style="dark" />
    </View>
  );
}