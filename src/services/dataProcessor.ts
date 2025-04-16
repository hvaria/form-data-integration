// src/services/dataProcessor.ts
import { FormData, CustomerConfig } from '../types';
import { ProcessingError, ErrorCategory } from '../utils/errorHandler';
import axios from 'axios';
import { customerConfigs } from '../config/customerConfig';

export class DataProcessor {
    async processFormData(formData: FormData, customerId: string): Promise<void> {
        console.log('\n=== Starting Form Data Processing ===');
        console.log(`Processing data for customer: ${customerId}`);
        
        try {
            // Get customer configuration
            const customerConfig = this.getCustomerConfig(customerId);
            
            // Process each enabled endpoint
            for (const endpoint of customerConfig.enabledEndpoints) {
                const endpointConfig = customerConfig.endpointSpecificConfig[endpoint];
                if (!endpointConfig?.enabled) continue;

                console.log(`\nValidating endpoint: ${endpoint}`);

                // Validate fields if validation rules exist
                if (endpointConfig.fieldValidation) {
                    for (const rule of endpointConfig.fieldValidation) {
                        const fieldName = Object.keys(formData).find(key => 
                            rule.pattern.source.toLowerCase().includes(key.toLowerCase())
                        );

                        if (!fieldName) {
                            console.warn(`Warning: No matching field found for pattern ${rule.pattern}`);
                            continue;
                        }

                        const value = String(formData[fieldName]);
                        console.log(`Validating ${fieldName}: ${value}`);

                        if (!rule.pattern.test(value)) {
                            throw new ProcessingError(`Validation failed: ${rule.errorMessage}`, {
                                customerId,
                                category: ErrorCategory.VALIDATION,
                                endpoint,
                                field: fieldName
                            });
                        }
                    }
                }
            }

            // Send to webhook
            const webhookPayload = {
                customerId,
                formData,
                timestamp: new Date().toISOString()
            };

            console.log('\nSending to webhook:', customerConfig.webhookUrl);
            await axios.post(customerConfig.webhookUrl, webhookPayload);
            console.log('✓ Data processed successfully');

        } catch (error) {
            if (error instanceof ProcessingError) throw error;
            
            throw new ProcessingError(error as Error, {
                customerId,
                category: ErrorCategory.PROCESSING,
                message: 'Failed to process form data'
            });
        }
    }

    private getCustomerConfig(customerId: string): CustomerConfig {
        const config = customerConfigs[customerId];
        if (!config) {
            throw new ProcessingError('Customer configuration not found', {
                customerId,
                category: ErrorCategory.CONFIGURATION
            });
        }
        return config;
    }
}