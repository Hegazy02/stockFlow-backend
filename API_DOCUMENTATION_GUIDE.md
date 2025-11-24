# API Documentation Guide

## 📖 Viewing the Documentation

The API documentation is automatically served when you start the server.

**Access it at:** `http://localhost:3000`

The documentation provides:
- Interactive navigation between endpoint categories
- Search functionality within each section
- Complete request/response examples
- Parameter descriptions and validation rules
- Color-coded HTTP methods and status codes

---

## ✏️ How to Update Documentation When Adding New Endpoints

Whenever you add a new endpoint to the API, follow these steps to update the documentation:

### Step 1: Identify the Section

Determine which section your endpoint belongs to:
- **Overview** - General API information and health checks
- **Authentication** - Login, register, password reset, etc.
- **Products** - Product CRUD operations
- **[New Category]** - Create a new section if needed

### Step 2: Add the Endpoint Documentation

Open `public/index.html` and locate the appropriate section (e.g., `<div id="products" class="section">`).

### Step 3: Copy the Endpoint Template

Use this template for each new endpoint:

```html
<!-- [Endpoint Name] -->
<div class="endpoint" data-search="keywords for search">
    <div class="endpoint-header">
        <span class="method [get|post|put|delete]">[METHOD]</span>
        <span class="endpoint-path">/api/your/endpoint</span>
    </div>
    <p class="endpoint-desc">Brief description of what this endpoint does</p>
    
    <!-- For endpoints with request body -->
    <span class="label">Request Body:</span>
    <table class="param-table">
        <thead>
            <tr>
                <th>Field</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>fieldName</td>
                <td>string</td>
                <td><span class="badge required">Required</span></td>
                <td>Field description</td>
            </tr>
            <!-- Add more fields as needed -->
        </tbody>
    </table>

    <!-- For endpoints with query parameters -->
    <span class="label">Query Parameters:</span>
    <table class="param-table">
        <thead>
            <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>paramName</td>
                <td>string</td>
                <td><span class="badge optional">Optional</span></td>
                <td>Parameter description</td>
            </tr>
        </tbody>
    </table>

    <!-- For endpoints with URL parameters -->
    <span class="label">URL Parameters:</span>
    <table class="param-table">
        <thead>
            <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>id</td>
                <td>string</td>
                <td>Resource identifier</td>
            </tr>
        </tbody>
    </table>

    <span class="label">Example Request:</span>
    <div class="code-block">
        <pre>{
  "field1": "value1",
  "field2": "value2"
}</pre>
    </div>

    <span class="label">Response <span class="status-code status-200">200 OK</span>:</span>
    <div class="code-block">
        <pre>{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}</pre>
    </div>
</div>
```

### Step 4: Customize the Template

1. **Update the method class**: Use `get`, `post`, `put`, or `delete`
2. **Set the endpoint path**: e.g., `/api/products/:id`
3. **Add search keywords**: In `data-search` attribute for better searchability
4. **Fill in parameters**: Add all request/response fields
5. **Add examples**: Provide realistic request and response examples
6. **Set status codes**: Use appropriate status code classes:
   - `status-200` - Success
   - `status-201` - Created
   - `status-400` - Bad Request
   - `status-404` - Not Found
   - `status-500` - Server Error

### Step 5: Add New Section (If Needed)

If you're adding a completely new category:

1. **Add navigation button** in the nav section:
```html
<button class="nav-btn" onclick="showSection('newcategory')">New Category</button>
```

2. **Create new section** in the content area:
```html
<div id="newcategory" class="section">
    <h2>🔧 New Category Endpoints</h2>
    <input type="text" class="search-box" placeholder="Search endpoints..." onkeyup="filterEndpoints(this, 'newcategory')">
    
    <!-- Add endpoints here -->
</div>
```

### Step 6: Update Last Modified Date

The last updated date is automatically set by JavaScript, but you can manually update it if needed.

---

## 🎨 Styling Reference

### Method Badges
- `<span class="method get">GET</span>` - Green
- `<span class="method post">POST</span>` - Blue
- `<span class="method put">PUT</span>` - Yellow
- `<span class="method delete">DELETE</span>` - Red

### Requirement Badges
- `<span class="badge required">Required</span>` - Red badge
- `<span class="badge optional">Optional</span>` - Gray badge

### Status Codes
- `<span class="status-code status-200">200 OK</span>`
- `<span class="status-code status-201">201 Created</span>`
- `<span class="status-code status-400">400 Bad Request</span>`
- `<span class="status-code status-404">404 Not Found</span>`
- `<span class="status-code status-500">500 Error</span>`

---

## 📝 Example: Adding a New Endpoint

Let's say you're adding a `GET /api/products/search` endpoint:

```html
<div class="endpoint" data-search="search products find query">
    <div class="endpoint-header">
        <span class="method get">GET</span>
        <span class="endpoint-path">/api/products/search</span>
    </div>
    <p class="endpoint-desc">Search products by name or SKU</p>
    
    <span class="label">Query Parameters:</span>
    <table class="param-table">
        <thead>
            <tr>
                <th>Parameter</th>
                <th>Type</th>
                <th>Required</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>q</td>
                <td>string</td>
                <td><span class="badge required">Required</span></td>
                <td>Search query (min 2 characters)</td>
            </tr>
            <tr>
                <td>limit</td>
                <td>number</td>
                <td><span class="badge optional">Optional</span></td>
                <td>Max results (default: 20)</td>
            </tr>
        </tbody>
    </table>

    <span class="label">Example Request:</span>
    <div class="code-block">
        <pre>GET /api/products/search?q=wireless&limit=10</pre>
    </div>

    <span class="label">Response <span class="status-code status-200">200 OK</span>:</span>
    <div class="code-block">
        <pre>{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "sku": "PROD-001",
      "name": "Wireless Mouse",
      "sellingPrice": 29.99
    }
  ],
  "count": 1
}</pre>
    </div>
</div>
```

---

## 🚀 Best Practices

1. **Keep examples realistic** - Use actual data structures from your API
2. **Include error responses** - Show what happens when things go wrong
3. **Add search keywords** - Make endpoints easy to find with the search feature
4. **Be consistent** - Follow the same format for all endpoints
5. **Update immediately** - Document new endpoints as you create them
6. **Test the documentation** - Make sure all examples work correctly

---

## 🔍 Testing Your Documentation

After updating the documentation:

1. Start your server: `npm start`
2. Open `http://localhost:3000` in your browser
3. Navigate to the section you updated
4. Test the search functionality
5. Verify all code examples are correct
6. Check that styling looks consistent

---

## 📦 File Location

The documentation file is located at:
```
public/index.html
```

This file is automatically served by Express when users visit the root URL (`/`).

---

## 💡 Tips

- Use the browser's developer tools to inspect and test styling
- Keep the documentation in sync with your actual API implementation
- Consider adding authentication examples if your endpoints require tokens
- Add common error scenarios to help developers troubleshoot
- Include rate limiting information if applicable

---

**Happy Documenting! 🎉**
