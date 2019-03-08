pipeline {
    agent { label 'zowe-cli-agent' }
    environment {
        // z/OSMF Connection Details
        ZOWE_OPT_HOST=credentials('eosHost')
        ZOWE_OPT_PORT="443"
        ZOWE_OPT_REJECT_UNAUTHORIZED=false

        // CICS Connection Details
        CICS="--port 6000 --region-name CICSTRN1"
    }
    stages {
        stage('local setup') {
            steps {
                sh 'node --version'
                sh 'npm --version'
                sh 'zowe --version'
                sh 'zowe plugins list'
                sh 'npm install gulp-cli -g'
                sh 'npm install'
            }
        }
        stage('build') {
            steps {
                //ZOWE_OPT_USER & ZOWE_OPT_PASSWORD are used to interact with z/OSMF 
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'gulp build'
                }
            }
        }
        stage('deploy') {
            steps {
                //ZOWE_OPT_USER & ZOWE_OPT_PASSWORD are used to interact with z/OSMF and CICS
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'gulp deploy'
                }
            }
        }
        stage('test') {
            steps {
                //ZOWE_OPT_USER & ZOWE_OPT_PASSWORD are used to interact with z/OSMF
                withCredentials([usernamePassword(credentialsId: 'eosCreds', usernameVariable: 'ZOWE_OPT_USER', passwordVariable: 'ZOWE_OPT_PASSWORD')]) {
                    sh 'npm test'
                }
            }
        }
    }
}