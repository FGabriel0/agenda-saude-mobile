
import { useState } from 'react';
import { router } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth, authReady } from '../src/lib/firebase';
import { COLORS } from '../src/styles/theme';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [sucesso, setSucesso] = useState(false);

  async function recuperarSenha() {
    const emailInformado = email.trim();

    if (!emailInformado) {
      setSucesso(false);
      setMensagem('Informe seu e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInformado)) {
      setSucesso(false);
      setMensagem('Digite um e-mail válido.');
      return;
    }

    try {
      setEnviando(true);
      setMensagem('');

      await authReady;

      await sendPasswordResetEmail(auth, emailInformado);

      setSucesso(true);
      setMensagem(
        'Se houver uma conta associada a este e-mail, ' +
        'você receberá um link para redefinir sua senha. ' +
        'Verifique também a pasta de spam.'
      );
    } catch (error: any) {
      setSucesso(false);

      if (error?.code === 'auth/invalid-email') {
        setMensagem('Digite um e-mail válido.');
      } else if (error?.code === 'auth/too-many-requests') {
        setMensagem(
          'Muitas tentativas. Aguarde antes de tentar novamente.'
        );
      } else if (error?.code === 'auth/network-request-failed') {
        setMensagem('Verifique sua conexão com a internet.');
      } else {
        setMensagem(
          'Não foi possível enviar o e-mail. Tente novamente.'
        );
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Recuperar senha</Text>

          <Text style={styles.subtitle}>
            Informe o e-mail cadastrado no Agenda Saúde
            para receber um link de redefinição de senha.
          </Text>

          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.input}
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!enviando}
            onSubmitEditing={recuperarSenha}
          />

          {mensagem !== '' && (
            <Text
              style={[
                styles.message,
                sucesso ? styles.success : styles.error,
              ]}
            >
              {mensagem}
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.button,
              enviando && styles.buttonDisabled,
            ]}
            onPress={recuperarSenha}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>
                Enviar link de recuperação
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backText}>
              Voltar para o login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  success: {
    color: COLORS.primary,
  },
  error: {
    color: COLORS.danger,
  },
  button: {
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
    textAlign: 'center',
  },
  backButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  backText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
