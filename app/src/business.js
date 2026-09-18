function findProductById(products, id) {
    return products.find((product) => product.id === Number(id));
}

function authenticateUser(users, email, password) {
    const normalizedEmail = String(email || '').toLowerCase();
    return users.find((user) => (
        user.email.toLowerCase() === normalizedEmail && user.password === password
    ));
}

function validateRegistration(users, data) {
    const { firstName, lastName, email, password } = data;

    if (!firstName || !lastName || !email || !password) {
        return 'Tous les champs sont obligatoires';
    }

    if (password.length < 8) {
        return 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (users.some((user) => user.email.toLowerCase() === email.toLowerCase())) {
        return 'Un compte existe déjà avec cet email';
    }

    return null;
}

function createUser(users, data) {
    const user = {
        id: users.length + 1,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password
    };
    users.push(user);
    return user;
}

module.exports = {
    findProductById,
    authenticateUser,
    validateRegistration,
    createUser
};
