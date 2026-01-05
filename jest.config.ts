export default {
    // Global configuration
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/**/index.ts'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    verbose: true,
    maxWorkers: 1, // Run tests sequentially to avoid DB conflicts

    // Multiple test configurations (projects)
    projects: [
        {
            displayName: 'unit',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/unit/**/*.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/tests/setup.unit.ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1'
            },
            transform: {
                '^.+\\.tsx?$': ['ts-jest', {
                    tsconfig: {
                        esModuleInterop: true,
                        allowSyntheticDefaultImports: true,
                    }
                }]
            },
        },
        {
            displayName: 'integration',
            preset: 'ts-jest',
            testEnvironment: 'node',
            testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
            setupFilesAfterEnv: ['<rootDir>/tests/setup.integration.ts'],
            moduleNameMapper: {
                '^@/(.*)$': '<rootDir>/src/$1'
            },
            transform: {
                '^.+\\.tsx?$': ['ts-jest', {
                    tsconfig: {
                        esModuleInterop: true,
                        allowSyntheticDefaultImports: true,
                    }
                }]
            },
        }
    ]
};
