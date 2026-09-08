# Contributing to Demiurge Protocol

Welcome to the Pleroma. This guide will help you contribute to the cosmic order.

## The Laws

Before contributing, familiarize yourself with [The Laws of the Demiurge Protocol](.cursorrules).

## Naming Conventions

We follow Gnostic terminology:

| Term | Usage |
|------|-------|
| **Aeon** | Major features/modules |
| **Archon** | Governance/control systems |
| **Syzygy** | Paired/complementary systems |
| **Pleroma** | The complete system/network |
| **Monad** | The local node identity |

**Always ask for confirmation before naming new modules.**

## Development Setup

### Prerequisites

- Rust (latest stable)
- Node.js 20+ LTS
- Git
- Docker (recommended)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Alaustrup/Demiurge Protocol.git
cd Demiurge Protocol

# Install Rust dependencies (when Cargo.toml exists)
cargo build

# Run tests
cargo test
```

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `develop` | Integration branch |
| `aeon/*` | New features |
| `archon/*` | Governance changes |
| `fix/*` | Bug fixes |

## Commit Messages

Format: `[TYPE] Brief description`

Types:
- `[AEON]` - New feature
- `[ARCHON]` - Governance change
- `[SYZYGY]` - Paired system update
- `[FIX]` - Bug fix
- `[DOCS]` - Documentation
- `[REFACTOR]` - Code improvement

Example: `[AEON] Implement Qor ID registration flow`

## Pull Request Process

1. Create a branch from `develop`
2. Make your changes
3. Ensure tests pass
4. Submit PR using the template
5. Await review from the Archons

## Code Standards

- **Rust**: Follow `rustfmt` and `clippy` guidelines
- **TypeScript/JavaScript**: ESLint + Prettier
- **Documentation**: Keep README files updated

## Questions?

Open an issue or reach out to [@Alaustrup](https://github.com/Alaustrup).

---

*"From the Monad, all emanates. To the Pleroma, all returns."*

## Ground rules

- `STATUS.md` is the only source of completion claims. Update it in the same PR that changes what works.
- Every feature lands with a test that would fail without it.
- No secrets in the tree. Rotate anything that was ever committed.
- Follow `ROADMAP.md` phase order.
