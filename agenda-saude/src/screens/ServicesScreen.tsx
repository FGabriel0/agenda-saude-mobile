import React from 'react';

import {
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';

import SearchService from '../components/Search/SearchService';
import ServiceMap from '../components/Services/ServiceMap';
import ServiceTypes from '../components/Services/ServiceTypes';
import NearbyHeader from '../components/Services/NearbyHeader';
import HealthUnitCard from '../components/Services/HealthUnitCard';

import { SafeAreaView } from 'react-native-safe-area-context';

import { router } from 'expo-router';

import BottomNavigation from '@/components/Home/BottomNavigation';

import Header from '@/components/Home/Header';
import MapaUnidades from '@/components/Services/MapaUnidades';

export default function ServicosScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.screen}>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >

          {/* Cabeçalho */}

          <Header
          title='Serviços de Saúde'
          observation='Encontre atendimento público perto de você'/>
          

          {/* Pesquisa */}
          <SearchService />

          {/* Mapa */}
          <MapaUnidades/>

          {/* Tipos de serviço */}
          <ServiceTypes />

          {/* Unidades */}
          <NearbyHeader />

          <HealthUnitCard
            name="Posto Vila do Sol"
            status="ABERTO"
            distance="1,2 km"
            information="Centro • até 17h"
            onPress={() => router.push('/campanha')}
          />

          <HealthUnitCard
            name="Farmácia Popular"
            status="24 HORAS"
            distance="3,8 km"
            information="Atendimento 24h"
          />

          {/* Espaço para a navegação */}
          <View style={{ height: 90 }} />

        </ScrollView>

        {/* Navegação inferior */}
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