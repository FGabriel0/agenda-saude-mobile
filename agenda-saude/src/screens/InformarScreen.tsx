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
          

          {/* Card principal */}
          <TouchableOpacity style={styles.preventionCard}>

            <Text style={styles.preventionType}>
              PREVENÇÃO
            </Text>

            <Text style={styles.preventionTitle}>
              Combate ao mosquito da
              dengue
            </Text>

            <Text style={styles.preventionDescription}>
              10 minutos por semana ajudam a
              eliminar focos dentro de casa.
            </Text>

            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>
                Ler orientações
              </Text>

              <Ionicons
                name="arrow-forward"
                size={14}
                color={COLORS.white}
              />
            </View>

          </TouchableOpacity>

          {/* Explorar por tema */}
          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Explore por tema
            </Text>

          </View>

          <View style={styles.themes}>

            {/* Vacinação */}
            <TouchableOpacity style={styles.themeCard}>

              <Ionicons
                name="add-circle"
                size={22}
                color={COLORS.primary}
              />

              <Text style={styles.themeText}>
                Vacinação
              </Text>

            </TouchableOpacity>

            {/* Bem-estar */}
            <TouchableOpacity style={styles.themeCard}>

              <Ionicons
                name="heart"
                size={21}
                color="#E58A22"
              />

              <Text style={styles.themeText}>
                Bem-estar
              </Text>

            </TouchableOpacity>

            {/* Prevenção */}
            <TouchableOpacity style={styles.themeCard}>

              <Ionicons
                name="umbrella"
                size={21}
                color="#8152C7"
              />

              <Text style={styles.themeText}>
                Prevenção
              </Text>

            </TouchableOpacity>

          </View>

          {/* Conteúdos recentes */}
          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Conteúdos recentes
            </Text>

            <TouchableOpacity>
              <Text style={styles.seeAll}>
                Ver todos
              </Text>
            </TouchableOpacity>

          </View>

          {/* Conteúdo 1 */}
          <TouchableOpacity style={styles.articleCard}>

            <Text style={styles.articleCategory}>
              VACINAÇÃO
            </Text>

            <Text style={styles.articleTitle}>
              Por que manter a caderneta atualizada?
            </Text>

            <Text style={styles.articleDescription}>
              Saiba quais doses acompanhar em cada
              fase da vida.
            </Text>

            <View style={styles.articleFooter}>

              <Text style={styles.articleLink}>
                Ler em 3 min
              </Text>

              <Ionicons
                name="arrow-forward"
                size={13}
                color={COLORS.primary}
              />

            </View>

          </TouchableOpacity>

          {/* Conteúdo 2 */}
          <TouchableOpacity style={styles.articleCard}>

            <Text
              style={[
                styles.articleCategory,
                { color: '#E58A22' },
              ]}
            >
              SAÚDE MENTAL
            </Text>

            <Text style={styles.articleTitle}>
              Quando procurar ajuda?
            </Text>

            <Text style={styles.articleDescription}>
              Reconheça sinais e conheça os canais
              de acolhimento.
            </Text>

            <View style={styles.articleFooter}>

              <Text style={styles.articleLink}>
                Ler em 3 min
              </Text>

              <Ionicons
                name="arrow-forward"
                size={13}
                color={COLORS.primary}
              />

            </View>

          </TouchableOpacity>

          {/* Precisa de ajuda */}
          <View style={styles.helpCard}>

            <Text style={styles.helpTitle}>
              Precisa de ajuda agora?
            </Text>

            <Text style={styles.helpText}>
              SAMU 192 • Disque Saúde 136 • CVV 188
            </Text>

          </View>

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
    backgroundColor: COLORS.background,
  },

  screen: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },

  header: {
    marginBottom: 17,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.dark,
  },

  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 3,
  },

  preventionCard: {
    backgroundColor: COLORS.blue,
    borderRadius: 16,

    padding: 17,

    minHeight: 117,

    marginBottom: 18,
  },

  preventionType: {
    fontSize: 8,
    fontWeight: '800',
    color: '#DCEFFF',
    marginBottom: 9,
  },

  preventionTitle: {
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '800',
    color: COLORS.white,
  },

  preventionDescription: {
    fontSize: 10,
    lineHeight: 14,
    color: '#EDF7FF',
    marginTop: 6,
  },

  readMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-end',
    marginTop: 5,
  },

  readMoreText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.white,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 9,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },

  themes: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },

  themeCard: {
    flex: 1,

    height: 63,

    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,

    justifyContent: 'center',
    alignItems: 'center',
  },

  themeText: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 4,
  },

  seeAll: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primary,
  },

  articleCard: {
    backgroundColor: COLORS.white,

    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 13,

    padding: 14,

    marginBottom: 9,
  },

  articleCategory: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },

  articleTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },

  articleDescription: {
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.textSecondary,
    marginTop: 5,
  },

  articleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },

  articleLink: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },

  helpCard: {
    backgroundColor: COLORS.lightGreen,

    borderWidth: 1,
    borderColor: '#A8DCCD',

    borderRadius: 13,

    padding: 13,

    marginTop: 3,
  },

  helpTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
  },

  helpText: {
    fontSize: 10,
    color: '#42645B',
  },
});