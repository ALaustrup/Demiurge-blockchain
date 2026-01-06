# Contributing to DEMIURGE

Thank you for your interest in contributing to DEMIURGE! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## How to Contribute

### Reporting Bugs

1. **Check existing issues** - Search the issue tracker to see if the bug has already been reported
2. **Create a new issue** - If not found, create a new issue with:
   - Clear, descriptive title
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, Rust version)
   - Relevant logs or screenshots

### Suggesting Features

1. **Check existing issues** - Search for similar feature requests
2. **Create a feature request** - Include:
   - Clear description of the feature
   - Use case and benefits
   - Potential implementation approach (if known)

### Pull Requests

1. **Fork the repository**
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our style guidelines
4. **Test your changes**:
   ```bash
   # Rust tests
   cargo test --workspace
   
   # TypeScript/Node tests
   pnpm test
   
   # Lint checks
   pnpm lint
   ```
5. **Commit with clear messages**:
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

## Development Setup

### Prerequisites

- **Rust** (via rustup): `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- **Node.js** 20+ and **pnpm** 9+
- **Docker** (optional, for local deployment)

### Local Development

```bash
# Clone the repository
git clone https://github.com/Alaustrup/DEMIURGE.git
cd DEMIURGE

# Install Node dependencies
pnpm install

# Build Rust components
cargo build --workspace

# Start development servers
pnpm dev
```

### Project Structure

```
DEMIURGE/
├── chain/           # L1 blockchain (Rust)
├── apps/            # Frontend and backend applications
│   ├── abyssid-service/    # Identity & Auth API
│   ├── abyssos-portal/     # AbyssOS desktop environment
│   ├── portal-web/         # Information portal
│   └── dns-service/        # DNS resolution
├── sdk/             # TypeScript and Rust SDKs
├── indexer/         # Block indexer and GraphQL gateway
└── docs/            # Documentation
```

## Style Guidelines

### Rust Code

- Follow [Rust API Guidelines](https://rust-lang.github.io/api-guidelines/)
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting
- Document public APIs with rustdoc comments

### TypeScript Code

- Use TypeScript strict mode
- Follow ESLint configuration
- Use meaningful variable and function names
- Document complex logic with comments

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `test:` - Test additions/changes
- `chore:` - Build/tooling changes

## Security

If you discover a security vulnerability, please **DO NOT** create a public issue. Instead, follow our [Security Policy](SECURITY.md).

## Questions?

- Check our [Documentation](docs/README.md)
- Open a discussion in GitHub Discussions
- Reach out to the maintainers

---

*The flame burns eternal. The code serves the will.*
