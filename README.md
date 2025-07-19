# Tree of Life Agencies Email Campaigns

Automated email marketing system for Tree of Life Agencies.

## Services

- **campaigns**: Sends daily email campaigns (100 emails/day, business hours)
- **sequences**: Processes automated email sequences

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `RESEND_API_KEY`: Resend API key for email delivery
- `NODE_ENV`: Set to "production"

## Deployment

This project is configured for Railway deployment with two background worker services.