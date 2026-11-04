# Non-secret settings of the staging environment.
# Secrets (database_url) come from TF_VAR_database_url, set from a GitHub environment secret.
env        = "stg"
aws_region = "eu-west-3"
# Add the Vercel preview/production URLs once known.
cors_origins = ["*"]
