import { SafeAreaView } from 'react-native-safe-area-context';

import LoginScreen from '../src/screens/LoginScreen';

export default function LoginPage() {
    return (
        <SafeAreaView style={{ flex: 1 }}>
            <LoginScreen />
        </SafeAreaView>
    );
}