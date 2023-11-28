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
        PULUMI_ACCESS_TOKEN = credentials('PULUMI_ACCESS_TOKEN')
        NODE_VERSION = '14'

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

        stage('Pulumi Preview') {
            steps {
                script {
                    // Run pulumi preview and save the output to a file
                    // sh 'pulumi preview --json > pulumi-preview-output.json'

                    // def previewOutput = readFile('pulumi-preview-output.json').trim()
                    
                    // echo "Pulumi Preview Output: ${previewOutput}"

                    // def changes = readJSON file: 'pulumi-preview-output.json'
                    

                    // if (changes.steps && changes.steps.size() > 0) {
                    //     echo "Changes detected. Proceeding with deployment..."
                    //     currentBuild.result = 'SUCCESS' // Mark the build as successful
                    // } else {
                    //     echo "No changes detected. Skipping deployment."
                    //     currentBuild.result = 'ABORTED' // Mark the build as aborted
                    // }

                    def previewOutput = sh(script: 'pulumi preview --json', returnStdout: true).trim()
                    writeFile file: 'pulumi-preview-output.json', text: previewOutput

                    // Store the current stack's state in S3
                    sh "pulumi stack export > pulumi-current-state.json"
                    sh "aws s3 cp pulumi-current-state.json s3://${PULUMI_STATE_BUCKET}/${PULUMI_STACK}/pulumi-current-state.json"

                    // Compare the preview with the current state
                    def changes = readJSON file: 'pulumi-preview-output.json'
                    def currentState = readJSON file: 'pulumi-current-state.json'

                    // Filter out changes that already exist in the current state

                    def filteredChanges = changes.steps.findAll { step ->
                       def urn = step.urn
                       def resourceExists = currentState.resources.any { it.urn == urn }
                       !resourceExists
                    }

                    // Check if there are changes to apply
                    if (filteredChanges.size() > 0) {
                        echo "Changes detected. Proceeding with deployment..."
                        currentBuild.result = 'SUCCESS'
                    } else {
                        echo "No changes detected. Skipping deployment."
                        currentBuild.result = 'ABORTED'
                    }

                    // Write the filtered changes to a file for later use
                     writeFile file: 'pulumi-filtered-changes.json', text: filteredChanges as String


                }
            }
        }

        

        stage('Pulumi Up') {
            when {
                expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
            }
            steps {
                script {

                    // def changes = script {
                    //     def jsonData = readFile(file: 'pulumi-preview-output.json')
                    //     return readJSON file: jsonData
                        
                    // }
                    // def resourcesChanged = changes.summary.resource_changes.any { it.change == "create" || it.change == "update" || it.change == "replace" }
                    
                    // if (resourcesChanged) { 

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
                            
                            sh 'curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -'
                            sh 'sudo apt-get install -y nodejs'
                            //sh 'sudo apt-get install -f'
                            sh 'sudo apt update'
                            sh 'npm install'
                            sh 'node -v'
                            sh 'npm -v'
                        
                            //sh 'export PATH="$NVM_DIR/versions/node/v${NODEJS_VERSION}/bin:$PATH"'
                            //sh 'export PATH="/var/lib/jenkins/.pulumi/bin:$PATH"'
                            //sh 'export npm_PATH="/usr/share/npm:$npm_PATH"'
                            sh 'npm install @pulumi/pulumi && npm install @pulumi/aws'
                            sh 'export PULUMI_CONFIG_PASSPHRASE="$PULUMI_CONFIG_PASSPHRASE"' 
                            sh './pulumi-up.sh'
                    }
                }
            }
        }

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