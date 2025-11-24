# Bulk Delete Products Endpoint

## Endpoint Details

**Method:** `POST`  
**Path:** `/api/products/bulk-delete`  
**Description:** Delete multiple products at once by providing an array of product IDs

---

## Request

### Headers
```
Content-Type: application/json
```

### Body
```json
{
  "ids": [
    "507f1f77bcf86cd799439013",
    "507f1f77bcf86cd799439014",
    "507f1f77bcf86cd799439015"
  ]
}
```

### Validation Rules
- `ids` field is **required**
- Must be an **array**
- Array must contain **at least 1 ID**
- Each ID must be a **valid MongoDB ObjectId** (24 hex characters)

---

## Response

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "3 product(s) deleted successfully",
  "data": {
    "deletedCount": 3,
    "requestedCount": 3
  }
}
```

### Partial Success
If some IDs don't exist, only existing products will be deleted:
```json
{
  "success": true,
  "message": "2 product(s) deleted successfully",
  "data": {
    "deletedCount": 2,
    "requestedCount": 3
  }
}
```

### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Please provide an array of product IDs"
}
```

### Validation Error (400 Bad Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "ids",
      "message": "At least one product ID must be provided"
    }
  ]
}
```

---

## Usage Examples

### JavaScript (Fetch API)
```javascript
const deleteProducts = async (productIds) => {
  const response = await fetch('http://localhost:3000/api/products/bulk-delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ids: productIds
    })
  });
  
  const result = await response.json();
  console.log(result);
};

// Usage
deleteProducts([
  '507f1f77bcf86cd799439013',
  '507f1f77bcf86cd799439014'
]);
```

### cURL
```bash
curl -X POST http://localhost:3000/api/products/bulk-delete \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "507f1f77bcf86cd799439013",
      "507f1f77bcf86cd799439014"
    ]
  }'
```

### Axios
```javascript
import axios from 'axios';

const bulkDeleteProducts = async (ids) => {
  try {
    const response = await axios.post(
      'http://localhost:3000/api/products/bulk-delete',
      { ids }
    );
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};
```

---

## Notes

- This endpoint uses `POST` method (not `DELETE`) because it accepts a request body
- The endpoint will not fail if some IDs don't exist - it will delete only the existing ones
- The response includes both `deletedCount` (actual deletions) and `requestedCount` (IDs provided)
- All IDs must be valid MongoDB ObjectIds (24 hexadecimal characters)
- Consider adding authentication middleware before deploying to production

---

## Frontend Integration

For AI agents building frontend CRUD:

```typescript
interface BulkDeleteRequest {
  ids: string[];
}

interface BulkDeleteResponse {
  success: boolean;
  message: string;
  data: {
    deletedCount: number;
    requestedCount: number;
  };
}

async function bulkDeleteProducts(ids: string[]): Promise<BulkDeleteResponse> {
  const response = await fetch('/api/products/bulk-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids })
  });
  return response.json();
}
```
