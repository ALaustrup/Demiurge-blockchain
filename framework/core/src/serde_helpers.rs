//! Serde helpers for byte arrays

use serde::{Serializer, Deserializer};

pub fn serialize_bytes<S>(bytes: &[u8; 32], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    use serde::ser::SerializeSeq;
    let mut seq = serializer.serialize_seq(Some(32))?;
    for byte in bytes {
        seq.serialize_element(byte)?;
    }
    seq.end()
}

pub fn deserialize_bytes<'de, D>(deserializer: D) -> Result<[u8; 32], D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{Visitor, SeqAccess};
    use std::fmt;

    struct BytesVisitor;

    impl<'de> Visitor<'de> for BytesVisitor {
        type Value = [u8; 32];

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a byte array of length 32")
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: SeqAccess<'de>,
        {
            let mut bytes = [0u8; 32];
            for (i, byte) in bytes.iter_mut().enumerate() {
                *byte = seq.next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(i, &self))?;
            }
            Ok(bytes)
        }
    }

    deserializer.deserialize_seq(BytesVisitor)
}

pub fn serialize_bytes64<S>(bytes: &[u8; 64], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    use serde::ser::SerializeSeq;
    let mut seq = serializer.serialize_seq(Some(64))?;
    for byte in bytes {
        seq.serialize_element(byte)?;
    }
    seq.end()
}

pub fn deserialize_bytes64<'de, D>(deserializer: D) -> Result<[u8; 64], D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{Visitor, SeqAccess};
    use std::fmt;

    struct Bytes64Visitor;

    impl<'de> Visitor<'de> for Bytes64Visitor {
        type Value = [u8; 64];

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("a byte array of length 64")
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: SeqAccess<'de>,
        {
            let mut bytes = [0u8; 64];
            for (i, byte) in bytes.iter_mut().enumerate() {
                *byte = seq.next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(i, &self))?;
            }
            Ok(bytes)
        }
    }

    deserializer.deserialize_seq(Bytes64Visitor)
}

/// Serialize Option<[u8; 32]> - None becomes null, Some becomes byte array
pub fn serialize_option_bytes<S>(bytes: &Option<[u8; 32]>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    match bytes {
        Some(b) => {
            use serde::ser::SerializeSeq;
            let mut seq = serializer.serialize_seq(Some(32))?;
            for byte in b {
                seq.serialize_element(byte)?;
            }
            seq.end()
        }
        None => serializer.serialize_none(),
    }
}

/// Deserialize Option<[u8; 32]> - null becomes None, byte array becomes Some
pub fn deserialize_option_bytes<'de, D>(deserializer: D) -> Result<Option<[u8; 32]>, D::Error>
where
    D: Deserializer<'de>,
{
    use serde::de::{Visitor, SeqAccess};
    use std::fmt;

    struct OptionBytesVisitor;

    impl<'de> Visitor<'de> for OptionBytesVisitor {
        type Value = Option<[u8; 32]>;

        fn expecting(&self, formatter: &mut fmt::Formatter) -> fmt::Result {
            formatter.write_str("null or a byte array of length 32")
        }

        fn visit_none<E>(self) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(None)
        }

        fn visit_unit<E>(self) -> Result<Self::Value, E>
        where
            E: serde::de::Error,
        {
            Ok(None)
        }

        fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error>
        where
            A: SeqAccess<'de>,
        {
            let mut bytes = [0u8; 32];
            for (i, byte) in bytes.iter_mut().enumerate() {
                *byte = seq.next_element()?
                    .ok_or_else(|| serde::de::Error::invalid_length(i, &self))?;
            }
            Ok(Some(bytes))
        }
    }

    deserializer.deserialize_option(OptionBytesVisitor)
}
