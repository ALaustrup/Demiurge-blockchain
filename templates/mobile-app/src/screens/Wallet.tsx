import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { sdk } from '../lib/sdk';
import { ArrowLeft } from 'lucide-react-native';

type Screen = 'home' | 'wallet' | 'chat' | 'nfts';

export default function WalletScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  useEffect(() => {
    // Load from storage
    // For demo, using placeholder
    const addr = '0x' + 'a'.repeat(64);
    setAddress(addr);
    loadBalance(addr);
  }, []);

  const loadBalance = async (addr: string) => {
    try {
      const bal = await sdk.cgt.getBalanceFormatted(addr);
      setBalance(bal.toFixed(8));
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <TouchableOpacity onPress={() => onNavigate('home')} className="mb-4">
        <ArrowLeft className="h-6 w-6 text-zinc-400" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-zinc-50 mb-8">Wallet</Text>

      <View className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 mb-6">
        <Text className="text-xl font-semibold text-zinc-50 mb-2">CGT Balance</Text>
        <Text className="text-3xl font-bold text-rose-400">{balance ?? '0.00000000'} CGT</Text>
      </View>

      <View className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
        <Text className="text-xl font-semibold text-zinc-50 mb-4">Send CGT</Text>
        
        <TextInput
          value={sendTo}
          onChangeText={setSendTo}
          placeholder="To address (0x...)"
          placeholderTextColor="#71717a"
          className="w-full px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 mb-4"
        />
        
        <TextInput
          value={sendAmount}
          onChangeText={setSendAmount}
          placeholder="Amount"
          placeholderTextColor="#71717a"
          keyboardType="numeric"
          className="w-full px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50 mb-4"
        />
        
        <TouchableOpacity className="w-full px-6 py-3 rounded-lg bg-rose-500">
          <Text className="text-center text-white font-semibold">Send CGT</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

