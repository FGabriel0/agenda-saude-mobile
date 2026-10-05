import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import HomeScreen from '@/screens/HomeScreen';
import { supabase } from '../src/lib/supabase';
import { COLORS } from '../src/styles/theme';

export default function Page() {
    const [verificandoSessao, setVerificandoSessao] =
        useState(true);

    const [autenticado, setAutenticado] =
        useState(false);

    useEffect(() => {
        verificarSessao();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setAutenticado(!!session);

                if (!session) {
                    router.replace('/login');
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function verificarSessao() {
        try {
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser();

        if (error || !user) {
            setAutenticado(false);
            router.replace('/login');
            return;
        }

setAutenticado(true);

            setAutenticado(true);
        } catch (error) {
            console.error(
                'Erro ao verificar sessão:',
                error
            );

            setAutenticado(false);
            router.replace('/login');
        } finally {
            setVerificandoSessao(false);
        }
    }

    if (verificandoSessao) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color={COLORS.primary}
                />
            </View>
        );
    }

    if (!autenticado) {
        return (
            <View
                style={styles.loadingContainer}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <HomeScreen />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 24,
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
});