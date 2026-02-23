module "authorizer" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-authorizer"
  environment   = var.Environment
  entry_point   = "src/authorizers/group_authorizer.ts"
  handler       = "index.handler"
  timeout       = 10
  runtime       = "nodejs22.x" # Authorizer was nodejs22.x in original

  environment_variables = {
    USER_POOL_ID           = split("/", var.user_pool_arn)[1]
    CLIENT_ID              = var.cognito_user_pool_client_id
    RESOURCE_GROUP_MAPPING = jsonencode(var.security_mapping)
  }

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*"
    }
  }
}
