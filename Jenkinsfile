pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        echo 'Building'
      }
    }

    stage('Test') {
      steps {
        echo 'Testing'
        sh 'npm test'
      }
    }

    stage('Deploy') {
      steps {
        echo 'Deploying'
      }
    }

  }
  environment {
    PATH = 'C:\\Program Files\\Git\\usr\\bin'
  }
}