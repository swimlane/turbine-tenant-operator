import {k8s, apps, core} from "./config"

const tenantId = "tenant-abcd";
const accountId = "account-abcd";

const agentImage = "quay.io/swimlane/turbine-agent";
const agentContainerEngineImage = "quay.io/swimlane/turbine-container-engine";
const engineImage = "quay.io/swimlane/turbine-engine";
const tasksImage = "quay.io/swimlane/swimlane-tasks";

export const agent = {
    metadata: {
        name: "turbine-agent",
        labels: {
            "app.kubernetes.io/name": "turbine-agent",
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },

    },
    replicas: 3,
    selector: {
        matchLabels: {
            "app.kubernetes.io/name": "turbine-agent",
        }
    } as k8s.V1LabelSelector,
    template: {
        spec: {
            containers: [
                {
                    name: "turbine-agent",
                    image: agentImage,
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                          cpu: "500m",
                          memory: "4096Mi"
                        },
                        limits: {
                          memory: "4096Mi"
                        }
                    } as k8s.V1ResourceRequirements,
                    env: [
                        {
                            name: "CONTAINER_ENGINE_URL",
                            value: "http://localhost:2375"
                        },
                        {
                            name: "ACCOUNT_ID",
                            value: accountId
                        },
                        {
                            name: "TENANT_ID",
                            value: tenantId
                        },
                        {
                            name: "AGENT_NAME",
                            valueFrom: {
                                fieldRef: {
                                    apiVersion: "v1",
                                    fieldPath: "metadata.name"
                                }
                            }
                        }
                    ],
                    envFrom: [
                        { name: "tenant-secrets" } as k8s.V1SecretReference
                    ] as k8s.V1EnvFromSource,
                } as k8s.V1Container,

                {
                    name: "container-engine",
                    image: agentContainerEngineImage,
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                          cpu: "500m",
                          memory: "4096Mi"
                        },
                        limits: {
                          memory: "4096Mi"
                        }
                    } as k8s.V1ResourceRequirements,
                    args: [
                        "podman",
                        "--log-level",
                        "info",
                        "system",
                        "service",
                        "tcp:0.0.0.0:2375",
                        "-t=0"
                    ],
                    securityContext: {
                        privileged: true
                    }
                } as k8s.V1Container,
            ]
        } as k8s.V1PodSpec,
    } as k8s.V1PodTemplateSpec,

    topologySpreadConstraints: {
        labelSelector: {
            matchLabels: {
                "app.kubernetes.io/name": "turbine-agent",
                "tenant.swimlane.io/tenant-id": tenantId
            }
        } as k8s.V1LabelSelector,
        maxSkew: 1,
        topologyKey: "topology.kubernetes.io/zone",
        whenUnsatisfiable: "DoNotSchedule"
    } as k8s.V1TopologySpreadConstraint

} as k8s.V1Deployment;

export const engine = {
    metadata: {
        name: "turbine-engine",
        labels: {
            "app.kubernetes.io/name": "turbine-engine",
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },

    },
    replicas: 3,
    selector: {
        matchLabels: {
            "app.kubernetes.io/name": "turbine-engine",
        }
    } as k8s.V1LabelSelector,
    template: {
        spec: {
            containers: [
                {
                    name: "turbine-engine",
                    image: engineImage,
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                          cpu: "500m",
                          memory: "4096Mi"
                        },
                        limits: {
                          memory: "4096Mi"
                        }
                    } as k8s.V1ResourceRequirements,
                    env: [
                        {
                            name: "ACCOUNT_ID",
                            value: accountId
                        },
                        {
                            name: "TENANT_ID",
                            value: tenantId
                        },
                        {
                            name: "ENGINE_NAME",
                            valueFrom: {
                                fieldRef: {
                                    apiVersion: "v1",
                                    fieldPath: "metadata.name"
                                }
                            }
                        }
                    ],
                    envFrom: [
                        { name: "tenant-secrets" } as k8s.V1SecretReference
                    ] as k8s.V1EnvFromSource,
                } as k8s.V1Container,
            ],
            securityContext: {
                fsGroup: 3000,
                runAsGroup: 3000,
                runAsUser: 3000
            }
        } as k8s.V1PodSpec,
    } as k8s.V1PodTemplateSpec,

    topologySpreadConstraints: {
        labelSelector: {
            matchLabels: {
                "app.kubernetes.io/name": "turbine-engine",
                "tenant.swimlane.io/tenant-id": tenantId
            }
        } as k8s.V1LabelSelector,
        maxSkew: 1,
        topologyKey: "topology.kubernetes.io/zone",
        whenUnsatisfiable: "DoNotSchedule"
    } as k8s.V1TopologySpreadConstraint

} as k8s.V1Deployment;

export const tasks = {
    metadata: {
        name: "swimlane-tasks",
        labels: {
            "app.kubernetes.io/name": "swimlane-tasks",
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },
    },
    replicas: 3,
    selector: {
        matchLabels: {
            "app.kubernetes.io/name": "swimlane-tasks",
        }
    } as k8s.V1LabelSelector,
    template: {
        spec: {
            containers: [
                {
                    name: "swimlane-tasks",
                    image: tasksImage,
                    imagePullPolicy: "Always",
                    resources: {
                        requests: {
                          cpu: "500m",
                          memory: "4096Mi"
                        },
                        limits: {
                          memory: "4096Mi"
                        }
                    } as k8s.V1ResourceRequirements,
                    env: [
                        {
                            name: "ACCOUNT_ID",
                            value: accountId
                        },
                        {
                            name: "TENANT_ID",
                            value: tenantId
                        },
                        {
                            name: "SWIMLANE_Data__Mongo__TenantIdentifier",
                            value: tenantId
                        }
                    ],
                    envFrom: [
                        { name: "tenant-secrets" } as k8s.V1SecretReference
                    ] as k8s.V1EnvFromSource,
                    livenessProbe: {
                        failureThreshold: 5,
                        httpGet: {
                          path: "/health",
                          port: 8080,
                          scheme: "HTTP"
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 60,
                        successThreshold: 1,
                        timeoutSeconds: 30
                    } as k8s.V1Probe,
                    readinessProbe: {
                        failureThreshold: 5,
                        httpGet: {
                          path: "/health",
                          port: 8080,
                          scheme: "HTTP"
                        },
                        initialDelaySeconds: 30,
                        periodSeconds: 60,
                        successThreshold: 1,
                        timeoutSeconds: 30
                    } as k8s.V1Probe
                } as k8s.V1Container,
            ],
            securityContext: {
                fsGroup: 2000,
                runAsGroup: 2000,
                runAsUser: 2000
            }
        } as k8s.V1PodSpec,
    } as k8s.V1PodTemplateSpec,

    topologySpreadConstraints: {
        labelSelector: {
            matchLabels: {
                "app.kubernetes.io/name": "swimlane-tasks",
                "tenant.swimlane.io/tenant-id": tenantId
            }
        } as k8s.V1LabelSelector,
        maxSkew: 1,
        topologyKey: "topology.kubernetes.io/zone",
        whenUnsatisfiable: "DoNotSchedule"
    } as k8s.V1TopologySpreadConstraint

} as k8s.V1Deployment;
