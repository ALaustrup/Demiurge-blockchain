#!/usr/bin/env bash
set -eu

PG_HBA="/var/lib/pgsql/data/pg_hba.conf"
if [ ! -f "$PG_HBA" ]; then
  PG_HBA=$(sudo -u postgres psql -tAc "SHOW hba_file" | tr -d '[:space:]')
fi

PG_CONF="/var/lib/pgsql/data/postgresql.conf"
if [ -f "$PG_CONF" ]; then
  sudo cp "$PG_CONF" "${PG_CONF}.bak"
  sudo python3 - <<'PY'
from pathlib import Path
path = Path("/var/lib/pgsql/data/postgresql.conf")
text = path.read_text()
if "listen_addresses = '*'" not in text:
    if "#listen_addresses = 'localhost'" in text:
        text = text.replace("#listen_addresses = 'localhost'", "listen_addresses = '*'", 1)
    elif "listen_addresses = 'localhost'" in text:
        text = text.replace("listen_addresses = 'localhost'", "listen_addresses = '*'", 1)
    else:
        text += "\nlisten_addresses = '*'\n"
    path.write_text(text)
PY
fi

sudo cp "$PG_HBA" "${PG_HBA}.bak"

# Password auth for local TCP (Windows -> WSL) and socket connections
sudo tee "$PG_HBA" >/dev/null <<'EOF'
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             all                                     scram-sha-256
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    all             all             0.0.0.0/0               scram-sha-256
EOF

sudo systemctl restart postgresql || sudo service postgresql restart

PGPASSWORD="${DEV_PASSWORD:-demiurge_qor_auth_dev}" psql -h 127.0.0.1 -U qor_auth -d qor_auth -c "SELECT 1 AS ok"
echo "PostgreSQL password auth OK"
