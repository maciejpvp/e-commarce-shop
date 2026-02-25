module "dynamodb_table" {
  source = "terraform-aws-modules/dynamodb-table/aws"

  name      = "e-commarce-shop-table-${var.Environment}"
  hash_key  = "PK"
  range_key = "SK"

  deletion_protection_enabled = false

  attributes = [
    {
      name = "PK"
      type = "S"
    },
    {
      name = "SK"
      type = "S"
    },
    {
      name = "gsi1pk"
      type = "S"
    },
    {
      name = "gsi1sk"
      type = "S"
    },
    {
      name = "gsi2pk"
      type = "S"
    },
    {
      name = "gsi2sk"
      type = "S"
    }
  ]

  billing_mode = "PAY_PER_REQUEST"

  global_secondary_indexes = [
    {
      name            = "GSI1"
      hash_key        = "gsi1pk"
      range_key       = "gsi1sk"
      projection_type = "ALL"
    },
    {
      name            = "GSI2"
      hash_key        = "gsi2pk"
      range_key       = "gsi2sk"
      projection_type = "ALL"
    }
  ]

  ttl_enabled        = true
  ttl_attribute_name = "ttl"

  tags = {
    Environment = var.Environment
    Terraform   = "true"
  }
}

locals {
  dynamodb_table_name = module.dynamodb_table.dynamodb_table_id
  dynamodb_table_arn  = module.dynamodb_table.dynamodb_table_arn
}
