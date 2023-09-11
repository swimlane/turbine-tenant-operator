import {k8s, apps, core} from "./config"

const tenantId = "tenant-abcd";
const accountId = "account-abcd";

export const pdb = {
    metadata: {
        name: "swimlane-tenant",
        labels: {
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },
    },
    labelSelector: {
        matchLabels: {
            "tenant.swimlane.io/tenant-id": tenantId
        }
    } as k8s.V1LabelSelector,
    maxUnavailable: 1
} as k8s.V1PodDisruptionBudget;