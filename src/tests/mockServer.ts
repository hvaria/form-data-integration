import express from 'express';
import cors from 'cors';
import { ParallelProcessingService } from '../services/parallelProcessingService';
import { endpointConfigs } from '../models/endpoint';
import { FormData } from '../models/formData';

const app = express();
app.use(cors());
app.use(express.json());

// Enhanced logging middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    const customerId = req.body?.customerID || 'Unknown';
    
    console.log(`\n🔵 [${new Date().toISOString()}] Incoming request:`);
    console.log(`📍 API: ${req.path}`);
    console.log(`👤 Customer ID: ${customerId}`);
    
    // Capture response
    const originalJson = res.json;
    res.json = function(body) {
        const duration = Date.now() - startTime;
        console.log(`⏱️  Duration: ${duration}ms`);
        console.log(`📤 Response:`, body);
        return originalJson.call(this, body);
    }
    
    next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`\n❌ [${new Date().toISOString()}] Error:`);
    console.error(`📍 API: ${req.path}`);
    console.error(`👤 Customer ID: ${req.body?.customerID || 'Unknown'}`);
    console.error(`⚠️  Error: ${err.message}`);
    console.error(`🔍 Stack: ${err.stack}`);
    
    res.status(500).json({
        status: 'error',
        message: err.message
    });
});

// Mock endpoints
app.post('/api/customer/profile', (req, res) => {
    res.json({ status: 'success', message: 'Customer profile updated' });
});

app.post('/api/verify/address', (req, res) => {
    res.json({ status: 'success', message: 'Address verified' });
});

app.post('/api/credit/check', (req, res) => {
    res.json({ status: 'success', message: 'Credit check completed' });
});

app.post('/api/products', (req, res) => {
    res.json({ status: 'success', message: 'Product recommendations generated' });
});

app.post('/api/queue', (req, res) => {
    res.json({ status: 'success', message: 'Request queued' });
});

app.post('/api/preferences', (req, res) => {
    res.json({ status: 'success', message: 'Preferences updated' });
});

app.post('/api/documents', (req, res) => {
    res.json({ status: 'success', message: 'Document processed' });
});

const PORT = process.env.PORT || 3000;

const openAIApiKey = process.env.OPENAI_API_KEY;
if (!openAIApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
}

const parallelService = new ParallelProcessingService(
    endpointConfigs.CustomerProfileAPI,
    openAIApiKey,
    'gpt-3.5-turbo', // Most cost-effective model
    5, // max concurrent
    5  // max workers
);

// Check model costs
const costs = parallelService.getModelCosts();
console.log('Model costs:', costs);

// Sample form data
const sampleFormData: FormData = {
    customerID: '12345',
    personalName: 'John Doe',
    emailAddress: 'john@example.com',
    phoneNumber: '1234567890',
    dateOfBirth: '1990-01-01',
    currentAddress: '123 Main St, New York, NY 10001',
    mailingAddress: '123 Main St, New York, NY 10001',
    employmentStatus: 'Employed',
    incomeRange: '$50k-$75k',
    creditScore: 750,
    productCategory: 'Loans',
    requestDate: new Date().toISOString(),
    priorityLevel: 'Medium',
    preferredContactMethod: 'Email',
    accountType: 'Personal',
    documentType: 'Application',
    documentID: 'DOC123',
    approvalStatus: 'Pending',
    processingNotes: 'Initial application',
    consentGiven: true,
    marketingOptIn: true,
    lastUpdated: new Date().toISOString(),
    agentID: 'AGENT001',
    deviceType: 'Desktop',
    ipAddress: '192.168.1.1'
};

async function processData() {
    // Process form data
    await parallelService.processFormData(sampleFormData, endpointConfigs.CustomerProfileAPI, 1);
    
    // Monitor processing status
    const status = parallelService.getProcessingStatus();
    console.log('Processing status:', status);
}

processData().catch(console.error);

// For complex processing requiring higher accuracy
parallelService.setModel('gpt-4-turbo-preview');

// For larger data sets
parallelService.setModel('gpt-3.5-turbo-16k');

// Back to cost-effective model
parallelService.setModel('gpt-3.5-turbo');

app.listen(PORT, () => {
    console.log(`\n🚀 Mock server running on http://localhost:${PORT}`);
    console.log('📝 Logging format:');
    console.log('🔵 - Request information');
    console.log('✅ - Successful response');
    console.log('❌ - Error information\n');
}); 