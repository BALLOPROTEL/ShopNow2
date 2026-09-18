const { expect } = require('chai');
const {
    findProductById,
    authenticateUser,
    validateRegistration,
    createUser
} = require('../../app/src/business');

describe('Règles métier ShopNow', () => {
    const products = [
        { id: 1, name: 'Laptop Pro' },
        { id: 2, name: 'Casque Audio' }
    ];
    const users = [
        {
            id: 1,
            firstName: 'Demo',
            lastName: 'Student',
            email: 'student@shopnow.test',
            password: 'Password123!'
        }
    ];

    describe('recherche produit', () => {
        it('retourne le produit correspondant à un identifiant numérique', () => {
            expect(findProductById(products, 1)).to.deep.equal(products[0]);
        });

        it('retourne undefined pour un produit inexistant', () => {
            expect(findProductById(products, 99)).to.equal(undefined);
        });
    });

    describe('authentification', () => {
        it('accepte un email sans tenir compte de la casse', () => {
            expect(authenticateUser(users, 'STUDENT@SHOPNOW.TEST', 'Password123!'))
                .to.equal(users[0]);
        });

        it('refuse un mot de passe incorrect', () => {
            expect(authenticateUser(users, 'student@shopnow.test', 'incorrect'))
                .to.equal(undefined);
        });
    });

    describe('inscription', () => {
        it('refuse un champ obligatoire absent', () => {
            expect(validateRegistration(users, {
                firstName: 'New',
                lastName: 'Student',
                email: 'new@shopnow.test'
            })).to.equal('Tous les champs sont obligatoires');
        });

        it('refuse un mot de passe de moins de huit caractères', () => {
            expect(validateRegistration(users, {
                firstName: 'New',
                lastName: 'Student',
                email: 'new@shopnow.test',
                password: 'short'
            })).to.equal('Le mot de passe doit contenir au moins 8 caractères');
        });

        it('refuse un email déjà utilisé sans tenir compte de la casse', () => {
            expect(validateRegistration(users, {
                firstName: 'Another',
                lastName: 'Student',
                email: 'STUDENT@SHOPNOW.TEST',
                password: 'Password123!'
            })).to.equal('Un compte existe déjà avec cet email');
        });

        it('valide et crée un nouvel utilisateur', () => {
            const localUsers = [...users];
            const data = {
                firstName: 'New',
                lastName: 'Student',
                email: 'new@shopnow.test',
                password: 'Password123!'
            };

            expect(validateRegistration(localUsers, data)).to.equal(null);
            expect(createUser(localUsers, data)).to.deep.include({
                id: 2,
                email: 'new@shopnow.test'
            });
            expect(localUsers).to.have.length(2);
        });
    });
});
