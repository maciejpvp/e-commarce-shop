module "s3_product_media" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "ecommerce-product-media-${var.Environment}"

  control_object_ownership = true
  object_ownership         = "BucketOwnerEnforced"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }

  cors_rule = [
    {
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = ["*"]
      allowed_headers = ["*"]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  lifecycle_rule = [
    {
      id      = "archive_old_media"
      enabled = true
      transition = [
        {
          days          = 90
          storage_class = "STANDARD_IA"
        }
      ]
    }
  ]
}

module "s3_website" {
  source  = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "ecommerce-website-${var.Environment}"

  control_object_ownership = true
  object_ownership         = "BucketOwnerEnforced"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = {
        sse_algorithm = "AES256"
      }
    }
  }
}

locals {
  bucket_id   = module.s3_product_media.s3_bucket_id
  bucket_arn  = module.s3_product_media.s3_bucket_arn
  domain_name = module.s3_product_media.s3_bucket_bucket_regional_domain_name

  website_bucket_id   = module.s3_website.s3_bucket_id
  website_bucket_arn  = module.s3_website.s3_bucket_arn
  website_domain_name = module.s3_website.s3_bucket_bucket_regional_domain_name
}
