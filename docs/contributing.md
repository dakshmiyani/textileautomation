# Textile ERP — Developer & Contribution Guide

This guide describes how to add a completely new module to the Textile ERP without breaking existing features.

---

## 1. Adding a New ERP Backend Module

Every new business domain must follow the standardized modular structure:

```text
server/src/modules/<module_name>/
│
├── <module_name>.controller.js
├── <module_name>.service.js
├── <module_name>.repository.js
├── <module_name>.routes.js
├── <module_name>.validation.js
└── <module_name>.constants.js
```

### Step 1: Create Knex Database Migration
```bash
npx knex migrate:make create_<module_name>_table --knexfile knexfile.js
```
Define columns, indexes, foreign keys, and timestamps in `server/src/database/migrations/`.

### Step 2: Write Repository (`<module_name>.repository.js`)
Only place raw Knex queries here:
```javascript
const { knex } = require('../../database/knex');

class OrderRepository {
  async findById(id) {
    return knex('orders').where({ id }).first();
  }
}
module.exports = new OrderRepository();
```

### Step 3: Write Service (`<module_name>.service.js`)
Place business logic, audit logging, and events here:
```javascript
const orderRepository = require('./order.repository');
const auditService = require('../audit/audit.service');
const { eventBus, EVENTS } = require('../../utils/eventBus');

class OrderService {
  async createOrder(data, context) {
    const order = await orderRepository.create(data);
    await auditService.log({ ... });
    eventBus.emitEvent('order.created', { order });
    return order;
  }
}
module.exports = new OrderService();
```

### Step 4: Write Controller (`<module_name>.controller.js`)
Keep controllers thin:
```javascript
const orderService = require('./order.service');

class OrderController {
  async create(req, res, next) {
    try {
      const order = await orderService.createOrder(req.body, { userId: req.user.id });
      res.status(201).json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  }
}
module.exports = new OrderController();
```

### Step 5: Mount in Router (`server/src/routes/index.js`)
```javascript
const orderRoutes = require('../modules/orders/orders.routes');
router.use('/orders', orderRoutes);
```

---

## 2. Adding a New Frontend Feature

1. Place API calls and queries in `client/src/features/<feature_name>/api.js` and `hooks.js`.
2. Add components in `client/src/features/<feature_name>/components/`.
3. Add page in `client/src/pages/<feature_name>/`.
4. Register the route in `client/src/app/router.jsx`.
5. Add navigation link to `NAV_ITEMS` in `client/src/layouts/DashboardLayout.jsx` with required permission.
