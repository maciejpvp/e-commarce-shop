variable "media_bucket_id" {
  description = "The ID of the S3 bucket for product media"
  type        = string
}

variable "media_bucket_domain_name" {
  description = "The regional domain name of the S3 bucket"
  type        = string
}

variable "media_bucket_arn" {
  description = "The ARN of the S3 bucket for policy attachment"
  type        = string
}

variable "api_gateway_domain" {
  description = "The domain name of the API Gateway"
  type        = string
}

variable "api_gateway_stage" {
  description = "The stage name of the API Gateway"
  type        = string
}

variable "api_key" {
  description = "The API Key for API Gateway"
  type        = string
  sensitive   = true
}
