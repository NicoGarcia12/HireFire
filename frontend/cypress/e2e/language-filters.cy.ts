describe('HireFire — filtros de idioma', () => {
  beforeEach(() => {
    cy.intercept('POST', 'http://localhost:3000/api/profile', { fixture: 'profile.json' }).as('saveProfile');
    cy.intercept('GET', 'http://localhost:3000/api/saved-searches*', { body: [] });
    cy.intercept('GET', 'http://localhost:3000/api/history*', { body: [] });

    cy.visit('/');
  });

  it('muestra el selector de idioma con Inglés y Portugués disponibles', () => {
    cy.get('[data-testid="language-select"]').should('exist');
  });

  it('agrega un idioma y aparece en la lista de permitidos', () => {
    cy.get('[data-testid="add-language-button"]').click();
    cy.get('[data-testid="allowed-language-english"]').should('be.visible');
  });

  it('el botón de quitar idioma elimina el idioma de la lista', () => {
    cy.get('[data-testid="add-language-button"]').click();
    cy.get('[data-testid="allowed-language-english"]').should('be.visible');

    cy.get('[data-testid="remove-language-english"]').click();
    cy.get('[data-testid="allowed-language-english"]').should('not.exist');
  });

  it('oculta el selector cuando no quedan idiomas disponibles', () => {
    cy.get('[data-testid="add-language-button"]').click();

    cy.get('[data-testid="language-select"]').should('exist');
    cy.get('[data-testid="add-language-button"]').click();

    cy.get('[data-testid="language-select"]').should('not.exist');
  });

  it('incluye los idiomas permitidos en el payload de búsqueda', () => {
    cy.intercept('POST', 'http://localhost:3000/api/search', (req) => {
      expect(req.body.allowedLanguages).to.have.length(1);
      expect(req.body.allowedLanguages[0].language).to.eq('english');
      req.reply({ body: { count: 0, results: [] } });
    }).as('searchWithLanguage');

    cy.get('[data-testid="profile-headline"]').type('Dev');
    cy.get('[data-testid="exp-title-0"]').type('Dev');
    cy.get('[data-testid="exp-company-0"]').type('Co');
    cy.get('[data-testid="save-profile-btn"]').click();
    cy.wait('@saveProfile');

    cy.get('[data-testid="add-language-button"]').click();

    cy.get('[data-testid="search-keywords"]').type('angular');
    cy.get('[data-testid="search-submit"]').click();
    cy.wait('@searchWithLanguage');
  });
});
