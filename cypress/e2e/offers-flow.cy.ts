describe('Offers Flow', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('sb-project-auth-token', JSON.stringify({
        access_token: 'mock-token',
        user: {
          id: '123',
          email: 'owner@test.com',
          role: 'OWNER'
        }
      }));
    });
  });

  it('should complete the full offer flow: create -> send -> accept -> checklist', () => {
    // Step 1: Navigate to offers page
    cy.visit('/offers');
    cy.contains('Create Offer').click();

    // Step 2: Select client
    cy.url().should('include', '/offers/new');
    cy.contains('Choose Client').should('be.visible');
    
    // Mock client selection (assuming clients exist)
    cy.get('[data-testid="client-selector"]').first().click();
    cy.contains('Select Items').click();

    // Step 3: Select price list items
    cy.contains('Select Items').should('be.visible');
    
    // Mock item selection
    cy.get('[data-testid="quantity-plus"]').first().click();
    cy.get('[data-testid="quantity-plus"]').first().click(); // qty = 2
    
    cy.contains('Review Offer').click();

    // Step 4: Review and send offer
    cy.contains('Review Offer').should('be.visible');
    cy.contains('Send Offer').click();

    // Should redirect to offer view page
    cy.url().should('include', '/offers/');
    cy.contains('Offer Details').should('be.visible');
    cy.contains('SENT').should('be.visible');

    // Step 5: Get offer token and simulate acceptance
    cy.get('[data-testid="copy-link"]').click();
    
    // Extract token from clipboard or URL
    cy.window().then((win) => {
      return win.navigator.clipboard.readText();
    }).then((clipboardText) => {
      const tokenMatch = clipboardText.match(/\/offer\/([^\/]+)$/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        
        // Visit public acceptance page
        cy.visit(`/offer/${token}`);
        
        // Step 6: Accept offer
        cy.contains('You have received an offer!').should('be.visible');
        cy.contains('Accept Offer').click();
        
        // Should show acceptance confirmation
        cy.contains('Offer Accepted!').should('be.visible');
        
        // Step 7: Verify checklist was created (back to admin view)
        cy.visit('/offers');
        cy.get('[data-testid="offers-table"] tr').first().click();
        
        // Check if offer is now ACCEPTED
        cy.contains('ACCEPTED').should('be.visible');
        
        // Navigate to client checklist
        cy.visit('/clients'); // Assuming we can get to client details
        cy.get('[data-testid="client-row"]').first().click();
        cy.contains('Checklists').click();
        
        // Verify default checklist items were created
        cy.contains('Collect documents').should('be.visible');
        cy.contains('Schedule kick-off call').should('be.visible');
        cy.contains('Set up shared drive').should('be.visible');
      }
    });
  });

  it('should handle invalid offer tokens', () => {
    cy.visit('/offer/invalid-token-123');
    
    cy.contains('Offer Not Available').should('be.visible');
    cy.contains('This offer link may have expired').should('be.visible');
  });

  it('should show offer statistics correctly', () => {
    cy.visit('/offers');
    
    // Check statistics cards
    cy.get('[data-testid="total-offers"]').should('be.visible');
    cy.get('[data-testid="sent-offers"]').should('be.visible');
    cy.get('[data-testid="accepted-offers"]').should('be.visible');
    cy.get('[data-testid="total-value"]').should('be.visible');
  });

  it('should filter offers by status', () => {
    cy.visit('/offers');
    
    // Test status filter
    cy.get('[data-testid="status-filter"]').select('SENT');
    cy.get('[data-testid="offers-table"] tr').should('contain', 'SENT');
    
    cy.get('[data-testid="status-filter"]').select('ACCEPTED');
    cy.get('[data-testid="offers-table"] tr').should('contain', 'ACCEPTED');
  });

  it('should search offers by client name', () => {
    cy.visit('/offers');
    
    cy.get('[data-testid="search-input"]').type('Test Client');
    cy.get('[data-testid="offers-table"] tr').should('contain', 'Test Client');
    
    // Clear search
    cy.get('[data-testid="search-input"]').clear();
    cy.get('[data-testid="offers-table"] tr').should('have.length.greaterThan', 0);
  });

  it('should manage checklist items', () => {
    // Assuming we have a client with an accepted offer
    cy.visit('/clients/test-client-id/checklists');
    
    // Add new checklist item
    cy.contains('Add Task').click();
    cy.get('[data-testid="task-title"]').type('Custom onboarding task');
    cy.get('[data-testid="task-description"]').type('This is a custom task for testing');
    cy.contains('Add Task').click();
    
    // Verify task was added
    cy.contains('Custom onboarding task').should('be.visible');
    
    // Mark task as complete
    cy.get('[data-testid="task-checkbox"]').first().click();
    cy.contains('completed').should('be.visible');
    
    // Check progress bar updated
    cy.get('[data-testid="progress-bar"]').should('have.attr', 'style').and('contain', 'width');
  });

  it('should handle real-time offer updates', () => {
    cy.visit('/offers');
    
    // Mock a real-time update (this would need to be set up with your test environment)
    cy.window().then((win) => {
      // Simulate a real-time update
      win.dispatchEvent(new CustomEvent('supabase-realtime-offer-update', {
        detail: {
          eventType: 'UPDATE',
          new: {
            id: 'test-offer-id',
            status: 'ACCEPTED'
          }
        }
      }));
    });
    
    // Verify the UI updated
    cy.contains('ACCEPTED').should('be.visible');
  });
});