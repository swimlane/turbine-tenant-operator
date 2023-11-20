import os
import kopf
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import kubernetes_templates

on_prem = os.getenv("SWIMLANE_FeatureManagement__OnPremInstall", 'False').lower() in ('true', '1', 't')

def get_current_namespace():
    ns_path = "/var/run/secrets/kubernetes.io/serviceaccount/namespace"
    if os.path.exists(ns_path):
        with open(ns_path) as f:
            return f.read().strip()
    try:
        _, active_context = config.list_kube_config_contexts()
        return active_context["context"]["namespace"]
    except KeyError:
        return "default"

@kopf.on.create('tenant')
@kopf.on.update('tenant')
@kopf.on.resume('tenant')
def create_fn(spec, **kwargs):
    tenant_id  = spec.get("tenantId")
    account_id = spec.get("accountId")
    namespace  = get_current_namespace() if on_prem else "tenant"+tenant_id

    kapi = client.AppsV1Api()
    capi = client.CoreV1Api()
    papi = client.PolicyV1Api()

    t_pdb    = kubernetes_templates.pdb_template( tenant_id, account_id, namespace )
    t_secret = kubernetes_templates.secret_template( tenant_id, account_id, namespace )
    t_tasks  = kubernetes_templates.deployment_template( "/templates/swimlane-tasks-deployment.yaml", tenant_id, account_id, namespace, spec.get("tasksReplicas")  )
    t_agent  = kubernetes_templates.deployment_template( "/templates/turbine-agent-deployment.yaml" , tenant_id, account_id, namespace, spec.get("agentReplicas")  )
    t_engine = kubernetes_templates.deployment_template( "/templates/turbine-engine-deployment.yaml", tenant_id, account_id, namespace, spec.get("engineReplicas") )

    # Create new namespace only if on_prem flag is False
    if not on_prem:
        t_ns = kubernetes_templates.namespace_template( tenant_id, account_id )
        try:
            capi.read_namespace(name="tenant"+tenant_id)
            capi.replace_namespace(name="tenant"+tenant_id,body=t_ns)
        except ApiException as e:
            if e.status == 404:
                capi.create_namespace(body=t_ns)
            else:
                raise kopf.TemporaryError(e)

    # For some reason the create doesn't work... catch the
    # exception for now and ignore reconciliation for it.
    # "Invalid value: 0x0" when doing replace_namespaced_pod_disruption_budget
    try:
        papi.create_namespaced_pod_disruption_budget(namespace=namespace, body=t_pdb)
        # papi.read_namespaced_pod_disruption_budget(name=t_pdb["metadata"]["name"], namespace=namespace)
        # papi.replace_namespaced_pod_disruption_budget(name=t_pdb["metadata"]["name"], namespace=namespace, body=t_pdb)
    except ApiException as e:
        pass
        # if e.status == 404:
        #     papi.create_namespaced_pod_disruption_budget(namespace=namespace, body=t_pdb)
        # else:
        #     raise kopf.TemporaryError(e)

    try:
        capi.read_namespaced_secret(name=t_secret["metadata"]["name"], namespace=namespace)
        capi.replace_namespaced_secret(name=t_secret["metadata"]["name"], namespace=namespace, body=t_secret)
    except ApiException as e:
        if e.status == 404:
            capi.create_namespaced_secret(namespace=namespace, body=t_secret)
        else:
            raise kopf.TemporaryError(e)

    try:
        kapi.read_namespaced_deployment(name=t_tasks["metadata"]["name"], namespace=namespace)
        kapi.replace_namespaced_deployment(name=t_tasks["metadata"]["name"], namespace=namespace, body=t_tasks)
    except ApiException as e:
        if e.status == 404:
           kapi.create_namespaced_deployment(namespace=namespace, body=t_tasks)
        else:
            raise kopf.TemporaryError(e)

    try:
        kapi.read_namespaced_deployment(name=t_agent["metadata"]["name"], namespace=namespace)
        kapi.replace_namespaced_deployment(name=t_agent["metadata"]["name"], namespace=namespace, body=t_agent)
    except ApiException as e:
        if e.status == 404:
           kapi.create_namespaced_deployment(namespace=namespace, body=t_agent)
        else:
            raise kopf.TemporaryError(e)

    try:
        kapi.read_namespaced_deployment(name=t_engine["metadata"]["name"], namespace=namespace)
        kapi.replace_namespaced_deployment(name=t_engine["metadata"]["name"], namespace=namespace, body=t_engine)
    except ApiException as e:
        if e.status == 404:
           kapi.create_namespaced_deployment(namespace=namespace, body=t_engine)
        else:
            raise kopf.TemporaryError(e)

    return {
        'tenantNamespace': namespace,
        'deployments': {
            "tasks": t_tasks["metadata"]["name"],
            "agent": t_agent["metadata"]["name"],
            "engine": t_engine["metadata"]["name"]
        },
        'secrets': {
            "tenantSecrets": t_secret["metadata"]["name"]
        },
        'pdb': {
            "tenantServices": t_pdb["metadata"]["name"]
        }
    }

# This is required in cloud because OwnerReferences
# in Kubernetes do not support cross-namespace refs.
# It was either this cleanup step, or have swimlane-tenant create+delete namespaces
# For On-prem, the tenant are deployed in the same namespace and thus are cleaned up
# automatically with OwnerReferences
@kopf.on.delete('tenant')
def delete_fn(spec, meta, **kwargs):
    if not on_prem:
        tenant_id  = spec.get("tenantId")
        try:
            client.CoreV1Api().delete_namespace(name="tenant"+tenant_id)
        except ApiException as e:
            if e.status == 404:
                pass
            else:
                raise kopf.TemporaryError(e)
    return {}