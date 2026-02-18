# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "e-commarce-shop-upload-product-role-${var.Environment}"

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

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda Function
data "external" "ensure_dist" {
  program = ["bash", "-c", "if [ ! -s ${path.module}/dist/index.mjs ]; then mkdir -p ${path.module}/dist && cd ${path.module}/../../.. && npx esbuild src/upload_product/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=infra/modules/lambda_product_upload/dist/index.mjs > /dev/null 2>&1; fi && echo '{\"status\": \"ok\"}'"]
}

resource "null_resource" "build_lambda" {
  triggers = {
    src_hash    = filesha256("${path.module}/../../../src/upload_product/index.ts")
    dist_exists = fileexists("${path.module}/dist/index.mjs")
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && npx esbuild src/upload_product/index.ts --bundle --platform=node --target=node20 --format=esm --outfile=infra/modules/lambda_product_upload/dist/index.mjs"
  }

  depends_on = [data.external.ensure_dist]
}

data "archive_file" "upload_product" {
  type        = "zip"
  source_file = "${path.module}/dist/index.mjs"
  output_path = "${path.module}/upload_product.zip"
  depends_on  = [null_resource.build_lambda]
}

resource "aws_lambda_function" "upload_product" {
  function_name = "e-commarce-shop-upload-product-${var.Environment}"
  role          = aws_iam_role.lambda_exec.arn

  filename         = data.archive_file.upload_product.output_path
  source_code_hash = data.archive_file.upload_product.output_base64sha256

  runtime = "nodejs22.x"
  handler = "index.handler"
  timeout = 10

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

# API Gateway Permission
resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.upload_product.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${var.api_gateway_execution_arn}/*/*"
}
