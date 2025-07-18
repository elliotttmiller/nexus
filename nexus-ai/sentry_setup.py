import os
import sentry_sdk

sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    traces_sample_rate=1.0,
    environment=os.getenv('ENVIRONMENT', 'development')
) 