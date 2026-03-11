module "upload_product_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-upload-product"
  environment   = var.Environment
  entry_point   = "src/product/upload_product/index.ts"
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

module "update_product_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-update-product"
  environment   = var.Environment
  entry_point   = "src/product/update_product/index.ts"
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

module "get_products_for_category_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-get-products-for-category"
  environment   = var.Environment
  entry_point   = "src/product/get_products_for_category/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:Query"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn, "${var.table_arn}/index/GSI1"]
    }
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}

module "create_coupon_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-create-coupon"
  environment   = var.Environment
  entry_point   = "src/coupon/create_coupon/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
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

