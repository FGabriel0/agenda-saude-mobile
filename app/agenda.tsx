// ponto de entrada da rota AGENDSA
import { StyleSheet } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import AgendaScreen from "../src/screens/AgendaScreen";

export default function AgendaPage() {
    return (<SafeAreaView style={styles.container}>
        <AgendaScreen />
    </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        padding: 24,
    }
});