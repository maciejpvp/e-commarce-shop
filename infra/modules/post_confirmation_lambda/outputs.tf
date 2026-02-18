output "post_confirmation_lambda_arn" {
  description = "The ARN of the Post Confirmation Lambda function"
  value       = aws_lambda_function.post_confirmation.arn
}

output "post_confirmation_lambda_function_name" {
  description = "The name of the Post Confirmation Lambda function"
  value       = aws_lambda_function.post_confirmation.function_name
}

output "post_confirmation_iam_role_arn" {
  description = "The ARN of the IAM role for the Post Confirmation Lambda"
  value       = aws_iam_role.post_confirmation_role.arn
}

output "post_confirmation_invoke_permission_id" {
  description = "The ID of the Lambda permission allowing Cognito to invoke the function"
  value       = aws_lambda_permission.allow_cognito.id
}
