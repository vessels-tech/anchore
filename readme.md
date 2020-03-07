# Anchore

Scratch project for playing around with anchore image scanning

```bash
pip install --user anchorecli

docker pull docker.io/anchore/anchore-engine:latest
docker create --name ae docker.io/anchore/anchore-engine:latest
docker cp ae:/docker-compose.yaml ./docker-compose.yaml
docker rm ae

docker-compose pull
docker-compose up -d

docker-compose ps
```


## Run on a given image
```bash
export IMAGE=node:12.16.0-alpine
# export IMAGE=mojaloop/quoting-service:v9.2.2-snapshot
export ANCHORE_CLI_USER=admin
export ANCHORE_CLI_PASS=foobar

anchore-cli image add ${IMAGE}
anchore-cli image wait ${IMAGE}
anchore-cli image list
anchore-cli image get ${IMAGE}
anchore-cli --json image vuln ${IMAGE} all > ${IMAGE//\//_}-vuln.json
anchore-cli --json evaluate check ${IMAGE} --detail > ${IMAGE//\//_}-policy.json
```



## Configuring policies
```bash
curl ${POLICY_PATH} > /tmp/mojaloop-policy-bundle.json
# anchore-cli policy add /tmp/mojaloop_policy_bundle.json
anchore-cli policy del mojaloop-policy
anchore-cli policy add ./mojaloop-policy-bundle.json
anchore-cli policy activate mojaloop-policy


```