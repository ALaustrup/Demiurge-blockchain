#!/usr/bin/env bash
set -eu

PG_CONF="/var/lib/pgsql/data/postgresql.conf"

if ! sudo test -f "$PG_CONF"; then
  echo "PostgreSQL config not found at $PG_CONF" >&2
  exit 1
fi

sudo sed -i "s/^#\?listen_addresses = .*/listen_addresses = '*'/" "$PG_CONF"

if ! sudo grep -q "^listen_addresses = '\\*'" "$PG_CONF"; then
  echo "listen_addresses = '*'" | sudo tee -a "$PG_CONF" >/dev/null
fi

sudo systemctl restart postgresql 2>/dev/null || sudo service postgresql restart
sudo grep -n "^listen_addresses" "$PG_CONF"
ss -tlnp 2>/dev/null | grep ":5432"
