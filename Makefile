DOCKER_REPO ?= quay.io/swimlane
APPLICATION_NAME ?= turbine-tenant-operator
GIT_HASH ?= $(shell git log --format="%h" -n 1)
RELEASE_VERSION ?= $(shell git log --format="%h" -n 1)

build:
	docker build --tag ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH} .

test:
	echo "Test"

push:
	docker push ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH}

release:
	docker pull ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH}
	docker tag  ${DOCKER_REPO}/${APPLICATION_NAME}:${GIT_HASH} ${DOCKER_REPO}/${APPLICATION_NAME}:${RELEASE_VERSION}
	docker push ${DOCKER_REPO}/${APPLICATION_NAME}:${RELEASE_VERSION}