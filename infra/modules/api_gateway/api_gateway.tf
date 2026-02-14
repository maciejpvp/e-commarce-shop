resource "aws_api_gateway_rest_api" "this" {
  name        = "e-commarce-shop-api"
  description = "REST API Gateway for e-commarce-shop"

  body = templatefile("${path.module}/api.yaml", {
    cognito_audience          = var.cognito_user_pool_client_id
    cognito_issuer            = "https://${var.cognito_user_pool_endpoint}"
    upload_product_lambda_uri = var.upload_product_lambda_invoke_arn
    cognito_user_pool_arn     = var.cognito_user_pool_arn
  })

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(aws_api_gateway_rest_api.this.body)
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "this" {
  deployment_id = aws_api_gateway_deployment.this.id
  rest_api_id   = aws_api_gateway_rest_api.this.id
  stage_name    = "prod"

  # access_log_settings {
  #   destination_arn = aws_cloudwatch_log_group.api_gw.arn
  #   format = jsonencode({
  #     requestId      = "$context.requestId"
  #     ip             = "$context.identity.sourceIp"
  #     caller         = "$context.identity.caller"
  #     user           = "$context.identity.user"
  #     requestTime    = "$context.requestTime"
  #     httpMethod     = "$context.httpMethod"
  #     resourcePath   = "$context.resourcePath"
  #     status         = "$context.status"
  #     protocol       = "$context.protocol"
  #     responseLength = "$context.responseLength"
  #   })
  # }

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/api-gw/e-commarce-shop-api"
  retention_in_days = 7

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

output "api_execution_arn" {
  description = "The execution ARN of the REST API Gateway"
  value       = aws_api_gateway_rest_api.this.execution_arn
}
