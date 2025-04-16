import { EndpointName, EndpointConfig } from '../models/endpoint';
import { FormData } from '../models/formData';
import { CustomerConfig } from '../types';

export interface FieldOverride {
    value?: any;
    transformation?: (value: any) => any;
    validation?: (value: any) => boolean | string;
    required?: boolean;
    dependsOn?: {
        field: keyof FormData;
        condition: (value: any) => boolean;
    };
}

export interface EndpointSpecificConfig {
    enabled: boolean;
    fieldMappings?: Partial<Record<keyof FormData, string | string[]>>;
    fieldOverrides?: Partial<Record<keyof FormData, FieldOverride>>;
    additionalFields?: Record<string, any>;
    validationRules?: Partial<Record<keyof FormData, (value: any) => boolean | string>>;
    fieldValidation?: {
        pattern: RegExp;
        errorMessage: string;
    }[];
}

export interface CustomerConfig {
    customerId: string;
    enabledEndpoints: string[];
    endpointSpecificConfig: Record<string, EndpointSpecificConfig>;
    defaultFieldOverrides?: Partial<Record<keyof FormData, FieldOverride>>;
    validationRules?: Partial<Record<keyof FormData, (value: any) => boolean | string>>;
    webhookUrl: string;
}

// Simple regex patterns for validation
const PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^\d{3}-\d{3}-\d{4}$/,
    DATE: /^\d{4}-\d{2}-\d{2}$/,
    NAME: /^[A-Za-z\s]{2,50}$/,
    CREDIT_SCORE: /^[3-8][0-9]{2}$/
};

// Log the patterns being used
console.log('\n=== Validation Patterns ===');
Object.entries(PATTERNS).forEach(([key, pattern]) => {
    console.log(`${key}: ${pattern}`);
});

// Example customer configurations
export const customerConfigs: Record<string, CustomerConfig> = {
    'CUST12345': {
        customerId: 'CUST12345',
        enabledEndpoints: ['CustomerProfileAPI', 'CreditCheckSystem'],
        webhookUrl: 'https://webhook.site/41ccf42f-9b0d-49b6-b3f4-59299a76d32b',
        endpointSpecificConfig: {
            CustomerProfileAPI: {
                name: 'CustomerProfileAPI',
                enabled: true,
                fieldValidation: [
                    {
                        pattern: PATTERNS.NAME,
                        errorMessage: 'Invalid name format'
                    },
                    {
                        pattern: PATTERNS.EMAIL,
                        errorMessage: 'Invalid email format'
                    }
                ]
            },
            CreditCheckSystem: {
                name: 'CreditCheckSystem',
                enabled: true,
                fieldValidation: [
                    {
                        pattern: PATTERNS.CREDIT_SCORE,
                        errorMessage: 'Credit score must be between 300 and 850'
                    }
                ]
            }
        }
    }
};

export function getCustomerConfig(customerId: string): CustomerConfig {
    const config = customerConfigs[customerId];
    if (!config) {
        throw new Error(`No configuration found for customer ${customerId}`);
    }
    return config;
}