import { App } from 'cdktf';
import VPCStack from './stacks/vpc';

const app = new App();

new VPCStack(app, 'vpc');
