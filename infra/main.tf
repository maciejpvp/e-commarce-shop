module "cognito" {
  source = "./modules/cognito"

  Environment = var.Environment
}

module "lambda_product_upload" {
  source = "./modules/lambda_product_upload"

  Environment               = var.Environment
  api_gateway_execution_arn = module.api_gateway.api_execution_arn
}

module "api_gateway" {
  source = "./modules/api_gateway"

  Environment                      = var.Environment
  cognito_user_pool_client_id      = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint       = module.cognito.cognito_user_pool_endpoint
  upload_product_lambda_invoke_arn = module.lambda_product_upload.lambda_invoke_arn
}

module "dynamodb" {
  source = "./modules/dynamodb"

  Environment = var.Environment
}
