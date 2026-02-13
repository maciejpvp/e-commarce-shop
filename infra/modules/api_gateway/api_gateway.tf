module "api_gateway" {
  source = "terraform-aws-modules/apigateway-v2/aws"

  name          = "e-commarce-shop-api"
  description   = "HTTP API Gateway for e-commarce-shop"
  protocol_type = "HTTP"

  create_domain_name = false
  create_certificate = false

  cors_configuration = {
    allow_headers = ["content-type", "x-amz-date", "authorization", "x-api-key", "x-amz-security-token", "x-amz-user-agent"]
    allow_methods = ["*"]
    allow_origins = ["*"]
  }

  # Access logs
  stage_access_log_settings = {
    create_log_group            = true
    log_group_retention_in_days = 7
    format = jsonencode({
      context = {
        domainName              = "$context.domainName"
        integrationErrorMessage = "$context.integrationErrorMessage"
        protocol                = "$context.protocol"
        requestId               = "$context.requestId"
        requestTime             = "$context.requestTime"
        responseLength          = "$context.responseLength"
        routeKey                = "$context.routeKey"
        stage                   = "$context.stage"
        status                  = "$context.status"
        error = {
          message      = "$context.error.message"
          responseType = "$context.error.responseType"
        }
        identity = {
          sourceIP = "$context.identity.sourceIp"
        }
        integration = {
          error             = "$context.integration.error"
          integrationStatus = "$context.integration.integrationStatus"
        }
      }
    })
  }

  # OpenAPI specification
  body = templatefile("${path.module}/api.yaml", {
    post_integration_uri    = "arn:aws:lambda:eu-west-1:052235179155:function:my-function"
    default_integration_uri = "arn:aws:lambda:eu-west-1:052235179155:function:my-default-function"
    cognito_audience        = var.cognito_user_pool_client_id
    cognito_issuer          = "https://${var.cognito_user_pool_endpoint}"
  })

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}
