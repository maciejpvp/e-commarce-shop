variable "stripe_bus_name" {
  type = string
}

variable "lambda_function_name" {
  type = string
}

variable "lambda_arn" {
  type = string
}

# The Bus (Imported)
resource "aws_cloudwatch_event_bus" "stripe_bus" {
  name = var.stripe_bus_name
}

# The Rule
resource "aws_cloudwatch_event_rule" "stripe_rule" {
  name           = "stripe-to-lambda-rule"
  event_bus_name = aws_cloudwatch_event_bus.stripe_bus.name
  event_pattern = jsonencode({
    "source" : [{ "prefix" : "aws.partner/stripe.com" }]
  })
}

# The Target
resource "aws_cloudwatch_event_target" "stripe_target" {
  rule           = aws_cloudwatch_event_rule.stripe_rule.name
  event_bus_name = aws_cloudwatch_event_bus.stripe_bus.name
  arn            = var.lambda_arn
}

# Permission for EventBridge to call Lambda
resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromStripeBus"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stripe_rule.arn
}
