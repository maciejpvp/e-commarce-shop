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

variable "endpoints" {
  description = "List of endpoints to configure in the API Gateway"
  type = list(object({
    endpoint    = string
    type        = string
    lambda      = string
    permissions = list(string)
  }))
}
