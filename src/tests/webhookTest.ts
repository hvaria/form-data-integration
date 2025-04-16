import { DataProcessor } from '../services/dataProcessor';
import { FormData } from '../models/formData';

async function testWebhookIntegration() {
    const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{customerId: string, error: any}>
    };

    try {
        const processor = new DataProcessor();

        // Test data for CUST001
        const testData1: FormData = {
            personalName: "John Smith",
            customerID: "CUST12345",
            emailAddress: "john.smith@example.com",
            phoneNumber: "123-456-7890",
            dateOfBirth: "1990-01-01",
            currentAddress: "123 Main St, City, ST 12345",
            mailingAddress: "123 Main St, City, ST 12345",
            employmentStatus: "Employed",
            incomeRange: "$50k-$75k",
            creditScore: 750,
            productCategory: "Loans",
            requestDate: new Date().toISOString(),
            priorityLevel: "Medium",
            preferredContactMethod: "Email",
            accountType: "Personal",
            documentType: "Application",
            documentID: "DOC12345",
            approvalStatus: "Pending",
            processingNotes: "Test submission",
            consentGiven: true,
            marketingOptIn: true,
            lastUpdated: new Date().toISOString(),
            agentID: "AGT123",
            deviceType: "Desktop",
            ipAddress: "127.0.0.1"
        };

        // Test data for CUST002
        const testData2: FormData = {
            ...testData1,
            customerID: "CUST67890",
            personalName: "Jane Doe",
            emailAddress: "jane.doe@example.com"
        };

        console.log("\n🚀 Starting webhook integration test...");

        // Test CUST001
        try {
            console.log("\n📤 Testing CUST001:");
            console.log("👤 Customer ID: CUST001");
            console.log("📝 Test data:", JSON.stringify(testData1, null, 2));
            await processor.processFormData(testData1, "CUST001");
            console.log("✅ CUST001 test completed successfully");
            results.success++;
        } catch (error) {
            console.error("❌ CUST001 test failed:", error);
            results.failed++;
            results.errors.push({ customerId: "CUST001", error });
        }

        // Test CUST002
        try {
            console.log("\n📤 Testing CUST002:");
            console.log("👤 Customer ID: CUST002");
            console.log("📝 Test data:", JSON.stringify(testData2, null, 2));
            await processor.processFormData(testData2, "CUST002");
            console.log("✅ CUST002 test completed successfully");
            results.success++;
        } catch (error) {
            console.error("❌ CUST002 test failed:", error);
            results.failed++;
            results.errors.push({ customerId: "CUST002", error });
        }

        // Print summary
        console.log("\n📊 Test Summary:");
        console.log(`✅ Successful tests: ${results.success}`);
        console.log(`❌ Failed tests: ${results.failed}`);
        
        if (results.errors.length > 0) {
            console.log("\n⚠️  Errors by Customer:");
            results.errors.forEach(({ customerId, error }) => {
                console.error(`\n❌ Customer ${customerId} failed:`);
                console.error(`🔍 Error: ${error.message}`);
                console.error(`📍 Stack: ${error.stack}`);
            });
        }

        console.log("\n🔍 Webhook URLs to verify:");
        console.log("CUST001: https://webhook.site/4a2dd565-c5dc-4f3b-a423-cad62bcfd47f");
        console.log("CUST002: https://webhook.site/67986567-5224-4759-9943-d821b544d068");

    } catch (error) {
        console.error("\n💥 Test execution failed:", error);
    }
}

// Run the test
testWebhookIntegration(); 