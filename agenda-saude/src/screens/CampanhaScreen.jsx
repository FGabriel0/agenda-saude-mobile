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
import { router } from 'expo-router';

import { COLORS } from '@/styles/theme';


import BottomNavigation from '@/components/Home/BottomNavigation';


export default function CampanhaScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          {/* Cabeçalho */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={COLORS.primary}
              />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              Detalhes da campanha
            </Text>

            <TouchableOpacity>
              <Ionicons
                name="heart-outline"
                size={23}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Card principal */}
          <View style={styles.heroCard}>
            <Text style={styles.heroType}>VACINAÇÃO</Text>

            <Text style={styles.heroTitle}>
              Campanha contra a gripe
            </Text>

            <Text style={styles.heroDescription}>
              Proteja-se e ajude a reduzir complicações
              respiratórias na comunidade.
            </Text>

            <View style={styles.freeBadge}>
              <Text style={styles.freeBadgeText}>
                Atendimento gratuito
              </Text>
            </View>
          </View>

          {/* Quando e onde */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Quando e onde</Text>

            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={17}
                color={COLORS.dark}
              />

              <Text style={styles.infoText}>
                14 a 18 de setembro • 08h às 17h
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={17}
                color={COLORS.dark}
              />

              <Text style={styles.infoText}>
                Posto de Saúde Edmar Fujita
              </Text>
            </View>

            <Text style={styles.address}>
              Rua Major Facundo, 1440 • Centro
            </Text>
          </View>

          {/* Quem pode participar */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Quem pode participar
            </Text>

            <View style={styles.checkRow}>
              <Ionicons
                name="checkmark"
                size={16}
                color={COLORS.primary}
              />

              <Text style={styles.checkText}>
                Pessoas a partir de 6 meses
              </Text>
            </View>

            <View style={styles.checkRow}>
              <Ionicons
                name="checkmark"
                size={16}
                color={COLORS.primary}
              />

              <Text style={styles.checkText}>
                Levar documento e cartão de vacinação
              </Text>
            </View>

            <View style={styles.warningRow}>
              <Ionicons
                name="alert-outline"
                size={16}
                color="#D9364B"
              />

              <Text style={styles.warningText}>
                Menores devem estar acompanhados
              </Text>
            </View>
          </View>

          {/* Aviso */}
          <View style={styles.notice}>
            <View style={styles.noticeHeader}>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color={COLORS.primary}
              />

              <Text style={styles.noticeTitle}>
                Sem agendamento
              </Text>
            </View>

            <Text style={styles.noticeText}>
              Atendimento por ordem de chegada, sujeito à
              disponibilidade diária.
            </Text>
          </View>

          {/* Botão mapa */}
          <TouchableOpacity style={styles.mapButton}>
            <Ionicons
              name="navigate-outline"
              size={18}
              color={COLORS.white}
            />

            <Text style={styles.mapButtonText}>
              Abrir rota no mapa
            </Text>
          </TouchableOpacity>

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
    paddingTop: 15,
  },

  header: {
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },

  backButton: {
    width: 35,
    height: 35,
    justifyContent: 'center',
  },

  headerTitle: {
    flex: 1,
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
  },

  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 17,
    padding: 18,
    minHeight: 137,
    marginBottom: 10,
  },

  heroType: {
    fontSize: 9,
    fontWeight: '700',
    color: '#D9FFF2',
    marginBottom: 10,
  },

  heroTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 6,
  },

  heroDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: '#E8FFF8',
    maxWidth: '95%',
  },

  freeBadge: {
    backgroundColor: COLORS.white,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 8,
  },

  freeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 15,
    marginBottom: 10,
  },

  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 12,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 9,
  },

  infoText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.text,
  },

  address: {
    fontSize: 10,
    color: COLORS.secondaryText,
    marginLeft: 24,
    marginTop: -2,
  },

  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 9,
  },

  checkText: {
    fontSize: 11,
    color: COLORS.text,
  },

  warningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },

  warningText: {
    fontSize: 10,
    color: '#D9364B',
  },

  notice: {
    backgroundColor: COLORS.lightGreen,
    borderWidth: 1,
    borderColor: '#A8DCCD',
    borderRadius: 14,
    padding: 13,
    marginBottom: 10,
  },

  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },

  noticeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },

  noticeText: {
    fontSize: 10,
    lineHeight: 15,
    color: '#42645B',
  },

  mapButton: {
    height: 43,
    borderRadius: 13,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },

  mapButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
});