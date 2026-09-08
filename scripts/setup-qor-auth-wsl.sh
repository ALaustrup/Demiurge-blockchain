#!/usr/bin/env bash
set -eu

export DEV_PASSWORD="${DEV_PASSWORD:-demiurge_qor_auth_dev}"

if command -v dnf >/dev/null 2>&1; then
  sudo dnf install -y postgresql-server postgresql-contrib redis 2>/dev/null \
    || sudo dnf install -y postgresql postgresql-contrib redis
  if [ ! -f /var/lib/pgsql/data/PG_VERSION ]; then
    sudo postgresql-setup --initdb 2>/dev/null || sudo postgresql-setup initdb
  fi
  sudo systemctl enable postgresql redis 2>/dev/null || true
  sudo systemctl start postgresql redis 2>/dev/null || {
    sudo service postgresql start
    sudo service redis start
  }
elif command -v apt-get >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -qq
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql redis-server
  sudo service postgresql start
  sudo service redis-server start
else
  echo "No supported package manager (dnf/apt-get)" >&2
  exit 1
fi

sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='qor_auth'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER qor_auth WITH PASSWORD '${DEV_PASSWORD}';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='qor_auth'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE qor_auth OWNER qor_auth;"

sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE qor_auth TO qor_auth;"

# Allow Windows host to reach services via WSL localhost forwarding
if [ -f /etc/valkey/valkey.conf ]; then
  sudo sed -i 's/^bind 127.0.0.1.*/bind 0.0.0.0/' /etc/valkey/valkey.conf
  sudo sed -i 's/^protected-mode yes/protected-mode no/' /etc/valkey/valkey.conf
  sudo systemctl restart valkey
elif [ -f /etc/redis/redis.conf ]; then
  sudo sed -i 's/^bind 127.0.0.1.*/bind 0.0.0.0/' /etc/redis/redis.conf
  sudo sed -i 's/^protected-mode yes/protected-mode no/' /etc/redis/redis.conf
  sudo systemctl restart redis
fi

# Password auth for connections from Windows (sqlx uses TCP + password)
PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
PG_CONF="/var/lib/pgsql/data/postgresql.conf"
if [ -f "$PG_CONF" ]; then
  sudo cp "$PG_CONF" "${PG_CONF}.bak"
  sudo python3 - <<'PY'
from pathlib import Path
path = Path("/var/lib/pgsql/data/postgresql.conf")
text = path.read_text()
if "listen_addresses = '*'" not in text:
    if "#listen_addresses = 'localhost'" in text:
        text = text.replace("#listen_addresses = 'localhost'", "listen_addresses = '*'")
    elif "listen_addresses = 'localhost'" in text:
        text = text.replace("listen_addresses = 'localhost'", "listen_addresses = '*'")
    else:
        text += "\nlisten_addresses = '*'\n"
    path.write_text(text)
PY
fi
if [ -f "$PG_HBA" ]; then
  sudo cp "$PG_HBA" "${PG_HBA}.bak"
  sudo tee "$PG_HBA" >/dev/null <<'EOF'
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
EOF
  sudo systemctl restart postgresql 2>/dev/null || sudo service postgresql restart
fi

redis-cli ping
PGPASSWORD="${DEV_PASSWORD}" psql -h 127.0.0.1 -U qor_auth -d qor_auth -c "SELECT 1" >/dev/null
echo "WSL PostgreSQL and Redis are ready."
