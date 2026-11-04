# One-time, account-level setup (local state, run by a human with admin rights):
#   cd infra/bootstrap && terraform init && terraform apply -var github_repository=owner/repo -var budget_email=you@example.com
#
# Creates:
#   - the S3 bucket holding the Terraform state of every environment;
#   - GitHub OIDC trust + a deploy role: GitHub Actions gets short-lived AWS credentials,
#     no long-lived access key stored in GitHub secrets;
#   - a monthly budget alert.

terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.80"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "project" {
  type    = string
  default = "pokewishlist"
}

variable "github_repository" {
  description = "owner/repo allowed to deploy, e.g. mathis/pokewishlist."
  type        = string
}

variable "github_subject_prefix" {
  description = <<-EOT
    OIDC "sub" prefix when the repository uses immutable subject claims (the default for
    new repositories): repo:<owner>@<owner-id>/<repo>@<repo-id>. Read it with
    `gh api repos/<owner>/<repo>/actions/oidc/customization/sub` (sub_claim_prefix).
  EOT
  type        = string
  default     = ""
}

variable "budget_email" {
  description = "Receives the budget alerts."
  type        = string
}

variable "monthly_budget_usd" {
  type    = number
  default = 5
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

# ---------- Terraform state ----------

resource "aws_s3_bucket" "tfstate" {
  bucket = "${var.project}-tfstate-${data.aws_caller_identity.current.account_id}"
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ---------- GitHub Actions → AWS without stored keys (OIDC) ----------

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

data "aws_iam_policy_document" "github_assume" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    # Only workflows of this repository, running for a GitHub environment (prd…).
    # Both subject formats: repo:owner/repo:… and the immutable repo:owner@id/repo@id:…
    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = compact([
        "repo:${var.github_repository}:environment:*",
        var.github_subject_prefix == "" ? "" : "${var.github_subject_prefix}:environment:*",
      ])
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "${var.project}-github-deploy"
  assume_role_policy = data.aws_iam_policy_document.github_assume.json
}

data "aws_iam_policy_document" "deploy" {
  statement {
    sid       = "TerraformState"
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject", "s3:ListBucket"]
    resources = [aws_s3_bucket.tfstate.arn, "${aws_s3_bucket.tfstate.arn}/*"]
  }

  statement {
    sid = "ManageProjectResources"
    actions = [
      "lambda:*",
      "apigateway:*",
      "logs:*",
      "cloudfront:*",
      "s3:*",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region, "us-east-1"]
    }
  }

  statement {
    sid = "ManageProjectRoles"
    actions = [
      "iam:GetRole", "iam:CreateRole", "iam:DeleteRole", "iam:TagRole", "iam:UntagRole",
      "iam:AttachRolePolicy", "iam:DetachRolePolicy", "iam:ListAttachedRolePolicies",
      "iam:ListRolePolicies", "iam:ListInstanceProfilesForRole", "iam:PassRole",
      "iam:UpdateAssumeRolePolicy",
    ]
    resources = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/${var.project}-*"]
  }

  statement {
    sid       = "Identity"
    actions   = ["sts:GetCallerIdentity"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy.json
}

# ---------- Budget alert ----------

resource "aws_budgets_budget" "monthly" {
  name         = "${var.project}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_usd)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 50
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = [var.budget_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.budget_email]
  }
}

output "tfstate_bucket" {
  value = aws_s3_bucket.tfstate.bucket
}

output "deploy_role_arn" {
  description = "Put it in the GitHub variable AWS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.deploy.arn
}
