// src/services/dataProcessor.ts
import { FormData } from "../models/formData";
import { CustomerConfig, getCustomerConfig } from "../config/customerConfig";
import { EndpointConfig, EndpointName } from "../models/endpoint";
import { getValidator } from "./validation/fieldValidators";
import { ProcessingError, logError } from "../utils/errorHandler";

type FormDataKey = keyof FormData;

interface ProcessingOptions {
    maxRetries?: number;
    timeoutMs?: number;
    batchSize?: number;
    rateLimit?: {
        requestsPerMinute: number;
    };
}

export class DataProcessor {
    private baseUrl: string;
    private options: ProcessingOptions;
    private lastRequestTime: number = 0;

    constructor(
        baseUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api',
        options: ProcessingOptions = {}
    ) {
        this.baseUrl = baseUrl;
        this.options = {
            maxRetries: 3,
            timeoutMs: 30000,
            batchSize: 10,
            rateLimit: { requestsPerMinute: 60 },
            ...options
        };
    }

    async processFormData(formData: FormData, customerId: string): Promise<void> {
        try {
            const customerConfig = this.getCustomerConfig(customerId);
            const endpointConfigs = this.getEndpointConfigs(customerConfig.enabledEndpoints);

            // Process endpoints in parallel with rate limiting
            await Promise.all(
                endpointConfigs.map(endpointConfig =>
                    this.processEndpoint(formData, endpointConfig, customerConfig)
                )
            );
        } catch (error) {
            throw new ProcessingError(error as Error, { customerId });
        }
    }

    async processBatch(formDataArray: FormData[], customerId: string): Promise<void> {
        const batchSize = this.options.batchSize || 10;
        for (let i = 0; i < formDataArray.length; i += batchSize) {
            const batch = formDataArray.slice(i, i + batchSize);
            await Promise.all(
                batch.map(formData => this.processFormData(formData, customerId))
            );
        }
    }

    private async processEndpoint(
        formData: FormData,
        endpointConfig: EndpointConfig,
        customerConfig: CustomerConfig
    ): Promise<void> {
        let retryCount = 0;
        const maxRetries = this.options.maxRetries || 3;

        while (retryCount <= maxRetries) {
            try {
                await this.waitForRateLimit();

                // Validate required fields first
                const validationResult = this.validateEndpointData(formData, endpointConfig);
                if (validationResult !== true) {
                    throw new Error(`Validation failed for ${endpointConfig.name}: ${validationResult}`);
                }

                // Transform and prepare payload
                const payload = this.transformDataForEndpoint(formData, endpointConfig, customerConfig);

                // Send to endpoint with timeout
                await this.sendToEndpoint(endpointConfig.path, payload);
                return;
            } catch (error) {
                retryCount++;
                if (retryCount > maxRetries) {
                    logError(new ProcessingError(error as Error, {
                        customerId: customerConfig.customerId,
                        endpoint: endpointConfig.name,
                        retryCount,
                        payload: formData
                    }));
                    throw error;
                }
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
            }
        }
    }

    private async waitForRateLimit(): Promise<void> {
        if (!this.options.rateLimit) return;

        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        const minTimeBetweenRequests = (60 * 1000) / this.options.rateLimit.requestsPerMinute;

        if (timeSinceLastRequest < minTimeBetweenRequests) {
            await new Promise(resolve => 
                setTimeout(resolve, minTimeBetweenRequests - timeSinceLastRequest)
            );
        }
        this.lastRequestTime = Date.now();
    }

    private validateEndpointData(
        formData: FormData,
        endpointConfig: EndpointConfig
    ): true | string {
        const errors: string[] = [];
        endpointConfig.requiredFields.forEach(field => {
            const validator = getValidator(field as FormDataKey);
            const isValid = validator(formData[field as FormDataKey]);
            if (isValid !== true) {
                errors.push(`Field ${String(field)} is invalid: ${isValid}`);
            }
        });

        return errors.length === 0 ? true : errors.join(", ");
    }

    private transformDataForEndpoint(
        formData: FormData,
        endpointConfig: EndpointConfig,
        customerConfig: CustomerConfig
    ): Record<string, any> {
        const payload: Record<string, any> = {};
        const endpointSpecificConfig = customerConfig.endpointSpecificConfig?.[endpointConfig.name];

        endpointConfig.requiredFields.forEach(field => {
            const value = formData[field];
            const targetField = endpointSpecificConfig?.fieldMappings?.[field] || field;
            const transformer = endpointConfig.fieldTransformations?.[field];
            
            if (typeof targetField === 'string') {
                const transformedValue = transformer ? (transformer as (value: any) => any)(value) : value;
                payload[targetField] = transformedValue;
            }
        });

        if (endpointSpecificConfig?.additionalFields) {
            Object.assign(payload, endpointSpecificConfig.additionalFields);
        }

        return payload;
    }

    private async sendToEndpoint(endpointPath: string, payload: Record<string, any>): Promise<void> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.options.timeoutMs);

        try {
            // Special handling for webhook endpoints
            if (endpointPath === '/webhook') {
                const webhookUrl = payload.webhookUrl;
                const secret = payload.secret;
                delete payload.webhookUrl;
                delete payload.secret;

                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Secret': secret || ''
                    },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`Webhook request failed with status ${response.status}`);
                }
            } else {
                // Regular endpoint handling
                const url = new URL(endpointPath, this.baseUrl).toString();
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });

                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
            }

            // Log successful request
            console.log(`Successfully sent request to ${endpointPath}`, {
                status: 200,
                payload
            });
        } catch (error: unknown) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error(`Request timed out after ${this.options.timeoutMs}ms`);
            }
            throw error;
        } finally {
            clearTimeout(timeout);
        }
    }

    private getCustomerConfig(customerId: string): CustomerConfig {
        try {
            return getCustomerConfig(customerId);
        } catch (error) {
            throw new ProcessingError(error as Error, {
                customerId,
                message: "Failed to load customer configuration"
            });
        }
    }

    private getEndpointConfigs(endpointNames: EndpointName[]): EndpointConfig[] {
        const endpointConfigs: Partial<Record<EndpointName, EndpointConfig>> = {
            CustomerProfileAPI: {
                name: "CustomerProfileAPI",
                path: "/customer/profile",
                requiredFields: ["personalName", "customerID", "emailAddress", "phoneNumber", "dateOfBirth"] as FormDataKey[],
                fieldTransformations: {
                    personalName: (value: string) => ({
                        firstName: value.split(" ")[0],
                        lastName: value.split(" ").slice(1).join(" ")
                    }),
                    dateOfBirth: (value: string) => new Date(value).toISOString().split('T')[0],
                    phoneNumber: (value: string) => value.replace(/[^\d]/g, '')
                }
            },
            AddressVerificationService: {
                name: "AddressVerificationService",
                path: "/verify/address",
                requiredFields: ["customerID", "currentAddress", "mailingAddress"] as FormDataKey[],
                fieldTransformations: {
                    currentAddress: (value: string) => {
                        const parts = value.split(',');
                        return {
                            street: parts[0].trim(),
                            city: parts[1].trim(),
                            state: parts[2].trim().split(' ')[0],
                            zip: parts[2].trim().split(' ')[1]
                        };
                    },
                    mailingAddress: (value: string) => {
                        const parts = value.split(',');
                        return {
                            street: parts[0].trim(),
                            city: parts[1].trim(),
                            state: parts[2].trim().split(' ')[0],
                            zip: parts[2].trim().split(' ')[1]
                        };
                    }
                }
            },
            CreditCheckSystem: {
                name: "CreditCheckSystem",
                path: "/credit/check",
                requiredFields: ["customerID", "incomeRange", "creditScore", "employmentStatus"] as FormDataKey[],
                fieldTransformations: {
                    incomeRange: (value: string) => {
                        const ranges = {
                            '$0-$25k': 25000,
                            '$25k-$50k': 50000,
                            '$50k-$75k': 75000,
                            '$75k-$100k': 100000,
                            '$100k+': 150000
                        };
                        return ranges[value as keyof typeof ranges];
                    },
                    employmentStatus: (value: string) => ({
                        status: value,
                        isEmployed: ['Employed', 'Self-employed'].includes(value)
                    })
                }
            },
            ProductCatalogService: {
                name: "ProductCatalogService",
                path: "/products",
                requiredFields: ["customerID", "productCategory", "incomeRange"] as FormDataKey[],
                fieldTransformations: {
                    productCategory: (value: string) => ({
                        code: value.substring(0, 2).toUpperCase(),
                        name: value,
                        eligibility: true
                    })
                }
            },
            RequestProcessingQueue: {
                name: "RequestProcessingQueue",
                path: "/queue",
                requiredFields: ["customerID", "requestDate", "priorityLevel", "processingNotes"] as FormDataKey[],
                fieldTransformations: {
                    requestDate: (value: string) => new Date(value).toISOString(),
                    priorityLevel: (value: string) => ({
                        level: value,
                        sla: {
                            'Low': '72h',
                            'Medium': '48h',
                            'High': '24h',
                            'Urgent': '4h'
                        }[value]
                    })
                }
            },
            CommunicationPreferencesAPI: {
                name: "CommunicationPreferencesAPI",
                path: "/preferences",
                requiredFields: ["customerID", "preferredContactMethod", "emailAddress", "phoneNumber", "marketingOptIn"] as FormDataKey[],
                fieldTransformations: {
                    preferredContactMethod: (value: string) => ({
                        method: value,
                        frequency: 'Weekly',
                        optOut: false
                    }),
                    marketingOptIn: (value: boolean) => ({
                        status: value ? 'OPTED_IN' : 'OPTED_OUT',
                        timestamp: new Date().toISOString()
                    })
                }
            },
            DocumentStorageService: {
                name: "DocumentStorageService",
                path: "/documents",
                requiredFields: ["customerID", "documentType", "documentID"] as FormDataKey[],
                fieldTransformations: {
                    documentType: (value: string) => ({
                        type: value,
                        retention: {
                            'Application': '7y',
                            'Verification': '5y',
                            'Statement': '3y',
                            'Contract': '10y'
                        }[value]
                    })
                }
            },
            WebhookEndpoint: {
                name: "WebhookEndpoint",
                path: "/webhook",
                requiredFields: ["customerID"] as FormDataKey[],
                fieldTransformations: {}
            }
        };

        return endpointNames.map(name => {
            const config = endpointConfigs[name];
            if (!config) {
                throw new Error(`No configuration found for endpoint ${name}`);
            }
            return config;
        });
    }
}