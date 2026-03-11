# Test Suite - Candidates Feature

Comprehensive unit tests for the Candidate Document Intake feature.

## Structure

```
test/
├── fixtures/              # Test data and mocks
│   └── candidate.fixture.ts
├── services/              # Service layer tests
│   └── candidates.service.spec.ts
├── controllers/           # Controller layer tests
│   └── candidates.controller.spec.ts
├── setup.ts              # Global test configuration
└── README.md             # This file
```

## Test Coverage

### Service Tests (`candidates.service.spec.ts`)

Tests the business logic layer in isolation with mocked repositories.

**Test Suites:**
- `uploadDocument` - Document upload and storage
- `requestSummaryGeneration` - Summary creation and queue integration
- `listSummaries` - Retrieve all summaries for a candidate
- `getSummary` - Retrieve single summary by ID
- `updateSummaryWithResult` - Update with LLM results
- `updateSummaryWithError` - Handle processing errors

**Key Scenarios:**
- ✅ Successful operations
- ✅ Workspace access control enforcement
- ✅ Metadata storage and retrieval
- ✅ Queue integration
- ✅ Error handling
- ✅ Null/missing data handling

### Controller Tests (`candidates.controller.spec.ts`)

Tests HTTP endpoints with mocked service layer.

**Test Suites:**
- `POST /candidates/:candidateId/documents` - Upload document (201 Created)
- `POST /candidates/:candidateId/summaries/generate` - Request summary (202 Accepted)
- `GET /candidates/:candidateId/summaries` - List summaries (200 OK)
- `GET /candidates/:candidateId/summaries/:summaryId` - Get summary (200 OK)
- `Auth & Authorization` - Guard and decorator verification
- `Error Handling` - Exception propagation

**Key Scenarios:**
- ✅ Correct HTTP status codes
- ✅ Request/response validation
- ✅ User context passing
- ✅ Workspace isolation
- ✅ Auth guard integration
- ✅ Error handling and propagation

## Running Tests

### Run all tests
```bash
npm test
```

### Run with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test -- test/services/candidates.service.spec.ts
npm test -- test/controllers/candidates.controller.spec.ts
```

### Run in watch mode
```bash
npm test -- --watch
```

### Run specific test suite
```bash
npm test -- --testNamePattern="uploadDocument"
```

## Test Philosophy

These tests focus on **real scenarios that catch bugs**, not just coverage numbers:

1. **Workspace Isolation** - Every test verifies that workspace scoping works correctly
2. **Error Cases** - Tests cover missing data, invalid input, and service failures
3. **Integration Points** - Tests verify that layers communicate correctly
4. **User Context** - Tests ensure auth context flows through the system
5. **Data Transformation** - Tests verify DTOs and mappers work correctly

## Fixtures

The `candidate.fixture.ts` file provides reusable test data:

- `mockUser` - Authenticated user with workspace
- `mockCandidate` - Sample candidate
- `mockDocument` - Sample document
- `mockSummary` - Sample summary
- `mockUploadDocumentDto` - Valid upload DTO
- `mockInvalidUploadDto` - Invalid upload DTO (for validation tests)

## Mocking Strategy

### Service Tests
- Mock repositories using `jest.fn()`
- Mock QueueService for async operations
- Mock CandidateMapper for response transformation

### Controller Tests
- Mock CandidatesService completely
- Mock CandidateMapper for response transformation
- Test controller logic in isolation

## Coverage Goals

- **Service Layer**: 90%+ coverage
- **Controller Layer**: 85%+ coverage
- **Overall**: 85%+ coverage

Current coverage can be checked with:
```bash
npm test -- --coverage
```

## Adding New Tests

When adding new features:

1. Create fixtures in `candidate.fixture.ts`
2. Add service tests in `candidates.service.spec.ts`
3. Add controller tests in `candidates.controller.spec.ts`
4. Run tests to verify: `npm test`
5. Check coverage: `npm test -- --coverage`

## Common Patterns

### Testing a service method
```typescript
it('should do something', async () => {
  // Arrange
  jest.spyOn(repository, 'save').mockResolvedValue(mockData);

  // Act
  const result = await service.method(input);

  // Assert
  expect(repository.save).toHaveBeenCalledWith(expectedData);
  expect(result).toEqual(expectedResult);
});
```

### Testing a controller endpoint
```typescript
it('should handle request', async () => {
  // Arrange
  jest.spyOn(service, 'method').mockResolvedValue(mockResponse);

  // Act
  const result = await controller.endpoint(params, mockUser);

  // Assert
  expect(service.method).toHaveBeenCalledWith(mockUser, params);
  expect(result).toEqual(mockResponse);
});
```

### Testing workspace isolation
```typescript
it('should enforce workspace access control', async () => {
  const otherWorkspaceUser = { ...mockUser, workspaceId: 'other' };
  jest.spyOn(repository, 'find').mockResolvedValue([]);

  await service.method(otherWorkspaceUser, params);

  expect(repository.find).toHaveBeenCalledWith({
    where: { workspaceId: otherWorkspaceUser.workspaceId },
  });
});
```

## Debugging Tests

### Run single test with verbose output
```bash
npm test -- test/services/candidates.service.spec.ts --verbose
```

### Run with debugging
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome DevTools.

## CI/CD Integration

These tests are designed to run in CI/CD pipelines:

```bash
# Run tests with coverage and exit with code 1 if coverage is below threshold
npm test -- --coverage --coverageThreshold='{"global":{"branches":80,"functions":80,"lines":80,"statements":80}}'
```

## Next Steps

After these tests pass:
1. Add integration tests for full workflows
2. Add E2E tests with real database
3. Add performance tests for queue operations
4. Add tests for LLM provider integration
