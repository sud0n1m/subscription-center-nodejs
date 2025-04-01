const request = require('supertest');

// Define mocks accessible within the test scope
const mockGetSubscriptionPreferences = jest.fn();
const mockUpdateSubscriptionPreferences = jest.fn();

// Mock the customerio module
jest.mock('./customerio', () => {
  // This is the mock constructor function
  return jest.fn().mockImplementation(() => {
    // This is the mock instance object
    return {
      getSubscriptionPreferences: mockGetSubscriptionPreferences,
      updateSubscriptionPreferences: mockUpdateSubscriptionPreferences,
    };
  });
});

// We will require the app inside beforeAll to ensure the mock is ready
// const app = require('./server');

describe('Preferences API Routes', () => {
  let app; // Declare app here

  beforeAll(() => {
    // Require the app after the mock has been defined and processed by Jest
    app = require('./server');
  });

  beforeEach(() => {
    // Reset mocks before each test
    mockGetSubscriptionPreferences.mockReset();
    mockUpdateSubscriptionPreferences.mockReset();
  });

  describe('GET /preferences/:base64_customer_id/data', () => {
    it('should return 400 for invalid base64 format', async () => {
      const invalidBase64 = 'not-base64!';
      const res = await request(app).get(`/preferences/${invalidBase64}/data`);
      expect(res.statusCode).toEqual(400);
      expect(res.body.error).toMatch(/Invalid base64 format/i);
    });

    // Add a test for empty decoded ID if needed
    // it('should return 400 for empty decoded ID', async () => { ... });

    it('should call getSubscriptionPreferences and return data on success', async () => {
      const customerId = 'customer1';
      const base64Id = Buffer.from(customerId).toString('base64');
      const mockPrefs = { preferences: { topics: [{ id: 1, name: 'Test' }] } };
      mockGetSubscriptionPreferences.mockResolvedValue(mockPrefs);

      const res = await request(app).get(`/preferences/${base64Id}/data`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockPrefs);
      expect(mockGetSubscriptionPreferences).toHaveBeenCalledWith(customerId);
    });

    it('should return 404 if customerio throws a 404 error', async () => {
        const customerId = 'notfound';
        const base64Id = Buffer.from(customerId).toString('base64');
        const error = new Error('Not Found');
        error.response = { status: 404 };
        mockGetSubscriptionPreferences.mockRejectedValue(error);

        const res = await request(app).get(`/preferences/${base64Id}/data`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.error).toEqual('Customer not found');
        expect(mockGetSubscriptionPreferences).toHaveBeenCalledWith(customerId);
    });

     it('should return 500 for other customerio errors', async () => {
        const customerId = 'servererror';
        const base64Id = Buffer.from(customerId).toString('base64');
        const error = new Error('Server Error');
        error.response = { status: 500 };
        mockGetSubscriptionPreferences.mockRejectedValue(error);

        const res = await request(app).get(`/preferences/${base64Id}/data`);

        expect(res.statusCode).toEqual(500);
        expect(res.body.error).toEqual('Error fetching preferences');
        expect(mockGetSubscriptionPreferences).toHaveBeenCalledWith(customerId);
    });

  });

  describe('POST /preferences/:base64_customer_id/data', () => {
    it('should return 400 for invalid base64 format', async () => {
        const invalidBase64 = 'not-base64!';
        const res = await request(app)
          .post(`/preferences/${invalidBase64}/data`)
          .send({ topics: [] });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toMatch(/Invalid base64 format/i);
      });

      it('should return 400 for invalid preferences payload', async () => {
        const customerId = 'customer2';
        const base64Id = Buffer.from(customerId).toString('base64');
        const invalidPayload = { wrong_key: 'no_topics' }; // Missing topics array
        const res = await request(app)
          .post(`/preferences/${base64Id}/data`)
          .send(invalidPayload);
        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/Invalid preferences payload format/i);
        expect(mockUpdateSubscriptionPreferences).not.toHaveBeenCalled(); // Ensure CIO wasn't called
      });

    it('should call updateSubscriptionPreferences and return success', async () => {
      const customerId = 'customer2';
      const base64Id = Buffer.from(customerId).toString('base64');
      const preferencesPayload = { topics: [{ id: 1, subscribed: true }] };
      mockUpdateSubscriptionPreferences.mockResolvedValue({ success: true });

      const res = await request(app)
        .post(`/preferences/${base64Id}/data`)
        .send(preferencesPayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(mockUpdateSubscriptionPreferences).toHaveBeenCalledWith(customerId, preferencesPayload);
    });

    it('should return 500 if updateSubscriptionPreferences fails', async () => {
      const customerId = 'updatefail';
      const base64Id = Buffer.from(customerId).toString('base64');
      const preferencesPayload = { topics: [] };
      const error = new Error('Update Failed');
      mockUpdateSubscriptionPreferences.mockRejectedValue(error);

      const res = await request(app)
        .post(`/preferences/${base64Id}/data`)
        .send(preferencesPayload);

      expect(res.statusCode).toEqual(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toEqual('Update Failed');
      expect(mockUpdateSubscriptionPreferences).toHaveBeenCalledWith(customerId, preferencesPayload);
    });
  });
}); 