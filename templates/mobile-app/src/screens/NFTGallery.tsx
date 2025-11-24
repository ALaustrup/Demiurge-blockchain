import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { sdk } from '../lib/sdk';
import { ArrowLeft } from 'lucide-react-native';

type Screen = 'home' | 'wallet' | 'chat' | 'nfts';

export default function NFTGalleryScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [address] = useState('0x' + 'a'.repeat(64)); // Placeholder

  useEffect(() => {
    loadNFTs();
  }, []);

  const loadNFTs = async () => {
    try {
      const nftList = await sdk.nft.getNftsByOwner(address);
      setNfts(nftList);
    } catch (err) {
      console.error('Failed to load NFTs:', err);
    }
  };

  return (
    <ScrollView className="flex-1 p-4">
      <TouchableOpacity onPress={() => onNavigate('home')} className="mb-4">
        <ArrowLeft className="h-6 w-6 text-zinc-400" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-zinc-50 mb-8">My NFTs</Text>

      {nfts.length === 0 ? (
        <Text className="text-zinc-400 text-center">No NFTs found</Text>
      ) : (
        <View className="space-y-4">
          {nfts.map((nft) => (
            <View key={nft.id} className="p-6 rounded-lg border border-zinc-800 bg-zinc-900">
              <Text className="text-lg font-semibold text-zinc-50 mb-2">NFT #{nft.id}</Text>
              <Text className="text-sm text-zinc-400">Creator: {nft.creator.slice(0, 10)}...</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

