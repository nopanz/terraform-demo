import 'cdktf/lib/testing/adapters/jest'; // Load types for expect matchers
import { Testing } from 'cdktf';
import VPCStack from '../stacks/vpc';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

describe('VPC Stack', () => {
  describe('Unit testing using assertions', () => {
    it('should contain a resource VPC', () => {
      expect(
        Testing.synthScope((scope) => {
          new VPCStack(scope, 'vpc-demo');
        })
      ).toHaveResource(Vpc);

      expect(
        Testing.synthScope((scope) => {
          new VPCStack(scope, 'vpc-demo');
        })
      ).toHaveResourceWithProperties(Vpc, { instance_tenancy: 'default' });
    });
  });
});
