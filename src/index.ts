import { DataProcessor } from "./services/dataProcessor";
import { errorHandler } from "./utils/errorHandler";
import { FormData } from "./models/formData";

// Example form data - in a real app this would come from API/event
const exampleFormData: FormData = {
    personalName: "John Doe",
    customerID: "CUST12345",
    emailAddress: "john.doe@example.com",
    phoneNumber: "555-123-4567",
    dateOfBirth: "01/15/1980",
    currentAddress: "123 Main St, City, State 12345",
    mailingAddress: "123 Main St, City, State 12345",
    employmentStatus: "Employed",
    incomeRange: "$50k-$75k",
    creditScore: 720,
    productCategory: "Loans",
    requestDate: "2023-04-15",
    priorityLevel: "Medium",
    preferredContactMethod: "Email",
    accountType: "Personal",
    documentType: "Application",
    documentID: "DOC78901",
    approvalStatus: "Pending",
    processingNotes: "Standard processing",
    consentGiven: true,
    marketingOptIn: true,
    lastUpdated: "2023-04-15T14:30:00Z",
    agentID: "AGT456",
    deviceType: "Desktop",
    ipAddress: "192.168.1.1"
};

async function main() {
    const processor = new DataProcessor();

    try {
        console.log("Starting form data processing...");
        await processor.processFormData(exampleFormData, exampleFormData.customerID);
        console.log("Processing completed successfully");
    } catch (error) {
        errorHandler(error);
    }
}

// Start the processor
main().catch(errorHandler);

// For testing purposes
export async function processFormData(formData: FormData, customerId: string) {
    const processor = new DataProcessor();
    return processor.processFormData(formData, customerId);
}