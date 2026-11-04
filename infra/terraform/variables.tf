variable "env" {
  description = "Environment name: dev, stg, prd… One infrastructure per environment, from the same code."
  type        = string

  validation {
    condition     = contains(["int", "dev", "stg", "tst", "ppd", "prd"], var.env)
    error_message = "env must be one of int, dev, stg, tst, ppd, prd."
  }
}

variable "project" {
  type    = string
  default = "pokewishlist"
}

variable "aws_region" {
  type    = string
  default = "eu-west-3"
}

variable "database_url" {
  description = "Supabase connection string (transaction pooler, port 6543). Pass it as TF_VAR_database_url, never in a file."
  type        = string
  sensitive   = true
}

variable "cors_origins" {
  description = "Browser origins allowed to call the API (Vercel and CloudFront front URLs)."
  type        = list(string)
  default     = ["*"]
}

variable "lambda_memory_mb" {
  type    = number
  default = 256
}

variable "lambda_timeout_s" {
  type    = number
  default = 10
}

variable "log_retention_days" {
  type    = number
  default = 14
}
