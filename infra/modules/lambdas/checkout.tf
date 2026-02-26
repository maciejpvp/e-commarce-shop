module "validate_cart_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-validate-cart"
  environment   = var.Environment
  entry_point   = "src/checkout/validateCart/index.ts"
  handler       = "index.handler"
  timeout       = 30

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:Query",
        "dynamodb:TransactWriteItems"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]
}


module "reserve_stock_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-reserve-stock"
  environment   = var.Environment
  entry_point   = "src/checkout/reserveStock/index.ts"
  handler       = "index.handler"
  timeout       = 30

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:TransactWriteItems"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]
}


