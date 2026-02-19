output "pre_sign_up_lambda_arn" {
  description = "The ARN of the Pre Sign Up Lambda function"
  value       = module.pre_sign_up_lambda.lambda_arn
}

output "pre_sign_up_lambda_function_name" {
  description = "The name of the Pre Sign Up Lambda function"
  value       = module.pre_sign_up_lambda.lambda_function_name
}

output "pre_sign_up_iam_role_arn" {
  description = "The ARN of the IAM role for the Pre Sign Up Lambda"
  value       = module.pre_sign_up_lambda.iam_role_arn
}

output "pre_sign_up_invoke_permission_id" {
  description = "The ID of the Lambda permission allowing Cognito to invoke the function"
  value       = module.pre_sign_up_lambda.lambda_invoke_permissions["Cognito"]
}
