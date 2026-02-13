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
