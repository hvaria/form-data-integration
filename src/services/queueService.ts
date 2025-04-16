import { FormData } from '../models/formData';
import { EndpointConfig } from '../models/endpoint';
import { ProcessingError } from '../utils/errorHandler';

interface QueueItem {
    data: FormData;
    endpointConfig: EndpointConfig;
    priority: number;
    timestamp: number;
}

export class QueueService {
    private queue: QueueItem[] = [];
    private processing: Set<string> = new Set();
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 5000; // 5 seconds

    constructor(private readonly maxConcurrent: number = 5) {}

    public async enqueue(data: FormData, endpointConfig: EndpointConfig, priority: number = 1): Promise<void> {
        const item: QueueItem = {
            data,
            endpointConfig,
            priority,
            timestamp: Date.now()
        };

        // Insert into queue based on priority
        const insertIndex = this.queue.findIndex(q => q.priority < priority);
        if (insertIndex === -1) {
            this.queue.push(item);
        } else {
            this.queue.splice(insertIndex, 0, item);
        }

        // Process queue if not at max capacity
        if (this.processing.size < this.maxConcurrent) {
            await this.processNext();
        }
    }

    private async processNext(): Promise<void> {
        if (this.queue.length === 0 || this.processing.size >= this.maxConcurrent) {
            return;
        }

        const item = this.queue.shift()!;
        const processingId = `${item.data.customerID}-${Date.now()}`;
        this.processing.add(processingId);

        try {
            await this.processItem(item);
        } catch (error) {
            const processError = error as Error;
            if (error instanceof ProcessingError && (error as any).retryCount < this.MAX_RETRIES) {
                // Re-queue with higher priority and retry count
                setTimeout(() => {
                    this.enqueue(item.data, item.endpointConfig, item.priority + 1);
                }, this.RETRY_DELAY);
            } else {
                console.error(`Failed to process item: ${processError.message}`);
                throw error;
            }
        } finally {
            this.processing.delete(processingId);
            // Process next item if available
            if (this.queue.length > 0) {
                await this.processNext();
            }
        }
    }

    private async processItem(item: QueueItem): Promise<void> {
        // Here you would integrate with your transformation and validation services
        // This is a placeholder for the actual processing logic
        console.log(`Processing item for customer ${item.data.customerID}`);
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    public getQueueLength(): number {
        return this.queue.length;
    }

    public getProcessingCount(): number {
        return this.processing.size;
    }

    public getQueueStatus(): { queueLength: number; processingCount: number } {
        return {
            queueLength: this.queue.length,
            processingCount: this.processing.size
        };
    }

    async getNextItem(): Promise<QueueItem | undefined> {
        return this.queue.shift();
    }
} 