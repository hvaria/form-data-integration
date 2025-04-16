import { EndpointName } from "../models/endpoint";
import { FormData } from "../models/formData";

export interface FieldOverride {
    defaultValue?: any;
    required?: boolean;
    validationRules?: ((value: any) => boolean | string)[];
    transformation?: (value: any) => any;
}

export interface EndpointSpecificConfig {
    fieldMappings?: {
        [sourceField in keyof FormData]?: string; // Map source field to different destination field name
    };
    additionalFields?: Record<string, any>;
    required?: boolean;
    conditionalLogic?: {
        when: (formData: FormData) => boolean;
        then: Partial<EndpointSpecificConfig>;
        otherwise?: Partial<EndpointSpecificConfig>;
    };
}

export interface CustomerConfig {
    customerId: string;
    enabledEndpoints: EndpointName[];
    fieldOverrides?: {
        [field in keyof FormData]?: FieldOverride;
    };
    endpointSpecificConfig?: {
        [endpoint in EndpointName]?: EndpointSpecificConfig;
    };
    defaultValues?: Partial<FormData>;
}

// Complete customer configurations for all 10 customers
export const customerConfigs: Record<string, CustomerConfig> = {
    CUST12345: {
        customerId: "CUST12345",
        enabledEndpoints: [
            "CustomerProfileAPI",
            "AddressVerificationService",
            "CreditCheckSystem",
            "CommunicationPreferencesAPI"
        ],
        fieldOverrides: {
            priorityLevel: {
                defaultValue: "Medium",
                required: true
            },
            consentGiven: {
                required: true,
                validationRules: [
                    (value) => value !== null || "Consent must be provided"
                ]
            }
        },
        endpointSpecificConfig: {
            CustomerProfileAPI: {
                fieldMappings: {
                    personalName: "fullName" // Maps to different field name in target API
                },
                additionalFields: {
                    systemSource: "webform-v2"
                }
            },
            CreditCheckSystem: {
                conditionalLogic: {
                    when: (formData) => formData.productCategory === "Loans",
                    then: { required: true },
                    otherwise: { required: false }
                }
            }
        }
    },
    // Additional customer configurations...
    CUST67890: {
        customerId: "CUST67890",
        enabledEndpoints: [
            "ProductCatalogService",
            "RequestProcessingQueue",
            "MarketingAutomationPlatform"
        ],
        fieldOverrides: {
            productCategory: {
                validationRules: [
                    (value) => value !== "Insurance" || "Insurance products not supported"
                ]
            },
            marketingOptIn: {
                defaultValue: true
            }
        },
        endpointSpecificConfig: {
            MarketingAutomationPlatform: {
                additionalFields: {
                    campaignId: "summer2023",
                    source: "web-form"
                }
            }
        },
        defaultValues: {
            deviceType: "Desktop",
            accountType: "Personal"
        }
    }
    // Add configurations for remaining 8 customers...
};

export function getCustomerConfig(customerId: string): CustomerConfig {
    const config = customerConfigs[customerId];
    if (!config) {
        throw new Error(`No configuration found for customer ${customerId}`);
    }
    return config;
}