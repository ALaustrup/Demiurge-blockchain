# QOR Auth — production image for Fly.io / any container host
FROM rust:1.85-bookworm AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY migrations ./migrations
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libssl3 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/qor-auth /app/qor-auth
COPY --from=builder /app/migrations /app/migrations
ENV QOR_AUTH__SERVER__HOST=0.0.0.0
ENV QOR_AUTH__SERVER__PORT=8080
EXPOSE 8080
CMD ["/app/qor-auth"]
