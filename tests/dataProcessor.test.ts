import { DataProcessor } from '../src/services/dataProcessor';
import { FormData } from '../src/models/formData';
import { ProcessingError, ErrorCategory } from '../src/utils/errorHandler';
import { EndpointName } from '../src/models/endpoint';

// Mock fetch
global.fetch = jest.fn();

describe('DataProcessor', () => {
    let processor: DataProcessor;
    const mockBaseUrl = 'http://api.example.com';
    const mockCustomerId = 'customer123';
    const mockFormData: FormData = {
        personalName: 'John Doe',
        customerID: '12345',
        emailAddress: 'john@example.com',
        phoneNumber: '1234567890',
        dateOfBirth: '1990-01-01',
        currentAddress: '123 Main St',
        mailingAddress: '123 Main St',
        employmentStatus: 'Employed',
        incomeRange: '$50k-$75k',
        creditScore: 750,
        productCategory: 'Loans',
        requestDate: '2023-01-01',
        priorityLevel: 'Medium',
        preferredContactMethod: 'Email',
        accountType: 'Personal',
        documentType: 'Application',
        documentID: 'doc123',
        approvalStatus: 'Pending',
        processingNotes: 'Test notes',
        consentGiven: true,
        marketingOptIn: true,
        lastUpdated: '2023-01-01',
        agentID: 'agent123',
        deviceType: 'Desktop',
        ipAddress: '192.168.1.1'
    };

    beforeEach(() => {
        processor = new DataProcessor(mockBaseUrl);
        (global.fetch as jest.Mock).mockClear();
    });

    describe('processFormData', () => {
        it('should process form data successfully', async () => {
            // Mock successful API responses
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    status: 200
                })
            );

            await expect(processor.processFormData(mockFormData, mockCustomerId)).resolves.not.toThrow();
        });

        it('should handle API errors', async () => {
            // Mock API error
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    ok: false,
                    status: 500
                })
            );

            await expect(processor.processFormData(mockFormData, mockCustomerId)).rejects.toThrow(ProcessingError);
        });

        it('should handle network errors', async () => {
            // Mock network error
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.reject(new Error('Network error'))
            );

            await expect(processor.processFormData(mockFormData, mockCustomerId)).rejects.toThrow(ProcessingError);
        });
    });

    describe('processBatch', () => {
        it('should process multiple form data entries', async () => {
            // Mock successful API responses
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    status: 200
                })
            );

            const formDataArray = [mockFormData, mockFormData];
            await expect(processor.processBatch(formDataArray, mockCustomerId)).resolves.not.toThrow();
        });

        it('should handle errors in batch processing', async () => {
            // Mock alternating success and failure
            let callCount = 0;
            (global.fetch as jest.Mock).mockImplementation(() => {
                callCount++;
                return callCount % 2 === 0
                    ? Promise.resolve({ ok: true, status: 200 })
                    : Promise.resolve({ ok: false, status: 500 });
            });

            const formDataArray = [mockFormData, mockFormData];
            await expect(processor.processBatch(formDataArray, mockCustomerId)).rejects.toThrow(ProcessingError);
        });
    });

    describe('rate limiting', () => {
        it('should respect rate limits', async () => {
            const processor = new DataProcessor(mockBaseUrl, {
                rateLimit: { requestsPerMinute: 60 }
            });

            // Mock successful API responses
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({
                    ok: true,
                    status: 200
                })
            );

            const startTime = Date.now();
            await processor.processFormData(mockFormData, mockCustomerId);
            const endTime = Date.now();

            // Should take at least 1 second between requests (60 requests per minute)
            expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
        });
    });

    describe('retry mechanism', () => {
        it('should retry failed requests', async () => {
            const processor = new DataProcessor(mockBaseUrl, {
                maxRetries: 2
            });

            let callCount = 0;
            (global.fetch as jest.Mock).mockImplementation(() => {
                callCount++;
                return callCount < 3
                    ? Promise.resolve({ ok: false, status: 500 })
                    : Promise.resolve({ ok: true, status: 200 });
            });

            await expect(processor.processFormData(mockFormData, mockCustomerId)).resolves.not.toThrow();
            expect(global.fetch).toHaveBeenCalledTimes(3);
        });

        it('should give up after max retries', async () => {
            const processor = new DataProcessor(mockBaseUrl, {
                maxRetries: 2
            });

            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({ ok: false, status: 500 })
            );

            await expect(processor.processFormData(mockFormData, mockCustomerId)).rejects.toThrow(ProcessingError);
            expect(global.fetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
    });

    describe('error handling', () => {
        it('should properly categorize validation errors', async () => {
            const invalidFormData = { ...mockFormData, emailAddress: 'invalid-email' };
            
            try {
                await processor.processFormData(invalidFormData, mockCustomerId);
            } catch (error) {
                expect(error).toBeInstanceOf(ProcessingError);
                if (error instanceof ProcessingError) {
                    expect(error.category).toBe(ErrorCategory.VALIDATION);
                }
            }
        });

        it('should properly categorize API errors', async () => {
            (global.fetch as jest.Mock).mockImplementation(() =>
                Promise.resolve({ ok: false, status: 502 })
            );

            try {
                await processor.processFormData(mockFormData, mockCustomerId);
            } catch (error) {
                expect(error).toBeInstanceOf(ProcessingError);
                if (error instanceof ProcessingError) {
                    expect(error.category).toBe(ErrorCategory.API);
                }
            }
        });
    });

    describe('timeout handling', () => {
        it('should handle request timeouts', async () => {
            const processor = new DataProcessor(mockBaseUrl, {
                timeoutMs: 100
            });

            (global.fetch as jest.Mock).mockImplementation(() =>
                new Promise(resolve => setTimeout(() => resolve({ ok: true, status: 200 }), 200))
            );

            await expect(processor.processFormData(mockFormData, mockCustomerId)).rejects.toThrow('Request timed out');
        });
    });
}); 