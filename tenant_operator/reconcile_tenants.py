import os
import requests
from tenant import get_current_namespace
from kubernetes import client, config
from kubernetes.client.rest import ApiException
import kubernetes_templates

try:
    config.load_kube_config()
except:
    config.load_incluster_config()

base_url  = os.getenv('SWIMLANE_Tenant__BaseUrl', "http://swimlane-tenant:5002/")
username  = os.getenv('SWIMLANE_SystemUser__Username', "swimlane_system@swimlane.com")
password  = os.getenv('SWIMLANE_SystemUser__Password')

def get_token():
  r = requests.post(
    base_url + "api/users/login",
    headers = {'Content-type': 'application/json'},
    json = {
      "username": username,
      "password": password
    }
  )
  assert r.status_code == 200
  return r.json()["token"]
  
headers = {
  'Content-type': 'application/json',
  'Authorization': 'Bearer {}'.format(get_token())
}

def get_accounts():
  r = requests.get(
    base_url + "api/accounts",
    headers = headers
  )
  return r.json()

def get_tenants(accountId):
  print("GET /tenant/api/accounts/{}/tenants".format(accountId))
  r = requests.get(
    base_url + "api/accounts/" + accountId + "/tenants",
    headers = headers
  )
  return r.json()["viewModels"]

def create_or_replace_tenant_resource(tenant_id, account_id, **kwargs):
    namespace   = get_current_namespace()
    t_tenant    = kubernetes_templates.tenant_template(tenant_id, account_id, namespace)
    try:
        client.CustomObjectsApi().get_namespaced_custom_object(name=t_tenant["metadata"]["name"], namespace=namespace, group="swimlane.io", version="v1", plural="tenants")
        return client.CustomObjectsApi().replace_namespaced_custom_object(name=t_tenant["metadata"]["name"], namespace=namespace, body=t_tenant)
    except ApiException as e:
        if e.status == 404:
          return client.CustomObjectsApi().create_namespaced_custom_object(namespace=namespace, body=t_tenant, group="swimlane.io", version="v1", plural="tenants")
          #  return client.CustomObjectsApi().create_namespaced_custom_object(namespace=namespace, body=t_tenant)
        else:
            print(f"error creating tenant: {e}")

def reconcile_tenants():
    tenants = []
    accounts = get_accounts()

    for i in range(len(accounts)):
        accountTenants = get_tenants(accounts[i]["id"])
        for j in range(len(accountTenants)):
          tenants.append(accountTenants[j])
          create_or_replace_tenant_resource(accountTenants[j]["id"], accountTenants[j]["accountId"])

    # k8s_tenants = client.CustomObjectsApi().list_namespaced_custom_object(namespace=get_current_namespace(), group="swimlane.io", version="v1", plural="tenants")["items"]
    # for k8s_tenant in k8s_tenants:
    #    tenantId  = k8s_tenant["spec"]["tenantId"]
    #    if any(tenantId in d.values() for d in tenants.values()):
    #       pass
