resource "aws_cognito_user_pool" "main" {
  name = "e-commarce-shop-pool"

  # 1. Enforce email as the primary identifier (prevents duplicates)
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length = 8
  }

  # 2. Configure how the verification is sent
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}."
    email_subject        = "Verify your email for E-commerce Shop"
  }

  # 3. Schema settings
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    mutable                  = true
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 2048
    }
  }
}

resource "aws_cognito_user_pool_client" "main" {
  name         = "e-commarce-shop-client-${var.Environment}"
  user_pool_id = aws_cognito_user_pool.main.id

  # Prevent unauthorized access
  prevent_user_existence_errors = "ENABLED"

  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Group for maintaining the application"
  precedence   = 1
}
