describe('Registration Flow', () => {
  beforeEach(() => {
    cy.visit('/register');
  });

  it('should display registration form', () => {
    cy.contains('Create your company account');
    cy.get('input[name="companyName"]').should('be.visible');
    cy.get('input[name="email"]').should('be.visible');
    cy.get('input[name="password"]').should('be.visible');
    cy.get('input[name="confirmPassword"]').should('be.visible');
  });

  it('should validate form inputs', () => {
    // Test empty form submission
    cy.get('button[type="submit"]').click();
    cy.get('input[name="companyName"]:invalid').should('be.visible');
    cy.get('input[name="email"]:invalid').should('be.visible');
    
    // Test password mismatch
    cy.get('input[name="companyName"]').type('Test Company');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('different');
    
    cy.get('button[type="submit"]').click();
    // Should show toast error for password mismatch
  });

  it('should show password requirements', () => {
    cy.contains('Must be at least 8 characters long');
  });

  it('should navigate back to login', () => {
    cy.contains('sign in to existing account').click();
    cy.url().should('include', '/login');
  });

  it('should toggle password visibility', () => {
    cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    cy.get('input[name="password"]').siblings('button').click();
    cy.get('input[name="password"]').should('have.attr', 'type', 'text');
  });
});