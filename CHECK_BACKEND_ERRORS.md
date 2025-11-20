# Check Backend 500 Errors

## On Your Server, Run:

```bash
# Check backend logs for the actual error
docker compose logs backend --tail=50

# Or follow logs in real-time
docker compose logs -f backend
```

## Common Causes of 500 Errors:

1. **Database connection issue**
   - Check: `docker compose logs backend | grep -i "error\|connection"`
   
2. **Missing tables**
   - Check: Database schema is initialized
   - Run: `./scripts/init-database.sh` if needed

3. **Query error**
   - Check: MySQL syntax errors in logs
   - Check: Table/column names match

4. **Missing relations**
   - Check: Entity relationships are correct
   - Check: Foreign keys exist

5. **TypeORM query error**
   - Check: Query builder syntax
   - Check: Parameter binding

## Quick Test:

```bash
# Test backend health
curl http://localhost:3000/api/health

# Test cases endpoint directly
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/cases
```

## Most Likely Issue:

The error is probably in the `findAll` query. Check the backend logs to see the exact error message.

