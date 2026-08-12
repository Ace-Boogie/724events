/// <reference types="cypress" />

describe("Flow de prise de contact", () => {
    beforeEach(() => {
        // Un test e2e part du lancement de l'application : la page d'accueil.
        cy.visit("/");
        // Tous les sélecteurs sont scopés au formulaire de contact : la page
        // contient d'autres inputs (radios du carrousel, filtre catégories)
        // qu'un sélecteur générique récupérerait par erreur.
        cy.get('[data-testid="contact-form"]').as("form");
    });

    it("affiche le formulaire avec tous ses champs", () => {
        cy.get("@form").find('input[name="nom"]').should("be.visible");
        cy.get("@form").find('input[name="prenom"]').should("be.visible");
        cy.get("@form").find('input[name="email"]').should("be.visible");
        cy.get("@form").find('textarea[name="message"]').should("be.visible");
        cy.get("@form")
            .find('[data-testid="button-test-id"]')
            .should("have.value", "Envoyer")
            .and("not.be.disabled");
    });

    it("permet de remplir le formulaire, de l'envoyer et affiche la confirmation", () => {
        cy.get("@form").find('input[name="nom"]').type("Dupont");
        cy.get("@form").find('input[name="prenom"]').type("Jean");
        cy.get("@form").find('input[name="email"]').type("jean.dupont@example.com");
        cy.get("@form")
            .find('textarea[name="message"]')
            .type("Bonjour, je souhaite organiser une conférence en septembre.");

        // Le Select est un composant custom : on ouvre la liste, puis on choisit.
        cy.get("@form").find('[data-testid="collapse-button-testid"]').click();
        // On cible le <li> qui contient une option (donc un input radio),
        // pas le <li> du titre qui peut porter le même texte.
        cy.get("@form").find("li").contains("Entreprise").click();
        cy.get("@form")
            .find('input[type="hidden"]')
            .should("have.value", "Entreprise");

        // Les valeurs saisies sont bien celles attendues
        // (le `text-transform: capitalize` du CSS n'affecte que l'affichage).
        cy.get("@form")
            .find('input[name="email"]')
            .should("have.value", "jean.dupont@example.com");

        cy.get("@form").find('[data-testid="button-test-id"]').click();

        // État final : la modale de confirmation s'affiche
        cy.contains("Message envoyé !").should("be.visible");
        cy.contains(
            "Merci pour votre message nous tâcherons de vous répondre dans les plus brefs délais"
        ).should("be.visible");

        // Le bouton redevient utilisable après l'envoi
        cy.get("@form")
            .find('[data-testid="button-test-id"]')
            .should("have.value", "Envoyer")
            .and("not.be.disabled");
    });

    it("permet de fermer la modale de confirmation", () => {
        cy.get("@form").find('input[name="nom"]').type("Dupont");
        cy.get("@form").find('input[name="prenom"]').type("Jean");
        cy.get("@form").find('input[name="email"]').type("jean.dupont@example.com");
        cy.get("@form").find('textarea[name="message"]').type("Test de fermeture");
        cy.get("@form").find('[data-testid="button-test-id"]').click();

        cy.contains("Message envoyé !").should("be.visible");
        cy.get(".modal").find('[data-testid="close-modal"]').click();
        cy.contains("Message envoyé !").should("not.exist");
    });
});