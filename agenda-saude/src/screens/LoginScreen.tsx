import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';
import { COLORS } from '../styles/theme';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] =
        useState(false);
    const [mensagem, setMensagem] =
        useState('');

    async function fazerLogin() {
        if (!email.trim() || !senha) {
            setMensagem(
                'Preencha o e-mail e a senha.'
            );
            return;
        }

        try {
            setCarregando(true);
            setMensagem('');

            const { error } =
                await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: senha,
                });

            if (error) {
                setMensagem(
                    'Não foi possível entrar. Verifique o e-mail e a senha.'
                );
                return;
            }

            if (typeof window === 'undefined') {
                Alert.alert(
                    'Login realizado',
                    'Você entrou com sucesso.'
                );
            }

            router.replace('/');
        } catch (error) {
            console.error(
                'Erro inesperado no login:',
                error
            );

            setMensagem(
                'Ocorreu um erro ao tentar entrar.'
            );
        } finally {
            setCarregando(false);
        }
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === 'ios'
                    ? 'padding'
                    : undefined
            }
        >
            <ScrollView
                contentContainerStyle={
                    styles.scrollContent
                }
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
                    />

                    {mensagem !== '' && (
                        <Text style={styles.message}>
                            {mensagem}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            carregando &&
                                styles.buttonDisabled,
                        ]}
                        onPress={fazerLogin}
                        disabled={carregando}
                    >
                        {carregando ? (
                            <ActivityIndicator
                                color={COLORS.white}
                            />
                        ) : (
                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Entrar
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            router.push('/cadastro')
                        }
                    >
                        <Text
                            style={
                                styles.registerLink
                            }
                        >
                            Não possui uma conta?
                            {' '}Criar conta
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