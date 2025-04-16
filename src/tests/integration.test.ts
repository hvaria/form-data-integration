import { ParallelProcessingService } from '../services/parallelProcessingService';
import { endpointConfigs } from '../models/endpoint';
import { FormData } from '../models/formData';

describe('Form Data Integration System', () => {
    let processingService: ParallelProcessingService;
    const sampleFormData: FormData = {
        customerID: '12345',
        personalName: 'John Doe',
        emailAddress: 'john@example.com',
        phoneNumber: '1234567890',
        dateOfBirth: '1990-01-01',
        currentAddress: '123 Main St, New York, NY 10001',
        mailingAddress: '123 Main St, New York, NY 10001',
        employmentStatus: 'Employed',
        incomeRange: '$50k-$75k',
        creditScore: 750,
        productCategory: 'Loans',
        requestDate: new Date().toISOString(),
        priorityLevel: 'Medium',
        preferredContactMethod: 'Email',
        accountType: 'Personal',
        documentType: 'Application',
        documentID: 'DOC123',
        approvalStatus: 'Pending',
        processingNotes: 'Initial application',
        consentGiven: true,
        marketingOptIn: true,
        lastUpdated: new Date().toISOString(),
        agentID: 'AGENT001',
        deviceType: 'Desktop',
        ipAddress: '192.168.1.1'
    };

    beforeAll(() => {
        processingService = new ParallelProcessingService(
            endpointConfigs.CustomerProfileAPI,
            process.env.OPENAI_API_KEY || '',
            'gpt-3.5-turbo',
            5,
            5
        );
    });

    describe('Form Processing', () => {
        it('should process form data successfully', async () => {
            const result = await processingService.processFormData(
                sampleFormData,
                endpointConfigs.CustomerProfileAPI,
                1
            );
            expect(result).toBeDefined();
        });

        it('should handle validation errors', async () => {
            const invalidData = { ...sampleFormData, emailAddress: 'invalid-email' };
            await expect(
                processingService.processFormData(
                    invalidData,
                    endpointConfigs.CustomerProfileAPI,
                    1
                )
            ).rejects.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors gracefully', async () => {
            const invalidService = new ParallelProcessingService(
                endpointConfigs.CustomerProfileAPI,
                'invalid-key',
                'gpt-3.5-turbo',
                5,
                5
            );
            await expect(
                invalidService.processFormData(sampleFormData, endpointConfigs.CustomerProfileAPI, 1)
            ).rejects.toThrow();
        });
    });
}); 