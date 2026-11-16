import ServicosScreen from "@/screens/ServicesScreen";
import { StyleSheet } from "react-native";


import { SafeAreaView } from 'react-native-safe-area-context';


export default function Page() {



  return (

    <SafeAreaView style={styles.container}>
      <ServicosScreen/>
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