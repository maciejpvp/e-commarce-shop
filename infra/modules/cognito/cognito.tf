resource "aws_cognito_user_pool" "main" {
  name = "e-commarce-shop-pool"

  # Enforce email as the primary identifier (prevents duplicates)
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  password_policy {
    minimum_length = 8
  }

  lambda_config {
    pre_sign_up       = var.pre_sign_up_lambda_arn
    post_confirmation = var.post_confirmation_lambda_arn
  }

  # Configure how the verification is sent
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_message        = "Your verification code is {####}."
    email_subject        = "Verify your email for E-commerce Shop"
  }

  # --- Schema Definition ---
  # Email
  schema {
    attribute_data_type      = "String"
    developer_only_attribute = false
    name                     = "email"
    required                 = true

    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  // First name (given_name)
  schema {
    attribute_data_type = "String"
    name                = "given_name"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  # 3. Last Name (family_name)
  schema {
    attribute_data_type = "String"
    name                = "family_name"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 100
    }
  }

  # 4. Phone Number
  schema {
    attribute_data_type = "String"
    name                = "phone_number"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 15
    }
  }

  // Birthdate
  schema {
    attribute_data_type = "String"
    name                = "birthdate"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 10
    }
  }

  // Gender
  schema {
    attribute_data_type = "String"
    name                = "gender"
    required            = true
    mutable             = true

    string_attribute_constraints {
      min_length = 1
      max_length = 32
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
