output "cloudfront_distribution_id" {
  description = "The ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distro.id
}

output "cloudfront_domain_name" {
  description = "The URL of the CloudFront distribution"
  value       = aws_cloudfront_distribution.main_distro.domain_name
}

output "cloudfront_arn" {
  description = "The ARN of the CloudFront distribution (needed for S3 bucket policy)"
  value       = aws_cloudfront_distribution.main_distro.arn
}
