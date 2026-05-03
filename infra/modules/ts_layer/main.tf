locals {
  # This creates the exact folder structure Node.js expects in a layer
  layer_staging_dir = "${path.root}/.terraform/layers/${var.layer_name}/nodejs/node_modules/${var.import_name}"
  zip_output_path   = "${path.root}/.terraform/layers/${var.layer_name}.zip"
}

# 1. Compile and Bundle the TS file into the staging directory
data "external" "bundle_ts" {
  program = ["bash", "-c", <<-EOT
    mkdir -p ${local.layer_staging_dir}
    npx esbuild ${var.entrypoint} --bundle --platform=node --target=node20 --format=cjs --outfile=${local.layer_staging_dir}/index.js --external:* >&2
    echo '{"name": "${var.import_name}", "main": "index.js"}' > ${local.layer_staging_dir}/package.json
    echo "{\"source_dir\": \"${path.root}/.terraform/layers/${var.layer_name}\"}"
  EOT
  ]
}

# 2. Zip the generated directory
data "archive_file" "layer_zip" {
  type        = "zip"
  source_dir  = data.external.bundle_ts.result.source_dir
  output_path = local.zip_output_path
}

resource "aws_lambda_layer_version" "this" {
  filename            = data.archive_file.layer_zip.output_path
  layer_name          = var.layer_name
  compatible_runtimes = var.compatible_runtimes
  source_code_hash    = data.archive_file.layer_zip.output_base64sha256

  lifecycle {
    create_before_destroy = true
  }
}
