module "update_product_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-update-product"
  environment   = var.Environment
  entry_point   = "src/update_product/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:UpdateItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]

    }
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}
