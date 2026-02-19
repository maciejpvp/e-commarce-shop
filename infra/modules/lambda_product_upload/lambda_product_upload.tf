module "upload_product_lambda" {
  source = "../lambda_base"

  function_name = "e-commarce-shop-upload-product"
  environment   = var.Environment
  entry_point   = "src/upload_product/index.ts"
  handler       = "index.handler"
  timeout       = 10

  esbuild_format   = "esm"
  esbuild_target   = "node20"
  output_extension = ".mjs"

  allowed_triggers = {
    APIGateway = {
      principal  = "apigateway.amazonaws.com"
      source_arn = "${var.api_gateway_execution_arn}/*/*"
    }
  }
}
