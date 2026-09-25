import React from 'react';

import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { Ionicons } from '@expo/vector-icons';

import BottomNavigation from '@/components/Home/BottomNavigation';

import { COLORS } from '@/styles/theme';
import Header from '@/components/Home/Header';
import ArticleCard from '@/components/Infor/ArticleCard';
import EmergencyHelp from '@/components/Infor/EmergencyHelp';
import RecentContentHeader from '@/components/Infor/RecentContentHeader';
import InformationTopics from '@/components/Infor/InformationTopics';
import PreventionCard from '@/components/Infor/PreventionCard';

import { router } from 'expo-router';

export default function InformarScreen() {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.screen}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* Cabeçalho */}
          <Header
            title='Informação e Prevenção'
            observation='Conteúdo confiável para cuidar da sua saúde'/>
          
{/* Destaque */}
          <PreventionCard
            title="Combate ao mosquito da dengue"
            description="10 minutos por semana ajudam a eliminar focos dentro de casa."
          />

          {/* Temas */}
          <InformationTopics />

          {/* Conteúdos */}
          <RecentContentHeader />

          <ArticleCard
            category="VACINAÇÃO"
            title="Por que manter a caderneta atualizada?"
            description="Saiba quais doses acompanhar em cada fase da vida."
            onPress={() => router.push('/campanha')}
          />

          <ArticleCard
            category="SAÚDE MENTAL"
            title="Quando procurar ajuda?"
            description="Reconheça sinais e conheça os canais de acolhimento."
            categoryColor="#E58A22"
          />

          {/* Ajuda */}
          <EmergencyHelp />

          {/* Espaço para o BottomNavigation */}
          <View style={{ height: 90 }} />

        </ScrollView>

        <BottomNavigation />

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,

    backgroundColor: '#F5FAF8',
  },

  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,

    paddingTop: 20,

    paddingBottom: 100,
  },
});