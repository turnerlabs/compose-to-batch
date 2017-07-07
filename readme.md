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
```

running the following command

```bash
docker-compose config | compose-to-batch
```

will output the following

```json
{
  "jobDefinitionName": "my-job",
  "type": "container",
  "containerProperties": {
    "image": "12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0",
    "environment": [
      {
        "name": "REGION",
        "value": "us-east-1"
      }
    ],
    "vcpus": "2",
    "memory": "2000"
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


### local development using IAM keys and Batch with jobRoleArn

A common scenario is to do local development using IAM keys specified as environment variables in your container.  When you're ready to deploy to Batch, you typically don't want to expose your secret IAM keys.  

One way to accomplish this is to use docker compose's variable substitution feature by including your iam keys in a `.env` file and then reference those variables in your docker-compose.yml file.

```
AWS_ACCESS_KEY_ID=xyz
AWS_SECRET_ACCESS_KEY=xyz
```

```yaml
version: "2"
services:
  my-job:
    build: .
    image: 12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0
    environment:
      REGION: us-east-1
      S3_BUCKET: some-bucket
      AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID} 
      AWS_SECRET_ACCESS_KEY: ${AWS_SECRET_ACCESS_KEY}       
    labels:      
      composeToBatch.jobRoleArn: arn:aws:iam::12345678910:role/my-role
```

When you're ready to deploy to Batch, the following command will safely exclude your secret keys from the generated batch job definition and use the job role instead.

```
$ cat docker-compose.yml | compose-to-batch
```

```json
{
  "jobDefinitionName": "my-job",
  "type": "container",
  "containerProperties": {
    "image": "12345678910.dkr.ecr.us-east-1.amazonaws.com/my-job:0.1.0",
    "environment": [
      {
        "name": "REGION",
        "value": "us-east-1"
      },
      {
        "name": "S3_BUCKET",
        "value": "some-bucket"
      }      
    ],
    "vcpus": "2",
    "memory": "2000",
    "jobRoleArn": "arn:aws:iam::12345678910:role/my-role"
  }
}
```

However, if you DO want to include substituted environment variables, you can use `docker-compose config` instead since it returns the result of the variable substitution.

```
$ docker-compose.config | compose-to-batch
```