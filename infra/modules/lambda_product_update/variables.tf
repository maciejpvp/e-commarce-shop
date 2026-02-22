variable "Environment" {
  type = string
}

variable "api_gateway_execution_arn" {
  description = "The execution ARN of the API Gateway, used for Lambda invoke permission"
  type        = string
}

variable "table_name" {
  description = "The name of the DynamoDB table for product metadata"
  type        = string
}

variable "table_arn" {
  description = "The ARN of the DynamoDB table for product metadata"
  type        = string
}
