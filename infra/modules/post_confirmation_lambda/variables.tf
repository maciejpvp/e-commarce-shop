variable "Environment" {
  type = string
}

variable "user_pool_arn" {
  description = "The ARN of the User Pool to which the trigger will be attached"
  type        = string
}

variable "dynamodb_table_name" {
  description = "The name of the DynamoDB table"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "The ARN of the DynamoDB table"
  type        = string
}
