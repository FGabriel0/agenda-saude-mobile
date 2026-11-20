
import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { auth, authReady } from '../src/lib/firebase';
import HomeScreen from '../src/screens/HomeScreen';
import { COLORS } from '../src/styles/theme';

export default function Page() {
  const [verificando, setVerificando] = useState(true);
  const [autenticado, setAutenticado] = useState(false);

  useEffect(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;

    async function verificarSessao() {
      try {
        await authReady;

        if (!ativo) return;

        unsubscribe = onAuthStateChanged(
          auth,
          (usuario) => {
            if (!ativo) return;

            if (!usuario) {
              setAutenticado(false);
              router.replace('/login');
            } else {
              setAutenticado(true);
            }

            setVerificando(false);
          }
        );
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);

        if (ativo) {
          setVerificando(false);
          router.replace('/login');
        }
      }
    }

    verificarSessao();

    return () => {
      ativo = false;
      unsubscribe?.();
    };
  }, []);

  if (verificando || !autenticado) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HomeScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
