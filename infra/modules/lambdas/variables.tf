variable "Environment" {
  description = "The environment for the infrastructure"
  type        = string
}

variable "table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "bucket_name" {
  description = "S3 bucket name for product media"
  type        = string
  default     = ""
}

variable "bucket_arn" {
  description = "S3 bucket ARN for product media"
  type        = string
  default     = ""
}

variable "user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "api_gateway_execution_arn" {
  description = "API Gateway execution ARN"
  type        = string
}

variable "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "cognito_user_pool_endpoint" {
  description = "Cognito User Pool Endpoint"
  type        = string
}

variable "security_mapping" {
  description = "Security mapping for authorizer"
  type        = any
}
