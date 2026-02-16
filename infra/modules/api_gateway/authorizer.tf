# --- IAM Role for Authorizer Lambda ---
resource "aws_iam_role" "authorizer_lambda_exec" {
  name = "e-commarce-shop-authorizer-role-${var.Environment}"

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

resource "aws_iam_role_policy_attachment" "authorizer_lambda_basic" {
  role       = aws_iam_role.authorizer_lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# --- Build Authorizer Lambda ---
resource "null_resource" "build_authorizer" {
  triggers = {
    src_hash = filesha256("${path.module}/../../../src/authorizers/group_authorizer.ts")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && npx esbuild src/authorizers/group_authorizer.ts --bundle --platform=node --target=node20 --format=esm --outfile=infra/modules/api_gateway/dist/authorizer/index.mjs"
  }
}

data "archive_file" "authorizer" {
  type        = "zip"
  source_file = "${path.module}/dist/authorizer/index.mjs"
  output_path = "${path.module}/authorizer.zip"
  depends_on  = [null_resource.build_authorizer]
}

# --- Authorizer Lambda Function ---
resource "aws_lambda_function" "authorizer" {
  function_name = "e-commarce-shop-authorizer-${var.Environment}"
  role          = aws_iam_role.authorizer_lambda_exec.arn

  filename         = data.archive_file.authorizer.output_path
  source_code_hash = data.archive_file.authorizer.output_base64sha256

  runtime = "nodejs22.x"
  handler = "index.handler"
  timeout = 10

  environment {
    variables = {
      USER_POOL_ID           = split("/", var.cognito_user_pool_arn)[1]
      CLIENT_ID              = var.cognito_user_pool_client_id
      RESOURCE_GROUP_MAPPING = jsonencode(local.security_mapping)
    }
  }

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

# --- API Gateway Permission ---
resource "aws_lambda_permission" "apigw_authorizer" {
  statement_id  = "AllowAPIGatewayInvokeAuthorizer"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authorizer.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*"
}
