export interface FormData {
    personalName: string;
    customerID: string;
    emailAddress: string;
    phoneNumber: string;
    dateOfBirth: string;
    currentAddress: string;
    mailingAddress: string;
    employmentStatus: string;
    incomeRange: string;
    creditScore: number;
    productCategory: string;
    requestDate: string;
    priorityLevel: string;
    preferredContactMethod: string;
    accountType: string;
    documentType: string;
    documentID: string;
    approvalStatus: string;
    processingNotes: string;
    consentGiven: boolean;
    marketingOptIn: boolean;
    lastUpdated: string;
    agentID: string;
    deviceType: string;
    ipAddress: string;
}

export interface CustomerConfig {
    customerId: string;
    enabledEndpoints: string[];
    webhookUrl: string;
    endpointSpecificConfig: Record<string, EndpointConfig>;
}

export interface EndpointConfig {
    name: string;
    enabled: boolean;
    fieldValidation?: ValidationRule[];
}

export interface ValidationRule {
    pattern: RegExp;
    errorMessage: string;
} 