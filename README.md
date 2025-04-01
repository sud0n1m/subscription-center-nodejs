# Customer.io Message Preferences Center (Node.js Example)

This project provides a self-hosted message preferences center example for Customer.io, built using Node.js, Express, and Vanilla JavaScript. Users can manage their topic subscriptions via a unique link containing their base64-encoded Customer.io ID.

## Features

*   Fetches subscription preferences (topics, titles) using the Customer.io App API.
*   Allows users to toggle topic subscriptions.
*   Allows users to unsubscribe from all topics.
*   Saves updated preferences using the Customer.io CDP API (`identify` call).
*   Responsive design.
*   Includes unit, integration, and E2E tests.
*   Configured for easy deployment to Vercel.

## Project Structure

```
.
├── cypress/               # E2E tests
├── public/                # Frontend static files (HTML, CSS, JS)
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── server/                # Backend Express server and API client
│   ├── customerio.js
│   ├── customerio.test.js # Unit tests
│   ├── server.js
│   └── server.test.js     # Integration tests
├── .env                   # Local environment variables (ignored by Git)
├── .env.example           # Example environment variables
├── .gitignore
├── cypress.config.js      # Cypress configuration
├── package-lock.json
├── package.json
├── plan.md                # Project development plan
├── README.md              # This file
└── vercel.json            # Vercel deployment configuration
```

## Setup and Running Locally

1.  **Prerequisites:**
    *   Node.js (v16 or later recommended)
    *   npm (usually included with Node.js)
    *   A Customer.io account with App API and CDP API keys.

2.  **Clone the Repository:**
    ```bash
    git clone https://github.com/sud0n1m/subscription-center-nodejs.git
    cd subscription-center-nodejs
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Configure Environment Variables:**
    *   Copy the example environment file:
        ```bash
        cp .env.example .env
        ```
    *   Edit the `.env` file and add your Customer.io API keys and region:
        ```dotenv
        # Customer.io API Keys
        CUSTOMERIO_APP_API_KEY='YOUR_APP_API_KEY_HERE'
        CUSTOMERIO_CDP_API_KEY='YOUR_CDP_API_KEY_HERE'

        # Customer.io Region (us or eu)
        CUSTOMERIO_REGION='us' # or 'eu'

        # Port for the server (optional, defaults to 3000)
        # PORT=3000
        ```
    *   **Important:** Ensure the `.env` file is listed in your `.gitignore` and never commit it to version control.

5.  **Run the Server:**
    ```bash
    npm start
    ```
    The server will start, usually at `http://localhost:3000`.

6.  **Access the Preferences Page:**
    *   You need a valid `customer_id` from your Customer.io workspace.
    *   Base64-encode the `customer_id`. You can use an online tool or Node.js:
        ```javascript
        // Example in Node REPL
        Buffer.from('YOUR_CUSTOMER_ID').toString('base64')
        ```
    *   Open your browser and navigate to `http://localhost:3000/preferences/<YOUR_BASE64_ENCODED_ID>`.

## Testing

The project includes unit, integration, and end-to-end tests.

1.  **Unit & Integration Tests (Jest):**
    *   These tests cover the `CustomerIOClient` class and the Express server routes. They use Jest and mock external dependencies like `axios`.
    *   Run the tests:
        ```bash
        npm test
        ```

2.  **End-to-End Tests (Cypress):**
    *   These tests simulate user interactions in a real browser against the running application (using mocked API responses via `cy.intercept`).
    *   **To run Cypress tests:**
        1.  **Start the server:** Make sure the application is running locally (`npm start`).
        2.  **Open the Cypress test runner:**
            ```bash
            npx cypress open
            ```
        3.  In the Cypress window, choose "E2E Testing".
        4.  Select a browser.
        5.  Click on `preferences.cy.js` to run the tests for the preferences page.

## Deployment (Vercel)

This project is configured for easy deployment to [Vercel](https://vercel.com/).

1.  **Push to GitHub:** Ensure your code (including `vercel.json`) is pushed to a GitHub repository. Make sure your `.env` file is **not** committed.
2.  **Import Project in Vercel:**
    *   Log in to your Vercel account.
    *   Click "Add New..." -> "Project".
    *   Select your GitHub repository (`subscription-center-nodejs`).
    *   Vercel should automatically detect the framework (Node.js) and use the settings from `vercel.json`. Review the settings if needed.
3.  **Configure Environment Variables:**
    *   In your Vercel project settings, navigate to "Settings" -> "Environment Variables".
    *   Add the following variables, ensuring you select the correct environments (Production, Preview, Development):
        *   `CUSTOMERIO_APP_API_KEY` (Your App API Key)
        *   `CUSTOMERIO_CDP_API_KEY` (Your CDP API Key)
        *   `CUSTOMERIO_REGION` (`us` or `eu`)
4.  **Deploy:**
    *   Click the "Deploy" button in Vercel.
    *   Vercel will build and deploy your application. Once complete, it will provide you with a production URL.
5.  **Access Deployed App:** Use the Vercel URL, appending `/preferences/<YOUR_BASE64_ENCODED_ID>` as you did locally.

## License

[MIT](LICENSE) 