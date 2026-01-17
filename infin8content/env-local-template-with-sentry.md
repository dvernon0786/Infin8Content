# Copy this content to your .env.local file
# Do NOT commit your actual .env.local file to version control

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Debugging and Monitoring Configuration
LOG_LEVEL=info
DEBUG_ENABLED=true
DEBUG_MONITORING_ENABLED=true

# Database Retention Policies (in days)
DEBUG_LOG_RETENTION_DAYS=90
DEBUG_METRICS_RETENTION_DAYS=30
DEBUG_SESSIONS_RETENTION_DAYS=7

# Inngest Debugging
INNGEST_DEBUG_ENABLED=true
INNGEST_DEBUG_LOG_LEVEL=info
INNGEST_DEBUG_SAMPLE_RATE=1.0

# Production Monitoring
MONITORING_ENABLED=true

# Sentry Configuration
SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1

# Custom Metrics (optional)
# CUSTOM_METRICS_ENDPOINT=https://your-metrics-endpoint.com/api/metrics
# CUSTOM_METRICS_API_KEY=your-metrics-api-key

# Alerting (optional)
# ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
# SLACK_CHANNEL=#debug-alerts
# EMAIL_RECIPIENTS=admin@example.com,dev-team@example.com
