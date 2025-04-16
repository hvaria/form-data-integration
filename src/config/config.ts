import dotenv from 'dotenv';
import { OpenAIModel } from '../services/openAIService';
import { SecretsService } from '../services/secretsService';

// Load environment variables
dotenv.config();

// Initialize secrets service
const secretsService = new SecretsService();

// Validate required environment variables
const requiredEnvVars = ['OPENAI_API_KEY'];
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}

// Store API key securely
secretsService.setSecret('OPENAI_API_KEY', process.env.OPENAI_API_KEY!)
    .catch(err => console.error('Failed to store API key:', err));

export const config = {
    openai: {
        getApiKey: async () => {
            const key = await secretsService.getSecret('OPENAI_API_KEY');
            if (!key) {
                throw new Error('API key not found or expired');
            }
            return key;
        },
        defaultModel: 'gpt-3.5-turbo' as OpenAIModel,
        maxTokens: {
            validation: 500,
            transformation: 1000,
            enrichment: 500
        }
    },
    processing: {
        maxConcurrent: 5,
        maxWorkers: 5,
        retryAttempts: 3,
        retryDelay: 5000 // 5 seconds
    },
    security: {
        apiKeyRotationInterval: 24 * 60 * 60 * 1000, // 24 hours
        maxFailedAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 minutes
    }
}; 