# --- Data Sources ---
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  lambda_arns = {
    validate_cart     = var.validate_cart_lambda_arn
    reserve_stock     = var.reserve_stock_lambda_arn
    calculate_summary = var.calculate_checkout_summary_lambda_arn
    create_session    = var.create_checkout_session_lambda_arn
    cleanup           = var.cleanup_lambda_arn
    finalize_order    = var.finalize_order_lambda_arn
    send_receipt      = var.send_receipt_lambda_arn
    unreserve_stock   = var.unreserve_stock_lambda_arn
  }
}

# --- IAM Role for Step Function ---
resource "aws_iam_role" "checkout_sfn_role" {
  name = "e-commerce-checkout-sfn-role-${var.Environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "states.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "sfn_lambda_policy" {
  name = "checkout-sfn-lambda-invoke-policy-${var.Environment}"
  role = aws_iam_role.checkout_sfn_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "lambda:InvokeFunction"
        Effect = "Allow"
        Resource = [
          var.validate_cart_lambda_arn,
          "${var.validate_cart_lambda_arn}:*",
          var.reserve_stock_lambda_arn,
          "${var.reserve_stock_lambda_arn}:*",
          var.create_checkout_session_lambda_arn,
          "${var.create_checkout_session_lambda_arn}:*",
          var.finalize_order_lambda_arn,
          "${var.finalize_order_lambda_arn}:*",
          var.unreserve_stock_lambda_arn,
          "${var.unreserve_stock_lambda_arn}:*",
          var.cleanup_lambda_arn,
          "${var.cleanup_lambda_arn}:*",
          var.send_receipt_lambda_arn,
          "${var.send_receipt_lambda_arn}:*",
          var.calculate_checkout_summary_lambda_arn,
          "${var.calculate_checkout_summary_lambda_arn}:*",
        ]
      }
    ]
  })
}

resource "aws_sfn_state_machine" "checkout_v1" {
  name     = "e-commerce-checkout-validation-${var.Environment}"
  role_arn = aws_iam_role.checkout_sfn_role.arn

  definition = templatefile("${path.module}/checkout_step_fn.asl.json", {
    lambda_arns = local.lambda_arns
  })

  tags = {
    Environment = var.Environment
    Project     = "e-commerce"
  }
}

output "state_machine_arn" {
  value = aws_sfn_state_machine.checkout_v1.arn
}
