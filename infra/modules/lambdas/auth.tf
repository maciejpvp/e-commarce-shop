module "pre_sign_up_lambda" {
  source = "../lambda_base"

  function_name = "e-commerce-pre-sign-up"
  environment   = var.Environment
  entry_point   = "src/auth/pre_sign_up/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:GetItem",
        "dynamodb:Query"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn, "${var.table_arn}/index/*"]

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

module "post_confirmation_lambda" {
  source = "../lambda_base"

  function_name = "e-commerce-post-confirmation"
  environment   = var.Environment
  entry_point   = "src/auth/post_confirmation/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:PutItem",
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]

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
