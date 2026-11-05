#!/bin/bash
set -u
cd "$(dirname "$0")/.." || exit 1
echo "Демо-аккаунтлар паролini GoTrue orqali yangilaydi (identity qatorini ham yaratadi)."
echo "service_role kalit ekranga chiqmaydi va faylga yozilmaydi."

if [ -f .env.local ]; then
  set -a
  . ./.env.local
  set +a
fi
URL="${VITE_SUPABASE_URL:-}"
if [ -z "$URL" ]; then read -p "Project URL: " URL; fi

KEY=""
read -rs -p "service_role kalit (Dashboard → Settings → API): " KEY
echo
if [ -z "$KEY" ]; then echo "Kalit bo'sh — bekor qilindi."; exit 1; fi

CREDS=(
  "manager@stroyka.ru:manager123"
  "worker1@stroyka.ru:worker123"
  "worker2@stroyka.ru:worker123"
)

USERS_JSON=$(curl -s -H "apikey: $KEY" -H "Authorization: Bearer $KEY" "$URL/auth/v1/admin/users?per_page=500")
if ! printf '%s' "$USERS_JSON" | grep -q '"users"'; then
  echo "Ro'yxat o'qilmadi: $(printf '%s' "$USERS_JSON" | head -c 200)"
  exit 1
fi

for c in "${CREDS[@]}"; do
  EMAIL="${c%%:*}"
  PASS="${c##*:}"
  UID_ROW=$(printf '%s' "$USERS_JSON" | EMAIL="$EMAIL" python3 -c "
import os, sys, json
mail = os.environ['EMAIL'].lower()
data = json.load(sys.stdin)
print(next((u['id'] for u in data.get('users', []) if (u.get('email') or '').lower() == mail), ''))
")
  if [ -z "$UID_ROW" ]; then
    echo "$EMAIL → akkaunt topilmadi"
    continue
  fi
  RESP=$(curl -s -X PUT "$URL/auth/v1/admin/users/$UID_ROW" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"password\":\"$PASS\",\"email_confirm\":true}")
  if printf '%s' "$RESP" | grep -q '"email"'; then
    echo "$EMAIL → парол обновлён, identity создан"
  else
    echo "$EMAIL → xato: $(printf '%s' "$RESP" | head -c 200)"
  fi
done

echo "Kirish: manager@stroyka.ru / manager123, worker1|2@stroyka.ru / worker123"
