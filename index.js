#!/usr/bin/env node

const fs = require('fs')
const yaml = require('js-yaml')

let dockerComposeYaml = ''

//read bits from stdin
process.stdin.setEncoding('utf8')
process.stdin.on('readable', () => {
  let chunk = process.stdin.read()
  if (chunk !== null) dockerComposeYaml += chunk
})

process.stdin.on('end', () => {
  //parse docker-compose.yml
  let compose
  try {
    compose = yaml.safeLoad(dockerComposeYaml, 'utf8')
  } catch (e) {
    console.error(e)
  }

  //transform docker-compose format to job definition format
  jobDefinition = transform(compose)

  //write job definition to stdout
  console.log(JSON.stringify(jobDefinition, undefined, 2))
})

function transform(compose) {
  let result = {}

  const serviceName = Object.keys(compose.services)[0]
  const service = compose.services[serviceName]

  result.jobDefinitionName = serviceName
  result.type = 'container'
  result.containerProperties = {
    image: service.image,
    environment: [],
    vcpus: '2',
    memory: '2000'
  }

  //environment variables
  if (service.environment) {
    Object.keys(service.environment).forEach(env => {
      //ignore dynamic environment variables (for now)
      if (!service.environment[env].startsWith('${')) {
        result.containerProperties.environment.push({
          name: env,
          value: service.environment[env]
        })
      }
    })
  }

  //optional
  if (service.command) result.containerProperties.command = service.command

  if (service.labels) {
    Object.keys(service.labels).forEach(label => {
      if (label === 'composeToBatch.vcpus')
        result.containerProperties.vcpus = service.labels[label]

      if (label === 'composeToBatch.memory')
        result.containerProperties.memory = service.labels[label]

      if (label === 'composeToBatch.jobRoleArn')
        result.containerProperties.jobRoleArn = service.labels[label]
    })
  }

  return result
}

module.exports = transform
