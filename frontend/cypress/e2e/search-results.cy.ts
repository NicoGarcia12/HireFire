describe('HireFire — resultados de búsqueda', () => {
  beforeEach(() => {
    cy.intercept('POST', 'http://localhost:3000/api/profile', { fixture: 'profile.json' }).as('saveProfile');
    cy.intercept('GET', 'http://localhost:3000/api/saved-searches*', { body: [] }).as('getSaved');
    cy.intercept('GET', 'http://localhost:3000/api/history*', { body: [] }).as('getHistory');
    cy.intercept('POST', 'http://localhost:3000/api/search', { fixture: 'search-results.json' }).as('search');

    cy.visit('/');

    cy.get('[data-testid="profile-headline"]').type('Frontend Developer');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Acme');
    cy.get('[data-testid="save-profile-btn"]').click();
    cy.wait('@saveProfile');

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@search');
  });

  it('muestra el score de cada resultado', () => {
    cy.contains('87').should('be.visible');
    cy.contains('52').should('be.visible');
  });

  it('muestra las razones del match', () => {
    cy.contains('Dominio de Angular').should('be.visible');
  });

  it('muestra los gaps', () => {
    cy.contains('Falta experiencia con NX').should('be.visible');
  });

  it('el botón exportar CSV está disponible', () => {
    cy.contains('Exportar CSV').should('be.visible');
  });

  it('el slider de score mínimo filtra resultados', () => {
    cy.get('[data-testid="results-section"]').should('be.visible');
    cy.contains('2').should('be.visible');
  });
});

describe('HireFire — estado vacío', () => {
  beforeEach(() => {
    cy.intercept('POST', 'http://localhost:3000/api/profile', { fixture: 'profile.json' }).as('saveProfile');
    cy.intercept('GET', 'http://localhost:3000/api/saved-searches*', { body: [] });
    cy.intercept('GET', 'http://localhost:3000/api/history*', { body: [] });
    cy.intercept('POST', 'http://localhost:3000/api/search', { body: { count: 0, results: [] } }).as('emptySearch');

    cy.visit('/');

    cy.get('[data-testid="profile-headline"]').type('Frontend Developer');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Acme');
    cy.get('[data-testid="save-profile-btn"]').click();
    cy.wait('@saveProfile');
  });

  it('muestra el estado vacío cuando la búsqueda no retorna resultados', () => {
    cy.get('[data-testid="search-keywords"]').type('xyzxyz');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@emptySearch');

    cy.get('[data-testid="empty-state"]').should('be.visible');
    cy.contains('Sin resultados').should('be.visible');
  });
});
