const request = require('supertest');
const { expect } = require('chai');
const app = require('../../app/src/server');

describe('API ShopNow', () => {
  it('GET /api/health doit retourner 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal('ok');
  });

  it('GET / doit retourner la page d accueil', async () => {
    const res = await request(app).get('/');

    expect(res.status).to.equal(200);
    expect(res.text).to.include('ShopNow');
  });

  it('GET /api/products doit retourner la liste des produits', async () => {
    const res = await request(app).get('/api/products');

    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array').that.is.not.empty;
    expect(res.body[0]).to.include.all.keys('id', 'name', 'price', 'category');
  });

  it('GET /api/products/:id doit retourner un produit existant', async () => {
    const res = await request(app).get('/api/products/1');

    expect(res.status).to.equal(200);
    expect(res.body).to.include({ id: 1, name: 'Laptop Pro 14"' });
    expect(res.body.price).to.be.a('number');
  });

  it('GET /api/products/:id doit retourner 404 pour un produit inexistant', async () => {
    const res = await request(app).get('/api/products/999');

    expect(res.status).to.equal(404);
    expect(res.body.error).to.equal('Produit introuvable');
  });

  it('GET /api/products/:id doit refuser un identifiant invalide', async () => {
    const res = await request(app).get('/api/products/not-a-number');

    expect(res.status).to.equal(404);
    expect(res.body).to.have.property('error', 'Produit introuvable');
  });

  it('POST /api/login doit accepter les identifiants valides', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@shopnow.test', password: 'Password123!' });

    expect(res.status).to.equal(200);
    expect(res.body.message).to.equal('Connexion réussie');
    expect(res.body.user).to.include({
      email: 'student@shopnow.test',
      firstName: 'Demo'
    });
  });

  it('POST /api/login doit refuser un mot de passe incorrect', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'student@shopnow.test', password: 'incorrect' });

    expect(res.status).to.equal(401);
    expect(res.body.error).to.equal('Email ou mot de passe incorrect');
  });

  it('POST /api/login doit refuser un email absent', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ password: 'Password123!' });

    expect(res.status).to.equal(401);
    expect(res.body).to.have.property('error', 'Email ou mot de passe incorrect');
  });

  it('POST /api/register doit créer un compte valide', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Api',
        lastName: 'Tester',
        email: 'api-tester@shopnow.test',
        password: 'Password123!'
      });

    expect(res.status).to.equal(201);
    expect(res.body.message).to.equal('Compte créé avec succès');
    expect(res.body.user).to.include({
      firstName: 'Api',
      email: 'api-tester@shopnow.test'
    });
    expect(res.body.user).to.not.have.property('password');
  });

  it('POST /api/register doit refuser les champs obligatoires manquants', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ email: 'incomplete@shopnow.test' });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal('Tous les champs sont obligatoires');
  });

  it('POST /api/register doit refuser un mot de passe trop court', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Api',
        lastName: 'Tester',
        email: 'short-password@shopnow.test',
        password: 'short'
      });

    expect(res.status).to.equal(400);
    expect(res.body.error).to.equal(
      'Le mot de passe doit contenir au moins 8 caractères'
    );
  });

  it('POST /api/register doit refuser un email déjà utilisé', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        firstName: 'Duplicate',
        lastName: 'Tester',
        email: 'STUDENT@SHOPNOW.TEST',
        password: 'Password123!'
      });

    expect(res.status).to.equal(409);
    expect(res.body.error).to.equal('Un compte existe déjà avec cet email');
  });

  it('une route API inconnue doit retourner 404', async () => {
    const res = await request(app).get('/api/unknown');

    expect(res.status).to.equal(404);
  });
});
