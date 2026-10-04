import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const swaggerSpec = require('../swagger.json');

export default swaggerSpec;