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
    cy.fillProfile();

    cy.contains('Guardado ✓').should('be.visible');
    cy.get('[data-testid="search-submit"]').should('not.be.disabled');
  });

  it('ejecuta una búsqueda y muestra los resultados', () => {
    cy.fillProfile();

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@search');

    cy.get('[data-testid="results-section"]').should('be.visible');
    cy.contains('Senior Angular Developer').should('be.visible');
    cy.contains('Frontend Engineer').should('be.visible');
  });

  it('el stepper avanza al guardar perfil y al buscar', () => {
    cy.get('.hf-stepper__step').first().should('have.class', 'hf-stepper__step--active');

    cy.fillProfile('Dev');

    cy.get('.hf-stepper__step').first().should('have.class', 'hf-stepper__step--done');

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@search');

    cy.get('.hf-stepper__step').last().should('have.class', 'hf-stepper__step--done');
  });
});
