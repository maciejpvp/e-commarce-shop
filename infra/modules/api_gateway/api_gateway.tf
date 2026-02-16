locals {
  # 1. Parse raw spec to get security mapping (breaks cycle)
  # Security mapping does not contain template variables, so it's safe to parse raw.
  raw_api_spec = yamldecode(file("${path.module}/api.yaml"))

  # Extract security mapping: "METHOD/path" -> ["group1", "group2"]
  security_mapping = merge([
    for path, methods in local.raw_api_spec.paths : {
      for method, config in methods :
      "${upper(method)}${path}" => lookup(config, "x-required-groups", [])
      if method != "parameters"
    }
  ]...)

  # 2. Render the body for API Gateway deployment
  # This depends on the authorizer ARN, which depends on security_mapping.
  rendered_body = templatefile("${path.module}/api.yaml", {
    cognito_audience             = var.cognito_user_pool_client_id
    cognito_issuer               = "https://${var.cognito_user_pool_endpoint}"
    upload_product_lambda_uri    = var.upload_product_lambda_invoke_arn
    cognito_user_pool_arn        = var.cognito_user_pool_arn
    authorizer_lambda_invoke_arn = aws_lambda_function.authorizer.invoke_arn
  })

  api_spec = yamldecode(local.rendered_body)
}

resource "aws_api_gateway_rest_api" "this" {
  name        = "e-commarce-shop-api"
  description = "REST API Gateway for e-commarce-shop"

  body = local.rendered_body

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
