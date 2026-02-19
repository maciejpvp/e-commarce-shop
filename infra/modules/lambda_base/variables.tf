variable "function_name" {
  description = "The name of the Lambda function"
  type        = string
}

variable "environment" {
  description = "The deployment environment (e.g., dev, prod)"
  type        = string
}

variable "runtime" {
  description = "The Lambda runtime"
  type        = string
  default     = "nodejs22.x"
}

variable "handler" {
  description = "The Lambda handler"
  type        = string
  default     = "index.handler"
}

variable "memory_size" {
  description = "The amount of memory in MB your Lambda Function can use at runtime"
  type        = number
  default     = 128
}

variable "timeout" {
  description = "The amount of time your Lambda Function has to run in seconds"
  type        = number
  default     = 10
}

variable "esbuild_format" {
  description = "The output format for esbuild (cjs or esm)"
  type        = string
  default     = "cjs"
}

variable "esbuild_target" {
  description = "The target for esbuild (e.g., node22)"
  type        = string
  default     = "node22"
}

variable "output_extension" {
  description = "The file extension for the bundled output (e.g., .js or .mjs)"
  type        = string
  default     = ".js"
}

variable "source_file" {
  description = "The path to the source file to be archived (e.g., dist/index.js). If not provided, it will be automatically generated."
  type        = string
  default     = ""
}

variable "entry_point" {
  description = "The entry point for esbuild (relative to project root)"
  type        = string
}

variable "environment_variables" {
  description = "A map of environment variables to pass to the Lambda"
  type        = map(string)
  default     = {}
}

variable "extra_policy_statements" {
  description = "A list of extra IAM policy statements to attach to the Lambda role"
  type = list(object({
    Action    = list(string)
    Effect    = string
    Resource  = list(string)
    Condition = optional(any)
  }))
  default = []
}

variable "allowed_triggers" {
  description = "A map of triggers that can invoke the Lambda"
  type = map(object({
    principal  = string
    source_arn = string
  }))
  default = {}
}

variable "retention_in_days" {
  description = "The number of days to retain logs in CloudWatch"
  type        = number
  default     = 7
}
