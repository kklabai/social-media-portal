# CSV Data Import Guide

This directory contains sample CSV files for importing data into the Social Media Portal database.

## How to Import Data

1. Place your CSV files in this directory (`csv-data/`)
2. Run the import command:
   ```bash
   npm run db:import
   ```

## CSV File Formats

### 1. users.csv
Contains user accounts that can log into the system.

| Column | Description | Required | Valid Values |
|--------|-------------|----------|--------------|
| email | User's email address (must match SSO login) | Yes | Valid email |
| name | User's display name | Yes | Any text |
| ecitizen_id | E-citizen identifier | No | Any text |
| role | User's role in system | Yes | `admin` or `user` |

### 2. ecosystems.csv
Digital ecosystems that group social media accounts.

| Column | Description | Required | Valid Values |
|--------|-------------|----------|--------------|
| name | Unique ecosystem name | Yes | Any text |
| theme | Ecosystem theme/category | Yes | Any text |
| description | Ecosystem description | No | Any text |
| active_status | Whether ecosystem is active | Yes | `true` or `false` |

### 3. user_ecosystems.csv
Assigns users to ecosystems they can manage.

| Column | Description | Required | Notes |
|--------|-------------|----------|--------|
| user_email | Email of user to assign | Yes | Must exist in users.csv |
| ecosystem_name | Name of ecosystem | Yes | Must exist in ecosystems.csv |
| assigned_by_email | Email of admin who assigned | No | Must exist in users.csv |

### 4. platform_templates.csv
Templates for the 25 supported social media platforms.

| Column | Description | Required | Notes |
|--------|-------------|----------|--------|
| platform_name | Platform name | Yes | Must be one of the 25 platforms |
| platform_category | Category of platform | Yes | e.g., Video, Social Network |
| template_data | JSON template data | No | Custom fields as JSON |

### 5. social_media_platforms.csv
Actual social media accounts for each ecosystem.

| Column | Description | Required | Notes |
|--------|-------------|----------|--------|
| ecosystem_name | Ecosystem this belongs to | Yes | Must exist in ecosystems.csv |
| platform_name | Platform type | Yes | Must exist in platform_templates.csv |
| platform_type | Platform category | No | e.g., Video, Blog |
| account_status | Account status | No | Default: `active` |
| profile_url | Profile URL | No | Full URL |
| username | Account username | No | Will be encrypted |
| password | Account password | No | Will be encrypted |
| email | Account email | No | Plain text |
| profile_id | Profile/Channel ID | No | Platform-specific ID |
| two_fa_enabled | 2FA enabled | No | `true` or `false` |
| totp_enabled | TOTP enabled | No | `true` or `false` |
| totp_secret | TOTP secret | No | Will be encrypted |
| verification_status | Verification status | No | `verified` or `unverified` |
| notes | Additional notes | No | Any text |

### 6. email_ids.csv
Email addresses used across the organization.

| Column | Description | Required | Notes |
|--------|-------------|----------|--------|
| email_address | Email address | Yes | Valid email |
| ecosystem_name | Related ecosystem | No | Optional association |
| primary_use | Primary use case | No | e.g., Social Media, Support |
| status | Email status | No | Default: `active` |
| created_by | Creator's name | No | Any text |
| notes | Additional notes | No | Any text |

## Important Notes

1. **Order matters**: Import files in the order listed above due to dependencies
2. **Email matching**: User emails in CSV must exactly match SSO login emails
3. **Case sensitivity**: Emails are converted to lowercase automatically
4. **Duplicates**: The import uses upsert, so running multiple times is safe
5. **Encryption**: Passwords and TOTP secrets are encrypted automatically

## Adding Your Real Data

1. Replace the sample users with your actual admin users
2. Ensure at least one admin user email matches your SSO login email
3. Create ecosystems for your organization
4. Assign users to appropriate ecosystems
5. Add your actual social media platform credentials

## Supported Platforms

The following 25 platforms are supported:
- YouTube
- Facebook
- Instagram
- Twitter/X
- TikTok
- Pinterest
- LinkedIn
- Bluesky
- Threads
- Reddit
- Blogspot
- Mastodon
- Telegram
- Nostr
- Lemmy
- Warpcast
- Twitch
- DLive
- Trovo
- Kick
- Rumble
- WhatsApp Channel
- Medium
- Quora
- Discord