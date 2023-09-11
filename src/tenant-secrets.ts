import {k8s, apps, core} from "./config"

const tenantId = "tenant-abcd";
const accountId = "account-abcd";

const  coreNamespace = process.env.SYSTEMUSER_PASSWORD || "core"

export const tenantSecrets = {
    metadata: {
        name: "tenant-secrets",
        labels: {
            "tenant.swimlane.io/account-id": accountId,
            "tenant.swimlane.io/tenant-id": tenantId,
        },
    },

    stringData: {
        // Mongo Connection Strings
        "MULTI_TENANT_DATABASE_CONNECTION_URL": process.env.TENANT_MONGO_CONNECTION_STRING,
        "SWIMLANE_Data__Mongo__SwimlaneConnectionString": process.env.TENANT_MONGO_CONNECTION_STRING,
        "SWIMLANE_Data__Mongo__HistoryConnectionString": process.env.TENANT_MONGO_CONNECTION_STRING,
        "SWIMLANE_Data__Mongo__TenantClusterConnectionString": process.env.TENANT_MONGO_CONNECTION_STRING,
        "SWIMLANE_Data__Mongo__SignalRConnectionString": process.env.SIGNALR_MONGO_CONNECTION_STRING,
        
        // Postgres Connection Strings"
        "SWIMLANE_AlertCorrelation__PostgresqlConnection": process.env.TENANT_POSTGRES_CONNECTION_STRING,
        
        // RabbitMQ Connection Strings"
        "AMQP_URL": process.env.TENANT_AMQP_CONNECTION_STRING,
        "SWIMLANE_Orchestration__RabbitMQConnectionString": process.env.TENANT_AMQP_CONNECTION_STRING,
        "SWIMLANE_Orchestration__Agent__RabbitMQConnectionString": process.env.TENANT_AMQP_CONNECTION_STRING,
        
        // SMTP Variables"
        "SWIMLANE_SmtpConfiguration__Host": process.env.SMTP_HOST,
        "SWIMLANE_SmtpConfiguration__Username": process.env.SMTP_USERNAME,
        "SWIMLANE_SmtpConfiguration__Password": process.env.SMTP_PASSWORD,
        
        "SWIMLANE_SystemUser__Password": process.env.SYSTEMUSER_PASSWORD,
        
        // Tenant Feature Flags"
        "SWIMLANE_FeatureManagement__DynamicOrchestration": "true",
        "SWIMLANE_FeatureManagement__MultiTenant": "true",
        "SWIMLANE_FeatureManagement__HideSspImportExport": "false",
        "SWIMLANE_FeatureManagement__IntegrationPage": "false",
        "SWIMLANE_FeatureManagement__PlaybookYamlEditor": "true",
        "SWIMLANE_FeatureManagement__RecordPage": "true",
        "SWIMLANE_FeatureManagement__SearchPage": "false",
        "SWIMLANE_FeatureManagement__SequentialTasks": "true",
        "SWIMLANE_FeatureManagement__PlaybookActivityPage": "false",
        "SWIMLANE_FeatureManagement__TrackProductExperience": "true",
        "SWIMLANE_FeatureManagement__FullLogo": "false",
        "SWIMLANE_FeatureManagement__PlaybookLoopActions": "false",
        "SWIMLANE_FeatureManagement__PlaybookPythonActions": "true",
        "FEATURES_AGGREGATE_REPEAT_PEAT_REPEAT": "true",
        
        "SWIMLANE_Gotenberg__ServiceUrl": `http://gotenberg.${coreNamespace}:3500/`,
        "SWIMLANE_Tenant__ContextEndpoint": `http://swimlane-tenant.${coreNamespace}:5002/api/tenants/{__tenant__}/context/`,
        "SWIMLANE_Orchestration__BaseUrl": `http://turbine-api.${coreNamespace}:3000/v1/`,
        "SWIMLANE_Tenant__BaseUrl": `http://swimlane-tenant.${coreNamespace}:5002/`,
        "SWIMLANE_ReportsService__BaseUrl": `http://swimlane-reports.${coreNamespace}:4000/`,
    } 
} as k8s.V1Secret;