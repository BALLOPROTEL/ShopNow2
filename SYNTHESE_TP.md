# Rapport final - TP INF243

## Informations de remise

| Element | Valeur |
|---|---|
| Etudiant | A completer |
| Groupe | A completer |
| Projet | ShopNow - Plateforme de tests |
| Depot Git | `https://github.com/BALLOPROTEL/ShopNow2` |
| Branche | `main` |
| Image Docker Hub | `balloprotel1/shopnow:latest` |

Ce document constitue le compte rendu du TP. Il presente la strategie de tests,
les tests ajoutes, les resultats locaux, la pipeline Jenkins et la configuration
SonarQube.

## 1. Presentation du projet

ShopNow est une application e-commerce pedagogique developpee avec Node.js et Express. Elle permet de travailler les principaux niveaux de tests logiciels :

- tests unitaires avec Mocha et Chai ;
- tests d'integration HTTP avec Supertest ;
- tests End-to-End avec Selenium WebDriver ;
- mesure de couverture avec NYC ;
- automatisation avec Jenkins ;
- analyse de qualite avec SonarQube.

L'objectif du TP est de construire progressivement une strategie de tests utile, reproductible et automatisee.

## 2. Organisation du projet

Les principaux dossiers sont :

```text
app/
  src/
    server.js       # application Express et routes API
    business.js     # regles metier extraites et testables
  public/           # pages HTML et JavaScript du site

tests/
  unit/             # tests unitaires
  integration/      # tests API avec Supertest
  e2e/              # tests navigateur avec Selenium

Jenkinsfile         # pipeline CI Jenkins
sonar-project.properties
package.json
README.md
```

Le serveur expose notamment :

- `GET /api/health` ;
- `GET /api/products` ;
- `GET /api/products/:id` ;
- `POST /api/register` ;
- `POST /api/login`.

L'application est accessible par Docker sur `http://localhost:8081`. SonarQube est expose sur `http://localhost:9090` et Jenkins sur `http://localhost:8080` lorsque les conteneurs sont demarres.

## 3. Travail realise

### 3.1 Tests unitaires

Le fichier `tests/unit/business.test.js` teste les regles metier suivantes :

- recherche d'un produit existant ;
- recherche d'un produit inexistant ;
- connexion avec un email valide ;
- comparaison de l'email sans tenir compte de la casse ;
- refus d'un mot de passe incorrect ;
- refus d'un champ obligatoire manquant ;
- refus d'un mot de passe trop court ;
- refus d'un email deja utilise ;
- creation d'un nouvel utilisateur.

Les fonctions testees sont dans `app/src/business.js`. Cette separation rend les regles metier testables sans devoir demarrer un serveur HTTP pour chaque test.

### 3.2 Tests API et integration

Le fichier `tests/integration/api.test.js` utilise Supertest pour appeler directement l'application Express.

Les tests verifient :

- le code HTTP ;
- la structure de la reponse ;
- les donnees retournees ;
- les cas nominaux ;
- les cas invalides ;
- les erreurs d'authentification ;
- les routes inexistantes.

Les cas negatifs couvrent notamment :

- produit inexistant : `404` ;
- identifiant produit invalide : `404` ;
- mot de passe incorrect : `401` ;
- email de connexion absent : `401` ;
- champs d'inscription manquants : `400` ;
- mot de passe trop court : `400` ;
- email deja utilise : `409` ;
- route API inconnue : `404`.

### 3.3 Test End-to-End

Le fichier `tests/e2e/navigation.test.js` automatise un parcours utilisateur complet avec Selenium et Chromium headless :

1. ouverture de ShopNow ;
2. suppression du panier et de la session precedente ;
3. ouverture de la page de connexion ;
4. connexion avec le compte de demonstration ;
5. acces a la page des produits ;
6. ouverture du detail du Laptop Pro 14 pouces ;
7. verification du nom et du prix ;
8. ajout du produit au panier ;
9. ouverture du panier ;
10. augmentation de la quantite ;
11. verification du total ;
12. suppression du produit ;
13. verification que le panier est vide.

Le test utilise les attributs `data-testid`, par exemple `login-submit`, `product-name`, `add-to-cart-1`, `quantity-1` et `empty-cart`. Il utilise aussi des attentes explicites Selenium avec `until.elementLocated`, `until.elementIsVisible`, `until.urlContains` et `until.alertIsPresent`.

Le binaire Chromium peut etre configure avec la variable `CHROMIUM_BINARY`. Dans l'environnement actuel, le chemin par defaut utilise le binaire Chromium Snap versionne.

## 4. Resultats des tests

Les commandes executees sont :

```bash
npm run test:unit
npm run test:integration
npm run test:e2e
npm test
```

Le dernier resultat global valide est :

```text
24 passing
```

La couverture generee par les tests unitaires et API est :

| Metrique | Resultat |
|---|---:|
| Instructions | 94,64 % |
| Branches | 92,85 % |
| Fonctions | 92,85 % |
| Lignes | 100 % |

La commande de couverture est :

```bash
npm run test:coverage
```

Elle genere notamment :

```text
coverage/lcov.info
coverage/lcov-report/index.html
```

Le rapport HTML peut etre ouvert dans un navigateur avec le fichier `coverage/lcov-report/index.html`.

Les dossiers `coverage/`, `node_modules/` et `.nyc_output/` sont exclus par `.gitignore` et ne doivent pas etre pushes dans Git.

## 4.1 Tableau de suivi des iterations

| Etape | Travail realise | Couverture locale | Jenkins | SonarQube |
|---|---|---:|---|---|
| Depart | Tests de demarrage fournis | Environ 47,5 % | Non execute | Non analyse |
| Iteration 1 | Tests unitaires des regles metier | A relever dans le premier rapport | A completer | A completer |
| Iteration 2 | Tests API nominaux et invalides | A relever dans le rapport intermediaire | A completer | A completer |
| Iteration 3 | Parcours E2E Selenium | 94,64 % pour unitaires/API | A verifier dans Jenkins | A verifier dans SonarQube |
| Final | Pipeline, Quality Gate et rapports JUnit | 94,64 % | A confirmer apres la build finale | A confirmer apres la build finale |

La couverture locale finale depasse l'objectif pedagogique de 80 %. La couverture
NYC porte sur les tests unitaires et API ; le test E2E valide le parcours
utilisateur mais n'est pas un test de couverture instrumente par NYC.

## 5. Fonctionnement detaille du Jenkinsfile

Le fichier `Jenkinsfile` definit une pipeline declarative Jenkins. Son but est de reproduire automatiquement la chaine suivante :

```text
Checkout
   -> Installation
   -> Tests unitaires
   -> Tests API
    -> Tests E2E
   -> Coverage
   -> SonarQube
    -> Quality Gate
   -> Post Actions
```

### 5.1 Declaration de la pipeline

```groovy
pipeline {
    agent any
```

`pipeline` indique qu'il s'agit d'une pipeline declarative. `agent any` autorise Jenkins a executer la pipeline sur n'importe quel agent disponible.

Dans l'installation actuelle, le job Jenkins utilise l'image Docker personnalisee du dossier `jenkins/`. Cette image contient notamment Node.js, npm, Chromium, Git et Docker CLI.

### 5.2 Options globales

```groovy
options {
    timestamps()
    skipDefaultCheckout(true)
    timeout(time: 15, unit: 'MINUTES')
}
```

- `timestamps()` ajoute l'heure a chaque ligne de log, ce qui facilite le diagnostic ;
- `skipDefaultCheckout(true)` empeche Jenkins de faire un checkout automatique implicite ;
- `timeout(...)` arrete une pipeline qui depasse quinze minutes.

Le checkout est donc realise explicitement dans l'etape `Checkout`.

### 5.3 Variables d'environnement

```groovy
environment {
    SONAR_SCANNER_OPTS = '-Xmx512m'
}
```

Cette variable limite et reserve la memoire utilisee par le scanner SonarQube. Elle evite que l'analyse consomme une quantite excessive de memoire dans le conteneur Jenkins.

### 5.4 Etape Checkout

```groovy
stage('Checkout') {
    steps {
        checkout scm
    }
}
```

Jenkins recupere le code depuis le depot configure dans le job. Dans ce projet, le job pointe vers :

```text
https://github.com/BALLOPROTEL/ShopNow2
```

La branche utilisee est `main` et le script de pipeline est `Jenkinsfile` a la racine.

### 5.5 Etape Installation

```groovy
stage('Installation') {
    steps {
        sh 'npm ci'
    }
}
```

`npm ci` installe exactement les dependances indiquees dans `package-lock.json`. Cette commande est preferable a `npm install` en CI car elle produit une installation reproductible et echoue si le lockfile ne correspond pas au `package.json`.

### 5.6 Etape Tests unitaires

```groovy
stage('Tests unitaires') {
    steps {
        sh 'npm run test:unit'
    }
}
```

Cette etape execute les fichiers situes dans `tests/unit/`. Si un test unitaire echoue, Jenkins marque la pipeline en echec et les etapes suivantes ne sont normalement pas executees.

### 5.7 Etape Tests API

```groovy
stage('Tests API') {
    steps {
        sh 'npm run test:integration'
    }
}
```

Cette etape execute les tests Supertest situes dans `tests/integration/`. Elle verifie le comportement HTTP de l'application Express, sans utiliser un navigateur.

### 5.8 Etape Tests E2E

```groovy
stage('Tests E2E') {
    steps {
        sh '''
            PORT=8081 npm start > shopnow-e2e.log 2>&1 &
            APP_PID=$!
            trap 'kill $APP_PID 2>/dev/null || true' EXIT
            ...
            CHROMIUM_BINARY=/usr/bin/chromium npx mocha "tests/e2e/**/*.test.js" \
              --reporter mocha-junit-reporter \
              --reporter-option mochaFile=test-results/e2e.xml
        '''
    }
}
```

Jenkins demarre temporairement l'application sur le port `8081`, attend que `/api/health` reponde, puis execute le parcours Selenium avec Chromium headless. Le `trap` arrete le serveur Node a la fin de l'etape, meme en cas d'echec.

La variable `CHROMIUM_BINARY` indique a Selenium le chemin du navigateur installe dans l'image Jenkins. L'E2E produit aussi `test-results/e2e.xml`.

### 5.9 Etape Coverage

```groovy
stage('Coverage') {
    steps {
        sh 'npm run test:coverage'
        archiveArtifacts artifacts: 'coverage/lcov.info', fingerprint: true
    }
}
```

La commande `npm run test:coverage` lance NYC sur les tests unitaires et API. Elle produit le rapport LCOV dans `coverage/lcov.info`.

`archiveArtifacts` conserve ce fichier dans Jenkins. Le parametre `fingerprint: true` permet a Jenkins d'identifier precisement l'artefact archive.

Le test E2E n'est pas inclus dans la couverture NYC actuelle, car le script `test:coverage` cible volontairement les tests unitaires et d'integration.

### 5.10 Etape SonarQube

```groovy
stage('SonarQube') {
    steps {
        withSonarQubeEnv('SonarQube') {
            sh '''
                npx --yes sonar-scanner \
                  ...
            '''
        }
    }
}
```

`withSonarQubeEnv('SonarQube')` demande a Jenkins de charger la configuration du serveur SonarQube dont le nom est exactement `SonarQube`.

Dans Jenkins, cette configuration doit contenir :

```text
Name       : SonarQube
Server URL : http://sonarqube:9000
```

Le nom est sensible a la casse car il est utilise directement dans le Jenkinsfile.

Le scanner est lance avec `npx --yes sonar-scanner`. Cela permet d'utiliser le scanner sans installer globalement une commande `sonar-scanner` dans l'image Jenkins.

Les parametres transmis au scanner sont :

```text
-Dsonar.projectKey=shopnow
```

Identifiant technique du projet SonarQube.

```text
-Dsonar.projectName="ShopNow Test Platform"
```

Nom lisible du projet dans SonarQube.

```text
-Dsonar.sources=app/src
```

Seul le code applicatif du dossier `app/src` est analyse comme source.

```text
-Dsonar.tests=tests
-Dsonar.test.inclusions=tests/**/*.test.js
```

Ces options indiquent a SonarQube ou se trouvent les tests et quels fichiers sont identifies comme tests.

```text
-Dsonar.exclusions=**/node_modules/**,**/coverage/**
```

Les dependances installees et les rapports generes ne sont pas analyses comme du code source du projet.

```text
-Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
```

SonarQube lit le rapport LCOV genere par NYC pour afficher la couverture.

```text
-Dsonar.nodejs.executable=/opt/node18/bin/node
```

Le scanner SonarQube utilise Node.js 18, installe dans l'image Jenkins a cet emplacement. Node.js 22 reste utilise pour les tests du projet. Cette separation evite les problemes de compatibilite ou de lenteur de l'analyse JavaScript.

### 5.11 Etape Quality Gate

```groovy
stage('Quality Gate') {
    steps {
        timeout(time: 5, unit: 'MINUTES') {
            waitForQualityGate abortPipeline: true
        }
    }
}
```

Cette etape attend le resultat du Quality Gate SonarQube. Si SonarQube refuse la qualite du projet ou si le resultat n'arrive pas dans les cinq minutes, Jenkins marque la pipeline en echec.

Pour que cette attente fonctionne, SonarQube doit avoir un webhook Jenkins configure vers :

```text
http://jenkins:8080/sonarqube-webhook/
```

### 5.12 Rapports JUnit et actions post-pipeline

```groovy
post {
    always {
        junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
        archiveArtifacts artifacts: 'coverage/**,test-results/**,shopnow-e2e.log', allowEmptyArchive: true
    }
```

Les commandes Mocha utilisent `mocha-junit-reporter` pour produire trois rapports XML :

```text
test-results/unit.xml
test-results/integration.xml
test-results/e2e.xml
```

Le bloc `always` est execute que la pipeline reussisse ou echoue.

- `junit` publie les resultats des trois categories de tests dans Jenkins ;
- `allowEmptyResults: true` evite un nouvel echec si un rapport n'a pas ete genere ;
- `archiveArtifacts` archive la couverture, les rapports JUnit et le log de demarrage ShopNow ;
- `allowEmptyArchive: true` evite de faire echouer les actions finales si aucun rapport n'a ete genere.

```groovy
success {
    echo 'Pipeline ShopNow terminee avec succes.'
}
```

Ce message apparait lorsque toutes les etapes principales ont reussi.

```groovy
failure {
    echo 'Pipeline ShopNow en echec : consulter les logs de l etape concernee.'
}
```

Ce message apparait lorsqu'une etape echoue. La premiere etape rouge dans l'interface Jenkins indique generalement l'origine du probleme.

## 6. Configuration manuelle Jenkins

Pour configurer SonarQube dans Jenkins :

1. ouvrir Jenkins sur `http://localhost:8080` ;
2. aller dans `Manage Jenkins` ;
3. ouvrir `System` ;
4. chercher `SonarQube servers` ;
5. ajouter ou verifier le serveur ;
6. utiliser exactement le nom `SonarQube` ;
7. utiliser l'URL interne `http://sonarqube:9000` ;
8. enregistrer la configuration ;
9. ouvrir le job `shopnow-test-platform` ;
10. cliquer sur `Build Now` ;
11. ouvrir la console de la build ;
12. vérifier les etapes `Checkout`, `Installation`, `Tests unitaires`, `Tests API`, `Tests E2E`, `Coverage`, `SonarQube` et `Quality Gate`.

Depuis le navigateur de la machine hote, SonarQube est consulte avec :

```text
http://localhost:9090
```

Depuis le conteneur Jenkins, le nom de service Docker est utilise :

```text
http://sonarqube:9000
```

Ces deux adresses sont normales : elles correspondent a deux reseaux differents.

## 7. Lecture des resultats SonarQube

Apres une pipeline reussie, ouvrir le projet `ShopNow Test Platform` dans SonarQube et comparer :

- la couverture locale affichee par NYC ;
- la couverture affichee par SonarQube ;
- les bugs ;
- les vulnerabilites ;
- les code smells ;
- les duplications ;
- les hotspots de securite.

Une difference entre NYC et SonarQube peut venir des fichiers inclus dans l'analyse, des exclusions, du rapport LCOV utilise ou du fait que l'E2E n'est pas inclus dans le calcul de couverture NYC.

## 8. Git et commits realises

Le depot distant actuel est :

```text
https://github.com/BALLOPROTEL/ShopNow2.git
```

Les commits importants sont :

```text
199a110 Initialisation du TP de tests
8d2285b first commit
cac4e76 Amelioration de la strategie de tests
03aef4b Ajout de la pipeline Jenkins
92a05ad Complete Jenkins test pipeline
```

Le commit `03aef4b` contient la premiere version du Jenkinsfile. Le commit
`92a05ad` ajoute les stages E2E, Quality Gate, les rapports JUnit et la mise a
jour de cette documentation. Ces commits ont ete pousses sur la branche `main`.

Commandes utilisees pour publier le travail :

```bash
git status
git add .
git commit -m "Ajout de la pipeline Jenkins"
git push
```

Avant chaque commit, il faut verifier que `node_modules/`, `coverage/`, `.nyc_output/` et les fichiers `.env` ne sont pas ajoutes.

## 9. Strategie de tests expliquee simplement

### Test unitaire

Il teste une fonction ou une regle metier de maniere isolee. Il est rapide et permet de localiser facilement une regression.

### Test d'integration

Il verifie que plusieurs composants fonctionnent ensemble. Ici, Supertest appelle Express et verifie la reponse HTTP de l'application.

### Test E2E

Il reproduit un parcours reel dans un navigateur. Il est plus proche de l'experience utilisateur, mais plus lent et plus dependant de l'environnement.

### Couverture

La couverture mesure la partie du code executee par les tests. Elle ne prouve pas a elle seule que tous les comportements sont correctement verifies.

## 10. Reponses aux questions d'analyse

### Question 1 - Difference entre les niveaux de tests

- Un test unitaire verifie une fonction ou une regle metier de maniere isolee.
- Un test d'integration verifie la collaboration de plusieurs composants, ici HTTP, Express et les routes API.
- Un test E2E reproduit les actions d'un utilisateur dans un vrai navigateur.

### Question 2 - Pourquoi 100 % de couverture peut etre insuffisant ?

La couverture indique que les lignes ou branches ont ete executees, mais elle ne
garantit pas que les assertions sont pertinentes. Un test peut executer une
ligne sans verifier correctement le resultat. Il faut donc combiner couverture,
cas nominaux, cas limites, cas d'erreur et assertions precises.

### Question 3 - Pourquoi tester les erreurs ?

Les erreurs font partie du comportement attendu d'une application. Tester les
codes `400`, `401`, `404` et `409` permet de verifier que l'application refuse
les donnees invalides de facon previsible et qu'elle ne renvoie pas une reponse
faussement positive.

### Question 4 - Pourquoi utiliser `data-testid` ?

Un `data-testid` fournit un selecteur stable et independant de la mise en page
ou des classes CSS. Le test Selenium est ainsi moins fragile lorsqu'un style ou
la structure HTML evolue.

### Question 5 - Pourquoi eviter les `sleep()` systematiques ?

Un `sleep()` attend une duree fixe : il ralentit les tests et peut encore etre
insuffisant sur une machine lente. Les attentes explicites attendent l'etat reel
de l'element ou de l'URL et rendent le test plus rapide et plus fiable.

### Question 6 - Quel est le role de Jenkins ?

Jenkins automatise l'integration continue. A chaque build, il recupere le code,
installe les dependances, execute les tests, genere la couverture et lance
l'analyse SonarQube. Une regression est detectee avant la livraison.

### Question 7 - Quel est le role de SonarQube ?

SonarQube analyse la qualite statique et la maintenabilite du code. Il fournit
des indicateurs sur les bugs, vulnerabilites, code smells, duplications,
hotspots et couverture recue par LCOV.

### Question 8 - Difference entre couverture et qualite du code

La couverture mesure la portion de code executee par les tests. La qualite du
code est plus large : lisibilite, maintenabilite, securite, complexite,
duplication et absence de defauts detectables. Une couverture elevee ne suffit
donc pas a garantir un code de bonne qualite.

## 11. Difficultes rencontrees et solutions

### Chemin Firefox Windows sous Linux

Le test E2E initial utilisait un chemin Windows code en dur. Sous Linux, ce
chemin etait invalide. Le test a ete adapte pour utiliser Chromium headless et
la variable `CHROMIUM_BINARY`.

### Session Chromium avec Snap

Le lanceur `/snap/bin/chromium` ne fonctionnait pas directement avec
ChromeDriver. Le binaire Chromium reel a ete utilise dans l'environnement local
et Jenkins fournit son propre chemin `/usr/bin/chromium`.

### Attente asynchrone de la quantite

L'attente Selenium comparait une promesse avec une chaine de caracteres. Elle a
ete corrigee pour attendre la resolution de `getText()` avant de comparer la
valeur `2`.

### Quality Gate SonarQube

Le Quality Gate depend d'une configuration externe a Git : le serveur Jenkins
doit connaitre un serveur nomme exactement `SonarQube` et SonarQube doit envoyer
un webhook vers Jenkins. Ces parametres doivent etre verifies manuellement
avant la build finale.

## 12. Preuves a joindre au compte rendu

Les captures suivantes doivent etre ajoutees au document de remise :

1. depot GitHub et historique des commits ;
2. resultat de `npm test` avec les tests verts ;
3. resultat de `npm run test:coverage` ;
4. page HTML `coverage/lcov-report/index.html` ;
5. pipeline Jenkins avec toutes les etapes vertes ;
6. console Jenkins montrant les rapports JUnit et SonarQube ;
7. projet SonarQube et son Quality Gate ;
8. depot Docker Hub `balloprotel1/shopnow`.

## 13. Checklist finale

- [x] Tests unitaires ajoutes.
- [x] Tests API ajoutes.
- [x] Test E2E avec Selenium et `data-testid` ajoute.
- [x] Attentes explicites utilisees dans le test E2E.
- [x] Couverture locale generee.
- [x] Objectif de couverture superieur a 80 % atteint localement.
- [x] Jenkinsfile versionne dans le depot.
- [x] Stage Quality Gate ajoute.
- [x] Rapports JUnit ajoutes.
- [x] `node_modules/`, `coverage/`, `.nyc_output/` et `test-results/` ignores.
- [x] Image publiee sur Docker Hub.
- [ ] Build Jenkins finale verifiee avec Quality Gate vert.
- [ ] Tableau de bord SonarQube capture.
- [ ] Nom de l'etudiant et groupe completes.

## 14. Conclusion

Le projet ShopNow dispose d'une strategie de tests a trois niveaux et d'une
pipeline CI complete. Les tests unitaires couvrent les regles metier, les tests
API verifient les contrats HTTP et les erreurs, et le test E2E valide un parcours
reel de connexion et de panier.

La couverture locale est de 94,64 % pour les instructions, avec 92,85 % des
branches, 92,85 % des fonctions et 100 % des lignes. La pipeline Jenkins lance
desormais les trois familles de tests, produit des rapports JUnit, genere LCOV,
analyse le projet avec SonarQube et attend le Quality Gate.

La seule validation restant a effectuer est la build Jenkins finale apres
configuration du serveur SonarQube et du webhook. Une fois cette build verte,
le depot, le rapport et les captures constituent les livrables finaux du TP.
La suite locale est verte avec 24 tests et la couverture depasse l'objectif pedagogique de 80 %. La pipeline Jenkins est versionnee dans le depot et prete a executer les tests et l'analyse SonarQube, sous reserve que le serveur Jenkins soit configure avec le serveur SonarQube nomme exactement `SonarQube`.

La prochaine etape operationnelle est de lancer une build Jenkins, verifier l'etape SonarQube et conserver les captures d'ecran de Jenkins, de la couverture locale et du tableau de bord SonarQube pour le compte rendu.
