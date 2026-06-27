/// <reference types="cypress" />

Cypress.Commands.add('fillProfile', (headline = 'Frontend Developer') => {
  cy.get('[data-testid="profile-headline"]').clear().type(headline);
  cy.get('[data-testid="exp-title-0"]').clear().type('Dev');
  cy.get('[data-testid="exp-company-0"]').clear().type('Acme');
  cy.get('[data-testid="save-profile-btn"]').click();
  cy.wait('@saveProfile');
});

declare global {
  namespace Cypress {
    interface Chainable {
      fillProfile(headline?: string): Chainable<void>;
    }
  }
}
