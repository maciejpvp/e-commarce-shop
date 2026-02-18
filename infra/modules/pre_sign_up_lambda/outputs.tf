output "pre_sign_up_lambda_arn" {
  description = "The ARN of the Pre Sign Up Lambda function"
  value       = aws_lambda_function.pre_sign_up.arn
}

output "pre_sign_up_lambda_function_name" {
  description = "The name of the Pre Sign Up Lambda function"
  value       = aws_lambda_function.pre_sign_up.function_name
}

output "pre_sign_up_iam_role_arn" {
  description = "The ARN of the IAM role for the Pre Sign Up Lambda"
  value       = aws_iam_role.pre_sign_up_role.arn
}

output "pre_sign_up_invoke_permission_id" {
  description = "The ID of the Lambda permission allowing Cognito to invoke the function"
  value       = aws_lambda_permission.allow_cognito.id
}
