import HomeScreen from "@/screens/HomeScreen";

import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";


import { SafeAreaView } from 'react-native-safe-area-context';


export default function Page() {



  return (

    <SafeAreaView style={styles.container}>
      <HomeScreen />
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    padding: 24,
  }
});
