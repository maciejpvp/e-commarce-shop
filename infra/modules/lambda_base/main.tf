resource "aws_iam_role" "this" {
  name = "${var.function_name}-role-${var.environment}"

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
    Environment = var.environment
    Terraform   = "true"
    Function    = var.function_name
  }
}

resource "aws_iam_role_policy_attachment" "basic" {
  role       = aws_iam_role.this.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy" "extra" {
  count = length(var.extra_policy_statements) > 0 ? 1 : 0
  name  = "${var.function_name}-extra-policy-${var.environment}"
  role  = aws_iam_role.this.id

  policy = jsonencode({
    Version   = "2012-10-17"
    Statement = var.extra_policy_statements
  })
}

locals {
  source_file        = var.source_file != "" ? var.source_file : "${path.module}/dist/${var.function_name}/index${var.output_extension}"
  relative_dist_path = replace(local.source_file, "${path.module}/", "")
}

data "external" "ensure_dist" {
  program = ["bash", "-c", "if [ ! -s ${local.source_file} ]; then mkdir -p ${dirname(local.source_file)} && cd ${path.module}/../../.. && npx esbuild ${var.entry_point} --bundle --platform=node --target=${var.esbuild_target} --format=${var.esbuild_format} --minify --outfile=infra/modules/lambda_base/${local.relative_dist_path} > /dev/null 2>&1; fi && echo '{\"status\": \"ok\"}'"]
}

resource "null_resource" "build" {
  triggers = {
    src_hash    = filesha256("${path.module}/../../../${var.entry_point}")
    dist_exists = fileexists(local.source_file)
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../../.. && npx esbuild ${var.entry_point} --bundle --platform=node --target=${var.esbuild_target} --format=${var.esbuild_format} --minify --outfile=infra/modules/lambda_base/${local.relative_dist_path}"
  }

  depends_on = [data.external.ensure_dist]
}

data "archive_file" "zip" {
  type        = "zip"
  source_file = local.source_file
  output_path = "${dirname(local.source_file)}/package.zip"
  depends_on  = [null_resource.build]
}

resource "aws_lambda_function" "this" {
  function_name    = "${var.function_name}-${var.environment}"
  role             = aws_iam_role.this.arn
  filename         = data.archive_file.zip.output_path
  source_code_hash = data.archive_file.zip.output_base64sha256
  runtime          = var.runtime
  handler          = var.handler
  memory_size      = var.memory_size
  timeout          = var.timeout

  environment {
    variables = var.environment_variables
  }

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }

  depends_on = [aws_cloudwatch_log_group.this]
}

resource "aws_cloudwatch_log_group" "this" {
  name              = "/aws/lambda/${var.function_name}-${var.environment}"
  retention_in_days = var.retention_in_days

  tags = {
    Environment = var.environment
    Terraform   = "true"
  }
}

resource "aws_lambda_permission" "triggers" {
  for_each = var.allowed_triggers

  statement_id  = "AllowExecutionFrom-${each.key}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.this.function_name
  principal     = each.value.principal
  source_arn    = each.value.source_arn
}
