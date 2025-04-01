require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const CustomerIOClient = require('./customerio');

// Instantiate the client after dotenv has loaded the environment variables
const customerio = new CustomerIOClient();

const app = express();
const port = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to serve static files (HTML, CSS, JS) from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// --- API Routes ---

// GET route to fetch preferences for a customer
app.get('/preferences/:base64_customer_id/data', async (req, res) => {
  const { base64_customer_id } = req.params;
  let customer_id;

  try {
    // Validate base64 format before decoding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64_customer_id)) {
      throw new Error('Invalid base64 format');
    }

    // Decode the base64 ID
    const buffer = Buffer.from(base64_customer_id, 'base64');
    customer_id = buffer.toString('utf-8');

    if (!customer_id) {
        // This might catch cases where decoding results in an empty string
        throw new Error('Invalid ID (empty after decoding)');
    }

    console.log(`Fetching preferences for customer_id: ${customer_id}`);

    // Fetch preferences from Customer.io
    const preferences = await customerio.getSubscriptionPreferences(customer_id);
    
    res.json(preferences);

  } catch (error) {
    console.error("Error:", error.message);
    
    // Handle specific errors
    if (error.message === 'Invalid base64 format') {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === 'Invalid ID (empty after decoding)') {
      return res.status(400).json({ error: error.message });
    }
    
    // Handle Customer.io API errors
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Customer not found' });
    } else if (error.response?.status === 401) {
      return res.status(401).json({ error: 'Unauthorized - check your API key' });
    } 
    
    // Default to 500 for other errors
    res.status(500).json({ 
      // Log detailed error server-side (already done by console.error above)
      error: 'An unexpected error occurred while fetching preferences.' 
    });
  }
});

// POST route to update preferences for a customer
app.post('/preferences/:base64_customer_id/data', async (req, res) => {
  const { base64_customer_id } = req.params;
  const preferences = req.body;
  let customer_id;

  try {
    // Validate base64 format before decoding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(base64_customer_id)) {
      throw new Error('Invalid base64 format');
    }

    // Decode the base64 ID
    const buffer = Buffer.from(base64_customer_id, 'base64');
    customer_id = buffer.toString('utf-8');

    if (!customer_id) {
      // This might catch cases where decoding results in an empty string
      throw new Error('Invalid ID (empty after decoding)');
    }

    // --- Enhanced Payload Validation ---
    if (!preferences || 
        !Array.isArray(preferences.topics) || 
        !preferences.topics.every(
            topic => typeof topic === 'object' && 
                     topic !== null && 
                     typeof topic.id === 'number' && 
                     typeof topic.subscribed === 'boolean'
        )
       ) {
      throw new Error('Invalid preferences payload format');
    }
    // --- End Enhanced Payload Validation ---

    console.log(`Updating preferences for customer_id: ${customer_id}`);

    // Call Customer.io API to update preferences
    const result = await customerio.updateSubscriptionPreferences(customer_id, preferences);

    res.json({ 
      success: true,
      message: `Preferences updated successfully for customer ${customer_id}` 
    });

  } catch (error) {
    console.error("Error updating preferences:", error); // Log the full error
    
    // Handle specific validation errors with 400
    if (error.message === 'Invalid base64 format' || 
        error.message === 'Invalid ID (empty after decoding)' ||
        error.message === 'Invalid preferences payload format') {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    // Default to 500 for other errors (including Customer.io API errors)
    res.status(500).json({ 
      success: false,
      // Log detailed error server-side (already done by console.error above)
      error: 'An unexpected error occurred while updating preferences.' 
    });
  }
});

// --- Frontend Route ---
// Serve index.html for /preferences/* routes
app.get('/preferences/:base64_customer_id', (req, res) => {
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = app; // Export the app for testing 