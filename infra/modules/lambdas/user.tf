// Upload Address Lambda
////////////////////////////////////////////////////
module "upload_address_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-upload-address"
  environment   = var.Environment
  entry_point   = "src/user/upload_address/index.ts"
  handler       = "index.handler"
  timeout       = 10
  runtime       = "nodejs22.x"

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action   = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:TransactWriteItems"]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*"
    }
  }
}

output "upload_address_lambda_invoke_arn" {
  value = module.upload_address_lambda.lambda_invoke_arn
}

// Get Address List Lambda
////////////////////////////////////////////////////
module "get_address_list_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-get-address-list"
  environment   = var.Environment
  entry_point   = "src/user/get_addres_list/index.ts"
  handler       = "index.handler"
  timeout       = 10
  runtime       = "nodejs22.x"

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action   = ["dynamodb:Query"]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*"
    }
  }
}

output "get_address_list_lambda_invoke_arn" {
  value = module.get_address_list_lambda.lambda_invoke_arn
}

