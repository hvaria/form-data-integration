import crypto from 'crypto';
import { config } from '../config/config';

export class SecretsService {
    private static readonly ENCRYPTION_ALGORITHM = 'aes-256-gcm';
    private static readonly KEY_LENGTH = 32;
    private static readonly IV_LENGTH = 16;
    private static readonly AUTH_TAG_LENGTH = 16;

    private encryptionKey: Buffer;
    private secrets: Map<string, { value: string; expiresAt: number }> = new Map();

    constructor() {
        // Generate or load encryption key
        this.encryptionKey = this.generateOrLoadEncryptionKey();
    }

    private generateOrLoadEncryptionKey(): Buffer {
        // In production, this should be loaded from a secure key management service
        const key = process.env.ENCRYPTION_KEY;
        if (key) {
            return Buffer.from(key, 'base64');
        }
        return crypto.randomBytes(SecretsService.KEY_LENGTH);
    }

    public async setSecret(key: string, value: string, ttlSeconds: number = 3600): Promise<void> {
        const encryptedValue = this.encrypt(value);
        this.secrets.set(key, {
            value: encryptedValue,
            expiresAt: Date.now() + (ttlSeconds * 1000)
        });
    }

    public async getSecret(key: string): Promise<string | null> {
        const secret = this.secrets.get(key);
        if (!secret) {
            return null;
        }

        if (Date.now() > secret.expiresAt) {
            this.secrets.delete(key);
            return null;
        }

        return this.decrypt(secret.value);
    }

    public async rotateSecret(key: string, newValue: string): Promise<void> {
        await this.setSecret(key, newValue);
    }

    public async deleteSecret(key: string): Promise<void> {
        this.secrets.delete(key);
    }

    private encrypt(text: string): string {
        const iv = crypto.randomBytes(SecretsService.IV_LENGTH);
        const cipher = crypto.createCipheriv(
            SecretsService.ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            iv
        );

        let encrypted = cipher.update(text, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        const authTag = cipher.getAuthTag();

        return JSON.stringify({
            iv: iv.toString('base64'),
            encrypted,
            authTag: authTag.toString('base64')
        });
    }

    private decrypt(encryptedData: string): string {
        const { iv, encrypted, authTag } = JSON.parse(encryptedData);
        const decipher = crypto.createDecipheriv(
            SecretsService.ENCRYPTION_ALGORITHM,
            this.encryptionKey,
            Buffer.from(iv, 'base64')
        );

        decipher.setAuthTag(Buffer.from(authTag, 'base64'));
        let decrypted = decipher.update(encrypted, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    public async validateApiKey(apiKey: string): Promise<boolean> {
        // Implement API key validation logic
        // This could include checking against a list of valid keys,
        // checking key format, or validating against an external service
        return apiKey.startsWith('sk-') && apiKey.length > 30;
    }

    public async rotateApiKey(oldKey: string, newKey: string): Promise<void> {
        if (!await this.validateApiKey(newKey)) {
            throw new Error('Invalid API key format');
        }

        // In production, this would update the key in your key management service
        await this.setSecret('OPENAI_API_KEY', newKey);
    }
} 