import os
import re
from os import path
from kubernetes import client, config
import yaml
import kopf

registry  = os.getenv("SWIMLANE_TENANT__IMAGE_REGISTRY", 'quay.io/')
image_tag = os.getenv("SWIMLANE_TENANT__IMAGE_TAG", 'latest')
on_prem   = os.getenv("SWIMLANE_FeatureManagement__OnPremInstall", 'False').lower() in ('true', '1', 't')

def namespace_template(tenant_id, account_id):

    resource = client.V1Namespace(metadata=client.V1ObjectMeta(name="tenant"+tenant_id))

    kopf.label(resource, forced=True, labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )
    # See tenant.delete_fn()
    if on_prem:
      kopf.adopt(resource)
    return resource

def deployment_template(template, tenant_id, account_id, namespace, replicas):
    with open(path.join(path.dirname(__name__), template)) as f:
      resource = yaml.safe_load(f)

    resource["metadata"]["name"] = resource["metadata"]["name"]+"-"+tenant_id
    resource["spec"]["replicas"] = replicas
    resource["spec"]["template"]["spec"]["containers"][0]["image"] = registry + resource["spec"]["template"]["spec"]["containers"][0]["image"] + ":" + image_tag
    try: 
      # Specifically for turbine-agent which has a second container.
      resource["spec"]["template"]["spec"]["containers"][1]["image"] = registry + resource["spec"]["template"]["spec"]["containers"][1]["image"] + ":" + image_tag
    except:
      pass
    resource["spec"]["template"]["spec"]["topologySpreadConstraints"][0]["labelSelector"]["matchLabels"]["tenant.swimlane.io/tenant-id"] = tenant_id
    
    resource["spec"]["template"]["spec"]["containers"][0]["env"].append({ "name": "ACCOUNT_ID", "value": account_id })
    resource["spec"]["template"]["spec"]["containers"][0]["env"].append({ "name": "TENANT_ID", "value": tenant_id })
    resource["spec"]["template"]["spec"]["containers"][0]["env"].append({ "name": "SWIMLANE_Data__Mongo__TenantIdentifier", "value": tenant_id })

    resource["spec"]["template"]["spec"]["containers"][0]["envFrom"][0]["name"] = "tenant-secrets-"+tenant_id

    kopf.adjust_namespace(resource, namespace=namespace, forced=True)
    kopf.label(resource, forced=True, labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )
    kopf.label(resource, forced=True, nested=['spec.template'], labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )
    # See tenant.delete_fn()
    if on_prem:
      kopf.adopt(resource)

    return resource

def pdb_template(tenant_id, account_id, namespace):
    with open(path.join(path.dirname(__name__), "/templates/pdb.yaml")) as f:
      resource = yaml.safe_load(f)

    resource["metadata"]["name"] = resource["metadata"]["name"]+"-"+tenant_id
    resource["spec"]["selector"]["matchLabels"] = {"tenant.swimlane.io/tenant-id": tenant_id}

    kopf.adjust_namespace(resource, namespace=namespace, forced=True)
    kopf.label(resource, forced=True, labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )
    # See tenant.delete_fn()
    if on_prem:
      kopf.adopt(resource)

    return resource

def secret_template(tenant_id, account_id, namespace):
    with open(path.join(path.dirname(__name__), "/templates/secret.yaml")) as f:
      resource = yaml.safe_load(f)

    resource["metadata"]["name"] = "tenant-secrets-"+tenant_id

    kopf.adjust_namespace(resource, namespace=namespace, forced=True)
    kopf.label(resource, forced=True, labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )
    # See tenant.delete_fn()
    if on_prem:
      kopf.adopt(resource)

    # Get all SWIMLANE_ env vars from the operator and forward them to the
    # agent pods
    for k, v in os.environ.items():
        if re.compile(r'SWIMLANE_\w+').match(k):
            resource["stringData"][k] = v

    # Extra non-SWIMLANE env vars
    env_subst = { 
      "AMQP_URL":                                             os.environ.get("AMQP_URL"),
      "MULTI_TENANT_DATABASE_CONNECTION_URL":                 os.environ.get("MULTI_TENANT_DATABASE_CONNECTION_URL"),
    }

    # Merge the above env with the template's stringData
    resource["stringData"].update(env_subst)

    return resource

def tenant_template(tenant_id, account_id, namespace):
    with open(path.join(path.dirname(__name__), "/templates/tenant.yaml")) as f:
      resource = yaml.safe_load(f)

    resource["metadata"]["name"]  = "tenant-"+tenant_id
    resource["spec"]["accountId"] = account_id
    resource["spec"]["tenantId"]  = tenant_id

    kopf.adjust_namespace(resource, namespace=namespace)
    kopf.label(resource, forced=True, labels={
        "tenant.swimlane.io/account-id": account_id,
        "tenant.swimlane.io/tenant-id": tenant_id,
       }
    )

    return resource