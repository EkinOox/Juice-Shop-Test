require('dotenv').config();
require('ts-node/register');
require('source-map-support/register');

module.exports = {
  recursive: true,
  spec: 'test/server/**/*.ts'
};