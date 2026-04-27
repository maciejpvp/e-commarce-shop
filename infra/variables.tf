variable "Environment" {
  type    = string
  default = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.Environment)
    error_message = "Environment must be one of: dev, staging, prod"
  }
}

variable "github_token" {
  type      = string
  sensitive = true
}

variable "stripe_bus_name" {
  type    = string
  default = "aws.partner/stripe.com/ed_test_61UG0BdejRE6EOpYr16UDTGI8oNJFHJ3ItuBm1HWaJpI"
}
