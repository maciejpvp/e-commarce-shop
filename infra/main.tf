// --- COGNITO ---

module "cognito" {
  source = "./modules/cognito"

  Environment                  = var.Environment
  post_confirmation_lambda_arn = module.lambdas.post_confirmation_lambda_arn
  pre_sign_up_lambda_arn       = module.lambdas.pre_sign_up_lambda_arn
}

// Stripe Event Bus
module "stripe_integration" {
  source               = "./modules/stripe_events"
  Environment          = var.Environment
  stripe_bus_name      = var.stripe_bus_name
  lambda_function_name = module.lambdas.order_payment_reconciler_lambda_function_name
  lambda_arn           = module.lambdas.order_payment_reconciler_lambda_arn
}

import {
  to = module.stripe_integration.aws_cloudwatch_event_bus.stripe_bus
  id = var.stripe_bus_name
}

data "aws_ssm_parameter" "stripe_secret" {
  name = "/e-commerce-store/${var.Environment}/stripe-secret-key"
}

// Lambda Layers

module "product_db_layer" {
  source     = "./modules/ts_layer"
  layer_name = "product-db-services-${var.Environment}"

  entrypoint = "${path.module}/../src/services/product.ts"

  import_name = "product-db"
}

module "cart_db_layer" {
  source     = "./modules/ts_layer"
  layer_name = "cart-db-services-${var.Environment}"

  entrypoint = "${path.module}/../src/services/cart.ts"

  import_name = "cart-db"
}

module "order_db_layer" {
  source     = "./modules/ts_layer"
  layer_name = "order-db-services-${var.Environment}"

  entrypoint = "${path.module}/../src/services/order.ts"

  import_name = "order-db"
}

module "coupon_db_layer" {
  source     = "./modules/ts_layer"
  layer_name = "coupon-db-services-${var.Environment}"

  entrypoint = "${path.module}/../src/services/coupon.ts"

  import_name = "coupon-db"
}

module "user_db_layer" {
  source     = "./modules/ts_layer"
  layer_name = "user-db-services-${var.Environment}"

  entrypoint = "${path.module}/../src/services/user.ts"

  import_name = "user-db"
}


// --- LAMBDAS ---

module "lambdas" {
  source = "./modules/lambdas"

  Environment                 = var.Environment
  table_name                  = module.dynamodb.dynamodb_table_name
  table_arn                   = module.dynamodb.dynamodb_table_arn
  bucket_name                 = module.s3_product_media.bucket_id
  bucket_arn                  = module.s3_product_media.bucket_arn
  user_pool_arn               = module.cognito.cognito_user_pool_arn
  api_gateway_execution_arn   = module.api_gateway.api_execution_arn
  checkout_sfn_arn            = module.checkout.state_machine_arn
  cognito_user_pool_client_id = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint  = module.cognito.cognito_user_pool_endpoint
  security_mapping            = module.api_gateway.security_mapping # Assuming api_gateway still exports this or needs it
  stripe_secret_key_arn       = data.aws_ssm_parameter.stripe_secret.arn
  layers = {
    product_db = module.product_db_layer.layer_arn,
    cart_db    = module.cart_db_layer.layer_arn,
    order_db   = module.order_db_layer.layer_arn,
    coupon_db  = module.coupon_db_layer.layer_arn,
    user_db    = module.user_db_layer.layer_arn,
  }
}

// --- CHECKOUT ---

module "checkout" {
  source = "./modules/checkout"

  Environment                           = var.Environment
  validate_cart_lambda_arn              = module.lambdas.validate_cart_lambda_invoke_arn
  reserve_stock_lambda_arn              = module.lambdas.reserve_stock_lambda_invoke_arn
  create_checkout_session_lambda_arn    = module.lambdas.create_checkout_session_lambda_invoke_arn
  finalize_order_lambda_arn             = module.lambdas.finalize_order_lambda_invoke_arn
  unreserve_stock_lambda_arn            = module.lambdas.unreserve_stock_lambda_invoke_arn
  cleanup_lambda_arn                    = module.lambdas.cleanup_lambda_invoke_arn
  send_receipt_lambda_arn               = module.lambdas.send_receipt_lambda_arn
  calculate_checkout_summary_lambda_arn = module.lambdas.calculate_checkout_summary_lambda_arn
}

// --- API GATEWAY ---

module "api_gateway" {
  source = "./modules/api_gateway"

  Environment                  = var.Environment
  cognito_user_pool_client_id  = module.cognito.cognito_user_pool_client_id
  cognito_user_pool_endpoint   = module.cognito.cognito_user_pool_endpoint
  cognito_user_pool_arn        = module.cognito.cognito_user_pool_arn
  authorizer_lambda_invoke_arn = module.lambdas.authorizer_lambda_invoke_arn

  endpoints = {
    products = {
      upload = {
        POST = {
          lambda      = module.lambdas.upload_product_lambda_invoke_arn
          permissions = ["admin"]
        }
      },
      update = {
        "{productId}" = {
          PATCH = {
            lambda      = module.lambdas.update_product_lambda_invoke_arn
            permissions = ["admin"]
          }
        }
      },
      group = {
        POST = {
          lambda      = module.lambdas.manage_products_group_lambda_invoke_arn
          permissions = ["admin"]
        }
        DELETE = {
          lambda      = module.lambdas.manage_products_group_lambda_invoke_arn
          permissions = ["admin"]
        }
      },
      category = {
        "{category}" = {
          GET = {
            lambda      = module.lambdas.get_products_for_category_lambda_invoke_arn
            permissions = []
            no_auth     = true
          }
        }
      },
      "{productId}" = {
        GET = {
          lambda      = module.lambdas.get_product_lambda_invoke_arn
          permissions = []
          no_auth     = true
        },
        categories = {
          POST = {
            lambda      = module.lambdas.manage_product_categories_lambda_invoke_arn
            permissions = ["admin"]
          },
        }
      },
    },
    cart = {
      POST = {
        lambda      = module.lambdas.add_to_cart_lambda_invoke_arn
        permissions = []
      },
      test = {
        POST = {
          lambda      = module.lambdas.add_to_cart_lambda_invoke_arn
          permissions = []
        }
      },
      PATCH = {
        lambda      = module.lambdas.update_cart_item_lambda_invoke_arn
        permissions = []
      }
      GET = {
        lambda      = module.lambdas.get_cart_lambda_invoke_arn
        permissions = []
      }
    },
    coupons = {
      POST = {
        lambda      = module.lambdas.create_coupon_lambda_invoke_arn
        permissions = ["admin"]
      }
    },
    checkout = {
      POST = {
        lambda      = module.lambdas.init_checkout_lambda_invoke_arn
        permissions = []
      }
      calculate = {
        POST = {
          lambda      = module.lambdas.calculate_checkout_summary_lambda_invoke_arn
          permissions = []
        }
      }
      "{orderId}" = {
        GET = {
          lambda      = module.lambdas.fetch_checkout_url_lambda_invoke_arn
          permissions = []
        }
      }
    }
    user = {
      address = {
        POST = {
          lambda      = module.lambdas.upload_address_lambda_invoke_arn
          permissions = []
        }
        GET = {
          lambda      = module.lambdas.get_address_list_lambda_invoke_arn
          permissions = []
        }
        "{addressName}" = {
          DELETE = {
            lambda      = module.lambdas.delete_address_lambda_invoke_arn
            permissions = []
          }
          PATCH = {
            lambda      = module.lambdas.edit_address_lambda_invoke_arn
            permissions = []
          }
        }
      },
      orders = {
        GET = {
          lambda      = module.lambdas.get_order_list_lambda_invoke_arn
          permissions = []
        }
      }
    }
  }
}

// --- DATABASE ---

module "dynamodb" {
  source = "./modules/dynamodb"

  Environment = var.Environment
}

// --- S3 ---

module "s3_product_media" {
  source = "./modules/s3"

  Environment = var.Environment
}

// --- CLOUDFRONT ---

module "cloudfront" {
  source = "./modules/cloudfront"

  Environment                = var.Environment
  media_bucket_id            = module.s3_product_media.bucket_id
  media_bucket_domain_name   = module.s3_product_media.domain_name
  media_bucket_arn           = module.s3_product_media.bucket_arn
  api_gateway_domain         = module.api_gateway.api_endpoint_domain
  api_gateway_stage          = module.api_gateway.stage_name
  api_key                    = module.api_gateway.api_key_value
  website_bucket_id          = module.s3_product_media.website_bucket_id
  website_bucket_arn         = module.s3_product_media.website_bucket_arn
  website_bucket_domain_name = module.s3_product_media.website_domain_name
}
