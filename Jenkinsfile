pipeline {
    agent any

    options {
        timestamps()
        skipDefaultCheckout(true)
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
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
                sh '''
                    mkdir -p test-results
                    npx mocha "tests/unit/**/*.test.js" --timeout 10000 \
                      --reporter mocha-junit-reporter \
                      --reporter-option mochaFile=test-results/unit.xml
                '''
            }
        }

        stage('Tests API') {
            steps {
                sh '''
                    npx mocha "tests/integration/**/*.test.js" --timeout 10000 \
                      --reporter mocha-junit-reporter \
                      --reporter-option mochaFile=test-results/integration.xml
                '''
            }
        }

        stage('Tests E2E') {
            steps {
                sh '''
                    PORT=8081 npm start > shopnow-e2e.log 2>&1 &
                    APP_PID=$!
                    trap 'kill $APP_PID 2>/dev/null || true' EXIT

                    for attempt in $(seq 1 30); do
                        if curl --fail --silent http://localhost:8081/api/health >/dev/null; then
                            break
                        fi
                        if [ "$attempt" -eq 30 ]; then
                            cat shopnow-e2e.log
                            exit 1
                        fi
                        sleep 1
                    done

                    mkdir -p test-results
                    CHROMIUM_BINARY=/usr/bin/chromium npx mocha "tests/e2e/**/*.test.js" \
                      --timeout 30000 \
                      --reporter mocha-junit-reporter \
                      --reporter-option mochaFile=test-results/e2e.xml
                '''
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

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true, testResults: 'test-results/**/*.xml'
            archiveArtifacts artifacts: 'coverage/**,test-results/**,shopnow-e2e.log', allowEmptyArchive: true
        }
        success {
            echo 'Pipeline ShopNow terminée avec succès.'
        }
        failure {
            echo 'Pipeline ShopNow en echec : consulter les logs de l etape concernee.'
        }
    }
}
