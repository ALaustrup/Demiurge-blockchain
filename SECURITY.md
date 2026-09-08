# Security Policy

## Reporting vulnerabilities

If you discover a security vulnerability, report it privately to the maintainer ([@Alaustrup](https://github.com/Alaustrup)). Do not open a public issue, disclose before a fix, or exploit it. Provide reproduction steps and allow reasonable time for a fix.

## Supported versions

| Branch | Supported |
|--------|-----------|
| main | Yes |
| develop | Best effort |

## Current security posture

Demiurge is **pre-alpha**. Do not run it with real value at stake. `STATUS.md` lists what is and is not enforced. In particular, until Phase 1 completes:

- Transactions have no nonce or chain-id binding, so replay is possible.
- Blocks carry no author signature and there is no fork choice.
- Energy is not enforced at mempool admission.

## Measures in place

- CI runs a secret scan (gitleaks), `cargo clippy -D warnings`, and the Rust and TypeScript test/typecheck suites on every push.
- No RPC method may mutate state except via a signed transaction submitted through `author_submitExtrinsic`. A test in `framework/rpc` enforces this.
- Passwords are Argon2id-hashed; backup codes are hashed; JWT access and refresh secrets are separate and must be supplied via environment in production (startup refuses placeholders).
- Private keys, `.env` files, keystores and runtime databases are gitignored. Never commit them. If a secret is committed, rotate it; removing it from history is not enough.

## Out of scope for now

- Smart-contract security: there is no VM yet.
- CVP, ZK and post-quantum features: research code, not security controls.
