# Categories API Documentation

## Overview

The Categories API provides endpoints for managing product categories in the inventory management system. Categories serve as organizational entities that products reference through their `categoryId` field, enabling hierarchical product classification.

**Base URL**: `/api/categories`

**Authentication**: Currently, authentication is not enforced but endpoints are designed to support JWT authentication when needed.

---

## Data Model

### Category Schema

```json
{
  "_id": "MongoDB ObjectId (auto-generated)",
  "name": "string (required, unique, max 100 characters)",
  "description": "string (optional, max 500 characters)",
  "status": "string (enum: 'Active' | 'Inactive', default: 'Active')",
  "createdAt": "Date (auto-generated)",
  "updatedAt": "Date (auto-updated)"
}
```

**Constraints**:
- Category names must be unique (case-insensitive)
- Name cannot be empty or whitespace-only
- Status must be either 'Active' or 'Inactive'

---

## Endpoints

### 1. Create Category
**POST** `/api/categories`

**Description**: Creates a new category with a unique name and optional description.

**Authentication**: Not currently required (designed for future JWT authentication)

**Request Body:**
```json
{
  "name": "Electronics",
  "description": "Electronic devices and accessories",
  "status": "Active"
}
```

**Field Descriptions**:
- `name` (required): Category name, must be unique, max 100 characters, cannot be empty or whitespace-only
- `description` (optional): Category description, max 500 characters
- `status` (optional): Category status, must be 'Active' or 'Inactive', defaults to 'Active'

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (400 Bad Request - Duplicate Name):**
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "success": false,
  "message": "\"name\" is not allowed to be empty"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "Active"
  }'
```

---

### 2. Get All Categories
**GET** `/api/categories`

**Description**: Retrieves all categories with optional filtering, searching, and pagination.

**Authentication**: Not required

**Query Parameters:**
- `status` (optional): Filter by status ('Active' or 'Inactive')
- `search` (optional): Search term to filter categories by name or description (case-insensitive)
- `page` (optional, default: 1): Page number for pagination
- `limit` (optional, default: 10): Number of items per page

**Example URLs:**
- Get all categories: `/api/categories`
- Filter by status: `/api/categories?status=Active`
- Search categories: `/api/categories?search=electronic`
- Paginated results: `/api/categories?page=2&limit=20`
- Combined filters: `/api/categories?status=Active&search=tech&page=1&limit=10`

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Electronics",
      "description": "Electronic devices and accessories",
      "status": "Active",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Furniture",
      "description": "Home and office furniture",
      "status": "Active",
      "createdAt": "2024-01-02T00:00:00.000Z",
      "updatedAt": "2024-01-02T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

**Success Response (200 OK - Empty Results):**
```json
{
  "success": true,
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 10,
    "pages": 0
  }
}
```

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/categories?status=Active&page=1&limit=10"
```

**Notes**:
- Results are ordered by creation date in descending order (newest first)
- Search is case-insensitive and matches partial strings in name or description
- Pagination metadata includes total count, current page, limit, and total pages

---

### 3. Get Category by ID
**GET** `/api/categories/:id`

**Description**: Retrieves a single category by its unique identifier.

**Authentication**: Not required

**Path Parameters:**
- `id` (required): MongoDB ObjectId of the category (24 hex characters)

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Error Response (400 Bad Request - Invalid ID Format):**
```json
{
  "success": false,
  "message": "\"id\" must be a valid MongoDB ObjectId"
}
```

**Example Request:**
```bash
curl -X GET http://localhost:3000/api/categories/507f1f77bcf86cd799439011
```

---

### 4. Update Category
**PUT** `/api/categories/:id`

**Description**: Updates an existing category. All fields are optional, but at least one field must be provided.

**Authentication**: Not currently required (designed for future JWT authentication)

**Path Parameters:**
- `id` (required): MongoDB ObjectId of the category to update

**Request Body (all fields optional, at least one required):**
```json
{
  "name": "Consumer Electronics",
  "description": "Updated description for electronic devices",
  "status": "Inactive"
}
```

**Field Descriptions**:
- `name` (optional): New category name, must be unique, max 100 characters
- `description` (optional): New category description, max 500 characters
- `status` (optional): New category status, must be 'Active' or 'Inactive'

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Consumer Electronics",
    "description": "Updated description for electronic devices",
    "status": "Inactive",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Error Response (400 Bad Request - Duplicate Name):**
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

**Error Response (400 Bad Request - Validation Error):**
```json
{
  "success": false,
  "message": "At least one field must be provided for update"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:3000/api/categories/507f1f77bcf86cd799439011 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Consumer Electronics",
    "status": "Inactive"
  }'
```

**Notes**:
- The `updatedAt` timestamp is automatically updated when any field is modified
- When updating the name, the system checks for duplicates excluding the current category

---

### 5. Delete Category
**DELETE** `/api/categories/:id`

**Description**: Deletes a single category by its unique identifier.

**Authentication**: Not currently required (designed for future JWT authentication)

**Path Parameters:**
- `id` (required): MongoDB ObjectId of the category to delete

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Electronics",
    "description": "Electronic devices and accessories",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

**Error Response (400 Bad Request - Invalid ID Format):**
```json
{
  "success": false,
  "message": "\"id\" must be a valid MongoDB ObjectId"
}
```

**Example Request:**
```bash
curl -X DELETE http://localhost:3000/api/categories/507f1f77bcf86cd799439011
```

**Notes**:
- Deleting a category does not automatically delete associated products
- Products referencing the deleted category will retain the categoryId reference
- Consider implementing soft deletes or cascading logic at the application level if needed

---

### 6. Bulk Delete Categories
**POST** `/api/categories/bulk-delete`

**Description**: Deletes multiple categories in a single operation. Returns the count of successfully deleted categories.

**Authentication**: Not currently required (designed for future JWT authentication)

**Request Body:**
```json
{
  "ids": [
    "507f1f77bcf86cd799439011",
    "507f1f77bcf86cd799439012",
    "507f1f77bcf86cd799439013"
  ]
}
```

**Field Descriptions**:
- `ids` (required): Array of MongoDB ObjectIds, must contain at least one valid ID

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "3 categories deleted successfully",
  "data": {
    "deletedCount": 3
  }
}
```

**Success Response (200 OK - Partial Deletion):**
```json
{
  "success": true,
  "message": "2 categories deleted successfully",
  "data": {
    "deletedCount": 2
  }
}
```

**Error Response (400 Bad Request - Empty Array):**
```json
{
  "success": false,
  "message": "\"ids\" must contain at least 1 items"
}
```

**Error Response (400 Bad Request - Invalid ID Format):**
```json
{
  "success": false,
  "message": "\"ids[0]\" must be a valid MongoDB ObjectId"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:3000/api/categories/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "507f1f77bcf86cd799439011",
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ]
  }'
```

**Notes**:
- The operation continues even if some IDs don't exist in the database
- The response includes the actual count of deleted categories
- If all IDs are invalid or non-existent, `deletedCount` will be 0
- This is useful for cleaning up multiple obsolete categories at once

---

## Validation Rules

### Create Category
- **name**: Required, string, trimmed, max 100 characters, cannot be empty or whitespace-only, must be unique (case-insensitive)
- **description**: Optional, string, trimmed, max 500 characters
- **status**: Optional, must be 'Active' or 'Inactive', defaults to 'Active'

### Update Category
- All fields are optional
- At least one field must be provided
- Same validation rules as create for provided fields
- Name uniqueness check excludes the current category being updated

### Category ID (Path Parameter)
- Must be a valid MongoDB ObjectId (24 hexadecimal characters)

### Bulk Delete
- **ids**: Required, array of valid MongoDB ObjectIds, must contain at least 1 item

---

## Error Responses

### 400 Bad Request - Validation Error
```json
{
  "success": false,
  "message": "\"name\" is not allowed to be empty"
}
```

### 400 Bad Request - Duplicate Name
```json
{
  "success": false,
  "message": "Category with this name already exists"
}
```

### 400 Bad Request - Invalid ObjectId
```json
{
  "success": false,
  "message": "\"id\" must be a valid MongoDB ObjectId"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Category not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - Request completed successfully |
| 201 | Created - Category created successfully |
| 400 | Bad Request - Validation error or invalid input |
| 404 | Not Found - Category does not exist |
| 500 | Internal Server Error - Unexpected server error |

---

## Pagination and Filtering

### Pagination

The GET `/api/categories` endpoint supports pagination through query parameters:

- **page**: Page number (default: 1, minimum: 1)
- **limit**: Items per page (default: 10, minimum: 1, maximum: 100)

**Pagination Metadata**:
```json
{
  "pagination": {
    "total": 50,      // Total number of categories matching filters
    "page": 2,        // Current page number
    "limit": 10,      // Items per page
    "pages": 5        // Total number of pages
  }
}
```

### Filtering

**Status Filter**:
- Parameter: `status`
- Values: 'Active' or 'Inactive'
- Example: `/api/categories?status=Active`

**Search Filter**:
- Parameter: `search`
- Searches in: name and description fields
- Case-insensitive partial matching
- Example: `/api/categories?search=electronic`

### Sorting

Categories are always returned in descending order by creation date (newest first). Custom sorting is not currently supported but can be added in future versions.

### Combined Example

```bash
# Get active categories containing "tech" in name or description, page 2, 20 items per page
curl -X GET "http://localhost:3000/api/categories?status=Active&search=tech&page=2&limit=20"
```

---

## Integration Notes

### Product References

Categories are referenced by products through the `categoryId` field. When working with categories:

1. **Before Deleting**: Consider checking if any products reference the category
2. **After Deleting**: Products will retain the categoryId reference (orphaned references)
3. **Best Practice**: Implement soft deletes by setting status to 'Inactive' instead of hard deleting

### Status Management

The status field allows you to control category visibility without deletion:

- **Active**: Category is available for use with products
- **Inactive**: Category is hidden but data is preserved

Use status filtering to show only active categories in product creation forms.

---

## Future Enhancements

Potential future saless to the Categories API:

1. **Hierarchical Categories**: Support for parent-child category relationships
2. **Category Images**: Add image URL field for visual representation
3. **Soft Deletes**: Implement soft delete with restoration capability
4. **Audit Trail**: Track who created/modified categories
5. **Bulk Operations**: Add bulk create and bulk update endpoints
6. **Category Statistics**: Endpoint to show product count per category
7. **Custom Sorting**: Support for sorting by name, status, or other fields

---

## Support

For issues, questions, or feature requests related to the Categories API, please contact the development team or refer to the main project documentation.
