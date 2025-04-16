import { FormData } from "./formData";

export type EndpointName =
    | "CustomerProfileAPI"
    | "AddressVerificationService"
    | "CreditCheckSystem"
    | "ProductCatalogService"
    | "RequestProcessingQueue"
    | "CommunicationPreferencesAPI"
    | "AccountManagementSystem"
    | "DocumentStorageService"
    | "ApprovalWorkflowEngine"
    | "ConsentManagementService"
    | "AuditLogService"
    | "DeviceTrackingSystem"
    | "EmploymentVerificationAPI"
    | "MarketingAutomationPlatform"
    | "FraudDetectionService"
    | "WebhookEndpoint";

export interface EndpointConfig {
    name: EndpointName;
    path: string;
    requiredFields: (keyof FormData)[];
    fieldTransformations?: {
        [K in keyof FormData]?: (value: FormData[K]) => any;
    };
    validationRules?: {
        [K in keyof FormData]?: (value: FormData[K]) => boolean | string;
    };
    dateFormat?: 'ISO' | 'UNIX' | 'US' | 'EU';
    retryConfig?: {
        maxRetries: number;
        retryDelay: number;
    };
}

export const endpointConfigs: Record<EndpointName, EndpointConfig> = {
    CustomerProfileAPI: {
        name: 'CustomerProfileAPI',
        path: '/customer/profile',
        requiredFields: ['personalName', 'customerID', 'emailAddress', 'phoneNumber', 'dateOfBirth'],
        fieldTransformations: {
            personalName: (value: string) => {
                const [firstName, ...lastNameParts] = value.split(' ');
                return {
                    firstName,
                    lastName: lastNameParts.join(' ')
                };
            },
            dateOfBirth: (value: string) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US');
            }
        }
    },
    AddressVerificationService: {
        name: 'AddressVerificationService',
        path: '/verify/address',
        requiredFields: ['customerID', 'currentAddress', 'mailingAddress'],
        fieldTransformations: {
            currentAddress: (value: string) => parseAddress(value),
            mailingAddress: (value: string) => parseAddress(value)
        }
    },
    CreditCheckSystem: {
        name: 'CreditCheckSystem',
        path: '/credit/check',
        requiredFields: ['customerID', 'incomeRange', 'creditScore'],
        fieldTransformations: {
            incomeRange: (value: string) => {
                const ranges = {
                    '$0-$25k': 0,
                    '$25k-$50k': 25000,
                    '$50k-$75k': 50000,
                    '$75k-$100k': 75000,
                    '$100k+': 100000
                };
                return ranges[value as keyof typeof ranges];
            }
        }
    },
    ProductCatalogService: {
        name: 'ProductCatalogService',
        path: '/product/catalog',
        requiredFields: ['productCategory', 'customerID'],
        fieldTransformations: {
            productCategory: (value: string) => {
                const codes = {
                    'Loans': 'LN',
                    'Insurance': 'IN',
                    'Investments': 'IV',
                    'Banking': 'BK',
                    'Credit Cards': 'CC'
                };
                return codes[value as keyof typeof codes];
            }
        }
    },
    RequestProcessingQueue: {
        name: 'RequestProcessingQueue',
        path: '/request/queue',
        requiredFields: ['customerID', 'requestDate', 'priorityLevel', 'documentType'],
        fieldTransformations: {
            priorityLevel: (value: string) => {
                const levels = {
                    'Low': 1,
                    'Medium': 2,
                    'High': 3,
                    'Urgent': 4
                };
                return levels[value as keyof typeof levels];
            },
            requestDate: (value: string) => {
                return new Date(value).toISOString().split('T')[0];
            }
        }
    },
    CommunicationPreferencesAPI: {
        name: 'CommunicationPreferencesAPI',
        path: '/communication/preferences',
        requiredFields: ['customerID', 'preferredContactMethod', 'emailAddress', 'phoneNumber', 'marketingOptIn'],
        fieldTransformations: {
            preferredContactMethod: (value: string) => {
                const codes = {
                    'Email': 'E',
                    'Phone': 'P',
                    'Mail': 'M',
                    'SMS': 'S'
                };
                return codes[value as keyof typeof codes];
            },
            marketingOptIn: (value: boolean) => value ? 'Y' : 'N'
        }
    },
    AccountManagementSystem: {
        name: 'AccountManagementSystem',
        path: '/account/manage',
        requiredFields: ['customerID', 'accountType', 'lastUpdated'],
        fieldTransformations: {
            accountType: (value: string) => {
                const codes = {
                    'Personal': 1,
                    'Business': 2,
                    'Joint': 3,
                    'Trust': 4
                };
                return codes[value as keyof typeof codes];
            },
            lastUpdated: (value: string) => Math.floor(new Date(value).getTime() / 1000)
        }
    },
    DocumentStorageService: {
        name: 'DocumentStorageService',
        path: '/document/storage',
        requiredFields: ['customerID', 'documentType', 'documentID'],
        fieldTransformations: {
            documentType: (value: string) => {
                const codes = {
                    'Application': 'A',
                    'Verification': 'V',
                    'Statement': 'S',
                    'Contract': 'C'
                };
                return codes[value as keyof typeof codes];
            }
        }
    },
    ApprovalWorkflowEngine: {
        name: 'ApprovalWorkflowEngine',
        path: '/approval/workflow',
        requiredFields: ['customerID', 'approvalStatus', 'processingNotes', 'agentID'],
        fieldTransformations: {
            approvalStatus: (value: string) => {
                const codes = {
                    'Pending': 0,
                    'Approved': 1,
                    'Rejected': 2,
                    'Under Review': 3
                };
                return codes[value as keyof typeof codes];
            },
            processingNotes: (value: string) => value.substring(0, 200)
        }
    },
    ConsentManagementService: {
        name: 'ConsentManagementService',
        path: '/consent/manage',
        requiredFields: ['customerID', 'consentGiven', 'lastUpdated'],
        fieldTransformations: {
            consentGiven: (value: boolean) => value.toString(),
            lastUpdated: (value: string) => new Date(value).toISOString()
        }
    },
    AuditLogService: {
        name: 'AuditLogService',
        path: '/audit/log',
        requiredFields: ['customerID', 'lastUpdated', 'agentID', 'ipAddress'],
        fieldTransformations: {
            lastUpdated: (value: string) => new Date(value).toISOString()
        }
    },
    DeviceTrackingSystem: {
        name: 'DeviceTrackingSystem',
        path: '/device/track',
        requiredFields: ['customerID', 'deviceType', 'ipAddress'],
        fieldTransformations: {
            deviceType: (value: string) => {
                const codes = {
                    'Desktop': 'D',
                    'Mobile': 'M',
                    'Tablet': 'T',
                    'Other': 'O'
                };
                return codes[value as keyof typeof codes];
            }
        }
    },
    EmploymentVerificationAPI: {
        name: 'EmploymentVerificationAPI',
        path: '/employment/verify',
        requiredFields: ['customerID', 'employmentStatus', 'incomeRange'],
        fieldTransformations: {
            employmentStatus: (value: string) => {
                const codes = {
                    'Employed': 'FT',
                    'Self-employed': 'SE',
                    'Unemployed': 'UE',
                    'Retired': 'RT',
                    'Student': 'ST'
                };
                return codes[value as keyof typeof codes];
            },
            incomeRange: (value: string) => {
                const ranges = {
                    '$0-$25k': '0-25000',
                    '$25k-$50k': '25000-50000',
                    '$50k-$75k': '50000-75000',
                    '$75k-$100k': '75000-100000',
                    '$100k+': '100000+'
                };
                return ranges[value as keyof typeof ranges];
            }
        }
    },
    MarketingAutomationPlatform: {
        name: 'MarketingAutomationPlatform',
        path: '/marketing/automate',
        requiredFields: ['customerID', 'personalName', 'emailAddress', 'marketingOptIn', 'productCategory'],
        fieldTransformations: {
            personalName: (value: string) => value,
            marketingOptIn: (value: boolean) => value,
            productCategory: (value: string) => value
        }
    },
    FraudDetectionService: {
        name: 'FraudDetectionService',
        path: '/fraud/detect',
        requiredFields: ['customerID', 'ipAddress', 'deviceType', 'requestDate', 'creditScore'],
        fieldTransformations: {
            requestDate: (value: string) => Math.floor(new Date(value).getTime() / 1000),
            deviceType: (value: string) => value,
            creditScore: (value: number) => {
                if (value >= 740) return 'Excellent';
                if (value >= 670) return 'Good';
                if (value >= 580) return 'Fair';
                return 'Poor';
            }
        }
    },
    WebhookEndpoint: {
        name: 'WebhookEndpoint',
        path: '/webhook',
        requiredFields: ['customerID'],
        fieldTransformations: {
            customerID: (value: string) => value
        }
    }
};

function parseAddress(address: string): {
    street: string;
    city: string;
    state: string;
    zip: string;
} {
    const parts = address.split(',');
    const street = parts[0].trim();
    const city = parts[1].trim();
    const stateZip = parts[2].trim().split(' ');
    const state = stateZip[0];
    const zip = stateZip[1];
    
    return { street, city, state, zip };
}