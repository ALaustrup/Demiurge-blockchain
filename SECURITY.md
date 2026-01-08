# Security Policy

## Reporting a Vulnerability

**IMPORTANT**: For security vulnerabilities, please **DO NOT** create a public GitHub issue.

### How to Report

1. **Email**: Send details to the project maintainers privately
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to Expect

- **Acknowledgment**: Within 48 hours
- **Initial Assessment**: Within 7 days
- **Resolution Timeline**: Depends on severity (critical issues prioritized)

## Security Measures

### Blockchain Security

DEMIURGE implements several security measures:

#### Cryptographic Standards
- **Ed25519** signatures for all transactions
- **SHA-256** for block hashing
- **Argon2** for memory-hard Proof-of-Work

#### Runtime Security
- Modular runtime with isolated state
- Transaction replay protection via nonces
- Fee-based spam prevention
- Module-level authorization checks

#### Network Security
- HTTPS for all production endpoints
- CORS configuration for API access
- Rate limiting on RPC endpoints

### Application Security

#### QOR ID Service
- Seed phrases never transmitted to server
- Only public keys stored
- Case-insensitive username handling
- Input validation on all endpoints

#### QLOUD OS
- Client-side key derivation
- No sensitive data in localStorage
- Secure WebSocket connections

## Known Security Considerations

### Current Limitations

1. **Single Node Operation**: Currently running single-node devnet; multi-node security pending
2. **Key Storage**: User responsibility to secure seed phrases
3. **Smart Contracts**: No WASM runtime yet; limited attack surface

### Recommended Practices

For Users:
- **Never share** your seed phrase
- **Backup** seed phrases securely (offline)
- **Verify** addresses before transactions

For Operators:
- Use **firewall** rules to restrict RPC access
- Implement **rate limiting** on public endpoints
- Regular **security audits**
- Monitor for **anomalous activity**

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅ Yes    |
| < 0.1   | ❌ No     |

## Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes in CHANGELOG.md

---

*Security is paramount. Report responsibly.*
