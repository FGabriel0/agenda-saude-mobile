import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import SearchInput from '../components/Search/SearchInput';
import SearchCategories from '../components/Search/SearchCategories';
import SearchFilters from '../components/Search/SearchFilters';
import SearchResultCard from '../components/Search/SearchResultCard';


import BottomNavigation from '@/components/Home/BottomNavigation';

import Header from '@/components/Home/Header';

export default function BuscarScreen() {
  return (
    <SafeAreaView style={styles.container}>

      <View style={styles.screen}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          <Header
            title='Buscar'
            observation='Encontre campanhas e serviços públicos'/>

          <SearchInput />

          <SearchCategories />

          <SearchFilters />

          {/* Resultados */}
          <View style={styles.resultsHeader}>

            <Text style={styles.resultsTitle}>
              Resultados próximos
            </Text>

            <Text style={styles.resultsCount}>
              12 encontrados
            </Text>

          </View>

          <SearchResultCard
            type="VACINAÇÃO"
            title="Gripe — Posto Edmar Fujita"
            information="Hoje • 1,2 km"
            
          />

          <SearchResultCard
            type="SERVIÇO"
            title="Atendimento odontológico"
            information="Seg–Sex • 2,4 km"
            icon="time-outline"
          />


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
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 100,
  },

  resultsHeader: {
    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 9,
  },

  resultsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#102F38',
  },

  resultsCount: {
    fontSize: 9,
    color: '#819095',
  },
});