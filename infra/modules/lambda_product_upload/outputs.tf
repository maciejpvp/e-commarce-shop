output "lambda_invoke_arn" {
  description = "The invoke ARN of the upload_product Lambda function"
  value       = module.upload_product_lambda.lambda_invoke_arn
}

output "lambda_function_name" {
  description = "The name of the upload_product Lambda function"
  value       = module.upload_product_lambda.lambda_function_name
}
