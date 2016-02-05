const findAll = require('../').findAll;

const expect = require('chai').expect;

describe('findAll', () => {
  it('retrieves a collection of kernel specs', () => {
    return findAll().then(dirs => {
      expect(dirs).to.have.any.keys('python3', 'python2');
    });
  });
});