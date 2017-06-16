compose-to-batch
==============

A CLI tool to transform a [`docker-compose.yml`](https://docs.docker.com/compose/compose-file/compose-file-v2/) into an [`AWS Batch job definition`](http://docs.aws.amazon.com/batch/latest/userguide/job_definitions.html).

This tool allows you to develop your job code on your `laptop` using docker:
```
$ docker-compose up
```

And then when you're ready to deploy to `AWS Batch`:
```
$ docker-compose config | compose-to-batch > job-definition.json
$ aws batch register-job-definition --cli-input-json file://job-definition.json
```


### usage

install
```
npm install -g compose-to-batch
```

given the following `docker-compose.yml`

```yaml
version: "2"
services:
  my-job:
    build: .
    image: 12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0
    environment:
      REGION: us-east-1
    labels:      
      composeToBatch.vcpus: 2
      composeToBatch.memory: 2000
      composeToBatch.jobRoleArn: arn:aws:iam::12345678910:role/my-role
```

running the following command

```bash
cat docker-compose.yml | compose-to-batch
```

will output the following

```json
{
  "jobDefinitionName": "my-job",
  "type": "container",
  "containerProperties": {
    "image": "image: 12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0",
    "environment": [
      {
        "name": "REGION",
        "value": "us-east-1"
      }
    ],
    "vcpus": "2",
    "memory": "2000",
    "jobRoleArn": "arn:aws:iam::12345678910:role/my-role"
  }
}
```

### mapping

- service -> jobDefinitionName
- service.image -> containerProperties.image
- service.command -> containerProperties.command
- service.environment -> containerProperties.environment
- service.labels.composeToBatch.vcpus -> containerProperties.vcpus
- service.labels.composeToBatch.memory -> containerProperties.memory
- service.labels.composeToBatch.jobRoleArn -> containerProperties.jobRoleArn
