const express = require('express');
const path = require('path');
const customerio = require('./customerio');

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Handle GET requests to fetch preferences
app.get('/preferences/:customerId/data', async (req, res) => {
    try {
        const { customerId } = req.params;
        console.log('\n=== Server: Fetching preferences ===');
        console.log('Customer ID:', customerId);

        const preferences = await customerio.getSubscriptionPreferences(customerId);
        console.log('Fetched preferences:', JSON.stringify(preferences, null, 2));

        res.json(preferences);
    } catch (error) {
        console.error('\n=== Server: Error fetching preferences ===');
        console.error('Error details:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to fetch preferences' 
        });
    }
});

// Handle POST requests to update preferences
app.post('/preferences/:customerId/data', async (req, res) => {
    try {
        const { customerId } = req.params;
        const preferences = req.body;

        console.log('\n=== Server: Received preferences update request ===');
        console.log('Customer ID:', customerId);
        console.log('Preferences:', JSON.stringify(preferences, null, 2));
        console.log('Request headers:', req.headers);

        // Validate the request
        if (!preferences || !preferences.topics) {
            throw new Error('Invalid preferences format');
        }

        // Update preferences using Customer.io Track API
        console.log('\n=== Server: Calling Customer.io API ===');
        console.log('Making request to Customer.io...');
        
        // Add try-catch specifically for the Customer.io API call
        try {
            console.log('Calling updateSubscriptionPreferences...');
            console.log('customerio object:', customerio ? 'exists' : 'missing');
            console.log('updateSubscriptionPreferences method:', customerio?.updateSubscriptionPreferences ? 'exists' : 'missing');
            
            const result = await customerio.updateSubscriptionPreferences(customerId, preferences);
            console.log('Customer.io API result:', result);

            // Fetch updated preferences to verify
            console.log('\n=== Server: Verifying updated preferences ===');
            const updatedPreferences = await customerio.getSubscriptionPreferences(customerId);
            console.log('Updated preferences:', JSON.stringify(updatedPreferences, null, 2));
        } catch (apiError) {
            console.error('Error in Customer.io API call:', apiError);
            throw apiError;
        }

        // Return success response
        console.log('\n=== Server: Sending success response ===');
        res.json({ 
            success: true,
            message: `Preferences updated successfully for customer ${customerId}`
        });
    } catch (error) {
        console.error('\n=== Server: Error in POST /preferences/:customerId/data ===');
        console.error('Error details:', error.message);
        if (error.response) {
            console.error('Error response status:', error.response.status);
            console.error('Error response data:', error.response.data);
        }
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Failed to update preferences' 
        });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 