output "lambda_invoke_arn" {
  description = "The invoke ARN of the upload_product Lambda function"
  value       = aws_lambda_function.upload_product.invoke_arn
}

output "lambda_function_name" {
  description = "The name of the upload_product Lambda function"
  value       = aws_lambda_function.upload_product.function_name
}
