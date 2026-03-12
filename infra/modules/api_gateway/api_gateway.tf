data "external" "flatten_endpoints" {
  program = ["node", "${path.module}/flatten_endpoints.js"]

  query = {
    endpoints = jsonencode(var.endpoints)
  }
}

locals {
  parsed_routes = jsondecode(data.external.flatten_endpoints.result.routes_json)

  # Map security rules based on the flattened routes array
  security_mapping = {
    for route in local.parsed_routes : "${route.method}${route.path}" => route.config.permissions
  }

  rendered_body = templatefile("${path.module}/api.yaml", {
    cognito_audience             = var.cognito_user_pool_client_id
    cognito_issuer               = "https://${var.cognito_user_pool_endpoint}"
    cognito_user_pool_arn        = var.cognito_user_pool_arn
    authorizer_lambda_invoke_arn = var.authorizer_lambda_invoke_arn
    routes                       = local.parsed_routes
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

resource "aws_api_gateway_api_key" "this" {
  name = "e-commarce-shop-api-key"
}

resource "aws_api_gateway_usage_plan" "this" {
  name = "e-commarce-shop-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.this.id
    stage  = aws_api_gateway_stage.this.stage_name
  }

  quota_settings {
    limit  = 500
    period = "DAY"
  }

  throttle_settings {
    burst_limit = 10
    rate_limit  = 5
  }
}

resource "aws_api_gateway_usage_plan_key" "this" {
  key_id        = aws_api_gateway_api_key.this.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.this.id
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

output "api_endpoint_domain" {
  description = "The domain name of the API Gateway endpoint"
  value       = "${aws_api_gateway_rest_api.this.id}.execute-api.eu-central-1.amazonaws.com"
}

output "stage_name" {
  description = "The stage name of the API Gateway"
  value       = aws_api_gateway_stage.this.stage_name
}

output "security_mapping" {
  value = local.security_mapping
}

output "api_key_value" {
  description = "The value of the API Key"
  value       = aws_api_gateway_api_key.this.value
  sensitive   = true
}
