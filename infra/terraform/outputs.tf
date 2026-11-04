output "api_url" {
  description = "Base URL of the Hono API (API Gateway → Lambda alias live)."
  value       = aws_apigatewayv2_api.api.api_endpoint
}

output "lambda_function_name" {
  value = aws_lambda_function.api.function_name
}

output "lambda_alias" {
  value = aws_lambda_alias.live.name
}

output "front_bucket" {
  value = aws_s3_bucket.front.bucket
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.front.id
}

output "front_url" {
  description = "SSG site URL."
  value       = "https://${aws_cloudfront_distribution.front.domain_name}"
}
