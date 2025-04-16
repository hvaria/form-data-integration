import { FormData } from '../models/formData';
import { EndpointConfig } from '../models/endpoint';
import { TransformationService } from './transformationService';
import { ValidationService } from './validationService';
import { OpenAIService, OpenAIModel } from './openAIService';
import { ProcessingError } from '../utils/errorHandler';

interface Worker {
    id: number;
    busy: boolean;
    process: (data: FormData, endpointConfig: EndpointConfig) => Promise<void>;
}

export class WorkerPool {
    private workers: Worker[] = [];
    private readonly maxWorkers: number;
    private readonly transformationService: TransformationService;
    private readonly validationService: ValidationService;
    private readonly openAIService: OpenAIService;

    constructor(
        maxWorkers: number = 5,
        endpointConfig: EndpointConfig,
        openAIApiKey: string,
        model: OpenAIModel = 'gpt-3.5-turbo'
    ) {
        this.maxWorkers = maxWorkers;
        this.transformationService = new TransformationService(endpointConfig);
        this.validationService = new ValidationService(endpointConfig);
        this.openAIService = new OpenAIService(openAIApiKey, model);
        this.initializeWorkers();
    }

    public setModel(model: OpenAIModel): void {
        this.openAIService.setModel(model);
    }

    public getModelCosts(): Record<OpenAIModel, { input: number; output: number }> {
        return this.openAIService.getModelCosts();
    }

    private initializeWorkers(): void {
        for (let i = 0; i < this.maxWorkers; i++) {
            this.workers.push({
                id: i,
                busy: false,
                process: async (data: FormData, endpointConfig: EndpointConfig) => {
                    try {
                        // AI-powered validation
                        const validationResult = await this.openAIService.validateData(data, endpointConfig);
                        if (!validationResult.isValid) {
                            throw new ProcessingError(
                                'AI validation failed',
                                {
                                    customerId: data.customerID,
                                    endpoint: endpointConfig.name,
                                    message: validationResult.issues.join(', ')
                                }
                            );
                        }

                        // AI-powered transformation
                        const transformedData = await this.openAIService.transformData(data, endpointConfig);

                        // AI-powered enrichment
                        const enrichedData = await this.openAIService.enrichData(transformedData, endpointConfig);

                        // Process enriched data
                        await this.processTransformedData(enrichedData, endpointConfig);
                    } catch (error) {
                        if (error instanceof ProcessingError) {
                            throw error;
                        }
                        throw new ProcessingError(
                            'Worker processing error',
                            {
                                customerId: data.customerID,
                                endpoint: endpointConfig.name,
                                message: error instanceof Error ? error.message : 'Unknown error'
                            }
                        );
                    }
                }
            });
        }
    }

    private async processTransformedData(data: FormData, endpointConfig: EndpointConfig): Promise<void> {
        // Here you would implement the actual endpoint submission logic
        console.log(`Processing transformed data for customer ${data.customerID}`);
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    public async process(data: FormData, endpointConfig: EndpointConfig): Promise<void> {
        const availableWorker = this.workers.find(w => !w.busy);
        
        if (!availableWorker) {
            throw new ProcessingError(
                'No available workers',
                {
                    customerId: data.customerID,
                    endpoint: endpointConfig.name
                }
            );
        }

        availableWorker.busy = true;
        try {
            await availableWorker.process(data, endpointConfig);
        } finally {
            availableWorker.busy = false;
        }
    }

    public getAvailableWorkers(): number {
        return this.workers.filter(w => !w.busy).length;
    }

    public getBusyWorkers(): number {
        return this.workers.filter(w => w.busy).length;
    }

    public getWorkerStatus(): { available: number; busy: number; total: number } {
        return {
            available: this.getAvailableWorkers(),
            busy: this.getBusyWorkers(),
            total: this.maxWorkers
        };
    }
} 