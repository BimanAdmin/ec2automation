

    pipeline {
    agent any

    environment {
        AWS_REGION = 'us-west-2'
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        AWS_CREDENTIALS_ID = credentials('AWS_CREDENTIALS_ID')
        PULUMI_STACK = 'ec2automation-s3'
        GITHUB_REPO_URL = 'https://github.com/BimanAdmin/ec2automation.git'
        PULUMI_STATE_BUCKET = 'pulumi-jenkins-state-new/state-file/'  // Set your Pulumi state bucket URL AWS_CREDENTIALS_ID
        PATH = "/var/lib/jenkins/.pulumi/bin:$PATH" // Installation Path for Pulumi on Jenkins ec2 machine
        npm_PATH= " /usr/share/npm:$npm_PATH"
        PULUMI_CONFIG_PASSPHRASE = credentials('PULUMI_CONFIG_PASSPHRASE')
        //PULUMI_ACCESS_TOKEN = credentials('PULUMI_ACCESS_TOKEN')
        NVM_VERSION = 'v0.39.1'
        NODEJS_VERSION = '14'

    }

    tools {
         nodejs 'pulumi'

    }

    stages {

        stage('Fetch Code') {
            steps {
                echo 'Fetching code from GitHub'
                git branch: 'master', url: "${GITHUB_REPO_URL}"
            }
        }

        stage ("Install dependencies") {
            steps {
                sh "curl -fsSL https://get.pulumi.com | sh"
                sh "export PATH=$PATH:/var/lib/jenkins/.pulumi/bin"

             }
        }

        stage('Check or Initialize Pulumi Stack') {
            steps {
                script {
                    // Check if the stack exists
                    def stackList = sh(script: 'pulumi stack ls --json', returnStdout: true).trim()
                    def stackExists = stackList.contains(PULUMI_STACK)
                    if (!stackExists) {
                            sh "pulumi stack init ${PULUMI_STACK}"
                        }
                    else { 
                            sh "pulumi stack select ${PULUMI_STACK}"
                        }                   
                      
                }
            }
        }

        stage('Pulumi Up') {
            steps {
                script {

                    // Create a script file for Pulumi up command
                    writeFile file: 'pulumi-up.sh', text: '''
                        #!/bin/bash
                        pulumi destroy --yes
                    '''
                    
                    // Make the script executable
                    sh 'chmod +x pulumi-up.sh'

                    // Execute Pulumi up
                    withCredentials([[$class: 'AmazonWebServicesCredentialsBinding', credentialsId: 'AWS_CREDENTIALS_ID', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY']]) {
                        // Set AWS credentials for Pulumi
                        sh 'export AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID'
                        sh 'export AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY'

                        // Set Pulumi state storage to AWS S3
                        sh "pulumi login s3://${PULUMI_STATE_BUCKET}/${PULUMI_STACK}"
                        
                        // Install Node.js and NPM
                        sh "nvm install ${NODEJS_VERSION}"
                        sh "nvm use ${NODEJS_VERSION}"
                        sh 'node -v'
                        sh 'npm -v'
                        sh 'export PATH="$NVM_DIR/versions/node/v${NODEJS_VERSION}/bin:$PATH"'
                        //sh 'export PATH="/var/lib/jenkins/.pulumi/bin:$PATH"'
                        //sh 'export npm_PATH="/usr/share/npm:$npm_PATH"'
                        //sh 'npm install @pulumi/pulumi && npm install @pulumi/aws'
                        // def stackList = sh(script: 'pulumi stack ls --json', returnStdout: true).trim()
                        // def stackExists = stackList.contains(PULUMI_STACK)
                        // if (!stackExists) {
                        //     sh "pulumi stack init ${PULUMI_STACK}"
                        // }
                        // else { 
                        //     sh "pulumi stack select ${PULUMI_STACK}"
                        // }
                        sh 'export PULUMI_CONFIG_PASSPHRASE="$PULUMI_CONFIG_PASSPHRASE"' 
                        sh './pulumi-up.sh'
                    }
                }
            }
        }

        //stage('Execute Kubernetes YAML Files') {
            //steps {
                //script {
                    //echo 'Applying Kubernetes YAML files to the cluster'
                    // Use kubectl to apply your Kubernetes YAML files
                     //aws eks --region "${REGION}" update-kubeconfig --name "${CLUSTER_NAME}"
                     //sh 'kubectl apply -f StorageClass.yaml'
                     //sh 'kubectl apply -f pvc.yaml'
                     //sh 'kubectl apply -f Statefulset.yaml'
                     //sh 'kubectl apply -f S Service.yaml'
                //}
            //}
        //}
    }

    post {
            failure {
                script {
                    echo 'Destroying EKS cluster due to pipeline failure'
                    // Run Pulumi destroy in case of pipeline failure
                    sh 'pulumi destroy --yes'
                }
            }

            success {
                script {
                    echo 'Pipeline executed successfully!'
                }
            }
        }
}