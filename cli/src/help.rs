/*!
 * Comprehensive Help System for Demiurge CLI
 * 
 * Provides detailed help, documentation, and lore integration.
 */

use std::collections::HashMap;

pub struct HelpSystem {
    pub topics: HashMap<String, HelpTopic>,
}

pub struct HelpTopic {
    pub title: String,
    pub description: String,
    pub commands: Vec<String>,
    pub examples: Vec<String>,
    pub lore: Option<String>,
    pub related: Vec<String>,
}

impl HelpSystem {
    pub fn new() -> Self {
        let mut topics = HashMap::new();
        
        // Core Topics - Load lore from files if they exist, otherwise use defaults
        let urgeid_lore = std::fs::read_to_string("docs/lore/URGEID_LORE.md")
            .unwrap_or_else(|_| "# UrgeID - Sovereign Identity\n\nYour identity in the Abyss.".to_string());
        
        let cgt_lore = std::fs::read_to_string("docs/lore/CGT_LORE.md")
            .unwrap_or_else(|_| "# CGT - Creator God Token\n\nThe native token of Demiurge.".to_string());
        
        let nft_lore = std::fs::read_to_string("docs/lore/NFT_LORE.md")
            .unwrap_or_else(|_| "# D-GEN NFTs\n\nDigital assets on Demiurge.".to_string());
        
        let abyss_lore = std::fs::read_to_string("docs/lore/ABYSS_LORE.md")
            .unwrap_or_else(|_| "# The Abyss\n\nThe marketplace of Demiurge.".to_string());
        
        let dev_lore = std::fs::read_to_string("docs/lore/DEVELOPER_LORE.md")
            .unwrap_or_else(|_| "# Developer Registry\n\nBuilders of the Abyss.".to_string());
        
        let abyssos_lore = std::fs::read_to_string("docs/lore/ABYSSOS_LORE.md")
            .unwrap_or_else(|_| "# AbyssOS\n\nThe desktop of the Abyss.".to_string());
        
        topics.insert("urgeid".to_string(), HelpTopic {
            title: "UrgeID - Sovereign Identity".to_string(),
            description: "UrgeID is your sovereign identity on Demiurge. It serves as your wallet address, profile, and Syzygy tracker.".to_string(),
            commands: vec![
                "demiurge urgeid generate".to_string(),
                "demiurge urgeid profile <address>".to_string(),
                "demiurge urgeid resolve <username>".to_string(),
                "demiurge urgeid progress <address>".to_string(),
            ],
            examples: vec![
                "demiurge urgeid generate".to_string(),
                "demiurge urgeid profile 0x1234...".to_string(),
                "demiurge urgeid resolve alice".to_string(),
            ],
            lore: Some(urgeid_lore),
            related: vec!["cgt".to_string(), "nft".to_string()],
        });
        
        topics.insert("cgt".to_string(), HelpTopic {
            title: "CGT - Creator God Token".to_string(),
            description: "CGT is the native token of Demiurge. It powers transactions, rewards, and the entire economy.".to_string(),
            commands: vec![
                "demiurge cgt balance <address>".to_string(),
                "demiurge cgt metadata".to_string(),
                "demiurge cgt supply".to_string(),
                "demiurge cgt chain-info".to_string(),
            ],
            examples: vec![
                "demiurge cgt balance 0x1234...".to_string(),
                "demiurge cgt metadata".to_string(),
            ],
            lore: Some(cgt_lore),
            related: vec!["urgeid".to_string(), "marketplace".to_string()],
        });
        
        topics.insert("nft".to_string(), HelpTopic {
            title: "NFTs - D-GEN Standard".to_string(),
            description: "D-GEN NFTs are flexible digital assets that can represent art, game items, worlds, or code modules.".to_string(),
            commands: vec![
                "demiurge nft get <id>".to_string(),
                "demiurge nft by-owner <address>".to_string(),
            ],
            examples: vec![
                "demiurge nft get 123".to_string(),
                "demiurge nft by-owner 0x1234...".to_string(),
            ],
            lore: Some(nft_lore),
            related: vec!["marketplace".to_string(), "urgeid".to_string()],
        });
        
        topics.insert("marketplace".to_string(), HelpTopic {
            title: "Abyss Marketplace".to_string(),
            description: "The Abyss is where NFTs are bought, sold, and traded. Royalties flow automatically to creators.".to_string(),
            commands: vec![
                "demiurge marketplace list".to_string(),
                "demiurge marketplace get <id>".to_string(),
            ],
            examples: vec![
                "demiurge marketplace list".to_string(),
                "demiurge marketplace get 1".to_string(),
            ],
            lore: Some(abyss_lore),
            related: vec!["nft".to_string(), "cgt".to_string()],
        });
        
        topics.insert("dev".to_string(), HelpTopic {
            title: "Developer Registry".to_string(),
            description: "Register as a developer, manage projects, and track your contributions to the Demiurge ecosystem.".to_string(),
            commands: vec![
                "demiurge dev register --username <name> --address <addr>".to_string(),
                "demiurge dev profile <identifier>".to_string(),
                "demiurge dev list".to_string(),
                "demiurge dev capsule list --owner <addr>".to_string(),
            ],
            examples: vec![
                "demiurge dev register --username alice --address 0x1234...".to_string(),
                "demiurge dev profile alice".to_string(),
            ],
            lore: Some(dev_lore),
            related: vec!["urgeid".to_string()],
        });
        
        topics.insert("abyss".to_string(), HelpTopic {
            title: "AbyssOS Operations".to_string(),
            description: "Manage AbyssOS development environment, initialize databases, and install dependencies.".to_string(),
            commands: vec![
                "demiurge abyss init".to_string(),
                "demiurge abyss init --abyssid".to_string(),
                "demiurge abyss init --install".to_string(),
            ],
            examples: vec![
                "demiurge abyss init".to_string(),
            ],
            lore: Some(abyssos_lore),
            related: vec![],
        });
        
        Self { topics }
    }
    
    pub fn show_topic(&self, topic: &str) {
        if let Some(help) = self.topics.get(topic) {
            println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            println!("{}", help.title);
            println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
            println!("{}", help.description);
            println!("\n📋 Commands:");
            for cmd in &help.commands {
                println!("  • {}", cmd);
            }
            if !help.examples.is_empty() {
                println!("\n💡 Examples:");
                for ex in &help.examples {
                    println!("  $ {}", ex);
                }
            }
            if let Some(lore) = &help.lore {
                println!("\n📖 Lore:");
                println!("{}", lore);
            }
            if !help.related.is_empty() {
                println!("\n🔗 Related Topics:");
                for rel in &help.related {
                    println!("  • demiurge help {}", rel);
                }
            }
            println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        } else {
            println!("Topic '{}' not found. Use 'demiurge help' to see all topics.", topic);
        }
    }
    
    pub fn list_topics(&self) {
        println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        println!("Demiurge CLI - Available Help Topics");
        println!("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        for (key, topic) in &self.topics {
            println!("  {} - {}", key, topic.title);
            println!("    {}", topic.description);
            println!();
        }
        
        println!("Usage: demiurge help <topic>");
        println!("Example: demiurge help urgeid");
        println!("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    }
}
