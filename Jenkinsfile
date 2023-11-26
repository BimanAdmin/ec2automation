pipeline {
    agent any

    environment {
            AWS_REGION = 'us-west-2'
            AWS_ACCESS_KEY_ID = credentials('sb-navin-access')
            AWS_SECRET_ACCESS_KEY = credentials('sb-navin-secret')
            PULUMI_STATE_BUCKET = 's3://sandbox-pulumi-state'
            PULUMI_STACK = 'automationStack'
            PULUMI_CONFIG_PASSPHRASE = 'Welcome$123'
            PATH = "/var/lib/jenkins/.pulumi/bin:$PATH" // Installation Path for Pulumi on Jenkins ec2 machine
            npm_PATH= " /usr/share/npm:$npm_PATH"
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