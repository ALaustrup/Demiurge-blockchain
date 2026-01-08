/**
 * SharedSession - Shared Memory Structure
 * 
 * Used for fast session sharing between processes.
 */

#ifndef GENESIS_SHARED_SESSION_H
#define GENESIS_SHARED_SESSION_H

#include <cstdint>

#define SHARED_SESSION_MAGIC 0x47454E53  // "GENS"

/**
 * Shared memory structure for session data
 * Must be POD (Plain Old Data) for shared memory
 */
#pragma pack(push, 1)
struct SharedSession {
    uint32_t magic;           // Magic number for validation
    uint32_t version;         // Structure version
    uint8_t  authenticated;   // Is user authenticated
    char     token[256];      // Session token
    char     username[64];    // Username
    char     abyssId[64];     // AbyssID address
    int64_t  timestamp;       // Last update timestamp
    uint32_t checksum;        // CRC32 of data
};
#pragma pack(pop)

#endif // GENESIS_SHARED_SESSION_H
