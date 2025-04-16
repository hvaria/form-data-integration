import { FormData } from '../models/formData';
import { EndpointConfig } from '../models/endpoint';
import { QueueService } from './queueService';
import { WorkerPool } from './workerPool';
import { ProcessingError, OpenAIModel } from '../utils/errorHandler';

export class ParallelProcessingService {
    private queueService: QueueService;
    private workerPool: WorkerPool;

    constructor(
        endpointConfig: EndpointConfig,
        openAIApiKey: string,
        model: OpenAIModel = 'gpt-3.5-turbo',
        maxConcurrent: number = 5,
        maxWorkers: number = 5
    ) {
        this.queueService = new QueueService(maxConcurrent);
        this.workerPool = new WorkerPool(maxWorkers, endpointConfig, openAIApiKey, model);
    }

    public setModel(model: OpenAIModel): void {
        this.workerPool.setModel(model);
    }

    public getModelCosts(): Record<OpenAIModel, { input: number; output: number }> {
        return this.workerPool.getModelCosts();
    }

    public async processFormData(data: FormData, endpointConfig: EndpointConfig, priority: number = 1): Promise<void> {
        try {
            // Enqueue the data for processing
            await this.queueService.enqueue(data, endpointConfig, priority);

            // Process the queue using available workers
            while (this.queueService.getQueueLength() > 0 && this.workerPool.getAvailableWorkers() > 0) {
                const queueStatus = this.queueService.getQueueStatus();
                const workerStatus = this.workerPool.getWorkerStatus();

                console.log('Processing status:', {
                    queue: queueStatus,
                    workers: workerStatus
                });

                // Get next item from queue
                const nextItem = await this.queueService.getNextItem();
                if (nextItem) {
                    try {
                        await this.workerPool.process(nextItem.data, nextItem.endpointConfig);
                    } catch (error) {
                        if (error instanceof ProcessingError) {
                            // Handle processing errors (e.g., retry, log, etc.)
                            console.error(`Processing error: ${error.message}`);
                        }
                    }
                }
            }
        } catch (error) {
            throw new ProcessingError(
                'Parallel processing error',
                {
                    customerId: data.customerID,
                    endpoint: endpointConfig.name,
                    message: error instanceof Error ? error.message : 'Unknown error'
                }
            );
        }
    }

    public getProcessingStatus(): {
        queue: { queueLength: number; processingCount: number };
        workers: { available: number; busy: number; total: number };
    } {
        return {
            queue: this.queueService.getQueueStatus(),
            workers: this.workerPool.getWorkerStatus()
        };
    }
} 