variable "Environment" {
  type = string
}

variable "api_gateway_execution_arn" {
  description = "The execution ARN of the API Gateway, used for Lambda invoke permission"
  type        = string
}
