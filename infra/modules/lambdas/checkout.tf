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
        "dynamodb:TransactWriteItems",
        "dynamodb:UpdateItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]
}


module "create_checkout_session_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-create-checkout-session"
  environment   = var.Environment
  entry_point   = "src/checkout/create_checkout_session/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "ssm:GetParameter"
      ]
      Effect   = "Allow"
      Resource = ["arn:aws:ssm:eu-central-1:445567075183:parameter/e-commerce-store/dev/stripe-secret-key"]
    },
    {
      Action   = ["kms:Decrypt"]
      Effect   = "Allow"
      Resource = ["*"]
    },
    {
      Action = [
        "dynamodb:PutItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]
}

module "order_payment_reconciler_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-order-payment-reconciler"
  environment   = var.Environment
  entry_point   = "src/checkout/order_payment_reconciler/index.ts"
  handler       = "index.handler"
  timeout       = 10

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:GetItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    },
    {
      Action = [
        "states:SendTaskSuccess",
        "states:SendTaskFailure",
        "states:SendTaskHeartbeat"
      ]
      Effect   = "Allow"
      Resource = ["*"]
    }
  ]
}

module "unreserve_stock_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-unreserve-stock"
  environment   = var.Environment
  entry_point   = "src/checkout/unreserve_stock/index.ts"
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

module "finalize_order_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-finalize-order"
  environment   = var.Environment
  entry_point   = "src/checkout/finalize_order/index.ts"
  handler       = "index.handler"
  timeout       = 30

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
}

module "cleanup_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-cleanup"
  environment   = var.Environment
  entry_point   = "src/checkout/cleanup/index.ts"
  handler       = "index.handler"
  timeout       = 30

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchWriteItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    }
  ]
}

module "send_receipt_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-send-receipt"
  environment   = var.Environment
  entry_point   = "src/checkout/send_receipt/index.ts"
  handler       = "index.handler"
  timeout       = 30

  environment_variables = {
    TABLE_NAME = var.table_name
  }

  extra_policy_statements = [
    {
      Action = [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem"
      ]
      Effect   = "Allow"
      Resource = [var.table_arn]
    },
    {
      Action = [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ]
      Effect   = "Allow"
      Resource = ["*"]
    }
  ]
}
