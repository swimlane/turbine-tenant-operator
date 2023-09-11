import * as k8s from "@kubernetes/client-node";

// Generates a client from an existing kubeconfig whether in memory
// or from a file.
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

// Creates the different clients for the different parts of the API.
export const apps = kc.makeApiClient(k8s.AppsV1Api);
export const core = kc.makeApiClient(k8s.CoreV1Api);

export { k8s }