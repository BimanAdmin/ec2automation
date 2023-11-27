pipeline {
    agent any

    environment {
        AWS_REGION = 'us-west-2'
        AWS_ACCESS_KEY_ID = credentials('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = credentials('AWS_SECRET_ACCESS_KEY')
        AWS_CREDENTIALS_ID = credentials('AWS_CREDENTIALS_ID')
        PULUMI_STACK = 'plec2sqlcontainer-s3'
        GITHUB_REPO_URL = 'https://github.com/BimanAdmin/ec2automation.git'
        PULUMI_STATE_BUCKET = 'pulumi-jenkins-state/state-bucket/'  // Set your Pulumi state bucket URL AWS_CREDENTIALS_ID
        PATH = "/var/lib/jenkins/.pulumi/bin:$PATH" // Installation Path for Pulumi on Jenkins ec2 machine
        npm_PATH= " /usr/share/npm:$npm_PATH"
        PULUMI_CONFIG_PASSPHRASE = credentials('PULUMI_CONFIG_PASSPHRASE')
        }

    // tools {
    //      nodejs 'pulumi'

    // }
        
    stages {
        stage('Install dependencies') {
            steps {
                // Install Pulumi CLI if not already installed
                sh 'curl -fsSL https://get.pulumi.com | sh'
                sh "export PATH=$PATH:/var/lib/jenkins/.pulumi/bin"
            }
        }

        stage('Pulumi up (main)') {
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
                    withCredentials([string(credentialsId: 'sb-navin-access', variable: 'AWS_CREDENTIALS')]) {

                        sh 'export PATH="/var/lib/jenkins/.pulumi/bin:$PATH"'
                        sh 'export npm_PATH="/usr/share/npm:$npm_PATH"'
                        sh 'npm install'
                        sh 'curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash'
                        sh 'export NVM_DIR="$HOME/.nvm"'
                        sh '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"'
                        sh '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"'
                        sh 'nvm install 14.17.0'  // Use the version you need
                        sh 'npm install pulumi && npm install @pulumi/aws && npm install @pulumi/pulumi'
                        //Version Check
                        sh 'pulumi version'
                        sh 'pulumi login s3://sandbox-pulumi-state?region=us-west-2'
                        //To  initialize a stack
                        // sh 'pulumi stack init pulumiec2sql-stack'
                        // Select the Pulumi stack to deploy to after
                        // sh 'pulumi stack select pulumiec2sql-stack'
                        def stackList = sh(script: 'pulumi stack ls --json', returnStdout: true).trim()
                        def stackExists = stackList.contains(PULUMI_STACK)
                        if (!stackExists) {
                            sh "pulumi stack init ${PULUMI_STACK}"
                        }
                        else { 
                            sh "pulumi stack select ${PULUMI_STACK}"
                        }
                        sh 'export PULUMI_CONFIG_PASSPHRASE="$PULUMI_CONFIG_PASSPHRASE"'
                        // Update the Pulumi stack
                        sh './pulumi-up.sh'
                    }
                }
            }
        }

        // Add more stages as needed
    }
}