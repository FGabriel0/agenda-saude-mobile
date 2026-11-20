
import { router } from 'expo-router';
import { useRef, useState } from 'react';

import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { signInWithEmailAndPassword } from 'firebase/auth';

import { auth, authReady } from '../lib/firebase';
import { COLORS } from '../styles/theme';
import LoadingScreen from '../components/Home/LoadingScreen';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [verificando, setVerificando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const tentativaEmAndamento = useRef(false);

  async function fazerLogin() {
    if (tentativaEmAndamento.current) return;

    if (!email.trim() || !senha) {
      setMensagem('Preencha o e-mail e a senha.');
      return;
    }

    tentativaEmAndamento.current = true;
    setVerificando(true);
    setMensagem('');

    try {
      // Aguarda a configuração da sessão Firebase
      await authReady;

      // Primeiro verifica as credenciais
      await signInWithEmailAndPassword(
        auth,
        email.trim(),
        senha
      );

      // Exibe a animação somente após login correto
      setCarregando(true);

      // Mantém a animação por 2 segundos
      await new Promise<void>((resolve) => {
        setTimeout(resolve, 2000);
      });

      // Abre a Home
      router.replace('/');

    } catch (error: any) {
      const code = error?.code;

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setMensagem('E-mail ou senha incorretos.');
      } else if (code === 'auth/invalid-email') {
        setMensagem('Digite um e-mail válido.');
      } else if (code === 'auth/too-many-requests') {
        setMensagem(
          'Muitas tentativas. Aguarde e tente novamente.'
        );
      } else if (code === 'auth/network-request-failed') {
        setMensagem(
          'Erro de conexão. Verifique sua internet.'
        );
      } else {
        setMensagem(
          'Não foi possível entrar. Tente novamente.'
        );
      }

      setCarregando(false);
    } finally {
      setVerificando(false);
      tentativaEmAndamento.current = false;
    }
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios' ? 'padding' : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              Agenda Saúde
            </Text>

            <Text style={styles.subtitle}>
              Entre na sua conta
            </Text>

            <Text style={styles.label}>
              E-mail
            </Text>

            <TextInput
              style={styles.input}
              placeholder="seuemail@exemplo.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              editable={!verificando}
            />

            <Text style={styles.label}>
              Senha
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Digite sua senha"
              value={senha}
              onChangeText={setSenha}
              secureTextEntry
              autoCapitalize="none"
              editable={!verificando}
              onSubmitEditing={fazerLogin}
            />

            {/* Recuperação de senha */}
            <TouchableOpacity
              style={styles.forgotPasswordButton}
              onPress={() =>
                router.push('/recuperar-senha')
              }
              disabled={verificando}
            >
              <Text style={styles.forgotPasswordText}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            {mensagem !== '' && (
              <Text style={styles.message}>
                {mensagem}
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                verificando && styles.buttonDisabled,
              ]}
              onPress={fazerLogin}
              disabled={verificando}
            >
              <Text style={styles.buttonText}>
                {verificando ? 'Verificando...' : 'Entrar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/cadastro')}
              disabled={verificando}
            >
              <Text style={styles.registerLink}>
                Não possui uma conta? Criar conta
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Animação somente após autenticação correta */}
      <LoadingScreen visible={carregando} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },

  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },

  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.white,
    marginBottom: 18,
  },

  forgotPasswordButton: {
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 18,
  },

  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },

  message: {
    color: COLORS.danger,
    fontSize: 13,
    marginBottom: 14,
    textAlign: 'center',
  },

  button: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },

  registerLink: {
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 18,
  },
});
