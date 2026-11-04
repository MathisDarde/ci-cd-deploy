# Non-secret settings of the production environment.
# Secrets (database_url) come from TF_VAR_database_url, set from a GitHub environment secret.
env        = "prd"
aws_region = "eu-west-3"
# Restrict to the real front URLs, e.g. ["https://pokewishlist.vercel.app", "https://dxxxx.cloudfront.net"].
cors_origins       = ["*"]
lambda_memory_mb   = 512
log_retention_days = 30
