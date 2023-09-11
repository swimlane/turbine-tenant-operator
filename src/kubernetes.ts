import {k8s, apps, core} from "./config"
import * as deployments from "./deployments"
import * as pdb from "./pdb"
import * as namespace from "./namespace"
import * as secrets from "./tenant-secrets"

const createDeployments = async (accountId: string, tenantId: string) => {
    await apps.createNamespacedDeployment(`tenant${tenantId}`, deployments.agent).catch((e) => console.error(e));
    await apps.createNamespacedDeployment(`tenant${tenantId}`, deployments.engine).catch((e) => console.error(e));
    await apps.createNamespacedDeployment(`tenant${tenantId}`, deployments.tasks).catch((e) => console.error(e));
};

const createSecrets = async (accountId: string, tenantId: string) => {
    await core.createNamespacedSecret(`tenant${tenantId}`, secrets.tenantSecrets).catch((e) => console.error(e));
};

const createPdb = async (accountId: string, tenantId: string) => {
    await core.createNamespacedSecret(`tenant${tenantId}`, pdb.pdb).catch((e) => console.error(e));
};

const createNamespace = async (accountId: string, tenantId: string) => {
    await core.createNamespace(namespace.namespace).catch((e) => console.error(e));
};

const deleteNamespace = async (accountId: string, tenantId: string) => {
    await core.deleteNamespace(`tenant${tenantId}`).catch((e) => console.error(e));
};