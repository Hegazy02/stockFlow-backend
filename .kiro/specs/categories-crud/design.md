# Design Document: Categories CRUD System

## Overview

The Categories CRUD System provides a RESTful API for managing product categories within the Express.js inventory management application. The system follows the existing architectural patterns established in the codebase, utilizing MongoDB for persistence, Joi for validation, and Express middleware for request processing. Categories serve as organizational entities that products reference through their categoryId field, enabling hierarchical product classification.

The system implements standard CRUD operations (Create, Read, Update, Delete) plus bulk deletion capabilities, with comprehensive validation, error handling, and API documentation. The design emphasizes data integrity through unique name constraints, proper status management, and referential integrity considerations.

## Architecture

### High-Level Architecture

The Categories CRUD System follows a layered MVC (Model-View-Controller) architecture consistent with the existing application structure:

```
┌─────────────────────────────────────────────────────────┐
│                    API Routes Layer                      │
│              (categoryRoutes.js)                         │
│  - Route definitions                                     │
│  - Middleware composition                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Middleware Layer                        │
│  - Validation (validate.js + categoryValidator.js)      │
│  - Authentication (auth.js)                              │
│  - Error Handling (errorHandler.js)                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  Controller Layer                        │
│              (categoryController.js)                     │
│  - Request handling                                      │
│  - Business logic orchestration                          │
│  - Response formatting                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Model Layer                           │
│                (Category.js)                             │
│  - Schema definition                                     │
│  - Data validation rules                                 │
│  - Database operations                                   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  MongoDB Database                        │
│              (categories collection)                     │
└─────────────────────────────────────────────────────────┘
```

### Request Flow

1. **Request Reception**: Express router receives HTTP request
2. **Validation**: Joi validator middleware validates request data
3. **Authentication**: Auth middleware verifies JWT token (for protected routes)
4. **Controller Processing**: Controller executes business logic
5. **Model Interaction**: Mongoose model performs database operations
6. **Response Formation**: Controller formats and sends response
7. **Error Handling**: Global error handler catches and formats errors

## Components and Interfaces

### 1. Category Model (`src/models/Category.js`)

**Responsibility**: Define the category data schema and database interactions

**Schema Definition**:
```javascript
{
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

**Indexes**:
- Unique index on `name` field (case-insensitive)
- Index on `status` field for filtering queries

**Middleware Hooks**:
- Pre-save: Update `updatedAt` timestamp
- Pre-update: Update `updatedAt` timestamp

### 2. Category Controller (`src/controllers/categoryController.js`)

**Responsibility**: Handle HTTP requests and orchestrate business logic

**Functions**:

- `createCategory(req, res, next)`: Create a new category
  - Validates uniqueness of category name
  - Handles duplicate name errors
  - Returns created category with 201 status

- `getAllCategories(req, res, next)`: Retrieve categories with filtering and pagination
  - Supports query parameters: status, search, page, limit
  - Returns paginated results with metadata
  - Default pagination: page=1, limit=10

- `getCategoryById(req, res, next)`: Retrieve a single category
  - Validates MongoDB ObjectId format
  - Returns 404 if category not found
  - Returns complete category object

- `updateCategory(req, res, next)`: Update an existing category
  - Validates name uniqueness (excluding current category)
  - Updates `updatedAt` timestamp
  - Returns updated category object

- `deleteCategory(req, res, next)`: Delete a single category
  - Returns 404 if category not found
  - Returns deleted category object
  - Note: Does not check for product references (handled at application level)

- `bulkDeleteCategories(req, res, next)`: Delete multiple categories
  - Accepts array of category IDs
  - Returns count of deleted categories
  - Continues even if some IDs don't exist

### 3. Category Validator (`src/validators/categoryValidator.js`)

**Responsibility**: Define Joi validation schemas for request data

**Schemas**:

- `createCategorySchema`: Validates category creation
  - name: required, string, trimmed, max 100 chars, non-empty
  - description: optional, string, trimmed, max 500 chars
  - status: optional, enum ['Active', 'Inactive'], default 'Active'

- `updateCategorySchema`: Validates category updates
  - All fields optional
  - At least one field required
  - Same validation rules as create schema

- `categoryIdSchema`: Validates MongoDB ObjectId in URL params
  - id: required, valid 24-character hex string

- `bulkDeleteSchema`: Validates bulk delete requests
  - ids: required, array of valid ObjectIds, minimum 1 item

### 4. Category Routes (`src/routes/categoryRoutes.js`)

**Responsibility**: Define API endpoints and apply middleware

**Endpoints**:

| Method | Path | Controller | Middleware | Description |
|--------|------|------------|------------|-------------|
| POST | `/api/categories` | createCategory | validate(createCategorySchema) | Create category |
| GET | `/api/categories` | getAllCategories | - | List categories |
| GET | `/api/categories/:id` | getCategoryById | validate(categoryIdSchema) | Get single category |
| PUT | `/api/categories/:id` | updateCategory | validate(categoryIdSchema), validate(updateCategorySchema) | Update category |
| DELETE | `/api/categories/:id` | deleteCategory | validate(categoryIdSchema) | Delete category |
| POST | `/api/categories/bulk-delete` | bulkDeleteCategories | validate(bulkDeleteSchema) | Bulk delete |

**Note**: Authentication middleware can be added to protected routes as needed (following the pattern in productRoutes.js)

## Data Models

### Category Entity

**Fields**:
- `_id`: MongoDB ObjectId (auto-generated)
- `name`: String, required, unique, trimmed, max 100 characters
- `description`: String, optional, trimmed, max 500 characters
- `status`: Enum ['Active', 'Inactive'], default 'Active'
- `createdAt`: Date, auto-generated on creation
- `updatedAt`: Date, auto-updated on modification

**Constraints**:
- Unique constraint on `name` field (case-insensitive)
- Status must be either 'Active' or 'Inactive'
- Name cannot be empty or whitespace-only

**Relationships**:
- One-to-Many with Product: A category can be referenced by multiple products through `categoryId`

### API Response Formats

**Success Response**:
```javascript
{
  success: true,
  message: "Operation successful message",
  data: { /* category object or array */ },
  pagination: { // only for list endpoints
    total: 100,
    page: 1,
    limit: 10,
    pages: 10
  }
}
```

**Error Response**:
```javascript
{
  success: false,
  message: "Error description"
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, the following redundancies were identified:
- Property 8.3 (status filtering) is redundant with Property 2.3 (already covers status filtering)
- Properties 1.4 and 1.5 can be combined into a single comprehensive property about successful creation
- Properties 5.1 and 5.3 can be combined into a single property about successful deletion

The following properties provide unique validation value and will be implemented:

**Core CRUD Properties:**
1. Category creation with persistence and response validation
2. Duplicate name rejection on creation
3. Invalid name rejection (whitespace-only)
4. Category retrieval by ID
5. Category update with persistence
6. Duplicate name rejection on update
7. Invalid data rejection on update
8. Timestamp update on modification
9. Category deletion with verification
10. Bulk deletion with count verification
11. Bulk deletion validation (no side effects on invalid input)
12. Partial bulk deletion handling

**Query and Filtering Properties:**
13. Default ordering by creation date
14. Pagination correctness
15. Status filtering correctness
16. Search functionality correctness

**Default Value Properties:**
17. Default status assignment

**Status Validation Properties:**
18. Status enum validation

### Correctness Properties

Property 1: Category creation persistence and response completeness
*For any* valid category name and optional description, when a category is created, the system should persist it to MongoDB and return a complete category object containing the generated identifier, name, description, status, createdAt, and updatedAt fields
**Validates: Requirements 1.1, 1.4, 1.5**

Property 2: Duplicate name rejection on creation
*For any* category name that already exists in the database (case-insensitive), attempting to create a new category with that name should result in rejection with an appropriate error message
**Validates: Requirements 1.2**

Property 3: Whitespace-only name rejection
*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), attempting to create a category with that name should result in a validation error
**Validates: Requirements 1.3**

Property 4: Category retrieval by valid identifier
*For any* category that exists in the database, requesting that category by its identifier should return the complete category object with all fields
**Validates: Requirements 3.1**

Property 5: Category update persistence
*For any* existing category and valid update data, updating the category should persist all changes to MongoDB and return the updated category object
**Validates: Requirements 4.1**

Property 6: Duplicate name rejection on update
*For any* two distinct categories A and B, attempting to update category A's name to match category B's name (case-insensitive) should result in rejection with an appropriate error message
**Validates: Requirements 4.2**

Property 7: Invalid update data rejection without side effects
*For any* existing category and invalid update data, the update attempt should be rejected with validation errors and the category should remain unchanged in the database
**Validates: Requirements 4.4**

Property 8: Timestamp update on modification
*For any* existing category, when any field is updated, the updatedAt timestamp should be greater than its previous value
**Validates: Requirements 4.5**

Property 9: Category deletion with verification
*For any* existing category, deleting that category by its identifier should remove it from MongoDB and return the deleted category object in the response
**Validates: Requirements 5.1, 5.3**

Property 10: Bulk deletion count accuracy
*For any* array of valid category identifiers that exist in the database, bulk deleting those categories should remove all of them from MongoDB and return the correct count of deleted items
**Validates: Requirements 6.1**

Property 11: Bulk deletion validation without side effects
*For any* invalid bulk deletion request (empty array or invalid ID formats), the system should return a validation error without deleting any categories
**Validates: Requirements 6.2, 6.3**

Property 12: Partial bulk deletion handling
*For any* array of category identifiers where some exist and some do not, bulk deletion should delete only the existing categories and return the actual deletion count
**Validates: Requirements 6.4**

Property 13: Default ordering by creation date
*For any* request to retrieve all categories without filters, the returned categories should be ordered by creation date in descending order (newest first)
**Validates: Requirements 2.1**

Property 14: Pagination correctness
*For any* valid pagination parameters (page and limit), the system should return exactly the specified number of items for that page, along with accurate pagination metadata (total, page, limit, pages)
**Validates: Requirements 2.2**

Property 15: Status filtering correctness
*For any* status value ('Active' or 'Inactive'), requesting categories filtered by that status should return only categories with matching status values
**Validates: Requirements 2.3, 8.3**

Property 16: Search functionality correctness
*For any* search term, the system should return only categories where the name or description contains that search term (case-insensitive)
**Validates: Requirements 2.4**

Property 17: Default status assignment
*For any* category created without an explicit status value, the system should assign the default status of 'Active'
**Validates: Requirements 8.1**

Property 18: Status enum validation
*For any* status value that is not 'Active' or 'Inactive', attempting to create or update a category with that status should result in a validation error
**Validates: Requirements 8.2**

## Error Handling

### Error Categories

**Validation Errors (400 Bad Request)**:
- Empty or whitespace-only category name
- Invalid MongoDB ObjectId format
- Invalid status value (not 'Active' or 'Inactive')
- Missing required fields
- Field length violations (name > 100 chars, description > 500 chars)
- Empty array for bulk delete
- Invalid data types

**Duplicate Errors (400 Bad Request)**:
- Category name already exists (on create)
- Category name already exists (on update to different category's name)

**Not Found Errors (404 Not Found)**:
- Category ID does not exist (on get, update, or delete)

**Server Errors (500 Internal Server Error)**:
- Database connection failures
- Unexpected MongoDB errors
- Unhandled exceptions

### Error Response Format

All errors follow the standardized format:
```javascript
{
  success: false,
  message: "Human-readable error description"
}
```

### Error Handling Strategy

1. **Validation Layer**: Joi validators catch malformed requests before reaching controllers
2. **Controller Layer**: Business logic errors (duplicates, not found) are handled explicitly
3. **Global Error Handler**: Catches unhandled exceptions and formats responses consistently
4. **MongoDB Errors**: Specific handling for duplicate key errors (code 11000)

## Testing Strategy

The Categories CRUD System will employ a dual testing approach combining unit tests and property-based tests to ensure comprehensive coverage and correctness.

### Property-Based Testing

**Framework**: We will use **fast-check** for JavaScript/Node.js property-based testing.

**Configuration**: Each property-based test will run a minimum of 100 iterations to ensure thorough coverage of the input space.

**Test Tagging**: Each property-based test will include a comment explicitly referencing the correctness property from this design document using the format:
```javascript
// Feature: categories-crud, Property X: [property description]
// Validates: Requirements X.Y
```

**Properties to Test**:

All 18 correctness properties defined above will be implemented as property-based tests:

1. **Property 1**: Generate random valid category names and descriptions, create categories, verify persistence and response completeness
2. **Property 2**: Create a category, generate variations of its name (different cases), attempt to create duplicates, verify rejection
3. **Property 3**: Generate whitespace-only strings (spaces, tabs, newlines, combinations), attempt creation, verify rejection
4. **Property 4**: Create random categories, retrieve by ID, verify complete object returned
5. **Property 5**: Create categories, generate random valid updates, apply updates, verify persistence
6. **Property 6**: Create two categories, attempt to update one to have the other's name, verify rejection
7. **Property 7**: Create categories, generate invalid update data, attempt updates, verify rejection and no changes
8. **Property 8**: Create categories, update fields, verify updatedAt timestamp increases
9. **Property 9**: Create random categories, delete them, verify removal and response
10. **Property 10**: Create multiple categories, bulk delete all, verify count and removal
11. **Property 11**: Generate invalid bulk delete requests, verify rejection without deletions
12. **Property 12**: Create some categories, generate array with mix of valid and invalid IDs, verify partial deletion
13. **Property 13**: Create multiple categories with delays, retrieve all, verify descending creation order
14. **Property 14**: Create many categories, generate random pagination params, verify correct subset and metadata
15. **Property 15**: Create categories with different statuses, filter by status, verify only matching returned
16. **Property 16**: Create categories with known content, generate search terms, verify correct matches
17. **Property 17**: Create categories without status field, verify 'Active' default
18. **Property 18**: Generate invalid status values, attempt create/update, verify rejection

**Generator Strategies**:
- **Category names**: Alphanumeric strings, 1-100 characters, including special characters and Unicode
- **Descriptions**: Optional strings, 0-500 characters
- **Status values**: Valid ('Active', 'Inactive') and invalid values
- **ObjectIds**: Valid 24-character hex strings and invalid formats
- **Whitespace strings**: Combinations of spaces, tabs, newlines
- **Pagination params**: Page numbers (1-100), limits (1-100)
- **Search terms**: Substrings from created category names/descriptions

### Unit Testing

**Framework**: Jest (already used in the project based on package.json patterns)

**Unit Test Coverage**:

Unit tests will focus on specific examples and integration points:

1. **Model Tests**:
   - Schema validation for each field
   - Unique index enforcement on name field
   - Timestamp middleware hooks
   - Default value assignment

2. **Controller Tests**:
   - Successful creation with valid data
   - Successful retrieval of existing category
   - Successful update of existing category
   - Successful deletion of existing category
   - 404 responses for non-existent IDs
   - Duplicate name handling
   - Empty result set handling

3. **Validator Tests**:
   - Each Joi schema with valid inputs
   - Each Joi schema with invalid inputs
   - Boundary values (max lengths)
   - Required field enforcement

4. **Route Tests**:
   - Middleware composition
   - Correct controller mapping
   - Validation middleware application

5. **Integration Tests**:
   - End-to-end API request/response cycles
   - Database persistence verification
   - Error response formatting

**Test Organization**:
- Co-locate tests with source files using `.test.js` suffix
- Example: `src/models/Category.test.js`, `src/controllers/categoryController.test.js`

### Testing Workflow

1. **Implementation First**: Implement feature code before writing tests
2. **Property Tests**: Write property-based tests for universal properties
3. **Unit Tests**: Write unit tests for specific examples and edge cases
4. **Test Execution**: Run all tests to verify correctness
5. **Iteration**: Fix failures and re-run until all tests pass

### Test Data Management

- Use in-memory MongoDB instance (mongodb-memory-server) for isolated testing
- Clean database state between tests
- Generate realistic test data using fast-check generators
- Avoid mocking database operations to test real functionality

## API Documentation

### Documentation Format

API documentation will be created as a Markdown file following the existing pattern in the codebase (similar to `PRODUCTS_API.md`).

**Documentation File**: `CATEGORIES_API.md`

### Documentation Structure

1. **Overview**: Brief description of the Categories API
2. **Base URL**: API base path (`/api/categories`)
3. **Authentication**: JWT token requirements (when applicable)
4. **Endpoints**: Detailed documentation for each endpoint including:
   - HTTP method and path
   - Description
   - Request parameters (path, query, body)
   - Request body schema with field descriptions
   - Response format (success and error cases)
   - Status codes
   - Example requests (curl commands)
   - Example responses (JSON)

5. **Error Handling**: Common error responses and status codes
6. **Data Models**: Category schema definition

### Endpoint Documentation Template

Each endpoint will follow this structure:

```markdown
## [Operation Name]

**Endpoint**: `[METHOD] /api/categories[/path]`

**Description**: [What this endpoint does]

**Authentication**: [Required/Not Required]

### Request

**Path Parameters**:
- `param`: [type] - [description]

**Query Parameters**:
- `param`: [type] - [description] (optional/required)

**Request Body**:
```json
{
  "field": "type - description"
}
```

### Response

**Success Response** (Status: [code]):
```json
{
  "success": true,
  "message": "Success message",
  "data": {}
}
```

**Error Response** (Status: [code]):
```json
{
  "success": false,
  "message": "Error message"
}
```

### Example

**Request**:
```bash
curl -X [METHOD] http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d '{"field": "value"}'
```

**Response**:
```json
{
  "success": true,
  "data": {}
}
```
```

### Documentation Maintenance

- Documentation will be created as part of the implementation tasks
- Documentation should be updated whenever API changes are made
- Examples should use realistic data
- All possible error cases should be documented

## Implementation Notes

### Integration with Existing System

1. **Model Registration**: Register Category model in the application startup
2. **Route Registration**: Mount category routes in `src/app.js` alongside existing routes
3. **Product Model Update**: The Product model already references Category through `categoryId` field
4. **Validation Consistency**: Follow existing Joi validation patterns from productValidator.js
5. **Error Handling**: Use existing global error handler middleware
6. **Response Format**: Maintain consistency with existing API response structure

### Database Considerations

1. **Indexes**: Create unique index on name field (case-insensitive) for performance and constraint enforcement
2. **Cascading Deletes**: Category deletion does not automatically delete associated products (application-level decision)
3. **Referential Integrity**: Products reference categories via ObjectId, but MongoDB doesn't enforce foreign key constraints
4. **Migration**: If categories already exist, ensure unique constraint is applied carefully

### Performance Considerations

1. **Pagination**: Default limit of 10 items prevents large result sets
2. **Indexing**: Status field index improves filter query performance
3. **Text Search**: For production, consider MongoDB text index for search functionality
4. **Query Optimization**: Use lean() for read-only queries to improve performance

### Security Considerations

1. **Input Validation**: Joi validators prevent injection attacks
2. **Authentication**: JWT middleware can be added to protect routes
3. **Rate Limiting**: Consider adding rate limiting middleware for production
4. **Data Sanitization**: Mongoose automatically sanitizes inputs

### Future Enhancements

1. **Hierarchical Categories**: Support parent-child category relationships
2. **Category Images**: Add image URL field for visual representation
3. **Soft Deletes**: Implement soft delete instead of hard delete
4. **Audit Trail**: Track who created/modified categories
5. **Bulk Operations**: Add bulk create and bulk update endpoints
6. **Category Statistics**: Endpoint to show product count per category
