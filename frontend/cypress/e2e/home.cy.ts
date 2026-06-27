describe('HireFire — flujo principal', () => {
  beforeEach(() => {
    cy.intercept('POST', 'http://localhost:3000/api/profile', { fixture: 'profile.json' }).as('saveProfile');
    cy.intercept('GET', 'http://localhost:3000/api/saved-searches*', { body: [] }).as('getSaved');
    cy.intercept('GET', 'http://localhost:3000/api/history*', { body: [] }).as('getHistory');
    cy.intercept('POST', 'http://localhost:3000/api/search', { fixture: 'search-results.json' }).as('search');

    cy.visit('/');
  });

  it('muestra el título HireFire en la página', () => {
    cy.contains('h1', 'HireFire').should('be.visible');
  });

  it('el formulario de búsqueda está deshabilitado sin perfil guardado', () => {
    cy.get('[data-testid="search-submit"]').should('be.disabled');
  });

  it('guarda el perfil y habilita la búsqueda', () => {
    cy.get('[data-testid="profile-headline"]').type('Frontend Developer');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Acme');
    cy.get('[data-testid="save-profile-btn"]').click();

    cy.wait('@saveProfile');
    cy.wait('@getSaved');
    cy.wait('@getHistory');

    cy.contains('Guardado ✓').should('be.visible');
    cy.get('[data-testid="search-submit"]').should('not.be.disabled');
  });

  it('ejecuta una búsqueda y muestra los resultados', () => {
    cy.get('[data-testid="profile-headline"]').type('Frontend Developer');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Acme');
    cy.get('[data-testid="save-profile-btn"]').click();
    cy.wait('@saveProfile');

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@search');

    cy.get('[data-testid="results-section"]').should('be.visible');
    cy.contains('Senior Angular Developer').should('be.visible');
    cy.contains('Frontend Engineer').should('be.visible');
  });

  it('el stepper avanza al guardar perfil y al buscar', () => {
    cy.get('.hf-stepper__step').first().should('have.class', 'hf-stepper__step--active');

    cy.get('[data-testid="profile-headline"]').type('Dev');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Co');
    cy.get('[data-testid="save-profile-btn"]').click();
    cy.wait('@saveProfile');

    cy.get('.hf-stepper__step').first().should('have.class', 'hf-stepper__step--done');

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@search');

    cy.get('.hf-stepper__step').last().should('have.class', 'hf-stepper__step--done');
  });
});
