import { EndpointName, EndpointConfig } from '../models/endpoint';
import { FormData } from '../models/formData';

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
}

export interface CustomerConfig {
    customerId: string;
    enabledEndpoints: EndpointName[];
    endpointSpecificConfig: Partial<Record<EndpointName, EndpointSpecificConfig>>;
    defaultFieldOverrides?: Partial<Record<keyof FormData, FieldOverride>>;
    validationRules?: Partial<Record<keyof FormData, (value: any) => boolean | string>>;
}

// Example customer configurations
export const customerConfigs: Record<string, CustomerConfig> = {
    'CUST001': {
        customerId: 'CUST001',
        enabledEndpoints: [
            'CustomerProfileAPI',
            'AddressVerificationService',
            'CreditCheckSystem',
            'ProductCatalogService',
            'DocumentStorageService',
            'WebhookEndpoint'
        ],
        endpointSpecificConfig: {
            CustomerProfileAPI: {
                enabled: true,
                fieldMappings: {
                    personalName: ['firstName', 'lastName']
                },
                fieldOverrides: {
                    dateOfBirth: {
                        validation: (value: string) => {
                            const age = new Date().getFullYear() - new Date(value).getFullYear();
                            return age >= 18 ? true : 'Customer must be at least 18 years old';
                        }
                    }
                }
            },
            CreditCheckSystem: {
                enabled: true,
                fieldOverrides: {
                    creditScore: {
                        validation: (value: number) => {
                            return value >= 300 && value <= 850 ? true : 'Credit score must be between 300 and 850';
                        }
                    }
                }
            },
            ProductCatalogService: {
                enabled: true,
                additionalFields: {
                    market: 'US',
                    channel: 'DIRECT'
                }
            },
            DocumentStorageService: {
                enabled: true,
                additionalFields: {
                    storageType: 'SECURE',
                    retention: 'STANDARD'
                }
            },
            WebhookEndpoint: {
                enabled: true,
                additionalFields: {
                    webhookUrl: 'https://webhook.site/4a2dd565-c5dc-4f3b-a423-cad62bcfd47f',
                    secret: 'your-webhook-secret'
                }
            }
        },
        defaultFieldOverrides: {
            consentGiven: {
                required: true,
                validation: (value: boolean) => value === true ? true : 'Consent must be given'
            }
        }
    },
    'CUST002': {
        customerId: 'CUST002',
        enabledEndpoints: [
            'ProductCatalogService',
            'RequestProcessingQueue',
            'CommunicationPreferencesAPI',
            'DocumentStorageService',
            'WebhookEndpoint'
        ],
        endpointSpecificConfig: {
            ProductCatalogService: {
                enabled: true,
                fieldOverrides: {
                    productCategory: {
                        dependsOn: {
                            field: 'incomeRange',
                            condition: (value: string) => value !== '$0-$25k'
                        }
                    }
                },
                additionalFields: {
                    market: 'EU',
                    channel: 'PARTNER'
                }
            },
            CommunicationPreferencesAPI: {
                enabled: true,
                additionalFields: {
                    language: 'en',
                    timezone: 'UTC'
                }
            },
            DocumentStorageService: {
                enabled: true,
                additionalFields: {
                    storageType: 'STANDARD',
                    retention: 'EXTENDED'
                }
            },
            WebhookEndpoint: {
                enabled: true,
                additionalFields: {
                    webhookUrl: 'https://webhook.site/67986567-5224-4759-9943-d821b544d068',
                    secret: 'your-webhook-secret'
                }
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