# 🏗️ Building Your Server - Practical Examples

## פרוטוקול בנייה נכונה של Server Endpoint

### Template לכל Endpoint

```typescript
import { Request, Response } from "express";
import { Router } from "express";

const router = Router();

/**
 * GET /api/resource
 * Description: Get all resources
 * Auth: Optional
 * Status codes: 200, 500
 */
router.get("/", async (req: Request, res: Response) => {
  try {
    // 1. Validate input (if needed)
    const { limit = 10, skip = 0 } = req.query;
    
    if (isNaN(limit) || isNaN(skip)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid pagination parameters",
      });
    }

    // 2. Call service layer
    const resources = await ResourceService.getAll(limit, skip);

    // 3. Return success response
    return res.status(200).json({
      success: true,
      data: resources,
      message: "Resources retrieved successfully",
    });

  } catch (error: any) {
    // 4. Handle error
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to retrieve resources",
    });
  }
});

/**
 * POST /api/resource
 * Description: Create a new resource
 * Auth: Required
 * Status codes: 201, 400, 401, 409, 500
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Validate required fields
    const { name, description } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Name and description are required",
        details: {
          name: !name ? "Name is required" : undefined,
          description: !description ? "Description is required" : undefined,
        },
      });
    }

    // 2. Check for conflicts
    const existing = await Resource.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "CONFLICT",
        message: "Resource with this name already exists",
      });
    }

    // 3. Create resource
    const resource = await ResourceService.create({
      name,
      description,
      createdBy: req.user.id,
    });

    // 4. Return created response
    return res.status(201).json({
      success: true,
      data: resource,
      message: "Resource created successfully",
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to create resource",
    });
  }
});

/**
 * GET /api/resource/:id
 * Description: Get a specific resource
 * Auth: Optional
 * Status codes: 200, 404, 500
 */
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Validate ID format
    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid resource ID",
      });
    }

    // 2. Fetch resource
    const resource = await ResourceService.getById(id);

    // 3. Check if exists
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: `Resource with ID ${id} not found`,
      });
    }

    // 4. Return success
    return res.status(200).json({
      success: true,
      data: resource,
      message: "Resource retrieved successfully",
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to retrieve resource",
    });
  }
});

/**
 * PUT /api/resource/:id
 * Description: Update a resource
 * Auth: Required (owner only)
 * Status codes: 200, 400, 401, 403, 404, 500
 */
router.put("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // 1. Validate ID
    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid resource ID",
      });
    }

    // 2. Find resource
    const resource = await ResourceService.getById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: `Resource with ID ${id} not found`,
      });
    }

    // 3. Check authorization
    if (resource.createdBy !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You don't have permission to update this resource",
      });
    }

    // 4. Validate update data
    if (name === "") {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Name cannot be empty",
      });
    }

    // 5. Update resource
    const updated = await ResourceService.update(id, {
      ...(name && { name }),
      ...(description && { description }),
    });

    // 6. Return updated resource
    return res.status(200).json({
      success: true,
      data: updated,
      message: "Resource updated successfully",
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to update resource",
    });
  }
});

/**
 * DELETE /api/resource/:id
 * Description: Delete a resource
 * Auth: Required (owner only)
 * Status codes: 200, 401, 403, 404, 500
 */
router.delete("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Validate ID
    if (!isValidMongoId(id)) {
      return res.status(400).json({
        success: false,
        error: "VALIDATION_ERROR",
        message: "Invalid resource ID",
      });
    }

    // 2. Find resource
    const resource = await ResourceService.getById(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        error: "NOT_FOUND",
        message: `Resource with ID ${id} not found`,
      });
    }

    // 3. Check authorization
    if (resource.createdBy !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: "FORBIDDEN",
        message: "You don't have permission to delete this resource",
      });
    }

    // 4. Delete
    await ResourceService.delete(id);

    // 5. Return success (can be 200 or 204)
    return res.status(200).json({
      success: true,
      data: null,
      message: "Resource deleted successfully",
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "SERVER_ERROR",
      message: "Failed to delete resource",
    });
  }
});

export default router;
```

---

## עיקרון SOLID ב-API

### ✅ Single Responsibility
```typescript
// ❌ BAD: Controller does everything
router.post("/", async (req, res) => {
  const user = new User(req.body);
  await user.save();
  // ... more logic
});

// ✅ GOOD: Separation of concerns
// Controller - handles HTTP
router.post("/", async (req, res) => {
  const user = await UserService.create(req.body);
  res.status(201).json({ success: true, data: user });
});

// Service - handles business logic
export class UserService {
  static async create(data: CreateUserInput) {
    // validation, hashing, etc
    return User.create(data);
  }
}
```

### ✅ Open/Closed
```typescript
// ✅ Easy to add new endpoints without modifying existing code
router.get("/", getAll);
router.post("/", create);
// Add new endpoint without changing above code
router.get("/:id/similar", getSimilar);
```

### ✅ Liskov Substitution
```typescript
// ✅ Different services same interface
interface IDataService {
  get(id: string): Promise<any>;
  create(data: any): Promise<any>;
}

class MongoDBService implements IDataService {
  get(id) { /* ... */ }
  create(data) { /* ... */ }
}

class PostgreSQLService implements IDataService {
  get(id) { /* ... */ }
  create(data) { /* ... */ }
}

// Can use either service same way
```

### ✅ Interface Segregation
```typescript
// ✅ Specific interfaces instead of fat ones
interface IAuthService {
  login(email: string, password: string): Promise<Token>;
  register(data: CreateUserInput): Promise<User>;
}

interface IProductService {
  list(filter: ProductFilter): Promise<Product[]>;
  search(query: string): Promise<Product[]>;
}
```

### ✅ Dependency Inversion
```typescript
// ✅ Depend on abstractions, not implementations
class AuthController {
  constructor(private authService: IAuthService) {}
  
  async login(req, res) {
    // Uses service through interface
    const token = await this.authService.login(email, password);
  }
}
```

---

## Practical Example: Product Endpoint

```typescript
// routes/product.routes.ts
import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();

// List all products (public)
router.get("/", ProductController.listAll);

// Search products
router.get("/search", ProductController.search);

// Get product by ID (public)
router.get("/:id", ProductController.getById);

// Create product (admin only)
router.post("/", adminMiddleware, ProductController.create);

// Update product (admin only)
router.put("/:id", adminMiddleware, ProductController.update);

// Delete product (admin only)
router.delete("/:id", adminMiddleware, ProductController.delete);

export default router;
```

```typescript
// controllers/product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "../services/product.service";

export class ProductController {
  static async listAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 20, category } = req.query;
      
      const products = await ProductService.list({
        page: Number(page),
        limit: Number(limit),
        category: category as string,
      });

      res.status(200).json({
        success: true,
        data: products,
        message: "Products retrieved successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to retrieve products",
      });
    }
  }

  static async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || q.toString().trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Search query must be at least 2 characters",
        });
      }

      const results = await ProductService.search(q as string);

      res.status(200).json({
        success: true,
        data: results,
        message: "Search completed",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Search failed",
      });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await ProductService.getById(id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: `Product with ID ${id} not found`,
        });
      }

      res.status(200).json({
        success: true,
        data: product,
        message: "Product retrieved successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to retrieve product",
      });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const { name, description, price, category } = req.body;

      // Validation
      if (!name || !price || !category) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Name, price, and category are required",
        });
      }

      if (typeof price !== "number" || price <= 0) {
        return res.status(400).json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Price must be a positive number",
        });
      }

      // Check duplicate
      const existing = await ProductService.findByName(name);
      if (existing) {
        return res.status(409).json({
          success: false,
          error: "CONFLICT",
          message: "Product with this name already exists",
        });
      }

      // Create
      const product = await ProductService.create({
        name,
        description,
        price,
        category,
      });

      res.status(201).json({
        success: true,
        data: product,
        message: "Product created successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to create product",
      });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductService.getById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: `Product with ID ${id} not found`,
        });
      }

      const updated = await ProductService.update(id, updateData);

      res.status(200).json({
        success: true,
        data: updated,
        message: "Product updated successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to update product",
      });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const product = await ProductService.getById(id);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "NOT_FOUND",
          message: `Product with ID ${id} not found`,
        });
      }

      await ProductService.delete(id);

      res.status(200).json({
        success: true,
        data: null,
        message: "Product deleted successfully",
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: "SERVER_ERROR",
        message: "Failed to delete product",
      });
    }
  }
}
```

```typescript
// services/product.service.ts
import { Product } from "../models/product.model";

export class ProductService {
  static async list(options: { page: number; limit: number; category?: string }) {
    const { page, limit, category } = options;
    const skip = (page - 1) * limit;

    const query = category ? { category } : {};
    return Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
  }

  static async search(query: string) {
    return Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    }).limit(20);
  }

  static async getById(id: string) {
    return Product.findById(id);
  }

  static async create(data: any) {
    return Product.create(data);
  }

  static async update(id: string, data: any) {
    return Product.findByIdAndUpdate(id, data, { new: true });
  }

  static async delete(id: string) {
    return Product.findByIdAndDelete(id);
  }

  static async findByName(name: string) {
    return Product.findOne({ name });
  }
}
```

---

## 📝 Checklist for Each Endpoint

- [ ] **Status Code**: Choose correct HTTP status (200, 201, 400, 401, 403, 404, 409, 500)
- [ ] **Validation**: Check required fields and types
- [ ] **Authentication**: Check if user is logged in (if required)
- [ ] **Authorization**: Check if user has permission
- [ ] **Conflict Check**: Check for duplicates/conflicts
- [ ] **Database**: Call appropriate service
- [ ] **Error Handling**: Catch and handle all errors
- [ ] **Response Format**: Use standard JSON format
- [ ] **Documentation**: Add JSDoc comment with example
- [ ] **Testing**: Test success and error cases

---

## 🚀 Best Practices Summary

1. **Always return standard format** - `{ success, data, error, message }`
2. **Use correct HTTP status codes** - Don't return 200 for everything
3. **Validate all input** - Don't trust client data
4. **Check authorization** - Not just authentication
5. **Use service layer** - Keep controllers lean
6. **Handle errors properly** - Don't let exceptions leak
7. **Log important events** - For debugging and monitoring
8. **Use TypeScript** - Catch errors at compile time
9. **Document endpoints** - JSDoc or OpenAPI
10. **Test thoroughly** - Unit and integration tests

