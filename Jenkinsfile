pipeline {
    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        timeout(time: 15, unit: 'MINUTES')
    }

    environment {
        SONAR_SCANNER_OPTS = '-Xmx512m'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Installation') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Tests unitaires') {
            steps {
                sh 'npm run test:unit'
            }
        }

        stage('Tests API') {
            steps {
                sh 'npm run test:integration'
            }
        }

        stage('Coverage') {
            steps {
                sh 'npm run test:coverage'
                archiveArtifacts artifacts: 'coverage/lcov.info', fingerprint: true
            }
        }

        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh '''
                        npx --yes sonar-scanner \
                          -Dsonar.projectKey=shopnow \
                          -Dsonar.projectName="ShopNow Test Platform" \
                          -Dsonar.sources=app/src \
                          -Dsonar.tests=tests \
                          -Dsonar.test.inclusions=tests/**/*.test.js \
                          -Dsonar.exclusions=**/node_modules/**,**/coverage/** \
                          -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                          -Dsonar.nodejs.executable=/opt/node18/bin/node
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
        success {
            echo 'Pipeline ShopNow terminée avec succès.'
        }
        failure {
            echo 'Pipeline ShopNow en echec : consulter les logs de l etape concernee.'
        }
    }
}
