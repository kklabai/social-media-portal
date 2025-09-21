# NocoDB Import Instructions

## How to Import CSV Files

1. **Open NocoDB** at https://sm.unclutch.dev
2. **Navigate to your base/project**
3. For each CSV file, follow these steps:

### Import Process:

1. Click **"+ New Table"** or **"Create Table"**
2. Choose **"Import"** → **"CSV"**
3. Upload the corresponding CSV file
4. NocoDB will automatically detect the column types
5. **Review and adjust field types**:
   - `id` fields → SingleLineText (Primary Key)
   - `email` fields → Email type
   - `*_at` fields → DateTime type
   - `active_status`, `is_primary`, `verified`, `totp_enabled` → Checkbox
   - `role`, `purpose`, `field_name` → SingleSelect (configure options)
   - `custom_metadata`, `custom_fields` → JSON
   - `description`, `old_value`, `new_value` → LongText
   - `profile_url` → URL

### Import Order:
Import tables in this order to avoid relationship issues:
1. `users.csv`
2. `ecosystems.csv`
3. `social_media_platforms.csv`
4. `user_ecosystems.csv`
5. `credential_history.csv`
6. `email_ids.csv`
7. `platform_templates.csv`

### After Import:

1. **Set up LinkToAnotherRecord relationships**:
   - In `user_ecosystems`: 
     - `user_id` → Link to `users` table
     - `ecosystem_id` → Link to `ecosystems` table
     - `assigned_by` → Link to `users` table
   - In `social_media_platforms`:
     - `ecosystem_id` → Link to `ecosystems` table
   - In `credential_history`:
     - `platform_id` → Link to `social_media_platforms` table
     - `changed_by` → Link to `users` table
   - In `email_ids`:
     - `user_id` → Link to `users` table

2. **Configure SingleSelect options**:
   - `users.role`: `admin`, `user`
   - `email_ids.purpose`: `notifications`, `updates`
   - `credential_history.field_name`: `username`, `password`, `profile_id`

3. **Set default values**:
   - DateTime fields: Set default to "Now"
   - Checkbox fields: Set appropriate defaults