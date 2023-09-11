import {k8s, apps, core} from "./config"

const tenantId = "tenant-abcd";
const accountId = "account-abcd";

export const namespace = {
    metadata: {
        name: `tenant${tenantId}`,
        labels: {
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },
    },
} as k8s.V1Namespace;