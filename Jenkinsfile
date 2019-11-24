pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'ping -c 2 localhost'
      }
    }

    stage('Test') {
      steps {
        sh 'ping -c 3 localhost'
      }
    }

    stage('Deploy') {
      steps {
        sh 'ping -c 4 localhost'
      }
    }

  }
}