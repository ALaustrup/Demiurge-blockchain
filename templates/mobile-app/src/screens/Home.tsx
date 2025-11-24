import { View, Text, TouchableOpacity } from 'react-native';
import { Wallet, Coins, MessageSquare, Image } from 'lucide-react-native';

type Screen = 'home' | 'wallet' | 'chat' | 'nfts';

export default function HomeScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  return (
    <View className="flex-1 p-4">
      <Text className="text-3xl font-bold text-zinc-50 mb-8">Demiurge Mobile</Text>
      
      <View className="space-y-4">
        <TouchableOpacity
          onPress={() => onNavigate('wallet')}
          className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 mb-4"
        >
          <Wallet className="h-8 w-8 text-rose-400 mb-2" />
          <Text className="text-xl font-semibold text-zinc-50 mb-1">Wallet</Text>
          <Text className="text-zinc-400">View balance and send CGT</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('chat')}
          className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 mb-4"
        >
          <MessageSquare className="h-8 w-8 text-rose-400 mb-2" />
          <Text className="text-xl font-semibold text-zinc-50 mb-1">Chat</Text>
          <Text className="text-zinc-400">World chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onNavigate('nfts')}
          className="p-6 rounded-lg border border-zinc-800 bg-zinc-900 mb-4"
        >
          <Image className="h-8 w-8 text-rose-400 mb-2" />
          <Text className="text-xl font-semibold text-zinc-50 mb-1">NFTs</Text>
          <Text className="text-zinc-400">View your collection</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

