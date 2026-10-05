import { SafeAreaView } from 'react-native-safe-area-context';

import CadastroScreen from '../src/screens/CadastroScreen';

export default function CadastroPage() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <CadastroScreen />
        </SafeAreaView>
    );
}