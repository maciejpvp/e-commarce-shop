module "upload_product_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-upload-product"
  environment   = var.Environment
  entry_point   = "src/upload_product/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    BUCKET_NAME = var.bucket_name
    TABLE_NAME  = var.table_name
  }

  extra_policy_statements = [
    {
      Action   = ["s3:PutObject"]
      Effect   = "Allow"
      Resource = ["${var.bucket_arn}/*"]
    },
    {
      Action = [
        "dynamodb:PutItem"
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
