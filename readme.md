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
anchore-cli policy add /tmp/mojaloop_policy_bundle.json
anchore-cli policy activate mojaloop-policy
```


## CI Evaluation Pseudocode
```bash
# TODO clone mojaloop/ci-config to /tmp/ci-config
# TODO copy the daily base image eval file to /tmp/node:12.16.0-alpine-eval.json

# Generate the anchore policy document
./mojaloop-policy-generator.js /tmp/mojaloop-policy-bundle.json
anchore-cli policy add /tmp/mojaloop-policy-bundle.json
anchore-cli policy activate mojaloop-policy


# TODO: run the image scan, result with a file called ${CIRCLE_REPO...}-eval.json

# Compare the 2 eval files. If there are issues in the derived, but not the base, then we have a problem
./anchore-result-diff.js /tmp/node:12.16.0-alpine-eval.json ${CIRCLE_REPO...}-eval.json

# TODO: if failed (regardless of the anchore-result-diff results) stop the build, alert on slack!

anchore-cli policy activate anchore_cis_1.13.0_base
anchore-cli policy del mojaloop-policy

```