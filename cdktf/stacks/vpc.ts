import { AwsProvider } from '@cdktf/provider-aws';
import {
  InternetGateway,
  RouteTable,
  RouteTableAssociation,
  Subnet,
  Vpc,
} from '@cdktf/provider-aws/lib/vpc';
import { TerraformStack, TerraformVariable } from 'cdktf';
import { Construct } from 'constructs';

export type Config = {
  environment?: string;
  region?: string;
  availabilityZone?: string;
};

export default class VPCStack extends TerraformStack {
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

    const vpc = new Vpc(scope, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      instanceTenancy: 'default',
      tags: {
        Terraform: 'true',
        Name: `terraform-vpc-${environment.value}`,
      },
    });

    const publicSubnet = new Subnet(scope, 'public_subnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      mapPublicIpOnLaunch: true,
      availabilityZone: availabilityZone.value,
      tags: {
        Public: '1',
        Terraform: 'true',
      },
    });

    const gateway = new InternetGateway(scope, 'gateway', {
      vpcId: vpc.id,
      tags: {
        Terraform: 'true',
        Name: `terraform-gateway-${environment.value}`,
      },
    });

    const routeTable = new RouteTable(scope, 'route_table', {
      vpcId: vpc.id,
      route: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: gateway.id,
        },
      ],
      tags: {
        Terraform: 'true',
        Name: `terraform-rt-${environment.value}`,
      },
    });

    new RouteTableAssociation(scope, 'route_table_association', {
      subnetId: publicSubnet.id,
      routeTableId: routeTable.id,
    });
  }
}
