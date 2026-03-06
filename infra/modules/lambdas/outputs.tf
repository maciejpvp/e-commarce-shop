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

output "create_coupon_lambda_invoke_arn" {
  value = module.create_coupon_lambda.lambda_invoke_arn
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

// Checkout
output "validate_cart_lambda_invoke_arn" {
  value = module.validate_cart_lambda.lambda_arn
}

output "reserve_stock_lambda_invoke_arn" {
  value = module.reserve_stock_lambda.lambda_arn
}

output "create_checkout_session_lambda_invoke_arn" {
  value = module.create_checkout_session_lambda.lambda_arn
}

output "order_payment_reconciler_lambda_function_name" {
  value = module.order_payment_reconciler_lambda.lambda_function_name
}

output "order_payment_reconciler_lambda_invoke_arn" {
  value = module.order_payment_reconciler_lambda.lambda_invoke_arn
}

output "order_payment_reconciler_lambda_arn" {
  value = module.order_payment_reconciler_lambda.lambda_arn
}

output "unreserve_stock_lambda_invoke_arn" {
  value = module.unreserve_stock_lambda.lambda_arn
}

output "finalize_order_lambda_invoke_arn" {
  value = module.finalize_order_lambda.lambda_arn
}

output "cleanup_lambda_invoke_arn" {
  value = module.cleanup_lambda.lambda_arn
}
