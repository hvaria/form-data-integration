import { FormData } from "./formData";
import { EndpointName } from "./endpoint";

type FormDataKey = keyof FormData;

export interface EndpointConfig {
    name: EndpointName;
    path: string;
    requiredFields: FormDataKey[];
    fieldTransformations?: Partial<Record<FormDataKey, (value: any) => any>>;
    fieldValidations?: Partial<Record<FormDataKey, (value: any) => boolean>>;
}

export const endpointConfigs: Partial<Record<EndpointName, EndpointConfig>> = {
    CustomerProfileAPI: {
        name: "CustomerProfileAPI",
        path: "/customer/profile",
        requiredFields: ["personalName", "customerID", "emailAddress", "phoneNumber", "dateOfBirth"],
        fieldTransformations: {
            personalName: (value: string) => value.split(" "),
            dateOfBirth: (value: string) => new Date(value).toLocaleDateString("en-US")
        }
    },
    CreditCheckSystem: {
        name: "CreditCheckSystem",
        path: "/credit/check",
        requiredFields: ["customerID", "incomeRange", "creditScore"],
        fieldTransformations: {
            incomeRange: (value: string) => parseInt(value.replace(/[^0-9]/g, "")),
            creditScore: (value: number) => value
        }
    }
}; 