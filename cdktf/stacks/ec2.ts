import { AwsProvider } from '@cdktf/provider-aws';
import {
  Ami,
  DataAwsAmi,
  Instance,
  KeyPair,
} from '@cdktf/provider-aws/lib/ec2';
import {
  DataAwsSubnet,
  DataAwsVpc,
  SecurityGroup,
} from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput, TerraformStack, TerraformVariable } from 'cdktf';
import { Construct } from 'constructs';

export type Config = {
  environment?: string;
  region?: string;
  availabilityZone?: string;
};

export default class EC2Stack extends TerraformStack {
  constructor(
    scope: Construct,
    name: string,
    config: Config = {
      availabilityZone: 'ap-southeast-1',
      environment: 'demo',
      region: 'ap-southeast-1',
    }
  ) {
    super(scope, name);

    const availabilityZone = new TerraformVariable(scope, 'availability_zone', {
      type: 'string',
      default: config.availabilityZone,
    });

    const environment = new TerraformVariable(scope, 'environment', {
      type: 'string',
      default: config.environment,
    });

    const region = new TerraformVariable(scope, 'region', {
      type: 'string',
      default: config.region,
    });

    new AwsProvider(scope, 'aws', {
      region: region.value,
    });

    const vpc = new DataAwsVpc(scope, 'vpc', {
      tags: {
        Name: `terraform-vpc-${environment.value}`,
      },
    });

    const subnet = new DataAwsSubnet(scope, 'subnet', {
      vpcId: vpc.id,
      availabilityZone: availabilityZone.value,
      tags: {
        Public: '1',
      },
    });

    const securityGroup = new SecurityGroup(scope, 'security_group', {
      name: `terraform-security-group-${environment.value}`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 0,
          toPort: 0,
          protocol: '1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: `-1`,
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    const ami = new DataAwsAmi(scope, 'ubuntu', {
      mostRecent: true,
      owners: ['099720109477'],
      filter: [
        {
          name: 'name',
          values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
        },
        {
          name: 'virtualzation-type',
          values: ['hvm'],
        },
      ],
    });

    const keyPair = new KeyPair(scope, 'kaypari', {
      keyName: `terraform-demo`,
      publicKey:
        'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJ8sJK6k6pjPnBj2v9xCjke9P8kWSBhssDqP0lrDww/C tangjirouboi@gmail.com',
    });

    const instance = new Instance(scope, 'instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: subnet.id,
      vpcSecurityGroupIds: [securityGroup.id],
      keyName: keyPair.id,
      tags: {
        Terraform: 'true',
        Name: `terraform-ec2-${environment.value}`,
      },
    });

    new TerraformOutput(scope, 'ip', {
      value: instance.publicIp,
    });
  }
}
