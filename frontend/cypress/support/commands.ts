/// <reference types="cypress" />

function fillMaterialInput(testId: string, value: string): void {
  cy.get(`[data-testid="${testId}"]`).closest('mat-form-field').click();
  cy.get(`[data-testid="${testId}"]`).clear().type(value);
}

Cypress.Commands.add('fillProfile', (headline = 'Frontend Developer') => {
  fillMaterialInput('profile-headline', headline);
  fillMaterialInput('exp-title-0', 'Dev');
  fillMaterialInput('exp-company-0', 'Acme');
  cy.get('[data-testid="save-profile-btn"]').click();
  cy.wait('@saveProfile');
  cy.wait('@getSaved');
  cy.wait('@getHistory');
});

declare global {
  namespace Cypress {
    interface Chainable {
      fillProfile(headline?: string): Chainable<void>;
    }
  }
}
