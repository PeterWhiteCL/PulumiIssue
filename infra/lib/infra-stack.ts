import { Stack, StackProps, aws_s3 as s3, RemovalPolicy, aws_s3_deployment as s3Deployment, aws_cloudfront as cloudfront } from 'aws-cdk-lib';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfraStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // The code that defines your bucket s3
    const bucketName = "the-bucket-name-you-want"
    const myBucket = new s3.Bucket(this, bucketName, {
      autoDeleteObjects: true,
      // publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,        
      websiteIndexDocument: "index.html"
    });

    // The code that defines your deployment
    const deployment = new s3Deployment.BucketDeployment(this, "deployStaticWebsite", {
      sources: [s3Deployment.Source.asset("../static")],
      destinationBucket: myBucket
    });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "originAccessIdentity");
    myBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, "distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(myBucket, { originAccessIdentity }),
      }
    });
  }
}
