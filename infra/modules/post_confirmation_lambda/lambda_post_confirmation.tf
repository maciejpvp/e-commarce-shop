module "post_confirmation_lambda" {
  source = "../lambda_base"

  function_name = "e-commerce-post-confirmation"
  environment   = var.Environment
  entry_point   = "src/post_confirmation_lambda/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.dynamodb_table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:PutItem",
      ]
      Effect   = "Allow"
      Resource = [var.dynamodb_table_arn]

      Condition = {
        "ForAllValues:StringLike" = {
          "dynamodb:LeadingKeys" = ["USER#*"]
        }
      }
    }
  ]

  allowed_triggers = {
    Cognito = {
      principal  = "cognito-idp.amazonaws.com"
      source_arn = var.user_pool_arn
    }
  }
}
