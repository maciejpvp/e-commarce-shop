#!/usr/bin/env bash
#
# Pre-builds all Lambda handlers and layers so that terraform plan
# can find the dist/ files it needs for archive_file data sources.
#
# This mirrors the exact esbuild commands from:
#   - infra/modules/lambda_base/main.tf  (null_resource.build)
#   - infra/modules/ts_layer/main.tf     (null_resource.bundle_ts)

set -euo pipefail

DIST_DIR="infra/modules/lambda_base/dist"

# ─── Lambda Handlers ─────────────────────────────────────────────────
# Format: "function_name|entry_point"
LAMBDAS=(
  # Products
  "e-commarce-shop-upload-product|src/product/upload_product/index.ts"
  "e-commarce-shop-update-product|src/product/update_product/index.ts"
  "e-commarce-shop-get-products-for-category|src/product/get_products_for_category/index.ts"
  "e-commarce-shop-get-product|src/product/get_product/index.ts"
  "e-commarce-shop-manage-product-categories|src/product/manage_product_categories/index.ts"
  "e-commarce-shop-manage-products-group|src/product/manage_products_group/index.ts"

  # Coupons
  "e-commarce-shop-create-coupon|src/coupon/create_coupon/index.ts"

  # Cart
  "e-commarce-shop-add-to-cart|src/cart/add_to_cart/index.ts"
  "e-commarce-shop-update-cart-item|src/cart/update_cart_item/index.ts"
  "e-commarce-shop-get-cart|src/cart/get_cart/index.ts"

  # Auth
  "e-commerce-pre-sign-up|src/auth/pre_sign_up/index.ts"
  "e-commerce-post-confirmation|src/auth/post_confirmation/index.ts"
  "e-commarce-shop-authorizer|src/auth/authorizers/group_authorizer.ts"

  # Checkout
  "e-commarce-shop-validate-cart|src/checkout/validateCart/index.ts"
  "e-commarce-shop-reserve-stock|src/checkout/reserveStock/index.ts"
  "e-commarce-shop-create-checkout-session|src/checkout/create_checkout_session/index.ts"
  "e-commarce-shop-order-payment-reconciler|src/checkout/order_payment_reconciler/index.ts"
  "e-commarce-shop-unreserve-stock|src/checkout/unreserve_stock/index.ts"
  "e-commarce-shop-finalize-order|src/checkout/finalize_order/index.ts"
  "e-commarce-shop-cleanup|src/checkout/cleanup/index.ts"
  "e-commarce-shop-send-receipt|src/checkout/send_receipt/index.ts"
  "e-commarce-shop-init-checkout|src/checkout/init_checkout/index.ts"
  "e-commarce-shop-fetch-checkout-url|src/checkout/fetch_checkout_url/index.ts"
  "e-commarce-shop-calculate-checkout-summary|src/checkout/calculate-checkout-summary/index.ts"

  # User
  "e-commarce-shop-upload-address|src/user/upload_address/index.ts"
  "e-commarce-shop-delete-address|src/user/delete_address/index.ts"
  "e-commarce-shop-get-address-list|src/user/get_addres_list/index.ts"
  "e-commarce-shop-edit-address|src/user/edit_address/index.ts"

  # Orders
  "e-commarce-shop-get-order-list|src/order/get_order_list/index.ts"
)

echo "══════════════════════════════════════════════"
echo "  Pre-building ${#LAMBDAS[@]} Lambda handlers"
echo "══════════════════════════════════════════════"

for entry in "${LAMBDAS[@]}"; do
  IFS='|' read -r func_name entry_point <<< "$entry"
  outfile="${DIST_DIR}/${func_name}/index.js"

  echo "  ⚡ ${func_name}"
  mkdir -p "$(dirname "$outfile")"
  npx esbuild "$entry_point" \
    --bundle \
    --platform=node \
    --target=node22 \
    --format=cjs \
    --minify \
    --outfile="$outfile"
done

# ─── Lambda Layers ───────────────────────────────────────────────────
# Format: "layer_name|import_name|entrypoint"
LAYERS=(
  "product-db-services|product-db|src/services/product.ts"
  "cart-db-services|cart-db|src/services/cart.ts"
  "order-db-services|order-db|src/services/order.ts"
  "coupon-db-services|coupon-db|src/services/coupon.ts"
  "user-db-services|user-db|src/services/user.ts"
)

echo ""
echo "══════════════════════════════════════════════"
echo "  Pre-building ${#LAYERS[@]} Lambda layers"
echo "══════════════════════════════════════════════"

for entry in "${LAYERS[@]}"; do
  IFS='|' read -r layer_name import_name entrypoint <<< "$entry"
  staging_dir="infra/.terraform/layers/${layer_name}/nodejs/node_modules/${import_name}"

  echo "  📦 ${layer_name}"
  mkdir -p "$staging_dir"
  npx esbuild "$entrypoint" \
    --bundle \
    --platform=node \
    --target=node20 \
    --format=cjs \
    --outfile="${staging_dir}/index.js" \
    --external:'*'
  echo "{\"name\": \"${import_name}\", \"main\": \"index.js\"}" > "${staging_dir}/package.json"
done

echo ""
echo "✅ All lambdas and layers pre-built successfully."
