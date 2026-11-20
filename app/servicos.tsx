import { StyleSheet } from "react-native";
import ServicosScreen from "../src/screens/ServicesScreen";


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