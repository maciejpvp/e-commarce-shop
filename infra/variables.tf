variable "Environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.Environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}
