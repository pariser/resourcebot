ACCOUNT_ID := 996938751812
AWS_REGION := us-west-1
CONTAINER_REPOSITORY_HOST := $(ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com

.PHONY: helm/build
helm/build:
	helm package cluster-bot-chart --version $(VERSION)-chart

.PHONY: helm/login
helm/login:
	@aws ecr get-login-password --region $(AWS_REGION) | \
		helm registry login --username AWS --password-stdin $(CONTAINER_REPOSITORY_HOST)

.PHONY: helm/push
helm/push:
	helm push cluster-bot-$(VERSION)-chart.tgz oci://$(CONTAINER_REPOSITORY_HOST)

.PHONY: docker/build
docker/build:
	docker buildx build --platform linux/amd64 --tag $(CONTAINER_REPOSITORY_HOST)/cluster-bot:$(VERSION) .

.PHONY: docker/login
docker/login:
	aws ecr get-login-password --region $(AWS_REGION) | \
		docker login --username AWS --password-stdin $(CONTAINER_REPOSITORY_HOST)

.PHONY: docker/push
docker/push:
	docker push $(CONTAINER_REPOSITORY_HOST)/cluster-bot:$(VERSION)
