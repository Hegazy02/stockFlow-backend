# Products API Documentation

## Endpoints

### 1. Create Product
**POST** `/api/products`

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Sample Product",
  "categoryId": "507f1f77bcf86cd799439011",
  "description": "Product description",
  "costPrice": 50.00,
  "sellingPrice": 75.00,
  "supplierId": "507f1f77bcf86cd799439012",
  "status": "Active"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "sku": "PROD-001",
    "name": "Sample Product",
    "categoryId": "507f1f77bcf86cd799439011",
    "description": "Product description",
    "costPrice": 50.00,
    "sellingPrice": 75.00,
    "supplierId": "507f1f77bcf86cd799439012",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 2. Get All Products
**GET** `/api/products`

**Query Parameters:**
- `status` (optional): Filter by status (Active/Inactive)
- `categoryId` (optional): Filter by category ID
- `supplierId` (optional): Filter by supplier ID
- `page` (optional, default: 1): Page number
- `limit` (optional, default: 10): Items per page

**Example:** `/api/products?status=Active&page=1&limit=10`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "sku": "PROD-001",
      "name": "Sample Product",
      "categoryId": { "_id": "507f1f77bcf86cd799439011", "name": "Electronics" },
      "description": "Product description",
      "costPrice": 50.00,
      "sellingPrice": 75.00,
      "supplierId": { "_id": "507f1f77bcf86cd799439012", "name": "Supplier Inc" },
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

---

### 3. Get Product by ID
**GET** `/api/products/:id`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "sku": "PROD-001",
    "name": "Sample Product",
    "categoryId": { "_id": "507f1f77bcf86cd799439011", "name": "Electronics" },
    "description": "Product description",
    "costPrice": 50.00,
    "sellingPrice": 75.00,
    "supplierId": { "_id": "507f1f77bcf86cd799439012", "name": "Supplier Inc" },
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

### 4. Update Product
**PUT** `/api/products/:id`

**Request Body (all fields optional):**
```json
{
  "name": "Updated Product Name",
  "sellingPrice": 80.00,
  "status": "Inactive"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "sku": "PROD-001",
    "name": "Updated Product Name",
    "categoryId": "507f1f77bcf86cd799439011",
    "description": "Product description",
    "costPrice": 50.00,
    "sellingPrice": 80.00,
    "supplierId": "507f1f77bcf86cd799439012",
    "status": "Inactive",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### 5. Delete Product
**DELETE** `/api/products/:id`

**Response (200):**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439013",
    "sku": "PROD-001",
    "name": "Sample Product",
    "categoryId": "507f1f77bcf86cd799439011",
    "description": "Product description",
    "costPrice": 50.00,
    "sellingPrice": 75.00,
    "supplierId": "507f1f77bcf86cd799439012",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Validation Rules

### Create Product
- **sku**: Required, string, automatically converted to uppercase
- **name**: Required, string, max 200 characters
- **categoryId**: Required, valid MongoDB ObjectId
- **description**: Optional, string, max 1000 characters
- **costPrice**: Required, number, must be >= 0
- **sellingPrice**: Required, number, must be >= 0
- **supplierId**: Required, valid MongoDB ObjectId
- **status**: Optional, must be "Active" or "Inactive" (default: "Active")

### Update Product
- All fields are optional
- At least one field must be provided
- Same validation rules as create for provided fields

### Product ID
- Must be a valid MongoDB ObjectId (24 hex characters)

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "sku",
      "message": "SKU is required"
    }
  ]
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Product not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```
