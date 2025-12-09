/*!
 * Demiurge CLI
 * 
 * Command-line interface for interacting with the Demiurge Blockchain.
 */

use clap::{Parser, Subcommand};
use demiurge_rust_sdk::DemiurgeSDK;
use reqwest;

mod keygen;

#[derive(Parser)]
#[command(name = "demiurge")]
#[command(about = "Demiurge Blockchain CLI", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,

    /// RPC URL for Demiurge node
    #[arg(long, default_value = "http://127.0.0.1:8545/rpc")]
    rpc_url: String,
}

#[derive(Subcommand)]
enum Commands {
    /// UrgeID operations
    Urgeid {
        #[command(subcommand)]
        command: UrgeidCommands,
    },
    /// CGT operations
    Cgt {
        #[command(subcommand)]
        command: CgtCommands,
    },
    /// NFT operations
    Nft {
        #[command(subcommand)]
        command: NftCommands,
    },
    /// Marketplace operations
    Marketplace {
        #[command(subcommand)]
        command: MarketplaceCommands,
    },
    /// Developer Registry operations
    Dev {
        #[command(subcommand)]
        command: DevCommands,
    },
    /// Validator key operations
    Keygen {
        /// Path to save the validator key
        #[arg(long, default_value = "/opt/demiurge/keys/validator.key")]
        output: String,
    },
}

#[derive(Subcommand)]
enum UrgeidCommands {
    /// Generate a new UrgeID (offline keygen)
    Generate,
    /// Get UrgeID profile
    Profile {
        address: String,
    },
    /// Resolve username to address
    Resolve {
        username: String,
    },
    /// Get UrgeID progress
    Progress {
        address: String,
    },
}

#[derive(Subcommand)]
enum CgtCommands {
    /// Get CGT balance
    Balance {
        address: String,
    },
    /// Get CGT metadata
    Metadata,
    /// Get total supply
    Supply,
    /// Get chain info
    ChainInfo,
}

#[derive(Subcommand)]
enum NftCommands {
    /// Get NFT by ID
    Get {
        id: u64,
    },
    /// Get NFTs by owner
    ByOwner {
        address: String,
    },
}

#[derive(Subcommand)]
enum MarketplaceCommands {
    /// List all active listings
    List,
    /// Get listing by ID
    Get {
        id: u64,
    },
}

#[derive(Subcommand)]
enum DevCommands {
    /// Register as a developer
    Register {
        /// Username (must match UrgeID username)
        #[arg(long)]
        username: String,
        /// Address (optional, uses default if not provided)
        #[arg(long)]
        address: Option<String>,
    },
    /// Get developer profile
    Profile {
        /// Address or username
        identifier: String,
    },
    /// List all developers
    List,
    /// Add a project
    AddProject {
        /// Project slug
        #[arg(long)]
        slug: String,
        /// Project name
        #[arg(long)]
        name: String,
        /// Project description
        #[arg(long)]
        description: Option<String>,
    },
    /// Show project details
    ShowProject {
        /// Project slug
        slug: String,
    },
    /// Dev Capsule operations
    Capsule {
        #[command(subcommand)]
        command: CapsuleCommands,
    },
}

#[derive(Subcommand)]
enum CapsuleCommands {
    /// List capsules by owner
    List {
        /// Owner address
        #[arg(long)]
        owner: String,
    },
    /// Create a new capsule
    Create {
        /// Owner address
        #[arg(long)]
        owner: String,
        /// Project slug
        #[arg(long)]
        project: String,
        /// Notes/description
        #[arg(long)]
        notes: String,
    },
    /// Update capsule status
    Status {
        /// Capsule ID
        #[arg(long)]
        id: u64,
        /// New status (draft, live, paused, archived)
        #[arg(long)]
        status: String,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let cli = Cli::parse();
    let sdk = DemiurgeSDK::new(&cli.rpc_url);

    match cli.command {
        Commands::Urgeid { command } => {
            match command {
                UrgeidCommands::Generate => {
                    use demiurge_rust_sdk::signing;
                    let private_key = signing::hex_to_bytes_32(
                        &hex::encode(rand::random::<[u8; 32]>())
                    )?;
                    let address = signing::derive_address(&private_key)?;
                    println!("New UrgeID generated:");
                    println!("  Address: {}", address);
                    println!("  Private Key: 0x{}", hex::encode(private_key));
                    println!("\n⚠️  Keep your private key secure! Never share it.");
                }
                UrgeidCommands::Profile { address } => {
                    let profile = sdk.urgeid().get_profile(&address).await?;
                    println!("UrgeID Profile:");
                    println!("  Address: {}", profile.address);
                    println!("  Display Name: {}", profile.display_name);
                    if let Some(username) = &profile.username {
                        println!("  Username: @{}", username);
                    }
                    println!("  Level: {}", profile.level);
                    println!("  Syzygy Score: {}", profile.syzygy_score);
                    println!("  Badges: {:?}", profile.badges);
                }
                UrgeidCommands::Resolve { username } => {
                    match sdk.urgeid().resolve_username(&username).await? {
                        Some(address) => println!("@{} → {}", username, address),
                        None => println!("Username @{} not found", username),
                    }
                }
                UrgeidCommands::Progress { address } => {
                    let progress = sdk.urgeid().get_progress(&address).await?;
                    println!("UrgeID Progress:");
                    println!("  Level: {}", progress.level);
                    println!("  Syzygy Score: {}", progress.syzygy_score);
                    println!("  Progress: {:.2}%", progress.progress_ratio * 100.0);
                    println!("  Next Level Threshold: {}", progress.next_level_threshold);
                }
            }
        }
        Commands::Cgt { command } => {
            match command {
                CgtCommands::Balance { address } => {
                    let balance = sdk.cgt().get_balance(&address).await?;
                    println!("CGT Balance: {}", balance);
                }
                CgtCommands::Metadata => {
                    let metadata = sdk.cgt().get_metadata().await?;
                    println!("CGT Metadata:");
                    println!("  Name: {}", metadata.name);
                    println!("  Symbol: {}", metadata.symbol);
                    println!("  Decimals: {}", metadata.decimals);
                    println!("  Max Supply: {}", metadata.max_supply);
                    println!("  Total Supply: {}", metadata.total_supply);
                }
                CgtCommands::Supply => {
                    let supply = sdk.cgt().get_total_supply().await?;
                    println!("Total Supply: {}", supply);
                }
                CgtCommands::ChainInfo => {
                    let info = sdk.cgt().get_chain_info().await?;
                    println!("Chain Info:");
                    println!("  Height: {}", info.height);
                    println!("  Block Hash: {}", info.block_hash);
                }
            }
        }
        Commands::Nft { command } => {
            match command {
                NftCommands::Get { id } => {
                    let nft = sdk.nft().get_nft(id).await?;
                    println!("NFT #{}:", nft.id);
                    println!("  Owner: {}", nft.owner);
                    println!("  Creator: {}", nft.creator);
                    println!("  Fabric Hash: {}", nft.fabric_root_hash);
                    if let Some(royalty) = nft.royalty_bps {
                        println!("  Royalty: {} bps", royalty);
                    }
                }
                NftCommands::ByOwner { address } => {
                    let nfts = sdk.nft().get_nfts_by_owner(&address).await?;
                    println!("NFTs owned by {}: {}", address, nfts.len());
                    for nft in nfts {
                        println!("  NFT #{}", nft.id);
                    }
                }
            }
        }
        Commands::Marketplace { command } => {
            match command {
                MarketplaceCommands::List => {
                    let listings = sdk.marketplace().get_all_listings().await?;
                    println!("Active Listings: {}", listings.len());
                    for listing in listings {
                        println!("  Listing #{}: NFT #{} - {} CGT", 
                            listing.id, listing.nft_id, listing.price);
                    }
                }
                MarketplaceCommands::Get { id } => {
                    let listing = sdk.marketplace().get_listing(id).await?;
                    println!("Listing #{}:", listing.id);
                    println!("  NFT ID: {}", listing.nft_id);
                    println!("  Seller: {}", listing.seller);
                    println!("  Price: {} CGT", listing.price);
                    println!("  Status: {}", listing.status);
                }
            }
        }
        Commands::Dev { command } => {
            match command {
                DevCommands::Register { username, address } => {
                    let addr = address.unwrap_or_else(|| {
                        eprintln!("Error: --address is required for registration");
                        std::process::exit(1);
                    });
                    
                    match sdk.client().call::<serde_json::Value>(
                        "dev_registerDeveloper",
                        Some(serde_json::json!({
                            "address": addr,
                            "username": username,
                            "signed_tx_hex": ""
                        }))
                    ).await {
                        Ok(result) => {
                            println!("Developer registered successfully!");
                            println!("{}", serde_json::to_string_pretty(&result)?);
                        }
                        Err(e) => {
                            eprintln!("Error: {}", e);
                            eprintln!("Note: Registration requires a signed transaction. Use the Portal UI for now.");
                        }
                    }
                }
                DevCommands::Profile { identifier } => {
                    let profile = if identifier.starts_with("0x") {
                        sdk.client().call::<serde_json::Value>(
                            "dev_getDeveloperProfile",
                            Some(serde_json::json!({ "address": identifier }))
                        ).await
                    } else {
                        sdk.client().call::<serde_json::Value>(
                            "dev_getDeveloperProfile",
                            Some(serde_json::json!({ "username": identifier }))
                        ).await
                    };
                    
                    match profile {
                        Ok(p) => {
                            if let Some(prof) = p.as_object() {
                                println!("Developer Profile:");
                                println!("  Username: @{}", prof.get("username").and_then(|v| v.as_str()).unwrap_or("N/A"));
                                println!("  Address: {}", prof.get("address").and_then(|v| v.as_str()).unwrap_or("N/A"));
                                println!("  Reputation: {}", prof.get("reputation").and_then(|v| v.as_u64()).unwrap_or(0));
                            } else {
                                println!("Developer not found");
                            }
                        }
                        Err(e) => eprintln!("Error: {}", e),
                    }
                }
                DevCommands::List => {
                    let gateway_url = std::env::var("ABYSS_GATEWAY_URL")
                        .unwrap_or_else(|_| "http://localhost:4000/graphql".to_string());
                    
                    let query = r#"query { developers { address username reputation } }"#;
                    let client = reqwest::Client::new();
                    match client.post(&gateway_url).json(&serde_json::json!({ "query": query })).send().await {
                        Ok(response) => {
                            let json: serde_json::Value = response.json().await?;
                            if let Some(devs) = json.get("data").and_then(|d| d.get("developers")).and_then(|v| v.as_array()) {
                                println!("Developers ({}):", devs.len());
                                for dev in devs {
                                    if let (Some(u), Some(a), Some(r)) = (
                                        dev.get("username").and_then(|v| v.as_str()),
                                        dev.get("address").and_then(|v| v.as_str()),
                                        dev.get("reputation").and_then(|v| v.as_u64())
                                    ) {
                                        println!("  @{} {} {}", u, a, r);
                                    }
                                }
                            }
                        }
                        Err(e) => eprintln!("Error: {}", e),
                    }
                }
                DevCommands::AddProject { slug, name, description } => {
                    eprintln!("Note: Use Portal UI at /developers/projects");
                    eprintln!("Slug: {}, Name: {}", slug, name);
                    if let Some(d) = description { eprintln!("Description: {}", d); }
                }
                DevCommands::Capsule { command } => {
                    match command {
                        CapsuleCommands::List { owner } => {
                            match sdk.client().call::<serde_json::Value>(
                                "devCapsule_listByOwner",
                                Some(serde_json::json!({ "owner": owner }))
                            ).await {
                                Ok(result) => {
                                    if let Some(capsules) = result.as_array() {
                                        println!("Capsules ({}):", capsules.len());
                                        for cap in capsules {
                                            if let (Some(id), Some(status), Some(project), Some(notes)) = (
                                                cap.get("id").and_then(|v| v.as_u64()),
                                                cap.get("status").and_then(|v| v.as_str()),
                                                cap.get("project_slug").and_then(|v| v.as_str()),
                                                cap.get("notes").and_then(|v| v.as_str())
                                            ) {
                                                println!("  #{} [{}] {} - {}", id, status, project, notes);
                                            }
                                        }
                                    } else {
                                        println!("No capsules found");
                                    }
                                }
                                Err(e) => eprintln!("Error: {}", e),
                            }
                        }
                        CapsuleCommands::Create { owner, project, notes } => {
                            match sdk.client().call::<serde_json::Value>(
                                "devCapsule_create",
                                Some(serde_json::json!({
                                    "owner": owner,
                                    "project_slug": project,
                                    "notes": notes
                                }))
                            ).await {
                                Ok(result) => {
                                    println!("Capsule created successfully!");
                                    println!("{}", serde_json::to_string_pretty(&result)?);
                                }
                                Err(e) => eprintln!("Error: {}", e),
                            }
                        }
                        CapsuleCommands::Status { id, status } => {
                            let valid_statuses = ["draft", "live", "paused", "archived"];
                            if !valid_statuses.contains(&status.as_str()) {
                                eprintln!("Error: Invalid status. Must be one of: {}", valid_statuses.join(", "));
                                return Ok(());
                            }
                            
                            match sdk.client().call::<serde_json::Value>(
                                "devCapsule_updateStatus",
                                Some(serde_json::json!({
                                    "id": id,
                                    "status": status
                                }))
                            ).await {
                                Ok(result) => {
                                    println!("Capsule status updated successfully!");
                                    println!("{}", serde_json::to_string_pretty(&result)?);
                                }
                                Err(e) => eprintln!("Error: {}", e),
                            }
                        }
                    }
                }
                DevCommands::ShowProject { slug } => {
                    let gateway_url = std::env::var("ABYSS_GATEWAY_URL")
                        .unwrap_or_else(|_| "http://localhost:4000/graphql".to_string());
                    
                    let query = format!(r#"query {{ project(slug: "{}") {{ slug name description maintainers {{ username }} }} }}"#, slug);
                    let client = reqwest::Client::new();
                    match client.post(&gateway_url).json(&serde_json::json!({ "query": query })).send().await {
                        Ok(response) => {
                            let json: serde_json::Value = response.json().await?;
                            if let Some(p) = json.get("data").and_then(|d| d.get("project")) {
                                println!("Project: {}", p.get("name").and_then(|v| v.as_str()).unwrap_or("N/A"));
                                println!("Slug: {}", p.get("slug").and_then(|v| v.as_str()).unwrap_or("N/A"));
                            } else {
                                println!("Project not found");
                            }
                        }
                        Err(e) => eprintln!("Error: {}", e),
                    }
                }
            }
        }
        Commands::Keygen { output } => {
            use std::path::PathBuf;
            let key_path = PathBuf::from(&output);
            let address = keygen::generate_validator_key(&key_path)?;
            if key_path.exists() && std::fs::metadata(&key_path)?.len() == 32 {
                println!("Validator key loaded:");
            } else {
                println!("Validator key generated successfully!");
            }
            println!("  Key path: {}", key_path.display());
            println!("  Validator address: {}", address);
            println!("\n⚠️  Keep your validator key secure! Never share it.");
        }
    }

    Ok(())
}

