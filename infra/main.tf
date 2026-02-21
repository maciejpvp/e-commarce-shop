// --- COGNITO ---

module "cognito" {
  source = "./modules/cognito"

  Environment                  = var.Environment
  post_confirmation_lambda_arn = module.post_confirmation_lambda.post_confirmation_lambda_arn
  pre_sign_up_lambda_arn       = module.pre_sign_up_lambda.pre_sign_up_lambda_arn
}

// --- LAMBDAS ---

module "lambda_product_upload" {
  source = "./modules/lambda_product_upload"

  Environment               = var.Environment
  api_gateway_execution_arn = module.api_gateway.api_execution_arn
  bucket_name               = module.s3_product_media.bucket_id
  bucket_arn                = module.s3_product_media.bucket_arn
  table_name                = module.dynamodb.dynamodb_table_name
  table_arn                 = module.dynamodb.dynamodb_table_arn
}

module "post_confirmation_lambda" {
  source = "./modules/post_confirmation_lambda"

  Environment         = var.Environment
  user_pool_arn       = module.cognito.cognito_user_pool_arn
  dynamodb_table_name = module.dynamodb.dynamodb_table_name
  dynamodb_table_arn  = module.dynamodb.dynamodb_table_arn
}

module "pre_sign_up_lambda" {
  source = "./modules/pre_sign_up_lambda"

  Environment         = var.Environment
  user_pool_arn       = module.cognito.cognito_user_pool_arn
  dynamodb_table_name = module.dynamodb.dynamodb_table_name
  dynamodb_table_arn  = module.dynamodb.dynamodb_table_arn
}

// --- API GATEWAY ---

module "api_gateway" {
  source = "./modules/api_gateway"

  Environment                      = var.Environment
  cognito_user_pool_client_id      = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint       = module.cognito.cognito_user_pool_endpoint
  cognito_user_pool_arn            = module.cognito.cognito_user_pool_arn
  upload_product_lambda_invoke_arn = module.lambda_product_upload.lambda_invoke_arn
}

// --- DATABASE ---

module "dynamodb" {
  source = "./modules/dynamodb"

  Environment = var.Environment
}

// --- S3 ---

module "s3_product_media" {
  source = "./modules/s3"

  Environment = var.Environment
}

// --- CLOUDFRONT ---

module "cloudfront" {
  source = "./modules/cloudfront"

  media_bucket_id          = module.s3_product_media.bucket_id
  media_bucket_domain_name = module.s3_product_media.domain_name
  media_bucket_arn         = module.s3_product_media.bucket_arn
}
