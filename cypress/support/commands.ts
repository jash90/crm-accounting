/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      mockSupabaseAuth(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

Cypress.Commands.add('mockSupabaseAuth', () => {
  cy.window().its('localStorage').invoke('setItem', 'sb-project-auth-token', JSON.stringify({
    access_token: 'mock-token',
    user: {
      id: '123',
      email: 'test@example.com',
      role: 'OWNER'
    }
  }));
});