import * as pulumi from "@pulumi/pulumi";
import * as pulumicdk from '@pulumi/cdk';
import { CfnElement, RemovalPolicy } from 'aws-cdk-lib';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3Deployment from "aws-cdk-lib/aws-s3-deployment";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3Assets from "aws-cdk-lib/aws-s3-assets";

import * as aws from "@pulumi/aws";
import * as awsnative from "@pulumi/aws-native";
import path = require("path");

function remapCloudControlResource(
  element: CfnElement,
  logicalId: string,
  typeName: string,
  rawProps: any,
  options: pulumi.ResourceOptions,
): pulumi.CustomResource | undefined {
  const props = pulumicdk.interop.normalize(rawProps);
  console.log( typeName );
  switch (typeName) {
    case "AWS::Lambda::LayerVersion":
      // console.log( props );
      return new aws.lambda.LayerVersion(
        "layerversion",
        {
          layerName: "layerversion",
          s3Key: props["content"].s3Key,
          s3Bucket: props[ "content"].s3Bucket,
        },
      );
    case "AWS::IAM::Role":
      // console.log( props );
      return new aws.iam.Role(
        "pulumi-cdk-role",
        {
          assumeRolePolicy: props["assumeRolePolicyDocument"],
          managedPolicyArns: props["managedPolicyArns"],
          name: "pulumi-cdk-role",
        },
      );
    case "Custom::CDKBucketDeployment":
      console.log( props );
      return new aws.s3.BucketObjectv2("static-dummy", {
        bucket: props[ "destinationBucketName" ],
        key: "dummyobject",
        source: new pulumi.asset.FileAsset( "../static/index.html" ),//props[ "sourceObjectKeys" ]
      });
      // return new aws.s3.BucketObjectv2("static-site",
      //   {
      //     key: ""
      //   }
      // );
      break;
    case "Custom::S3AutoDeleteObjects":
      console.log( props );
      // return new aws.s3.
      break;
  }

  return undefined;
}

export class InfraStack extends pulumicdk.Stack {
  cloudfrontUrl: pulumi.Output<string>;

  constructor(id: string, options?: pulumicdk.StackOptions) {
    super(id, { ...options, remapCloudControlResource });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfraQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });

    // // The code that defines your bucket s3
    // const bucketName = "someBucket"
    // const siteBucket = new s3.Bucket(this, bucketName, {
    //   // autoDeleteObjects: true,
    //   // publicReadAccess: true,
    //   removalPolicy: RemovalPolicy.DESTROY,        
    //   websiteIndexDocument: "index.html"
    // });

    // // const distribution = new cloudfront.CloudFrontWebDistribution(this, "distribution", {
    // //   originConfigs: [{
    // //     s3OriginSource: {
    // //       s3BucketSource: siteBucket,
    // //     },
    // //     behaviors: [{ isDefaultBehavior: true }],
    // //   }],
    // // });

    // // const distribution = new cloudfront.Distribution(this, "distribution", {
    // //   defaultRootObject: "index.html",
    // //   defaultBehavior: {
    // //     origin: new S3Origin(siteBucket),
    // //   }
    // // });

    // const deployment = new s3Deployment.BucketDeployment(this, "staticWebsite", {
    //   sources: [s3Deployment.Source.asset("../static")],
    //   destinationBucket: siteBucket,
    //   // distribution,
    //   // distributionPaths: [ "/*" ],
    // });

    // // this.cloudfrontUrl = this.asOutput(distribution.domainName);


    
    const bucketName = "someBucket";
    const myBucket = new s3.Bucket(this, bucketName, {
      // autoDeleteObjects: true,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,        
      websiteIndexDocument: "index.html"
    });

    // // The code that defines your deployment
    // const deployment = new s3Deployment.BucketDeployment(this, "deployStaticWebsite", {
    //   sources: [s3Deployment.Source.asset("../static")],
    //   destinationBucket: myBucket,
    // });

    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, "originAccessIdentity");
    myBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, "distribution", {
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(myBucket, { originAccessIdentity }),
      }
    });

    this.cloudfrontUrl = this.asOutput(distribution.domainName);

    this.synth();
  }
}

const stack = new InfraStack("website-stack");
export const url = stack.cloudfrontUrl;