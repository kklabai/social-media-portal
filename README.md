# Social Media Manager Portal

A comprehensive web application for managing social media accounts across multiple ecosystems with secure authentication and TOTP support.

## Features

- **SSO Authentication**: Integrated with Nandi Auth for secure single sign-on
- **Ecosystem Management**: Organize social media platforms into themed ecosystems
- **Platform Management**: Manage 25 social media platforms per ecosystem
- **Secure Credential Storage**: Encrypted storage for usernames and passwords
- **TOTP Support**: Two-factor authentication for enhanced security
- **Credential History**: Track changes to usernames, passwords, and profile IDs
- **Link Checking**: Verify if social media profile URLs are active
- **Role-Based Access**: Admin and user roles with different permissions
- **Custom Platform Fields**: Support for platform-specific custom fields

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: Nandi SSO
- **Security**: AES-256 encryption, TOTP (RFC 6238)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- Nandi Auth credentials

### 2. Environment Configuration

Create a `.env.local` file with your configuration:

```env
# Nandi SSO Configuration
NANDI_SSO_URL=your_nandi_sso_url
NANDI_APP_ID=your_app_id
NANDI_RETURN_URL=http://localhost:3001/api/auth/sso/callback

# Application URL
NEXTAUTH_URL=http://localhost:3001

# Encryption Key (32 characters)
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 3. Installation

```bash
# Install dependencies
npm install

# Initialize database
npx prisma migrate dev
npx prisma generate

# Import sample data (optional)
npx ts-node prisma/import-from-csv.ts

# Run development server
npm run dev

# Run on port 3001
./start-on-3001.sh

# Build for production
npm run build
npm start
```

### 4. Database Schema

The application uses SQLite with Prisma ORM. The database schema includes:

1. **users**
   - id (Integer, Primary Key, Auto-increment)
   - ecitizen_id (String, Unique)
   - name (String)
   - email (String, Unique)
   - role (String: 'admin' or 'user')
   - created_at (DateTime)
   - updated_at (DateTime)

2. **ecosystems**
   - id (Integer, Primary Key, Auto-increment)
   - name (String, Unique)
   - theme (String)
   - description (String, Optional)
   - active_status (Boolean)
   - custom_metadata (JSON)
   - created_at (DateTime)
   - updated_at (DateTime)

3. **user_ecosystems**
   - id (Integer, Primary Key, Auto-increment)
   - user_id (Integer, Foreign Key)
   - ecosystem_id (Integer, Foreign Key)
   - assigned_by (Integer, Foreign Key)
   - assigned_at (DateTime)
   - created_at (DateTime)
   - updated_at (DateTime)

4. **social_media_platforms**
   - id (Integer, Primary Key, Auto-increment)
   - ecosystem_id (Integer, Foreign Key)
   - platform_name (String)
   - platform_type (String)
   - profile_id (String)
   - username (String, Encrypted)
   - password (String, Encrypted)
   - totp_secret (String, Encrypted)
   - totp_enabled (Boolean)
   - profile_url (String)
   - custom_table_name (String)
   - custom_fields (JSON)
   - created_at (DateTime)
   - updated_at (DateTime)

5. **credential_history**
   - id (Integer, Primary Key, Auto-increment)
   - platform_id (Integer, Foreign Key)
   - field_name (String)
   - old_value (String, Encrypted)
   - new_value (String, Encrypted)
   - changed_by (Integer, Foreign Key)
   - changed_at (DateTime)

6. **email_ids**
   - id (Integer, Primary Key, Auto-increment)
   - user_id (Integer, Foreign Key)
   - email (String)
   - purpose (String)
   - is_primary (Boolean)
   - verified (Boolean)
   - created_at (DateTime)
   - updated_at (DateTime)

7. **platform_templates**
   - id (Integer, Primary Key, Auto-increment)
   - platform_type (String, Unique)
   - custom_fields (JSON)
   - created_at (DateTime)
   - updated_at (DateTime)

## Usage

1. **Login**: Users authenticate through Nandi SSO
2. **Dashboard**: View statistics and quick actions
3. **Ecosystems**: 
   - Admins can create, edit, and delete ecosystems
   - Users can view assigned ecosystems
4. **Platforms**: 
   - View and edit platform credentials
   - Enable/disable TOTP for enhanced security
   - Check profile URL status
5. **Custom Fields**: Configure platform-specific fields (coming soon)

## Security Best Practices

- All sensitive data (passwords, TOTP secrets) are encrypted
- Use strong encryption keys in production
- Enable HTTPS in production
- Regularly rotate API tokens
- Implement proper session management
- Use TOTP for critical platform accounts

## API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/ecosystems/*` - Ecosystem management
- `/api/platforms/*` - Platform management
- `/api/platforms/[id]/totp/*` - TOTP management
- `/api/platforms/[id]/check-link` - Link verification
- `/api/platforms/[id]/history` - Credential history

## CSV Import

The application supports bulk data import via CSV files. Sample files are provided in the `csv-data/` directory:
- `users.csv` - User accounts
- `ecosystems.csv` - Ecosystem definitions
- `social_media_platforms.csv` - Platform credentials
- `user_ecosystems.csv` - User-ecosystem assignments
- `email_ids.csv` - Email addresses
- `platform_templates.csv` - Platform templates

## Production Features

- **Pagination**: Server-side pagination for handling large datasets
- **Search**: Real-time search across all entities
- **Filtering**: Advanced filtering options for users, ecosystems, and platforms
- **Performance**: Optimized queries with Prisma ORM
- **Scalability**: SQLite for development, easily migrate to PostgreSQL/MySQL for production

## Future Enhancements

- Custom platform tables with configurable fields
- Bulk import/export functionality
- Advanced search and filtering
- Audit logs
- Email notifications
- API rate limiting
- Backup and restore functionality