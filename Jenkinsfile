pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        echo 'Building'
        dir("C:\Users\Iain_\Documents\GitHub\asteroids-app") {
          bat "pwd"
        }
        bat 'npm install'
      }
    }

    stage('Test') {
      steps {
        echo 'Testing'
        bat 'npm test'
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
