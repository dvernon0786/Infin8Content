/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidWorkflowState(): R
    }
  }
  
  var expect: jest.Expect
  var describe: jest.Describe
  var test: jest.It
  var it: jest.It
  var beforeAll: jest.Lifecycle
  var afterAll: jest.Lifecycle
  var beforeEach: jest.Lifecycle
  var afterEach: jest.Lifecycle
  var jest: jest.Jest
}

export {};
