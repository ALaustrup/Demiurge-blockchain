/**
 * Demiurge Node Bot Template
 * 
 * Archon-like microservice that interacts with Demiurge chain and chat.
 */

import { DemiurgeSDK, signTransactionHex } from '@demiurge/ts-sdk';
import axios from 'axios';

const RPC_URL = process.env.DEMIURGE_RPC_URL || 'http://127.0.0.1:8545/rpc';
const GATEWAY_URL = process.env.ABYSS_GATEWAY_URL || 'http://localhost:4000/graphql';
const BOT_ADDRESS = process.env.BOT_ADDRESS || '';
const BOT_PRIVATE_KEY = process.env.BOT_PRIVATE_KEY || '';

const sdk = new DemiurgeSDK({ rpcUrl: RPC_URL });

async function fetchWorldMessages() {
  try {
    const query = `
      query {
        worldChatMessages(limit: 10) {
          id
          content
          sender {
            username
            isArchon
          }
          createdAt
        }
      }
    `;

    const response = await axios.post(GATEWAY_URL, {
      query,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-demiurge-address': BOT_ADDRESS,
        'x-demiurge-username': 'bot',
      },
    });

    return response.data.data?.worldChatMessages || [];
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return [];
  }
}

async function sendWorldMessage(content: string) {
  try {
    const mutation = `
      mutation {
        sendWorldMessage(content: "${content}") {
          id
          content
        }
      }
    `;

    await axios.post(GATEWAY_URL, {
      query: mutation,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-demiurge-address': BOT_ADDRESS,
        'x-demiurge-username': 'bot',
      },
    });
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

async function sendCgtReward(toAddress: string, amount: number) {
  if (!BOT_PRIVATE_KEY) {
    console.log('No private key configured, skipping reward');
    return;
  }

  try {
    const { unsignedTxHex } = await sdk.cgt.buildTransfer(BOT_ADDRESS, toAddress, amount);
    const signatureHex = await signTransactionHex(unsignedTxHex, BOT_PRIVATE_KEY);
    await sdk.cgt.sendRawTransaction(unsignedTxHex);
    console.log(`Sent ${amount} CGT to ${toAddress}`);
  } catch (error) {
    console.error('Failed to send reward:', error);
  }
}

async function botLoop() {
  console.log('Bot started. Listening for messages...');
  
  let lastMessageId: string | null = null;

  while (true) {
    try {
      const messages = await fetchWorldMessages();
      
      if (messages.length > 0) {
        const latest = messages[0];
        
        if (latest.id !== lastMessageId) {
          lastMessageId = latest.id;
          
          // Simple response logic
          if (latest.content.toLowerCase().includes('hello') || 
              latest.content.toLowerCase().includes('hi')) {
            await sendWorldMessage('Hello! I am a Demiurge bot. 👋');
          }
          
          // Reward new users (example)
          if (latest.sender && !latest.sender.isArchon) {
            // Could implement reward logic here
          }
        }
      }
    } catch (error) {
      console.error('Bot loop error:', error);
    }

    // Poll every 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Start bot
if (BOT_ADDRESS) {
  botLoop().catch(console.error);
} else {
  console.error('BOT_ADDRESS environment variable not set');
  process.exit(1);
}

