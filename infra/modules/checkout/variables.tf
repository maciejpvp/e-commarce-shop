variable "Environment" {
  type = string
}

variable "validate_cart_lambda_arn" {
  type = string
}

variable "reserve_stock_lambda_arn" {
  type = string
}

variable "create_checkout_session_lambda_arn" {
  type = string
}

variable "finalize_order_lambda_arn" {
  type = string
}

variable "unreserve_stock_lambda_arn" {
  type = string
}

variable "cleanup_lambda_arn" {
  type = string
}

variable "send_receipt_lambda_arn" {
  type = string
}
