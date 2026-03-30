variable "layer_name" {
  type        = string
  description = "Name of the layer in AWS"
}

variable "entrypoint" {
  type        = string
  description = "Path to your TS file (e.g., ../../services/product.ts)"
}

variable "import_name" {
  type        = string
  description = "The package name your lambdas will use to import this code (e.g., 'shared-product-db')"
}

variable "compatible_runtimes" {
  type    = list(string)
  default = ["nodejs18.x", "nodejs20.x"]
}
