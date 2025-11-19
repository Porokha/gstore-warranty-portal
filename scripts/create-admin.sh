#!/bin/bash

# Script to create initial admin user
# Usage: ./scripts/create-admin.sh

set -e

echo "🔐 Creating admin user..."

# Check if backend container is running
if ! docker ps | grep -q gstore-warranty-backend; then
    echo "❌ Backend container is not running!"
    echo "Please start the application first: docker-compose -f docker-compose.prod.yml up -d"
    exit 1
fi

# Prompt for admin details
read -p "Enter admin username (default: admin): " username
username=${username:-admin}

read -p "Enter admin password: " -s password
echo ""

read -p "Enter admin name (default: Admin): " name
name=${name:-Admin}

read -p "Enter admin last name (default: User): " last_name
last_name=${last_name:-User}

# Generate password hash
echo "🔑 Generating password hash..."
hash=$(docker-compose -f docker-compose.prod.yml exec -T backend node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$password', 10).then(hash => {
  console.log(hash);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
" | tr -d '\r\n')

if [ -z "$hash" ]; then
    echo "❌ Failed to generate password hash!"
    exit 1
fi

# Get database password from .env
if [ ! -f "backend/.env" ]; then
    echo "❌ backend/.env file not found!"
    exit 1
fi

db_password=$(grep "^DB_PASSWORD=" backend/.env | cut -d '=' -f2 | tr -d '"' | tr -d "'")

# Insert admin user
echo "👤 Creating admin user in database..."
docker-compose -f docker-compose.prod.yml exec -T db mysql -u gstore -p"$db_password" gstore_warranty <<EOF
INSERT INTO users (name, last_name, username, password_hash, role, language_pref)
VALUES ('$name', '$last_name', '$username', '$hash', 'admin', 'en')
ON DUPLICATE KEY UPDATE
  password_hash = '$hash',
  role = 'admin';
SELECT 'Admin user created/updated successfully!' as message;
EOF

echo ""
echo "✅ Admin user created successfully!"
echo ""
echo "📝 Login credentials:"
echo "   Username: $username"
echo "   Password: (the one you entered)"
echo ""
echo "🌐 Login at: http://YOUR_IP:3001/staff/login"

