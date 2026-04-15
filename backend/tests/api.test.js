const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const app = require('../server');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ==================== AUTH TESTS ====================

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('test@example.com');
      expect(res.body.role).toBe('user');
    });

    it('should not register with duplicate email', async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'dup@example.com',
        password: 'password123',
      });
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test User 2',
        email: 'dup@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should not register without required fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@example.com',
      });
      expect(res.status).toBe(400);
    });

    it('should not register with invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'invalid-email',
        password: 'password123',
      });
      expect(res.status).toBe(400);
    });

    it('should not register with short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Test',
        email: 'test@example.com',
        password: '12345',
      });
      expect(res.status).toBe(400);
    });

    it('should register an admin user', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });
      expect(res.status).toBe(201);
      expect(res.body.role).toBe('admin');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });
      expect(res.status).toBe(401);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'noexist@example.com',
        password: 'password123',
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user profile', async () => {
      const reg = await request(app).post('/api/auth/register').send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${reg.body.token}`);
      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@example.com');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });
});

// ==================== TASK TESTS ====================

describe('Task Endpoints', () => {
  let userToken, adminToken, userId, adminId;

  beforeEach(async () => {
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Task User',
      email: 'taskuser@example.com',
      password: 'password123',
    });
    userToken = userRes.body.token;
    userId = userRes.body._id;

    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = adminRes.body.token;
    adminId = adminRes.body._id;
  });

  describe('POST /api/tasks', () => {
    it('should create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Test Task')
        .field('description', 'A test task')
        .field('priority', 'high')
        .field('status', 'pending');
      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Test Task');
      expect(res.body.priority).toBe('high');
    });

    it('should not create task without title', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('description', 'No title');
      expect(res.status).toBe(400);
    });

    it('should not create task without auth', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .field('title', 'Unauthenticated');
      expect(res.status).toBe(401);
    });

    it('should create a task assigned to another user', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Assigned Task')
        .field('assignedTo', adminId);
      expect(res.status).toBe(201);
      expect(res.body.assignedTo._id).toBe(adminId);
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Task 1')
        .field('priority', 'low')
        .field('status', 'pending');
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Task 2')
        .field('priority', 'high')
        .field('status', 'completed');
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Admin Task')
        .field('priority', 'medium');
    });

    it('should get user own tasks', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(2);
    });

    it('should get all tasks for admin', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(3);
    });

    it('should filter by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=completed')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.tasks[0].status).toBe('completed');
    });

    it('should filter by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=high')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/tasks?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.tasks.length).toBe(1);
      expect(res.body.total).toBe(3);
      expect(res.body.pages).toBe(3);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Original Title');
      taskId = res.body._id;
    });

    it('should update own task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Updated Title')
        .field('status', 'in-progress');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Updated Title');
      expect(res.body.status).toBe('in-progress');
    });

    it('should allow admin to update any task', async () => {
      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('title', 'Admin Updated');
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Admin Updated');
    });

    it('should not update non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'Nope');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .field('title', 'To Delete');
      taskId = res.body._id;
    });

    it('should delete own task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/removed/i);
    });

    it('should allow admin to delete any task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });
});

// ==================== USER CRUD TESTS (ADMIN) ====================

describe('User CRUD Endpoints (Admin)', () => {
  let adminToken, userId;

  beforeEach(async () => {
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
    });
    adminToken = adminRes.body.token;

    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Normal User',
      email: 'user@example.com',
      password: 'password123',
    });
    userId = userRes.body._id;
  });

  it('should get all users (admin)', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.users.length).toBe(2);
  });

  it('should get single user (admin)', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('user@example.com');
  });

  it('should update user (admin)', async () => {
    const res = await request(app)
      .put(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
    expect(res.body.role).toBe('admin');
  });

  it('should delete user (admin)', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/removed/i);
  });

  it('should not allow non-admin to access users', async () => {
    const userRes = await request(app).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'password123',
    });
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userRes.body.token}`);
    expect(res.status).toBe(403);
  });
});
