# Database Migration Instructions

## Create Settings Table

### Option 1: Run SQL inside Docker container (EASIEST)

```bash
# Execute SQL directly in the database container
docker exec -i gstore-warranty-db mysql -u gstore -pgstore123 gstore_warranty < database/migrations/001_create_settings_table.sql
```

### Option 2: Connect to container and run SQL manually

```bash
# Connect to MySQL inside the container
docker exec -it gstore-warranty-db mysql -u gstore -pgstore123 gstore_warranty

# Then paste this SQL:
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

# Type 'exit' to leave MySQL
```

### Option 3: If you have custom credentials

Check your `.env` file or environment variables:
- `DB_NAME` (default: `gstore_warranty`)
- `DB_USER` (default: `gstore`)
- `DB_PASSWORD` (default: `gstore123`)

Then use:
```bash
docker exec -i gstore-warranty-db mysql -u YOUR_USER -pYOUR_PASSWORD YOUR_DATABASE < database/migrations/001_create_settings_table.sql
```

### Option 4: Using root user (if above doesn't work)

```bash
# Using root user
docker exec -i gstore-warranty-db mysql -u root -prootpassword gstore_warranty < database/migrations/001_create_settings_table.sql
```

## Verify Table Created

```bash
# Check if table exists
docker exec -it gstore-warranty-db mysql -u gstore -pgstore123 gstore_warranty -e "SHOW TABLES LIKE 'settings';"
```

