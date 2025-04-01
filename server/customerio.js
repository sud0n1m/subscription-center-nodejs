const axios = require('axios');

class CustomerIOClient {
    constructor() {
        this.appApiKey = process.env.CUSTOMERIO_APP_API_KEY;
        this.cdpApiKey = process.env.CUSTOMERIO_CDP_API_KEY;
        this.region = process.env.CUSTOMERIO_REGION || 'us';

        this.baseURL = this.region === 'eu' 
            ? 'https://api-eu.customer.io/v1'
            : 'https://api.customer.io/v1';
        this.cdpURL = this.region === 'eu'
            ? 'https://cdp-eu.customer.io/v1'
            : 'https://cdp.customer.io/v1';

        // Validate required environment variables
        if (!this.appApiKey) {
            throw new Error('CUSTOMERIO_APP_API_KEY is required');
        }
        if (!this.cdpApiKey) {
            throw new Error('CUSTOMERIO_CDP_API_KEY is required');
        }
    }

    async getSubscriptionPreferences(customerId) {
        try {
            const response = await axios.get(
                `${this.baseURL}/customers/${customerId}/subscription_preferences`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.appApiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Parse and structure the response data
            const { customer } = response.data;
            return {
                customer: {
                    id: customer.id,
                    email: customer.identifiers.email,
                    globallyUnsubscribed: customer.unsubscribed
                },
                preferences: {
                    header: {
                        title: customer.header.title || 'Email Preferences',
                        subtitle: customer.header.subtitle || 'Manage your email subscription preferences below.'
                    },
                    topics: customer.topics.map(topic => ({
                        id: topic.id,
                        name: topic.name,
                        description: topic.description,
                        subscribed: topic.subscribed
                    }))
                }
            };
        } catch (error) {
            console.error('Error fetching preferences:', error.response?.data || error.message);
            throw error;
        }
    }

    async updateSubscriptionPreferences(customerId, preferences) {
        try {
            // Convert topics array to object format
            const topicsObject = preferences.topics.reduce((acc, topic) => {
                acc[`topic_${topic.id}`] = topic.subscribed;
                return acc;
            }, {});

            // Prepare the request payload
            const requestPayload = {
                userId: customerId,
                traits: {
                    cio_subscription_preferences: {
                        topics: topicsObject
                    }
                }
            };

            console.log('Updating preferences for customer:', customerId);

            const response = await axios.post(
                `${this.cdpURL}/identify`,
                requestPayload,
                {
                    auth: {
                        username: this.cdpApiKey,
                        password: ''
                    },
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error updating preferences:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = CustomerIOClient; 