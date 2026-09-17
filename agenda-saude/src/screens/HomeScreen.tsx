import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import Header from '../components/Header';
import CampaignCard from '../components/CampaignCard';
import QuickAccess from '../components/QuickAccess';
import NextCampaign from '../components/NextCampaign';
import BottomNavigation from '../components/BottomNavigation';



//Tela inicial do Projeto
const HomeScreen = () => {
  return (
    <View style={styles.container}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}

      >
        <Header />
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
    backgroundColor: '#F3F9F7',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 110,
  }
});

export default HomeScreen