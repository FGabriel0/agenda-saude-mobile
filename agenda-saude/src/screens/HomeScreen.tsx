import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import Header from '../components/Home/Header';
import CampaignCard from '../components/Home/CampaignCard';
import QuickAccess from '../components/Home/QuickAccess';
import NextCampaign from '../components/Home/NextCampaign';
import BottomNavigation from '../components/Home/BottomNavigation';
import { COLORS } from '@/styles/theme';



//Tela inicial do Projeto
const HomeScreen = () => {
  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}

      >
        <Header
          title="Agenda Saúde"
          observation='Cuidado perto de você'
           />
        <CampaignCard />
        <QuickAccess />
        <NextCampaign />

      </ScrollView>
      <BottomNavigation />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  }
});

export default HomeScreen