module "cognito" {
  source = "./modules/cognito"

  Environment = var.Environment
}

module "api_gateway" {
  source = "./modules/api_gateway"

  Environment                 = var.Environment
  cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint  = module.cognito.cognito_user_pool_endpoint
}

module "dynamodb" {
  source = "./modules/dynamodb"

  Environment = var.Environment
}
