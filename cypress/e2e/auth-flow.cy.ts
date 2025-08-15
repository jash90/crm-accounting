describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.contains('Sign in to your account');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign in');
  });

  it('should show validation errors for empty form', () => {
    cy.get('button[type="submit"]').click();
    cy.get('input[type="email"]:invalid').should('be.visible');
    cy.get('input[type="password"]:invalid').should('be.visible');
  });

  it('should navigate to register page', () => {
    cy.contains('create a new company account').click();
    cy.url().should('include', '/register');
    cy.contains('Create your company account');
  });

  it('should show demo account information', () => {
    cy.contains('Demo accounts:');
    cy.contains('admin@saas.com');
    cy.contains('owner@company1.com');
    cy.contains('employee@company1.com');
  });

  it('should toggle password visibility', () => {
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button').contains('svg').click(); // Eye icon
    cy.get('input[type="text"]').should('be.visible');
  });
});