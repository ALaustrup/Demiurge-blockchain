//! Network protocol definitions

use codec::{Decode, Encode};
use demiurge_core::Block;

/// Network protocol messages
#[derive(Clone, Debug, Encode, Decode)]
pub enum Message {
    /// Block announcement
    BlockAnnouncement {
        block_hash: [u8; 32],
        block_number: u64,
    },
    /// Full block
    Block(Block),
    /// Transaction
    Transaction(demiurge_core::Transaction),
    /// Block request
    BlockRequest {
        block_hash: [u8; 32],
    },
    /// Peer information
    PeerInfo {
        peer_id: Vec<u8>,
        addresses: Vec<String>,
    },
}

/// Network protocol
pub struct Protocol;

impl Protocol {
    /// Encode a message
    pub fn encode(message: &Message) -> Vec<u8> {
        message.encode()
    }

    /// Decode a message
    pub fn decode(data: &[u8]) -> Result<Message, codec::Error> {
        Message::decode(&mut &data[..])
    }
}
