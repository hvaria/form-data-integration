import { EndpointConfig } from '../models/endpoint';
import { ValidationError } from '../utils/errorHandler';

interface TransformationContext {
    customerId: string;
    endpointName: string;
    fieldName: string;
    originalValue: any;
}

type FieldTransformation = (value: any) => any;

interface FieldTransformations {
    [key: string]: FieldTransformation;
}

export class TransformationService {
    private static readonly DATE_FORMATS = {
        ISO: 'YYYY-MM-DD',
        UNIX: 'X',
        US: 'MM/DD/YYYY',
        EU: 'DD/MM/YYYY'
    };

    private static readonly PHONE_FORMATS = {
        US: '+1 (###) ###-####',
        INTL: '+## ### ### ####'
    };

    constructor(private readonly endpointConfig: EndpointConfig) {}

    public transformField(context: TransformationContext): any {
        const { fieldName, originalValue, customerId, endpointName } = context;
        
        if (!originalValue) {
            return originalValue;
        }

        const transformations = this.endpointConfig.fieldTransformations as FieldTransformations;
        const transformation = transformations[fieldName];
        
        if (!transformation) {
            return originalValue;
        }

        try {
            return transformation(originalValue);
        } catch (error) {
            throw new ValidationError(
                fieldName,
                `Failed to transform field ${fieldName}`,
                originalValue
            );
        }
    }

    public transformPersonName(value: string): string {
        return value.trim().replace(/\s+/g, ' ').toLowerCase().replace(/(?:^|\s)\S/g, char => char.toUpperCase());
    }

    public transformDate(value: string | number | Date): string {
        const date = new Date(value);
        const format = this.endpointConfig.dateFormat || 'ISO';
        
        if (isNaN(date.getTime())) {
            throw new ValidationError(
                'date',
                'Invalid date value',
                value
            );
        }

        switch (format) {
            case 'ISO':
                return date.toISOString().split('T')[0];
            case 'UNIX':
                return Math.floor(date.getTime() / 1000).toString();
            case 'US':
                return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            case 'EU':
                return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            default:
                return date.toISOString();
        }
    }

    public transformPhoneNumber(value: string, format: keyof typeof TransformationService.PHONE_FORMATS = 'US'): string {
        const digits = value.replace(/\D/g, '');
        const template = TransformationService.PHONE_FORMATS[format];
        
        let result = template;
        let digitIndex = 0;
        
        for (let i = 0; i < template.length; i++) {
            if (template[i] === '#') {
                if (digitIndex < digits.length) {
                    result = result.replace('#', digits[digitIndex]);
                    digitIndex++;
                } else {
                    throw new ValidationError(
                        'phone',
                        'Invalid phone number length',
                        value
                    );
                }
            }
        }
        
        return result;
    }

    public transformAddress(value: Record<string, string>): string {
        const { street, city, state, zip, country } = value;
        return `${street}, ${city}, ${state} ${zip}, ${country}`.trim();
    }

    public transformEmail(value: string): string {
        const email = value.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!emailRegex.test(email)) {
            throw new ValidationError(
                'email',
                'Invalid email format',
                value
            );
        }
        
        return email;
    }
} 