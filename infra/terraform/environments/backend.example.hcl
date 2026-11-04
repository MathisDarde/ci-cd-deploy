# Copy to backend.hcl (git-ignored values are fine here: nothing secret) and set the bucket
# created by infra/bootstrap. The state key is passed per environment:
#   terraform init -backend-config=environments/backend.hcl -backend-config="key=pokewishlist/prd.tfstate"
bucket       = "pokewishlist-tfstate-123456789012"
region       = "eu-west-3"
encrypt      = true
use_lockfile = true
