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
- **Database**: NocoDB (REST API-based database)
- **Authentication**: Nandi SSO
- **Security**: AES-256 encryption, bcrypt for passwords, TOTP (RFC 6238)

## Setup Instructions

### 1. Prerequisites

- Node.js 18+ and npm
- NocoDB instance running
- Nandi Auth credentials

### 2. Environment Configuration

Create a `.env.local` file with your configuration:

```env
# NocoDB Configuration
NEXT_PUBLIC_NOCODB_API_URL=http://localhost:8080/api/v1
NOCODB_API_TOKEN=your_nocodb_api_token
NEXT_PUBLIC_NOCODB_PROJECT_ID=your_project_id

# Nandi Auth Configuration
NEXT_AUTH_URL=https://auth.kailasa.ai
NEXT_AUTH_CLIENT_ID=your_client_id
AUTH_CLIENT_SECRET=your_client_secret
NEXT_BASE_URL=http://localhost:3000
NEXT_PUBLIC_AUTH_URL=https://auth.kailasa.ai
NEXT_PUBLIC_AUTH_CLIENT_ID=your_client_id
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Encryption Key (32 characters)
ENCRYPTION_KEY=your_32_character_encryption_key
```

### 3. Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

### 4. NocoDB Setup

Create the following tables in NocoDB:

1. **users**
   - id (UUID, Primary Key)
   - ecitizen_id (String, Unique)
   - name (String)
   - email (String, Unique)
   - role (String: 'admin' or 'user')
   - created_at (DateTime)
   - updated_at (DateTime)

2. **ecosystems**
   - id (UUID, Primary Key)
   - name (String)
   - theme (String)
   - description (String, Optional)
   - active_status (Boolean)
   - custom_metadata (JSON)
   - created_at (DateTime)
   - updated_at (DateTime)

3. **user_ecosystems**
   - id (UUID, Primary Key)
   - user_id (UUID, Foreign Key)
   - ecosystem_id (UUID, Foreign Key)
   - assigned_by (UUID, Foreign Key)
   - assigned_at (DateTime)
   - created_at (DateTime)
   - updated_at (DateTime)

4. **social_media_platforms**
   - id (UUID, Primary Key)
   - ecosystem_id (UUID, Foreign Key)
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
   - id (UUID, Primary Key)
   - platform_id (UUID, Foreign Key)
   - field_name (String)
   - old_value (String, Encrypted)
   - new_value (String, Encrypted)
   - changed_by (UUID, Foreign Key)
   - changed_at (DateTime)

6. **email_ids**
   - id (UUID, Primary Key)
   - user_id (UUID, Foreign Key)
   - email (String)
   - purpose (String)
   - is_primary (Boolean)
   - verified (Boolean)
   - created_at (DateTime)
   - updated_at (DateTime)

7. **platform_templates**
   - id (UUID, Primary Key)
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

## Future Enhancements

- Custom platform tables with configurable fields
- Bulk import/export functionality
- Advanced search and filtering
- Audit logs
- Email notifications
- API rate limiting
- Backup and restore functionality