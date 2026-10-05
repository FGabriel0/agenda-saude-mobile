import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import BottomNavigation from '../components/Home/BottomNavigation';
import CampaignCard from '../components/Home/CampaignCard';
import Header from '../components/Home/Header';
import NextCampaign from '../components/Home/NextCampaign';
import QuickAccess from '../components/Home/QuickAccess';

import { COLORS } from '@/styles/theme';
import { supabase } from '../lib/supabase';

// Tela inicial do Projeto
const HomeScreen = () => {
  const [saindo, setSaindo] = useState(false);

  async function sairDaConta() {
    try {
      setSaindo(true);

      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          'Erro ao sair da conta:',
          error
        );
        return;
      }

      router.replace('/login');
    } catch (error) {
      console.error(
        'Erro inesperado ao sair:',
        error
      );
    } finally {
      setSaindo(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.headerContainer}>
          <View style={styles.headerContent}>
            <Header
              title="Agenda Saúde"
              observation="Cuidado perto de você"
            />
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sairDaConta}
            disabled={saindo}
          >
            {saindo ? (
              <ActivityIndicator
                size="small"
                color={COLORS.danger}
              />
            ) : (
              <Text style={styles.logoutText}>
                Sair
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <CampaignCard />

        <QuickAccess />

        <NextCampaign />
      </ScrollView>

      <BottomNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  },

  headerContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerContent: {
    flex: 1,
  },

  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.danger,
    minWidth: 55,
    alignItems: 'center',
    marginRight: 12,
  },

  logoutText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
});

export default HomeScreen;