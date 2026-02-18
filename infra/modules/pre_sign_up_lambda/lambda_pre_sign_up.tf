resource "aws_iam_role" "pre_sign_up_role" {
  name = "e-commerce-cognito-pre-sign-up-role-${var.Environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

resource "aws_iam_role_policy_attachment" "pre_sign_up_basic" {
  role       = aws_iam_role.pre_sign_up_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Build Logic
data "external" "ensure_dist" {
  program = ["bash", "-c", "if [ ! -s ${path.module}/dist/index.js ]; then mkdir -p ${path.module}/dist && cd ${path.module}/../../.. && npx esbuild src/pre_sign_up/index.ts --bundle --platform=node --target=node22 --format=cjs --minify --outfile=infra/modules/pre_sign_up_lambda/dist/index.js > /dev/null 2>&1; fi && echo '{\"status\": \"ok\"}'"]
}

resource "null_resource" "build_pre_sign_up" {
  triggers = {
    src_hash    = filesha256("${path.module}/../../../src/pre_sign_up/index.ts")
    dist_exists = fileexists("${path.module}/dist/index.js")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && npx esbuild src/pre_sign_up/index.ts --bundle --platform=node --target=node22 --format=cjs --minify --outfile=infra/modules/pre_sign_up_lambda/dist/index.js"
  }

  depends_on = [data.external.ensure_dist]
}

data "archive_file" "pre_sign_up_zip" {
  type        = "zip"
  source_file = "${path.module}/dist/index.js"
  output_path = "${path.module}/pre_sign_up.zip"
  depends_on  = [null_resource.build_pre_sign_up]
}

# Lambda Function
resource "aws_lambda_function" "pre_sign_up" {
  function_name = "e-commerce-pre-sign-up-${var.Environment}"
  role          = aws_iam_role.pre_sign_up_role.arn

  filename         = data.archive_file.pre_sign_up_zip.output_path
  source_code_hash = data.archive_file.pre_sign_up_zip.output_base64sha256

  runtime = "nodejs22.x"
  handler = "index.handler"
  timeout = 10

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

resource "aws_cloudwatch_log_group" "pre_sign_up" {
  name              = "/aws/lambda/${aws_lambda_function.pre_sign_up.function_name}"
  retention_in_days = 7

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

# Cognito Permission
resource "aws_lambda_permission" "allow_cognito" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.pre_sign_up.function_name
  principal     = "cognito-idp.amazonaws.com"

  source_arn = var.user_pool_arn
}

# DynamoDB Table Access
resource "aws_iam_policy" "pre_sign_up_dynamodb" {
  name        = "e-commerce-pre-sign-up-dynamodb-${var.Environment}"
  description = "Allow Pre Sign Up Lambda to access DynamoDB Table, and Check if user exists"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Effect   = "Allow"
        Resource = [var.dynamodb_table_arn, "${var.dynamodb_table_arn}/index/*"]

        Condition = {
          "ForAllValues:StringLike" = {
            "dynamodb:LeadingKeys" = ["EMAIL#*", "USER#*"]
          }
        }
      }
    ]
  })

  depends_on = [aws_iam_role.pre_sign_up_role]
}

resource "aws_iam_role_policy_attachment" "pre_sign_up_dynamodb_attachment" {
  role       = aws_iam_role.pre_sign_up_role.name
  policy_arn = aws_iam_policy.pre_sign_up_dynamodb.arn
}
