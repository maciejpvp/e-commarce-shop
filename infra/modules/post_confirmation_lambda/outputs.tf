output "post_confirmation_lambda_arn" {
  description = "The ARN of the Post Confirmation Lambda function"
  value       = module.post_confirmation_lambda.lambda_arn
}

output "post_confirmation_lambda_function_name" {
  description = "The name of the Post Confirmation Lambda function"
  value       = module.post_confirmation_lambda.lambda_function_name
}

output "post_confirmation_iam_role_arn" {
  description = "The ARN of the IAM role for the Post Confirmation Lambda"
  value       = module.post_confirmation_lambda.iam_role_arn
}

output "post_confirmation_invoke_permission_id" {
  description = "The ID of the Lambda permission allowing Cognito to invoke the function"
  value       = module.post_confirmation_lambda.lambda_invoke_permissions["Cognito"]
}
