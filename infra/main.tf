// --- COGNITO ---

module "cognito" {
  source = "./modules/cognito"

  Environment                  = var.Environment
  post_confirmation_lambda_arn = module.lambdas.post_confirmation_lambda_arn
  pre_sign_up_lambda_arn       = module.lambdas.pre_sign_up_lambda_arn
}

// Stripe Event Bus
module "stripe_integration" {
  source               = "./modules/stripe_events"
  stripe_bus_name      = "aws.partner/stripe.com/ed_test_61UG0BdejRE6EOpYr16UDTGI8oNJFHJ3ItuBm1HWaJpI"
  lambda_function_name = module.lambdas.order_payment_reconciler_lambda_function_name
  lambda_arn           = module.lambdas.order_payment_reconciler_lambda_arn
}

import {
  to = module.stripe_integration.aws_cloudwatch_event_bus.stripe_bus
  id = "aws.partner/stripe.com/ed_test_61UG0BdejRE6EOpYr16UDTGI8oNJFHJ3ItuBm1HWaJpI"
}

// --- LAMBDAS ---

module "lambdas" {
  source = "./modules/lambdas"

  Environment                 = var.Environment
  table_name                  = module.dynamodb.dynamodb_table_name
  table_arn                   = module.dynamodb.dynamodb_table_arn
  bucket_name                 = module.s3_product_media.bucket_id
  bucket_arn                  = module.s3_product_media.bucket_arn
  user_pool_arn               = module.cognito.cognito_user_pool_arn
  api_gateway_execution_arn   = module.api_gateway.api_execution_arn
  cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint  = module.cognito.cognito_user_pool_endpoint
  security_mapping            = module.api_gateway.security_mapping # Assuming api_gateway still exports this or needs it
}

// --- CHECKOUT ---

module "checkout" {
  source = "./modules/checkout"

  Environment                        = var.Environment
  validate_cart_lambda_arn           = module.lambdas.validate_cart_lambda_invoke_arn
  reserve_stock_lambda_arn           = module.lambdas.reserve_stock_lambda_invoke_arn
  create_checkout_session_lambda_arn = module.lambdas.create_checkout_session_lambda_invoke_arn
  finalize_order_lambda_arn          = module.lambdas.finalize_order_lambda_invoke_arn
  unreserve_stock_lambda_arn         = module.lambdas.unreserve_stock_lambda_invoke_arn
}

// --- API GATEWAY ---

module "api_gateway" {
  source = "./modules/api_gateway"

  Environment                                 = var.Environment
  cognito_user_pool_client_id                 = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint                  = module.cognito.cognito_user_pool_endpoint
  cognito_user_pool_arn                       = module.cognito.cognito_user_pool_arn
  upload_product_lambda_invoke_arn            = module.lambdas.upload_product_lambda_invoke_arn
  update_product_lambda_invoke_arn            = module.lambdas.update_product_lambda_invoke_arn
  authorizer_lambda_invoke_arn                = module.lambdas.authorizer_lambda_invoke_arn
  get_products_for_category_lambda_invoke_arn = module.lambdas.get_products_for_category_lambda_invoke_arn
  add_to_cart_lambda_invoke_arn               = module.lambdas.add_to_cart_lambda_invoke_arn
  create_coupon_lambda_invoke_arn             = module.lambdas.create_coupon_lambda_invoke_arn
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
  api_gateway_domain       = module.api_gateway.api_endpoint_domain
  api_gateway_stage        = module.api_gateway.stage_name
}
