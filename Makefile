DOCKER_REPO ?= quay.io/swimlane
APPLICATION_NAME ?= turbine-tenant-operator
GIT_HASH ?= $(shell git log --format="%h" -n 1)
RELEASE_VERSION ?= $(shell git log --format="%h" -n 1)

build:
	docker build --tag localimage:localtag --tag ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH} .
	$(MAKE) generate-kustomize

generate-kustomize:
	cat manifests/crds/*.yaml > ${APPLICATION_NAME}-${RELEASE_VERSION}-crds.yaml
	kustomize build manifests/base/ \
		| sed "s|${DOCKER_REPO}/${APPLICATION_NAME}|${DOCKER_REPO}/${APPLICATION_NAME}:${RELEASE_VERSION}|g"  \
		> ${APPLICATION_NAME}-${RELEASE_VERSION}.yaml

test:
	echo "Test"

push:
	docker push ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH}

release:
	docker pull ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH}
	docker tag  ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH} ${DOCKER_REPO}/${APPLICATION_NAME}:${RELEASE_VERSION}
	docker push ${DOCKER_REPO}/${APPLICATION_NAME}:${RELEASE_VERSION}

	$(MAKE) generate-kustomize