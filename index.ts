import * as aws from "@pulumi/aws";

const ebsVolume = new aws.ebs.Volume("myEBSVolume", {
    size: 5,
    availabilityZone: "us-east-1a", // Change this to the desired availability zone
    tags: {
        Name: "MyEBSVolume",
    },
});

const group = new aws.ec2.SecurityGroup("web-secgrp", {
    ingress: [
        { protocol: "tcp", fromPort: 22, toPort: 22, cidrBlocks: ["0.0.0.0/0"] },
    ],
});

const server = new aws.ec2.Instance("ansibleserver", {
    instanceType: "t2.micro",
    securityGroups: [ group.name ], // reference the security group resource above
    ami: "aami-0230bd60aa48260c6",
    keyName:"ec2-automation-key",
    userData: `#!/bin/bash
              sudo yum update -y
              sudo yum install -y docker
              sudo service docker start
              sudo usermod -a -G docker ec2-user
              sudo chkconfig docker on
              sudo curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
              sudo unzip awscliv2.zip
              sudo ./aws/install
              sudo yum install -y ansible`, // installing ansible

    
});

export const publicIp = server.publicIp;
export const publicHostName = server.publicDns;
export const instanceId = server.id;
export const ebsVolumeId = ebsVolume.id;