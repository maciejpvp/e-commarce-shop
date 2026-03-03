# Record Types - E-Commerce Single-Table Design

## 1. User Related

### USER PROFILE
- PK: USER#<user_id>
- SK: PROFILE
- Attributes: 
  - email (String)
  - first_name (String)
  - last_name (String)
  - phone_number (String)
  - created_at (ISO8601)
  - version (Number)
  - gsi1pk: EMAIL#<email> (For unique lookup)
  - gsi1sk: PROFILE

### EMAIL CLAIM (Unique Constraint)
- PK: EMAIL#<email>
- SK: EMAIL#<email>
- Note: Use with TransactWriteItems to prevent duplicate signups.

### USER ADDRESS
- PK: USER#<user_id>
- SK: ADDRESS#<address_id>
- Attributes: 
  - street, city, state, zip_code, country
  - is_default (Boolean)
  - created_at, version

### USER CART
- PK: USER#<user_id>
- SK: CART#<product_id>
- Attributes: 
  - quantity (Integer)
  - price_at_add (Integer - Cents)
  - updated_at (ISO8601)
  - ttl (Number - Unix timestamp, auto-expires idle cart items)
  - version

---

## 2. Order Related

### ORDER (Summary)
- PK: USER#<user_id>
- SK: ORDER#<created_at>#<order_id>
- Attributes: 
  - status [PENDING, PAID, SHIPPED, DELIVERED, CANCELLED]
  - total_amount (Integer - Cents)
  - currency (e.g., USD)
  - shipping_address: <Address_Id>
  - created_at, version
  - gsi1pk: ORDER#<order_id> (To find order by ID only)
  - gsi1sk: ORDER#<order_id>
  - gsi2pk: STATUS#<status> (Query orders by status)
  - gsi2sk: ORDER#<created_at>#<order_id> (Time-sorted within status)

### ORDER ITEM 
- PK: ORDER#<order_id>
- SK: ITEM#<product_id>
- Attributes:
  - product_name (Denormalized)
  - quantity (Integer)
  - price_at_purchase (Integer - Cents)
  - gsi1pk: PRODUCT#<product_id> (Inverted index: Find all orders for a product)
  - gsi1sk: ORDER#<created_at>#<order_id>
- Note: Fetching an order with items requires two queries:
  1. `PK=USER#<user_id>, SK=ORDER#<created_at>#<order_id>` → order summary
  2. `PK=ORDER#<order_id>` → line items

---

## 3. Product Related

### PRODUCT
- PK: PRODUCT#<product_id>
- SK: METADATA
- Attributes: 
  - name,
  - description,
  - price (Integer - Cents),
  - stock (Integer),
  - media: [ { type, key, isMain } ],
  - created_at,
  - version,

### PRODUCT CATEGORY
- PK: PRODUCT#<product_id>
- SK: CATEGORY#<category_id>
- gsi1pk: CATEGORY#<category_id>
- gsi1sk: PRICE#<zero-padded-price>#<product_id> 

### PRODUCT COMMENT
- PK: PRODUCT#<product_id>
- SK: COMMENT#<timestamp>#<user_id>
- Attributes: 
  - content
  - rating (1-10)
  - user_name (Denormalized)
  - gsi1pk: PRODUCT#<product_id> (Top-rated reviews)
  - gsi1sk: RATING#<zero-padded-rating>#<timestamp>

---

## 4. Promotion Related

### DISCOUNT / COUPON
- PK: COUPON#<code>
- SK: METADATA
- Attributes:
  - discount_type [PERCENT, FLAT]
  - value
  - expiry_date
  - is_active (Boolean)
  - gsi1pk: COUPON_STATUS#ACTIVE (Query all active coupons)
  - gsi1sk: EXPIRY#<expiry_date>#<code>

---

## 5. Access Patterns

| # | Access Pattern | Index | Key Condition |
|---|---|---|---|
| 1 | Get user profile | Table | `PK=USER#<id>, SK=PROFILE` |
| 2 | Get user by email | GSI1 | `gsi1pk=EMAIL#<email>, gsi1sk=PROFILE` |
| 3 | List user addresses | Table | `PK=USER#<id>, SK begins_with ADDRESS#` |
| 4 | Get user cart | Table | `PK=USER#<id>, SK begins_with CART#` |
| 5 | List user orders (newest first) | Table | `PK=USER#<id>, SK begins_with ORDER#` (ScanIndexForward=false) |
| 6 | Get order by ID | GSI1 | `gsi1pk=ORDER#<id>` |
| 7 | Get order items | Table | `PK=ORDER#<id>, SK begins_with ITEM#` |
| 8 | Orders by status (time-sorted) | GSI2 | `gsi2pk=STATUS#<status>` |
| 9 | Get product metadata | Table | `PK=PRODUCT#<id>, SK=METADATA` |
| 10 | Products by category (price-sorted) | GSI1 | `gsi1pk=CATEGORY#<cat>, gsi1sk between PRICE#min AND PRICE#max` |
| 11 | Product comments (chronological) | Table | `PK=PRODUCT#<id>, SK begins_with COMMENT#` |
| 12 | Product comments (by rating) | GSI1 | `gsi1pk=PRODUCT#<id>, gsi1sk begins_with RATING#` |
| 13 | All orders containing a product | GSI1 | `gsi1pk=PRODUCT#<id>, gsi1sk begins_with ORDER#` |
| 14 | Get coupon by code | Table | `PK=COUPON#<code>, SK=METADATA` |
| 15 | List active coupons | GSI1 | `gsi1pk=COUPON_STATUS#ACTIVE` |