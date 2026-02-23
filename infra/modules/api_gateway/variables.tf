variable "Environment" {
  type = string
}

variable "cognito_user_pool_client_id" {
  description = "The ID of the Cognito User Pool Client"
  type        = string
}

variable "cognito_user_pool_endpoint" {
  description = "The endpoint of the Cognito User Pool"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "The ARN of the Cognito User Pool"
  type        = string
}

variable "authorizer_lambda_invoke_arn" {
  description = "The invoke ARN of the authorizer Lambda function"
  type        = string
}

variable "upload_product_lambda_invoke_arn" {
  description = "The invoke ARN of the upload_product Lambda function"
  type        = string
}

variable "update_product_lambda_invoke_arn" {
  description = "The invoke ARN of the update_product Lambda function"
  type        = string
}

variable "get_products_for_category_lambda_invoke_arn" {
  description = "The invoke ARN of the get_products_for_category Lambda function"
  type        = string
}
