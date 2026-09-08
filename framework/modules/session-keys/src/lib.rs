//! # Session Keys Module
//!
//! Temporary authorization for games - No wallet popups during gameplay

pub mod session;
pub mod error;

pub use session::{SessionKeysModule, SessionCall, constants};
pub use error::{SessionKeysError, Result};
