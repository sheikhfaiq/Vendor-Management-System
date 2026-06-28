import request from 'supertest';
import app from '../src/app';
import prisma from '../src/config/prisma';

describe('Auth & Vendor Profile Integration Tests', () => {
  const testEmail = `vendor_${Date.now()}@test.com`;
  const testPassword = 'Password123!';
  let accessToken = '';

  afterAll(async () => {
    try {
      await prisma.user.delete({
        where: { email: testEmail },
      });
    } catch (e) {
      // Suppress deletion errors if signup failed
    }
    await prisma.$disconnect();
  });

  it('should sign up a new vendor', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: testPassword,
        vendorType: 'COMPANY',
        companyName: 'Test Tech Corp',
        businessCategory: 'Contractor',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.vendorProfile).toBeDefined();
    expect(res.body.data.vendorProfile.companyName).toBe('Test Tech Corp');
  });

  it('should fail signup with duplicate email', async () => {
    const res = await request(app)
      .post('/auth/signup')
      .send({
        email: testEmail,
        password: testPassword,
        vendorType: 'INDIVIDUAL',
        companyName: 'Bob Dev',
        businessCategory: 'Labour',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should login the vendor', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();

    accessToken = res.body.data.accessToken;
  });

  it('should fetch the logged in vendor profile', async () => {
    const res = await request(app)
      .get('/vendors/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.companyName).toBe('Test Tech Corp');
  });

  it('should retrieve profile completion percentage', async () => {
    const res = await request(app)
      .get('/vendors/profile/completion')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.completion).toBeGreaterThan(0);
  });
});
