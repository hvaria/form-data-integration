import { FormData } from '../models/formData';
import { EndpointConfig } from '../models/endpoint';
import { ProcessingError } from '../utils/errorHandler';
import OpenAI from 'openai';
import { config } from '../config/config';
import { ErrorCategory } from '../utils/errorHandler';

export type OpenAIModel = 'gpt-3.5-turbo' | 'gpt-3.5-turbo-16k' | 'gpt-4-turbo-preview';

export class OpenAIService {
    private openai: OpenAI | null = null;
    private readonly modelCosts = {
        'gpt-3.5-turbo': {
            input: 0.0005,
            output: 0.0015
        },
        'gpt-3.5-turbo-16k': {
            input: 0.003,
            output: 0.004
        },
        'gpt-4-turbo-preview': {
            input: 0.01,
            output: 0.03
        }
    };

    constructor(
        private model: OpenAIModel = config.openai.defaultModel
    ) {}

    private async initializeOpenAI(): Promise<void> {
        if (!this.openai) {
            const apiKey = await config.openai.getApiKey();
            this.openai = new OpenAI({ apiKey });
        }
    }

    public setModel(model: OpenAIModel): void {
        this.model = model;
    }

    public getModelCosts(): Record<OpenAIModel, { input: number; output: number }> {
        return this.modelCosts;
    }

    public async validateData(data: FormData, endpointConfig: EndpointConfig): Promise<{ isValid: boolean; issues: string[] }> {
        try {
            await this.initializeOpenAI();
            const prompt = this.createValidationPrompt(data, endpointConfig);
            const response = await this.openai!.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a data validation expert. Analyze the form data and identify any issues or inconsistencies.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: config.openai.maxTokens.validation
            });

            const result = JSON.parse(response.choices[0].message.content || '{}');
            return {
                isValid: result.isValid,
                issues: result.issues || []
            };
        } catch (error) {
            throw new ProcessingError(
                error instanceof Error ? error : new Error('AI validation error'),
                {
                    customerId: data.customerID,
                    endpoint: endpointConfig.name,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    category: ErrorCategory.VALIDATION
                }
            );
        }
    }

    public async transformData(data: FormData, endpointConfig: EndpointConfig): Promise<FormData> {
        try {
            await this.initializeOpenAI();
            const prompt = this.createTransformationPrompt(data, endpointConfig);
            const response = await this.openai!.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a data transformation expert. Transform the form data according to the endpoint requirements.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: config.openai.maxTokens.transformation
            });

            return JSON.parse(response.choices[0].message.content || '{}');
        } catch (error) {
            throw new ProcessingError(
                error instanceof Error ? error : new Error('AI transformation error'),
                {
                    customerId: data.customerID,
                    endpoint: endpointConfig.name,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    category: ErrorCategory.TRANSFORMATION
                }
            );
        }
    }

    public async enrichData(data: FormData, endpointConfig: EndpointConfig): Promise<FormData> {
        try {
            await this.initializeOpenAI();
            const prompt = this.createEnrichmentPrompt(data, endpointConfig);
            const response = await this.openai!.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a data enrichment expert. Add relevant additional information to the form data.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: config.openai.maxTokens.enrichment
            });

            return JSON.parse(response.choices[0].message.content || '{}');
        } catch (error) {
            throw new ProcessingError(
                error instanceof Error ? error : new Error('AI enrichment error'),
                {
                    customerId: data.customerID,
                    endpoint: endpointConfig.name,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    category: ErrorCategory.TRANSFORMATION
                }
            );
        }
    }

    private createValidationPrompt(data: FormData, endpointConfig: EndpointConfig): string {
        return `Validate the following form data for endpoint ${endpointConfig.name}:
        Data: ${JSON.stringify(data, null, 2)}
        Required fields: ${JSON.stringify(endpointConfig.requiredFields)}
        Return a JSON object with 'isValid' (boolean) and 'issues' (array of strings)`;
    }

    private createTransformationPrompt(data: FormData, endpointConfig: EndpointConfig): string {
        return `Transform the following form data according to endpoint ${endpointConfig.name} requirements:
        Data: ${JSON.stringify(data, null, 2)}
        Field transformations: ${JSON.stringify(endpointConfig.fieldTransformations)}
        Return the transformed data as a JSON object`;
    }

    private createEnrichmentPrompt(data: FormData, endpointConfig: EndpointConfig): string {
        return `Enrich the following form data for endpoint ${endpointConfig.name}:
        Data: ${JSON.stringify(data, null, 2)}
        Add relevant additional information based on the data context.
        Return the enriched data as a JSON object`;
    }
} 