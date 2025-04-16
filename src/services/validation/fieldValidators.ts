import { FormData } from "../../models/formData";

type Validator = (value: any) => boolean | string;

export const fieldValidators: Record<keyof FormData, Validator[]> = {
    personalName: [
        (value: string) => value?.trim().length > 0 || 'Name is required',
        (value: string) => value?.includes(' ') || 'Full name must include first and last name'
    ],
    customerID: [
        (value: string) => value?.trim().length > 0 || 'Customer ID is required',
        (value: string) => /^[A-Z0-9]{8,}$/.test(value) || 'Invalid customer ID format'
    ],
    emailAddress: [
        (value: string) => value?.trim().length > 0 || 'Email is required',
        (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Invalid email format'
    ],
    phoneNumber: [
        (value: string) => value?.trim().length > 0 || 'Phone number is required',
        (value: string) => /^[\d\s-()]+$/.test(value) || 'Invalid phone number format'
    ],
    dateOfBirth: [
        (value: string) => value?.trim().length > 0 || 'Date of birth is required',
        (value: string) => {
            const date = new Date(value);
            return !isNaN(date.getTime()) || 'Invalid date format';
        },
        (value: string) => {
            const age = new Date().getFullYear() - new Date(value).getFullYear();
            return age >= 18 || 'Must be at least 18 years old';
        }
    ],
    currentAddress: [
        (value: string) => value?.trim().length > 0 || 'Current address is required',
        (value: string) => value?.includes(',') || 'Address must include city and state'
    ],
    mailingAddress: [
        (value: string) => value?.trim().length > 0 || 'Mailing address is required',
        (value: string) => value?.includes(',') || 'Address must include city and state'
    ],
    employmentStatus: [
        (value: string) => value?.trim().length > 0 || 'Employment status is required',
        (value: string) => ['Employed', 'Self-employed', 'Unemployed', 'Retired', 'Student'].includes(value) || 'Invalid employment status'
    ],
    incomeRange: [
        (value: string) => value?.trim().length > 0 || 'Income range is required',
        (value: string) => ['$0-$25k', '$25k-$50k', '$50k-$75k', '$75k-$100k', '$100k+'].includes(value) || 'Invalid income range'
    ],
    creditScore: [
        (value: number) => value !== undefined || 'Credit score is required',
        (value: number) => value >= 300 && value <= 850 || 'Credit score must be between 300 and 850'
    ],
    productCategory: [
        (value: string) => value?.trim().length > 0 || 'Product category is required',
        (value: string) => ['Loans', 'Insurance', 'Investments', 'Banking', 'Credit Cards'].includes(value) || 'Invalid product category'
    ],
    requestDate: [
        (value: string) => value?.trim().length > 0 || 'Request date is required',
        (value: string) => {
            const date = new Date(value);
            return !isNaN(date.getTime()) || 'Invalid date format';
        }
    ],
    priorityLevel: [
        (value: string) => value?.trim().length > 0 || 'Priority level is required',
        (value: string) => ['Low', 'Medium', 'High', 'Urgent'].includes(value) || 'Invalid priority level'
    ],
    preferredContactMethod: [
        (value: string) => value?.trim().length > 0 || 'Preferred contact method is required',
        (value: string) => ['Email', 'Phone', 'Mail', 'SMS'].includes(value) || 'Invalid contact method'
    ],
    accountType: [
        (value: string) => value?.trim().length > 0 || 'Account type is required',
        (value: string) => ['Personal', 'Business', 'Joint', 'Trust'].includes(value) || 'Invalid account type'
    ],
    documentType: [
        (value: string) => value?.trim().length > 0 || 'Document type is required',
        (value: string) => ['Application', 'Verification', 'Statement', 'Contract'].includes(value) || 'Invalid document type'
    ],
    documentID: [
        (value: string) => value?.trim().length > 0 || 'Document ID is required',
        (value: string) => /^[A-Z0-9]{8,}$/.test(value) || 'Invalid document ID format'
    ],
    approvalStatus: [
        (value: string) => value?.trim().length > 0 || 'Approval status is required',
        (value: string) => ['Pending', 'Approved', 'Rejected', 'Under Review'].includes(value) || 'Invalid approval status'
    ],
    processingNotes: [
        (value: string) => value?.trim().length > 0 || 'Processing notes are required',
        (value: string) => value.length <= 500 || 'Processing notes must be 500 characters or less'
    ],
    consentGiven: [
        (value: boolean) => value !== undefined || 'Consent status is required',
        (value: boolean) => typeof value === 'boolean' || 'Consent must be true or false'
    ],
    marketingOptIn: [
        (value: boolean) => value !== undefined || 'Marketing opt-in status is required',
        (value: boolean) => typeof value === 'boolean' || 'Marketing opt-in must be true or false'
    ],
    lastUpdated: [
        (value: string) => value?.trim().length > 0 || 'Last updated timestamp is required',
        (value: string) => {
            const date = new Date(value);
            return !isNaN(date.getTime()) || 'Invalid timestamp format';
        }
    ],
    agentID: [
        (value: string) => value?.trim().length > 0 || 'Agent ID is required',
        (value: string) => /^[A-Z]{3}\d{3}$/.test(value) || 'Invalid agent ID format'
    ],
    deviceType: [
        (value: string) => value?.trim().length > 0 || 'Device type is required',
        (value: string) => ['Desktop', 'Mobile', 'Tablet', 'Other'].includes(value) || 'Invalid device type'
    ],
    ipAddress: [
        (value: string) => value?.trim().length > 0 || 'IP address is required',
        (value: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(value) || 'Invalid IP address format'
    ]
};

export function getValidator(field: keyof FormData): (value: any) => boolean | string {
    return (value: any) => {
        const validators = fieldValidators[field];
        for (const validator of validators) {
            const result = validator(value);
            if (result !== true) {
                return result;
            }
        }
        return true;
    };
}

export function validateFormData(formData: Partial<FormData>): Record<keyof FormData, string[]> {
    const errors: Record<keyof FormData, string[]> = {} as Record<keyof FormData, string[]>;
    
    for (const [field, validators] of Object.entries(fieldValidators)) {
        const fieldErrors: string[] = [];
        const value = formData[field as keyof FormData];
        
        for (const validator of validators) {
            const result = validator(value);
            if (typeof result === 'string') {
                fieldErrors.push(result);
            }
        }
        
        if (fieldErrors.length > 0) {
            errors[field as keyof FormData] = fieldErrors;
        }
    }
    
    return errors;
}

// Composite validators
export const CompositeValidators = {
    forCustomerProfileAPI: (data: Partial<FormData>): true | string => {
        const errors: string[] = [];

        if (!getValidator('personalName')(data.personalName)) {
            errors.push("Personal name is required");
        }
        if (!getValidator('emailAddress')(data.emailAddress)) {
            errors.push("Invalid email format");
        }
        if (data.dateOfBirth && !getValidator('dateOfBirth')(data.dateOfBirth)) {
            errors.push("Must be at least 18 years old");
        }

        return errors.length === 0 ? true : errors.join(", ");
    },

    forCreditCheckSystem: (data: Partial<FormData>): true | string => {
        const errors: string[] = [];

        if (data.creditScore !== undefined && !getValidator('creditScore')(data.creditScore)) {
            errors.push("Credit score must be between 300-850");
        }
        if (data.incomeRange && !getValidator('incomeRange')(data.incomeRange)) {
            errors.push("Invalid income range");
        }

        return errors.length === 0 ? true : errors.join(", ");
    }
};