terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.6"
    }
  }

  # Remote state, one file per environment (partial configuration):
  #   terraform init -backend-config=environments/backend.hcl -backend-config="key=pokewishlist/stg.tfstate"
  # The bucket comes from infra/bootstrap.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project
      Environment = var.env
      ManagedBy   = "terraform"
    }
  }
}

# CloudFront only accepts ACM certificates and some resources from us-east-1.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
