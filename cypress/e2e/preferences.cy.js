describe('Preferences Page', () => {
  const customerId = '1';
  const base64CustomerId = btoa(customerId); // Simulate base64 encoding
  const preferencesUrl = `/preferences/${base64CustomerId}`;
  const apiUrl = `/preferences/${base64CustomerId}/data`;

  beforeEach(() => {
    // Intercept the initial GET request to fetch preferences
    // and provide mock data.
    cy.intercept('GET', apiUrl, {
      statusCode: 200,
      body: {
        customer: {
          id: customerId,
          email: 'test@example.com',
          globallyUnsubscribed: false,
        },
        preferences: {
          header: {
            title: 'Test Email Preferences',
            subtitle: 'Manage your test preferences below.',
          },
          topics: [
            { id: 1, name: 'Test Topic 1', description: 'Desc 1', subscribed: true },
            { id: 2, name: 'Test Topic 2', description: '', subscribed: false }, // No description
            { id: 3, name: 'Test Topic 3', description: 'Desc 3', subscribed: true },
          ],
        },
      },
    }).as('getPreferences'); // Alias the intercept
  });

  it('should load the preferences page correctly', () => {
    cy.visit(preferencesUrl);

    // Wait for the API call to complete
    cy.wait('@getPreferences');

    // Check header content
    cy.get('#title').should('contain.text', 'Test Email Preferences');
    cy.get('#subtitle').should('contain.text', 'Manage your test preferences below.');

    // Check if topics are rendered
    cy.get('#topics .topic-item').should('have.length', 3);

    // Check specific topic content and state
    cy.get('.topic-item').eq(0).find('.topic-name').should('contain.text', 'Test Topic 1');
    cy.get('.topic-item').eq(0).find('.topic-description').should('contain.text', 'Desc 1');
    cy.get('.topic-item').eq(0).find('input[type="checkbox"]').should('be.checked');

    cy.get('.topic-item').eq(1).find('.topic-name').should('contain.text', 'Test Topic 2');
    cy.get('.topic-item').eq(1).find('.topic-description').should('not.exist'); // Check description is absent
    cy.get('.topic-item').eq(1).find('input[type="checkbox"]').should('not.be.checked');

    // Check if buttons exist
    cy.get('#saveButton').should('exist');
    cy.get('#cancelButton').should('exist');
    cy.get('#unsubscribeAllButton').should('exist');
  });

  it('should allow toggling a preference and saving successfully', () => {
    // Intercept the POST request for saving preferences
    cy.intercept('POST', apiUrl, {
      statusCode: 200,
      body: { success: true, message: 'Mock preferences updated successfully' },
    }).as('savePreferences');

    cy.visit(preferencesUrl);
    cy.wait('@getPreferences'); // Wait for initial load

    // Find the second topic item (index 1)
    cy.get('#topics .topic-item').eq(1).as('secondTopic');

    // Verify the initial state of the hidden checkbox
    cy.get('@secondTopic').find('input[type="checkbox"]').should('not.be.checked');

    // Click the visible label element associated with the toggle
    cy.get('@secondTopic').find('label.toggle-container').click();

    // Verify the state of the hidden checkbox changed after clicking the label
    cy.get('@secondTopic').find('input[type="checkbox"]').should('be.checked');

    // Click the Save button
    cy.get('#saveButton').click();

    // Wait for the save API call and verify its request body
    cy.wait('@savePreferences').then((interception) => {
      // Check that the payload sent includes the change we made for topic 2
      // The full payload also includes other topics from the form
      expect(interception.request.body.topics).to.deep.include({ id: 2, subscribed: true });
      // Optionally, check other topics too
      expect(interception.request.body.topics).to.deep.include({ id: 1, subscribed: true }); // Unchanged
      expect(interception.request.body.topics).to.deep.include({ id: 3, subscribed: true }); // Unchanged
    });

    // Check for success toast
    cy.get('#toast-container .toast.success').should('contain.text', 'Preferences saved successfully!');

    // Check that the preferences form is hidden and success screen is shown
    cy.get('#preferences-container').should('not.be.visible');
    cy.get('#success-screen').should('be.visible');
    cy.get('#success-screen h1').should('contain.text', 'Preferences Updated');
  });

  it('should revert changes when Cancel is clicked after toggling', () => {
    cy.visit(preferencesUrl);
    cy.wait('@getPreferences'); // Wait for initial load

    // Find the second topic item (index 1)
    cy.get('#topics .topic-item').eq(1).as('secondTopic');

    // Verify initial state
    cy.get('@secondTopic').find('input[type="checkbox"]').should('not.be.checked');

    // Click the toggle label
    cy.get('@secondTopic').find('label.toggle-container').click();

    // Verify state changed
    cy.get('@secondTopic').find('input[type="checkbox"]').should('be.checked');

    // Stub the window.confirm method to automatically return true
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('Are you sure you want to cancel? Any unsaved changes will be lost.');
      return true; // Automatically click "OK" in the confirm dialog
    });

    // Intercept POST requests to ensure none are made
    cy.intercept('POST', apiUrl).as('saveAttempt');

    // Click the Cancel button
    cy.get('#cancelButton').click();

    // Verify the toggle reverted to its original state
    cy.get('@secondTopic').find('input[type="checkbox"]').should('not.be.checked');

    // Ensure no save request was sent
    // We check this by asserting the intercept was *not* called.
    // Need to wait a very short time to allow potential network calls to initiate.
    cy.wait(100); // Adjust if needed, but should be quick
    cy.get('@saveAttempt.all').should('have.length', 0);
  });

  it('should unsubscribe from all topics successfully', () => {
    // Stub the window.confirm method
    cy.on('window:confirm', (str) => {
      expect(str).to.equal('Are you sure you want to unsubscribe from all emails? This action cannot be undone.');
      return true; // Automatically click "OK"
    });

    // Intercept the POST request for unsubscribing
    cy.intercept('POST', apiUrl, {
      statusCode: 200,
      body: { success: true, message: 'Mock unsubscribed successfully' },
    }).as('unsubscribeAll');

    cy.visit(preferencesUrl);
    cy.wait('@getPreferences'); // Wait for initial load

    // Verify initial state of checkboxes (some are checked)
    cy.get('#topics .topic-item').eq(0).find('input[type="checkbox"]').should('be.checked');
    cy.get('#topics .topic-item').eq(1).find('input[type="checkbox"]').should('not.be.checked');
    cy.get('#topics .topic-item').eq(2).find('input[type="checkbox"]').should('be.checked');

    // Click the Unsubscribe button
    cy.get('#unsubscribeAllButton').click();

    // Wait for the unsubscribe API call and verify its request body
    cy.wait('@unsubscribeAll').then((interception) => {
      expect(interception.request.body).to.deep.equal({
        globallyUnsubscribed: true,
        topics: [
          { id: 1, subscribed: false },
          { id: 2, subscribed: false },
          { id: 3, subscribed: false },
        ]
      });
    });

    // Check for success toast
    cy.get('#toast-container .toast.success').should('contain.text', 'Successfully unsubscribed from all emails.');

    // Check that the preferences form is hidden and success screen is shown
    cy.get('#preferences-container').should('not.be.visible');
    cy.get('#success-screen').should('be.visible');
    cy.get('#success-screen h1').should('contain.text', 'Preferences Updated'); // Success screen title is generic
  });

  // We can add more tests here later for saving, unsubscribing, canceling, etc.
}); 