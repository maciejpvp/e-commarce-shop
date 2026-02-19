module "pre_sign_up_lambda" {
  source = "../lambda_base"

  function_name = "e-commerce-pre-sign-up"
  environment   = var.Environment
  entry_point   = "src/pre_sign_up/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.dynamodb_table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ]
      Effect   = "Allow"
      Resource = [var.dynamodb_table_arn, "${var.dynamodb_table_arn}/index/*"]

      Condition = {
        "ForAllValues:StringLike" = {
          "dynamodb:LeadingKeys" = ["EMAIL#*", "USER#*"]
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
