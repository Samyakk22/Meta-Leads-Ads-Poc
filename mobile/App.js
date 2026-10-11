import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LeadsScreen from './src/LeadsScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <LeadsScreen />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
