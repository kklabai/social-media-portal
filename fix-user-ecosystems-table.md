# Fix user_ecosystems Table

The current `user_ecosystems` table uses NocoDB "Links" fields which cannot be set via API. Here's how to fix it:

## Steps to Recreate the Table

1. **Export existing data** (if any):
   - Go to the user_ecosystems table in NocoDB
   - Export any existing valid records

2. **Delete the current table**:
   - In NocoDB, go to the user_ecosystems table
   - Click on the table options (3 dots menu)
   - Select "Delete Table"

3. **Create new table with proper fields**:
   - Create a new table named `user_ecosystems`
   - Add these fields:

   | Field Name | Field Type | Additional Settings |
   |------------|------------|-------------------|
   | id | SingleLineText | Primary Key (auto) |
   | user_id | Number | Required |
   | ecosystem_id | Number | Required |
   | assigned_by | Number | Optional |
   | assigned_at | DateTime | Optional |
   | created_at | DateTime | Default: NOW() |
   | updated_at | DateTime | Optional |

4. **Important**: Do NOT use "Links" field type. Use regular "Number" fields for user_id and ecosystem_id.

5. **Add indexes** (optional but recommended):
   - Create index on user_id
   - Create index on ecosystem_id
   - Create unique index on (user_id, ecosystem_id) to prevent duplicates

## Alternative: Manual Assignment Process

If you can't recreate the table, here's the manual process:

1. Admin goes to NocoDB UI
2. Navigate to user_ecosystems table
3. Click "Add Record"
4. Select the user from the dropdown
5. Select the ecosystem from the dropdown
6. Save

## Temporary Workaround

Until the table is fixed, you can use this SQL directly in your database:

```sql
INSERT INTO user_ecosystems (user_id, ecosystem_id, assigned_at, created_at, assigned_by)
VALUES (?, ?, NOW(), NOW(), ?);
```

Replace the `?` with actual values.