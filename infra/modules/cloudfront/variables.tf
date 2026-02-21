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
