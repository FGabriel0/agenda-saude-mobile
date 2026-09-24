import BuscarScreen from "@/screens/BuscarScreen";
import { StyleSheet } from "react-native";


import { SafeAreaView } from 'react-native-safe-area-context';


export default function Page() {



  return (

    <SafeAreaView style={styles.container}>
      <BuscarScreen/>
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