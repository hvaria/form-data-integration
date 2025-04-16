import { FormData } from "../../models/formData";

type Transformer = (value: any) => any;

export const fieldTransformers: Record<keyof FormData, Transformer[]> = {
    personalName: [
        (value: string) => {
            const [firstName, ...lastNameParts] = value.split(' ');
            return {
                firstName,
                lastName: lastNameParts.join(' ')
            };
        }
    ],
    dateOfBirth: [
        (value: string) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US');
        },
        (value: string) => {
            const date = new Date(value);
            return date.toISOString().split('T')[0];
        }
    ],
    employmentStatus: [
        (value: string) => {
            const codes = {
                'Employed': 'FT',
                'Self-employed': 'SE',
                'Unemployed': 'UE',
                'Retired': 'RT',
                'Student': 'ST'
            };
            return codes[value as keyof typeof codes];
        }
    ],
    incomeRange: [
        (value: string) => {
            const ranges = {
                '$0-$25k': 0,
                '$25k-$50k': 25000,
                '$50k-$75k': 50000,
                '$75k-$100k': 75000,
                '$100k+': 100000
            };
            return ranges[value as keyof typeof ranges];
        }
    ],
    creditScore: [
        (value: number) => {
            if (value >= 740) return 'Excellent';
            if (value >= 670) return 'Good';
            if (value >= 580) return 'Fair';
            return 'Poor';
        }
    ],
    productCategory: [
        (value: string) => {
            const codes = {
                'Loans': 'LN',
                'Insurance': 'IN',
                'Investments': 'IV',
                'Banking': 'BK',
                'Credit Cards': 'CC'
            };
            return codes[value as keyof typeof codes];
        }
    ],
    priorityLevel: [
        (value: string) => {
            const levels = {
                'Low': 1,
                'Medium': 2,
                'High': 3,
                'Urgent': 4
            };
            return levels[value as keyof typeof levels];
        }
    ],
    preferredContactMethod: [
        (value: string) => {
            const codes = {
                'Email': 'E',
                'Phone': 'P',
                'Mail': 'M',
                'SMS': 'S'
            };
            return codes[value as keyof typeof codes];
        }
    ],
    accountType: [
        (value: string) => {
            const codes = {
                'Personal': 1,
                'Business': 2,
                'Joint': 3,
                'Trust': 4
            };
            return codes[value as keyof typeof codes];
        }
    ],
    documentType: [
        (value: string) => {
            const codes = {
                'Application': 'A',
                'Verification': 'V',
                'Statement': 'S',
                'Contract': 'C'
            };
            return codes[value as keyof typeof codes];
        }
    ],
    approvalStatus: [
        (value: string) => {
            const codes = {
                'Pending': 0,
                'Approved': 1,
                'Rejected': 2,
                'Under Review': 3
            };
            return codes[value as keyof typeof codes];
        }
    ],
    deviceType: [
        (value: string) => {
            const codes = {
                'Desktop': 'D',
                'Mobile': 'M',
                'Tablet': 'T',
                'Other': 'O'
            };
            return codes[value as keyof typeof codes];
        }
    ],
    consentGiven: [
        (value: boolean) => value.toString()
    ],
    marketingOptIn: [
        (value: boolean) => value ? 'Y' : 'N'
    ],
    lastUpdated: [
        (value: string) => new Date(value).toISOString(),
        (value: string) => Math.floor(new Date(value).getTime() / 1000)
    ],
    requestDate: [
        (value: string) => new Date(value).toISOString().split('T')[0],
        (value: string) => Math.floor(new Date(value).getTime() / 1000)
    ],
    currentAddress: [
        (value: string) => parseAddress(value)
    ],
    mailingAddress: [
        (value: string) => parseAddress(value)
    ],
    // Default transformers for fields that don't need transformation
    customerID: [(value: string) => value],
    emailAddress: [(value: string) => value],
    phoneNumber: [(value: string) => value],
    documentID: [(value: string) => value],
    processingNotes: [(value: string) => value],
    agentID: [(value: string) => value],
    ipAddress: [(value: string) => value]
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

export function getTransformer(field: keyof FormData): Transformer {
    return (value: any) => {
        const transformers = fieldTransformers[field];
        if (!transformers || transformers.length === 0) {
            return value;
        }
        
        let transformedValue = value;
        for (const transformer of transformers) {
            transformedValue = transformer(transformedValue);
        }
        return transformedValue;
    };
}

export function transformFormData(formData: Partial<FormData>): Partial<FormData> {
    const transformed: Partial<FormData> = {};
    
    for (const [field, value] of Object.entries(formData)) {
        const transformer = getTransformer(field as keyof FormData);
        transformed[field as keyof FormData] = transformer(value);
    }
    
    return transformed;
}