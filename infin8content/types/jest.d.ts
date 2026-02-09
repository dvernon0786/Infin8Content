/// <reference types="jest" />

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidWorkflowState(): R
    }
  }
  
  const expect: jest.Expect
  const describe: jest.Describe
  const test: jest.It
  const it: jest.It
  const beforeAll: jest.Lifecycle
  const afterAll: jest.Lifecycle
  const beforeEach: jest.Lifecycle
  const afterEach: jest.Lifecycle
  const jest: jest.Jest
}
