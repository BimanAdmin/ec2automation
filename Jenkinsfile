//////Jenkins Pipeline Code////
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

        stage ("Install dependencies and applications") {
            steps {
                sh "curl -fsSL https://get.pulumi.com | sh"
                sh "export PATH=$PATH:/var/lib/jenkins/.pulumi/bin"

                sh 'echo "jenkins ALL=(ALL) NOPASSWD: ALL" | sudo tee -a /etc/sudoers'
                sh 'sudo apt-get update -y'
                sh 'sudo apt-get install -y unzip'
                sh 'sudo apt-get install -y curl'

                // Download and install AWS CLI
                sh 'curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"'
                sh 'unzip awscliv2.zip'
                sh 'sudo ./aws/install'

                // Verify the installation
                sh 'aws --version'

             }
        }

        // stage('Check or Initialize Pulumi Stack') {
        //     steps {
        //         script {
        //             //Check if the stack exists
        //             def stackList = sh(script: 'pulumi stack ls --json', returnStdout: true).trim()
        //             def stackExists = stackList.contains(PULUMI_STACK)
        //             if (!stackExists) {
        //                     sh "pulumi stack init ${PULUMI_STACK}"
        //             }
        //             else { 
        //                     sh "pulumi stack select ${PULUMI_STACK}"
        //             }                   
                      
        //         }
        //     }
        // }

        stage('Pulumi Up') {
            steps {
                script {

                    // Create a script file for Pulumi up command
                    writeFile file: 'pulumi-up.sh', text: '''
                        #!/bin/bash
                        pulumi up --yes
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
                        sh 'export PATH="/var/lib/jenkins/.pulumi/bin:$PATH"'
                        sh 'export npm_PATH="/usr/share/npm:$npm_PATH"'


                        sh 'npm install'
                        sh 'npm install @pulumi/pulumi && npm install @pulumi/aws'
                        sh 'pulumi login s3://pulumi-jenkins-state-new/state-file/?region=us-west-2'
                        def stackList = sh(script: 'pulumi stack ls --json', returnStdout: true).trim()
                        def stackExists = stackList.contains(PULUMI_STACK)
                        if (!stackExists) {
                            sh "pulumi stack init ${PULUMI_STACK}"
                        }
                        else { 
                            sh "pulumi stack select ${PULUMI_STACK}"
                        }
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