import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react-native';

type Screen = 'home' | 'wallet' | 'chat' | 'nfts';

const ABYSS_GATEWAY_URL = process.env.EXPO_PUBLIC_ABYSS_GATEWAY_URL || 'http://localhost:4000/graphql';

export default function ChatScreen({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const query = `
        query {
          worldChatMessages(limit: 20) {
            id
            content
            sender {
              username
            }
            createdAt
          }
        }
      `;

      const response = await fetch(ABYSS_GATEWAY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      const json = await response.json();
      if (json.data?.worldChatMessages) {
        setMessages(json.data.worldChatMessages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  return (
    <View className="flex-1 p-4">
      <TouchableOpacity onPress={() => onNavigate('home')} className="mb-4">
        <ArrowLeft className="h-6 w-6 text-zinc-400" />
      </TouchableOpacity>

      <Text className="text-3xl font-bold text-zinc-50 mb-4">World Chat</Text>

      <ScrollView className="flex-1 mb-4">
        {messages.map((msg) => (
          <View key={msg.id} className="p-3 rounded-lg bg-zinc-900 mb-2">
            <Text className="font-semibold text-zinc-50">
              @{msg.sender?.username || 'unknown'}
            </Text>
            <Text className="text-zinc-300">{msg.content}</Text>
          </View>
        ))}
      </ScrollView>

      <View className="flex-row gap-2">
        <TextInput
          value={messageInput}
          onChangeText={setMessageInput}
          placeholder="Type a message..."
          placeholderTextColor="#71717a"
          className="flex-1 px-4 py-3 rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-50"
        />
        <TouchableOpacity className="px-6 py-3 rounded-lg bg-rose-500">
          <Text className="text-white font-semibold">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

