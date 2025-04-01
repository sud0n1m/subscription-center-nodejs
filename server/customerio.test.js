const axios = require('axios');
const CustomerIOClient = require('./customerio');

// Mock the axios library
jest.mock('axios');

// Mock environment variables
process.env.CUSTOMERIO_APP_API_KEY = 'test_app_key';
process.env.CUSTOMERIO_CDP_API_KEY = 'test_cdp_key';
process.env.CUSTOMERIO_REGION = 'us';

describe('CustomerIOClient', () => {
  let client;

  beforeEach(() => {
    // Reset mocks before each test
    axios.get.mockReset();
    axios.post.mockReset();
    // Create a new client instance for each test AFTER env vars are set
    client = new CustomerIOClient();
  });

  describe('getSubscriptionPreferences', () => {
    it('should call the App API with correct parameters and return formatted data', async () => {
      const customerId = 'test_customer_123';
      const mockApiResponse = {
        data: {
          customer: {
            id: customerId,
            identifiers: { email: 'test@example.com' },
            unsubscribed: false,
            header: { title: 'Test Title', subtitle: 'Test Subtitle' },
            topics: [
              { id: 1, name: 'Topic 1', description: 'Desc 1', subscribed: true },
              { id: 2, name: 'Topic 2', description: 'Desc 2', subscribed: false },
            ],
          },
        },
      };
      axios.get.mockResolvedValue(mockApiResponse);

      const result = await client.getSubscriptionPreferences(customerId);

      expect(axios.get).toHaveBeenCalledWith(
        `https://api.customer.io/v1/customers/${customerId}/subscription_preferences`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CUSTOMERIO_APP_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result).toEqual({
        customer: {
          id: customerId,
          email: 'test@example.com',
          globallyUnsubscribed: false,
        },
        preferences: {
          header: {
            title: 'Test Title',
            subtitle: 'Test Subtitle',
          },
          topics: [
            { id: 1, name: 'Topic 1', description: 'Desc 1', subscribed: true },
            { id: 2, name: 'Topic 2', description: 'Desc 2', subscribed: false },
          ],
        },
      });
    });

    it('should throw an error if the API call fails', async () => {
      const customerId = 'test_customer_fail';
      const apiError = new Error('API Error');
      axios.get.mockRejectedValue(apiError);

      await expect(client.getSubscriptionPreferences(customerId)).rejects.toThrow('API Error');
    });
  });

  describe('updateSubscriptionPreferences', () => {
    it('should call the CDP API with correct parameters and payload', async () => {
      const customerId = 'test_customer_456';
      const mockPreferences = {
        topics: [
          { id: 1, subscribed: false },
          { id: 3, subscribed: true },
        ],
      };
      const expectedPayload = {
        userId: customerId,
        traits: {
          cio_subscription_preferences: {
            topics: {
              topic_1: false,
              topic_3: true,
            },
          },
        },
      };
      axios.post.mockResolvedValue({ data: { success: true } }); // Mock successful response

      await client.updateSubscriptionPreferences(customerId, mockPreferences);

      expect(axios.post).toHaveBeenCalledWith(
        'https://cdp.customer.io/v1/identify',
        expectedPayload,
        {
          auth: {
            username: process.env.CUSTOMERIO_CDP_API_KEY,
            password: '',
          },
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    });

    it('should throw an error if the API call fails', async () => {
      const customerId = 'test_customer_fail_update';
      const mockPreferences = { topics: [] }; // Empty topics for simplicity
      const apiError = new Error('CDP API Error');
      axios.post.mockRejectedValue(apiError);

      await expect(client.updateSubscriptionPreferences(customerId, mockPreferences)).rejects.toThrow('CDP API Error');
    });
  });
}); 