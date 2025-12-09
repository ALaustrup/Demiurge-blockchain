FROM rust:1.75 as builder

WORKDIR /app

# Copy Cargo files
COPY Cargo.toml Cargo.lock ./
COPY chain/Cargo.toml ./chain/
COPY runtime/*/Cargo.toml ./runtime/
COPY cli/Cargo.toml ./cli/

# Copy source code
COPY chain ./chain
COPY runtime ./runtime
COPY cli ./cli

# Build release
RUN cargo build --release --bin demiurge-chain

# Runtime stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/target/release/demiurge-chain /app/demiurge-chain

EXPOSE 8080

CMD ["./demiurge-chain"]

