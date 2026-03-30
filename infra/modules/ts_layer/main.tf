locals {
  # This creates the exact folder structure Node.js expects in a layer
  layer_staging_dir = "${path.root}/.terraform/layers/${var.layer_name}/nodejs/node_modules/${var.import_name}"
  zip_output_path   = "${path.root}/.terraform/layers/${var.layer_name}.zip"
}

# 1. Compile and Bundle the TS file into the staging directory
resource "null_resource" "bundle_ts" {
  triggers = {
    # Re-run if the source file changes. (For production, you might want to hash the whole /services dir)
    source_hash = filemd5(var.entrypoint)
  }

  provisioner "local-exec" {
    # Uses esbuild to bundle local TS files into one JS file.
    # --external:* tells it NOT to bundle your global node_modules (like @aws-sdk)
    command = <<-EOT
      mkdir -p ${local.layer_staging_dir}
      npx esbuild ${var.entrypoint} --bundle --platform=node --target=node20 --format=cjs --outfile=${local.layer_staging_dir}/index.js --external:*
      echo '{"name": "${var.import_name}", "main": "index.js"}' > ${local.layer_staging_dir}/package.json
    EOT
  }
}

# 2. Zip the generated directory
data "archive_file" "layer_zip" {
  depends_on  = [null_resource.bundle_ts]
  type        = "zip"
  source_dir  = "${path.root}/.terraform/layers/${var.layer_name}"
  output_path = local.zip_output_path
}

# 3. Create the AWS Layer
resource "aws_lambda_layer_version" "this" {
  filename            = data.archive_file.layer_zip.output_path
  layer_name          = var.layer_name
  compatible_runtimes = var.compatible_runtimes
  source_code_hash    = data.archive_file.layer_zip.output_base64sha256
}
