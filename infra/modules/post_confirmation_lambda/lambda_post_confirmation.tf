resource "aws_iam_role" "post_confirmation_role" {
  name = "e-commerce-cognito-post-confirmation-role-${var.Environment}"

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

resource "aws_iam_role_policy_attachment" "post_confirmation_basic" {
  role       = aws_iam_role.post_confirmation_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Build Logic
data "external" "ensure_dist" {
  program = ["bash", "-c", "if [ ! -s ${path.module}/dist/index.js ]; then mkdir -p ${path.module}/dist && cd ${path.module}/../../.. && npx esbuild src/post_confirmation_lambda/index.ts --bundle --platform=node --target=node22 --format=cjs --minify --outfile=infra/modules/post_confirmation_lambda/dist/index.js > /dev/null 2>&1; fi && echo '{\"status\": \"ok\"}'"]
}

resource "null_resource" "build_post_confirmation" {
  triggers = {
    src_hash    = filesha256("${path.module}/../../../src/post_confirmation_lambda/index.ts")
    dist_exists = fileexists("${path.module}/dist/index.js")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && npx esbuild src/post_confirmation_lambda/index.ts --bundle --platform=node --target=node22 --format=cjs --minify --outfile=infra/modules/post_confirmation_lambda/dist/index.js"
  }

  depends_on = [data.external.ensure_dist]
}

data "archive_file" "post_confirmation_zip" {
  type        = "zip"
  source_file = "${path.module}/dist/index.js"
  output_path = "${path.module}/post_confirmation.zip"
  depends_on  = [null_resource.build_post_confirmation]
}

# Lambda Function
resource "aws_lambda_function" "post_confirmation" {
  function_name = "e-commerce-post-confirmation-${var.Environment}"
  role          = aws_iam_role.post_confirmation_role.arn

  filename         = data.archive_file.post_confirmation_zip.output_path
  source_code_hash = data.archive_file.post_confirmation_zip.output_base64sha256

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

resource "aws_cloudwatch_log_group" "post_confirmation" {
  name              = "/aws/lambda/${aws_lambda_function.post_confirmation.function_name}"
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
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"

  # Ensure this points to your specific User Pool ARN
  source_arn = var.user_pool_arn
}

# DynamoDB Table Access
resource "aws_iam_policy" "post_confirmation_dynamodb" {
  name        = "e-commerce-post-confirmation-dynamodb-${var.Environment}"
  description = "Allow Post Confirmation Lambda to access DynamoDB Table, and Put User Profile"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:PutItem",
        ]
        Effect   = "Allow"
        Resource = [var.dynamodb_table_arn]

        Condition = {
          "ForAllValues:StringLike" = {
            "dynamodb:LeadingKeys" = ["USER#*"]
          }
        }
      }
    ]
  })

  depends_on = [aws_iam_role.post_confirmation_role]
}

resource "aws_iam_role_policy_attachment" "post_confirmation_dynamodb_attachment" {
  role       = aws_iam_role.post_confirmation_role.name
  policy_arn = aws_iam_policy.post_confirmation_dynamodb.arn
}
