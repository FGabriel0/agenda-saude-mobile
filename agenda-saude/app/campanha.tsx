import { StyleSheet } from "react-native";


import { SafeAreaView } from 'react-native-safe-area-context';


import CampanhaScreen from "@/screens/CampanhaScreen"

export default function Page() {



  return (

    <SafeAreaView style={styles.container}>
      <CampanhaScreen/>
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