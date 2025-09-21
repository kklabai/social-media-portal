# NocoDB Table Setup Guide

## 1. Create Tables

Create the following tables in NocoDB:

### users
- id (SingleLineText, Primary Key)
- ecitizen_id (SingleLineText, Unique)
- name (SingleLineText, Required)
- email (Email, Required, Unique)
- role (SingleSelect: admin, user)
- created_at (DateTime)
- updated_at (DateTime)

### ecosystems
- id (SingleLineText, Primary Key)
- name (SingleLineText, Required)
- theme (SingleLineText, Required)
- description (LongText)
- active_status (Checkbox, Default: true)
- custom_metadata (JSON)
- created_at (DateTime)
- updated_at (DateTime)

### user_ecosystems
- id (SingleLineText, Primary Key)
- user_id (LinkToAnotherRecord → users)
- ecosystem_id (LinkToAnotherRecord → ecosystems)
- assigned_by (LinkToAnotherRecord → users)
- assigned_at (DateTime)
- created_at (DateTime)
- updated_at (DateTime)

### social_media_platforms
- id (SingleLineText, Primary Key)
- ecosystem_id (LinkToAnotherRecord → ecosystems)
- platform_name (SingleLineText, Required)
- platform_type (SingleLineText)
- profile_id (SingleLineText)
- username (SingleLineText)
- password (SingleLineText)
- totp_secret (SingleLineText)
- totp_enabled (Checkbox, Default: false)
- profile_url (URL)
- custom_table_name (SingleLineText)
- custom_fields (JSON)
- created_at (DateTime)
- updated_at (DateTime)

### credential_history
- id (SingleLineText, Primary Key)
- platform_id (LinkToAnotherRecord → social_media_platforms)
- field_name (SingleSelect: username, password, profile_id)
- old_value (LongText)
- new_value (LongText)
- changed_by (LinkToAnotherRecord → users)
- changed_at (DateTime)

### email_ids
- id (SingleLineText, Primary Key)
- user_id (LinkToAnotherRecord → users)
- email (Email, Required)
- purpose (SingleSelect: notifications, updates)
- is_primary (Checkbox, Default: false)
- verified (Checkbox, Default: false)
- created_at (DateTime)
- updated_at (DateTime)

### platform_templates
- id (SingleLineText, Primary Key)
- platform_type (SingleLineText, Unique)
- custom_fields (JSON)
- created_at (DateTime)
- updated_at (DateTime)

## 2. Get API Token

1. Click on your profile icon in NocoDB
2. Go to "API Tokens"
3. Create a new token
4. Copy the token for your .env.local file

## 3. Get Project ID

1. In NocoDB, click on the project
2. The URL will be like: `http://localhost:8080/#/nc/project_id/...`
3. Copy the project_id from the URL