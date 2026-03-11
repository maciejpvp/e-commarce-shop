module "add_to_cart_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-add-to-cart"
  environment   = var.Environment
  entry_point   = "src/cart/add_to_cart/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action   = ["dynamodb:PutItem", "dynamodb:GetItem"]
      Effect   = "Allow"
      Resource = [var.table_arn]
    },
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}

module "update_cart_item_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-update-cart-item"
  environment   = var.Environment
  entry_point   = "src/cart/update_cart_item/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    },
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}

module "get_cart_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-get-cart"
  environment   = var.Environment
  entry_point   = "src/cart/get_cart/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action   = ["dynamodb:GetItem"]
      Effect   = "Allow"
      Resource = [var.table_arn]
    },
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}
