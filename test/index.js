const assert = require('assert')
const yaml = require('js-yaml')
const transform = require('../.')

const service = 'my-job'
const vcpus = '4'
const memory = '8000'
const jobRoleArn = 'foo'
const envVarName = 'NAME1'
const envVarValue = 'VALUE1'
const envVarName2 = 'NAME2'
const envVarValue2 = 'VALUE2'

const dockerComposeYaml = `
version: "2"
services:
  ${service}:
    build: .
    image: 12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0
    environment:
      ${envVarName}: ${envVarValue}
      ${envVarName2}: ${envVarValue2}
    labels:      
      composeToBatch.vcpus: ${vcpus}
      composeToBatch.memory: ${memory}
      composeToBatch.jobRoleArn: ${jobRoleArn}
`
const compose = yaml.safeLoad(dockerComposeYaml, 'utf8')

describe('composeToBatch', () => {
  describe('transform()', () => {
    it('should map to the first service', () => {
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.jobDefinitionName, service)
    })

    it('should map the image', () => {
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.image, compose.image)
    })

    it('should map the env vars', () => {
      jobDefinition = transform(compose)

      assert.equal(
        jobDefinition.containerProperties.environment[0].name,
        envVarName
      )
      assert.equal(
        jobDefinition.containerProperties.environment[0].value,
        envVarValue
      )

      assert.equal(
        jobDefinition.containerProperties.environment[1].name,
        envVarName2
      )
      assert.equal(
        jobDefinition.containerProperties.environment[1].value,
        envVarValue2
      )
    })

    it('should map the vcpus', () => {
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.containerProperties.vcpus, vcpus)
    })

    it('should map the memory', () => {
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.containerProperties.memory, memory)
    })

    it('should map the jobRoleArn', () => {
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.containerProperties.jobRoleArn, jobRoleArn)
    })

    it('should map the command', () => {
      const arg1 = 'foo'
      const arg2 = 'bar'
      const dockerComposeYaml = `
version: "2"
services:
  service:
    command: [ "${arg1}", "${arg2}" ]
`
      const compose = yaml.safeLoad(dockerComposeYaml, 'utf8')
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.containerProperties.command[0], arg1)
      assert.equal(jobDefinition.containerProperties.command[1], arg2)
    })

    it('should ignore dynamic environment variables', () => {
      const dockerComposeYaml = `
version: "2"
services:
  service:
    environment:
      FOO: \${foo}
      BAR: bar
`
      const compose = yaml.safeLoad(dockerComposeYaml, 'utf8')
      jobDefinition = transform(compose)
      assert.equal(jobDefinition.containerProperties.environment[0].name, 'BAR')
    })
  })
})
