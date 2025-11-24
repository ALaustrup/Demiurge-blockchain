import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HomeScreen from './src/screens/Home';
import WalletScreen from './src/screens/Wallet';
import ChatScreen from './src/screens/Chat';
import NFTGalleryScreen from './src/screens/NFTGallery';

type Screen = 'home' | 'wallet' | 'chat' | 'nfts';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <StatusBar style="light" />
      
      {currentScreen === 'home' && <HomeScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'wallet' && <WalletScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'chat' && <ChatScreen onNavigate={setCurrentScreen} />}
      {currentScreen === 'nfts' && <NFTGalleryScreen onNavigate={setCurrentScreen} />}
    </SafeAreaView>
  );
}

