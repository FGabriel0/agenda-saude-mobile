import { router } from 'expo-router';
import { useState } from 'react';
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

import { supabase } from '../lib/supabase';
import { COLORS } from '../styles/theme';

export default function CadastroScreen() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] =
        useState('');
    const [carregando, setCarregando] =
        useState(false);
    const [mensagem, setMensagem] =
        useState('');

    async function cadastrar() {
        // Verifica se todos os campos foram preenchidos
        if (
            !email.trim() ||
            !senha ||
            !confirmarSenha
        ) {
            setMensagem(
                'Preencha todos os campos.'
            );
            return;
        }

        // Verifica se o e-mail possui um formato válido
        const emailValido =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email.trim()
            );

        if (!emailValido) {
            setMensagem(
                'Digite um e-mail válido.'
            );
            return;
        }

        // Verifica o tamanho mínimo da senha
        if (senha.length < 6) {
            setMensagem(
                'A senha deve ter pelo menos 6 caracteres.'
            );
            return;
        }

        // Verifica se as duas senhas são iguais
        if (senha !== confirmarSenha) {
            setMensagem(
                'As senhas não são iguais.'
            );
            return;
        }

        try {
            setCarregando(true);
            setMensagem('');

            const { data, error } =
                await supabase.auth.signUp({
                    email: email
                        .trim()
                        .toLowerCase(),
                    password: senha,
                });

            if (error) {
                console.error(
                    'Erro no cadastro:',
                    error
                );

                const mensagemErro =
                    error.message.toLowerCase();

                if (
                    mensagemErro.includes(
                        'invalid'
                    ) &&
                    mensagemErro.includes(
                        'email'
                    )
                ) {
                    setMensagem(
                        'Digite um e-mail válido.'
                    );
                    return;
                }

                if (
                    mensagemErro.includes(
                        'already'
                    ) ||
                    mensagemErro.includes(
                        'registered'
                    )
                ) {
                    setMensagem(
                        'Já existe uma conta cadastrada com este e-mail.'
                    );
                    return;
                }

                setMensagem(
                    'Não foi possível criar a conta. Tente novamente.'
                );
                return;
            }

            if (data.session) {
                setMensagem(
                    'Conta criada com sucesso!'
                );
            } else {
                setMensagem(
                    'Conta criada! Verifique seu e-mail para confirmar o cadastro.'
                );
            }
        } catch (error) {
            console.error(
                'Erro inesperado:',
                error
            );

            setMensagem(
                'Ocorreu um erro ao criar a conta. Tente novamente.'
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
                showsVerticalScrollIndicator={
                    false
                }
            >
                <View style={styles.card}>
                    <Text style={styles.title}>
                        Agenda Saúde
                    </Text>

                    <Text
                        style={styles.subtitle}
                    >
                        Crie sua conta
                    </Text>

                    <Text style={styles.label}>
                        E-mail
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="seuemail@exemplo.com"
                        value={email}
                        onChangeText={(texto) => {
                            setEmail(texto);

                            if (mensagem) {
                                setMensagem('');
                            }
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                    />

                    <Text style={styles.label}>
                        Senha
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Digite sua senha"
                        value={senha}
                        onChangeText={(texto) => {
                            setSenha(texto);

                            if (mensagem) {
                                setMensagem('');
                            }
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>
                        Confirmar senha
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Digite a senha novamente"
                        value={confirmarSenha}
                        onChangeText={(texto) => {
                            setConfirmarSenha(
                                texto
                            );

                            if (mensagem) {
                                setMensagem('');
                            }
                        }}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    {mensagem !== '' && (
                        <Text
                            style={
                                styles.message
                            }
                        >
                            {mensagem}
                        </Text>
                    )}

                    <TouchableOpacity
                        style={[
                            styles.button,
                            carregando &&
                                styles.buttonDisabled,
                        ]}
                        onPress={cadastrar}
                        disabled={carregando}
                    >
                        {carregando ? (
                            <ActivityIndicator
                                color={
                                    COLORS.white
                                }
                            />
                        ) : (
                            <Text
                                style={
                                    styles.buttonText
                                }
                            >
                                Criar conta
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() =>
                            router.replace(
                                '/login'
                            )
                        }
                    >
                        <Text
                            style={
                                styles.loginLink
                            }
                        >
                            Já possui uma
                            conta?{' '}
                            Entrar
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
        backgroundColor:
            COLORS.background,
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

    loginLink: {
        color: COLORS.primary,
        textAlign: 'center',
        fontWeight: '600',
        marginTop: 18,
    },
});