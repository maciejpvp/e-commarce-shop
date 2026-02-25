// Product Lambdas
output "upload_product_lambda_invoke_arn" {
  value = module.upload_product_lambda.lambda_invoke_arn
}

output "update_product_lambda_invoke_arn" {
  value = module.update_product_lambda.lambda_invoke_arn
}

output "get_products_for_category_lambda_invoke_arn" {
  value = module.get_products_for_category_lambda.lambda_invoke_arn
}

// Cart
output "add_to_cart_lambda_invoke_arn" {
  value = module.add_to_cart_lambda.lambda_invoke_arn
}

// Auth Lambdas
output "pre_sign_up_lambda_arn" {
  value = module.pre_sign_up_lambda.lambda_arn
}

output "post_confirmation_lambda_arn" {
  value = module.post_confirmation_lambda.lambda_arn
}

output "authorizer_lambda_invoke_arn" {
  value = module.authorizer.lambda_invoke_arn
}
