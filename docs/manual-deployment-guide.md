# Manual Deployment Guide — BengoERP UI (Includes Automated Workflow Steps)

**Target:** `erp-ui` (BengoERP frontend)  
**Purpose:** Manual deployment steps identical to what `build.sh` and `deploy.yml` automate. Use this when you need to run the pipeline manually or debug failures (e.g., ImagePullBackOff).

> ⚠️ *Security:* keep secrets (GH tokens, Docker creds, kubeconfig) safe. Prefer environment variables or CI secrets, **do not** commit them.

---

## Quick variables (set these before running any commands)
```bash
export APP_NAME=erp-ui
export REGISTRY_SERVER=docker.io
export REGISTRY_NAMESPACE=codevertex
export IMAGE_REPO="$REGISTRY_SERVER/$REGISTRY_NAMESPACE/$APP_NAME"
export IMAGE_TAG=$(git rev-parse --short=8 HEAD)
export DEVOPS_REPO="https://github.com/Bengo-Hub/devops-k8s.git"
export DEVOPS_DIR=~/devops-k8s
export NAMESPACE=erp
export VALUES_FILE_PATH="apps/${APP_NAME}/values.yaml"

# REQUIRED for cross-repo push (deploy keys DON'T work for this)
export GH_PAT="ghp_..."      # GitHub PAT with repo:write to Bengo-Hub/devops-k8s

# REQUIRED for private registry
export REGISTRY_USERNAME="codevertex"
export REGISTRY_PASSWORD="your-registry-token"

# REQUIRED for kubectl operations
export KUBE_CONFIG="$(cat ~/.kube/config | base64 -w0)"

# Optional: API URL configuration (baked into build)
export VITE_API_URL="https://erpapi.masterspace.co.ke"
export VITE_WEBSOCKET_URL="wss://erpapi.masterspace.co.ke/ws/pos/"
```

---

## Overview: Automated steps performed by `build.sh` / `deploy.yml`

1. ✅ Build container with production API URL (via build args)
2. ✅ Run `trivy` filesystem + image vulnerability scans
3. ✅ Push image to configured registry
4. ✅ Create/update Kubernetes secrets (`erp-ui-env`, `registry-credentials`)
5. ✅ Update `devops-k8s/apps/erp-ui/values.yaml` with new image tag and imagePullSecrets
6. ✅ Commit and push to devops-k8s using GH_PAT (requires PAT token)
7. ✅ ArgoCD auto-syncs and performs rolling update with health checks
8. ✅ Zero-downtime deployment: new pods validated before traffic switch
9. ✅ Old pods removed only after new ones pass readiness probe

This guide gives the exact manual commands that reproduce those steps.

**Key Requirements**:
- GH_PAT or GITHUB_SECRET must be set (deploy keys don't work for cross-repo push)
- Health endpoint `/health` must respond with 200 OK
- imagePullSecrets configured if using private registry

---

## Step 0 — Prerequisites & quick checks
```bash
# Tools
which git docker kubectl helm yq jq argocd trivy || echo "Install missing tools"

# kube access
kubectl cluster-info
kubectl get pods -n argocd

# argocd CLI (for manual sync)
argocd version || echo "Install argocd CLI: https://github.com/argoproj/argo-cd/releases"

# Ensure working directory is the UI source
cd /bengobox-erp-ui
```

---

## Step 1 — Build the Docker image (matches build.sh behavior)

**Production build with API URL** (baked into the frontend at build time):
```bash
# Build with production API configuration
DOCKER_BUILDKIT=1 docker build \
  --build-arg VITE_API_URL=https://erpapi.masterspace.co.ke \
  --build-arg VITE_WEBSOCKET_URL=wss://erpapi.masterspace.co.ke/ws/pos/ \
  -t "${IMAGE_REPO}:${IMAGE_TAG}" .
```

**Notes:**
- `VITE_API_URL` and `VITE_WEBSOCKET_URL` are baked into the build. To change them, rebuild with different `--build-arg` values.
- `build.sh` will attempt to add SSH key with `ssh-add` if `DOCKER_SSH_KEY` is provided (for private git submodules).
- `build.sh` also uses `trivy fs` and `trivy image` to scan filesystem and image — run those after build if desired.

---

## Step 2 — Create registry pull secret (for private images)
```bash
# Decode kubeconfig first
mkdir -p ~/.kube
echo "$KUBE_CONFIG" | base64 -d > ~/.kube/config

# Create namespace
kubectl get ns $NAMESPACE >/dev/null 2>&1 || kubectl create ns $NAMESPACE

# Create docker-registry secret
kubectl -n $NAMESPACE create secret docker-registry registry-credentials \
  --docker-server=$REGISTRY_SERVER \
  --docker-username=$REGISTRY_USERNAME \
  --docker-password=$REGISTRY_PASSWORD \
  --dry-run=client -o yaml | kubectl apply -f -

echo "✅ Registry pull secret created"
```

## Step 3 — Security scans (optional but recommended)
```bash
# Filesystem scan (trivy)
trivy fs . --exit-code 0 --format table --skip-files "localhost*.pem,*.key,*.crt"

# Image scan
trivy image "${IMAGE_REPO}:${IMAGE_TAG}" --exit-code 0 --format table --ignorefile .trivyignore
```

---

## Step 3 — Push image to registry (what build.sh does)
```bash
# Login (if not already)
docker login ${REGISTRY_SERVER} -u "${REGISTRY_USERNAME}" --password-stdin <<< "${REGISTRY_PASSWORD}"

# Push
docker push "${IMAGE_REPO}:${IMAGE_TAG}"

# Verify locally that the tag exists
docker pull "${IMAGE_REPO}:${IMAGE_TAG}"
```

If push succeeds but cluster still fails to pull, ensure the cluster has the pull secret (Step 6).

---

## Step 4 — Update DevOps repo (values.yaml) exactly like build.sh

`build.sh` clones the `devops-k8s` repo, edits `apps/erp-ui/values.yaml` using `yq` (with env injection), commits and pushes using a GH token.

Manual commands (preferred: use GH_PAT env variable):
```bash
# Clone/update
[ -d "$DEVOPS_DIR" ] || git clone "https://github.com/Bengo-Hub/devops-k8s.git" "$DEVOPS_DIR"
cd "$DEVOPS_DIR"
git fetch origin main
git checkout main
git reset --hard origin/main

# Update values using yq (env injection, safe)
IMAGE_REPO_ENV="$IMAGE_REPO" IMAGE_TAG_ENV="$IMAGE_TAG" yq e -i '.image.repository = env(IMAGE_REPO_ENV) | .image.tag = env(IMAGE_TAG_ENV)' "$VALUES_FILE_PATH"

# Ensure imagePullSecrets are set if registry requires auth
if [[ -n "${REGISTRY_USERNAME:-}" && -n "${REGISTRY_PASSWORD:-}" ]]; then
  yq e -i '.image.pullSecrets = [{"name":"registry-credentials"}]' "$VALUES_FILE_PATH"
fi

# Commit & push (use GH token or SSH with write-access)
git add "$VALUES_FILE_PATH"
git commit -m "${APP_NAME}:${IMAGE_TAG} released" || echo "No changes to commit"

# Push with token (build.sh uses x-access-token if GH_PAT present)
if [[ -n "${GH_PAT:-}" ]]; then
  git remote remove push-origin 2>/dev/null || true
  git remote add push-origin "https://x-access-token:${GH_PAT}@github.com/Bengo-Hub/devops-k8s.git"
  git push push-origin HEAD:main
else
  git push origin main
fi
```

**Why env injection?** `yq e -i '.image.tag = env(IMAGE_TAG_ENV)'` prevents quoting/escaping issues and works reliably.

---

## Step 5 — Ensure the cluster can pull images (imagePullSecret)

`build.sh` creates `registry-credentials` in the `$NAMESPACE` if `REGISTRY_USERNAME` and `REGISTRY_PASSWORD` are provided.

Manual equivalent:
```bash
kubectl -n "${NAMESPACE}" delete secret registry-credentials --ignore-not-found

kubectl -n "${NAMESPACE}" create secret docker-registry registry-credentials \
  --docker-server="${REGISTRY_SERVER}" \
  --docker-username="${REGISTRY_USERNAME}" \
  --docker-password="${REGISTRY_PASSWORD}" \
  --docker-email="${REGISTRY_EMAIL}"
```

**Verify secret:**
```bash
kubectl get secret registry-credentials -n ${NAMESPACE} -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d | jq
```

**Important:** ensure `apps/erp-ui/values.yaml` contains:
```yaml
imagePullSecrets:
  - name: registry-credentials
```
(build.sh writes this as `.image.pullSecrets` — verify chart uses that value to set `spec.template.spec.imagePullSecrets`).

---

## Step 6 — Optional: Database setup (if using build.sh SETUP_DATABASES=true)

`build.sh` can install Postgres/Redis using Bitnami charts. Manual:
```bash
kubectl create ns ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
helm repo add bitnami https://charts.bitnami.com/bitnami || true
helm repo update

# Postgres
helm upgrade --install postgresql bitnami/postgresql -n ${NAMESPACE}   --set global.postgresql.auth.postgresPassword="${POSTGRES_PASSWORD}"   --set global.postgresql.auth.database="appdb" --wait --timeout=300s

# Redis
helm upgrade --install redis bitnami/redis -n ${NAMESPACE}   --set global.redis.password="${REDIS_PASSWORD}" --wait --timeout=300s
```

Create secret with DB URL (build.sh creates Jwt secret and DB secret):
```bash
kubectl -n ${NAMESPACE} create secret generic ${ENV_SECRET_NAME}   --from-literal=DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@postgresql.${NAMESPACE}.svc.cluster.local:5432/appdb"   --dry-run=client -o yaml | kubectl apply -f -
```

---

## Step 7 — Trigger / verify ArgoCD sync

`build.sh` relies on automated sync; if auto-sync is enabled ArgoCD will detect the commit and sync. If not, do:

```bash
argocd login argocd.masterspace.co.ke --username admin --password "<ADMIN_PASS>" --grpc-web --insecure
argocd app refresh erp-ui
argocd app sync erp-ui --force
argocd app get erp-ui
```

**Check status:**
```bash
kubectl get all,ingress -n ${NAMESPACE}
```

---

## Step 8 — Post-sync checks & troubleshooting (ImagePullBackOff diagnosis)

If pods show `ImagePullBackOff` or `ErrImagePull`:

1. Confirm the exact image referenced by the Deployment:
```bash
kubectl -n ${NAMESPACE} get deployment erp-ui-app -o jsonpath='{.spec.template.spec.containers[*].image}'
```

2. Confirm image exists and is pullable from the VPS:
```bash
docker pull "${IMAGE_REPO}:${IMAGE_TAG}"
```

3. Confirm `imagePullSecrets` is present on the Deployment:
```bash
kubectl -n ${NAMESPACE} get deployment erp-ui-app -o yaml | yq e '.spec.template.spec.imagePullSecrets' -
```
If empty, ensure the Helm chart maps `values.image.pullSecrets` -> `spec.template.spec.imagePullSecrets`. If not, patch values or chart.

4. Confirm secret contents:
```bash
kubectl -n ${NAMESPACE} get secret registry-credentials -o jsonpath='{.data.\.dockerconfigjson}' | base64 -d | jq
```

5. Force a rolling restart (if secret fixed or image updated):
```bash
kubectl rollout restart deployment/erp-ui-app -n ${NAMESPACE}
kubectl rollout status deployment/erp-ui-app -n ${NAMESPACE}
kubectl get pods -n ${NAMESPACE} -w
```

6. If orchestration still fails, inspect image pull events:
```bash
kubectl describe pod -n ${NAMESPACE} <pod-name>   # look for Events -> pull error messages
kubectl logs deployment/erp-ui-app -n ${NAMESPACE} --tail=200 || true
```

---

## Extra: Mapping between the automated files and manual steps

- `build.sh`:
  - Build image, trivy scans, docker push, create registry secret, update `values.yaml` with `yq`, push to `devops-k8s` with GH token, and optionally setup DBs.
  - Use this guide's Step 1–7 for manual equivalence.

- `deploy.yml` (CI workflow):
  - Triggers `build.sh` in CI and uses GH_PAT and registry creds from secrets. If CI exists, prefer running CI to deploy.

---

## Safety & Best Practices

- Do not store `GH_PAT` or `REGISTRY_PASSWORD` in plain files on disk. Use environment variables or your vault/CI secrets.
- Prefer SSH write access (deploy key with write enabled) or GitHub PAT for automation.
- Monitor ArgoCD UI and controller logs when troubleshooting sync issues:
```bash
kubectl logs -n argocd deployment/argocd-application-controller -f
```

---

## Quick checklist (copy/paste)

```bash
# Build & push
cd /bengobox-erp-ui
docker build -t "${IMAGE_REPO}:${IMAGE_TAG}" .
docker push "${IMAGE_REPO}:${IMAGE_TAG}"

# Create registry secret in cluster
kubectl -n ${NAMESPACE} create secret docker-registry registry-credentials   --docker-server="${REGISTRY_SERVER}"   --docker-username="${REGISTRY_USERNAME}"   --docker-password="${REGISTRY_PASSWORD}"   --dry-run=client -o yaml | kubectl apply -f -

# Update values & push
cd $DEVOPS_DIR
IMAGE_REPO_ENV="$IMAGE_REPO" IMAGE_TAG_ENV="$IMAGE_TAG" yq e -i '.image.repository = env(IMAGE_REPO_ENV) | .image.tag = env(IMAGE_TAG_ENV)' "$VALUES_FILE_PATH"
yq e -i '.image.pullSecrets = [{"name":"registry-credentials"}]' "$VALUES_FILE_PATH"
git add "$VALUES_FILE_PATH"
git commit -m "${APP_NAME}:${IMAGE_TAG} released" || echo "No changes to commit"
git push push-origin HEAD:main   # or git push origin main

# Force ArgoCD sync
argocd app refresh erp-ui
argocd app sync erp-ui --force

# Restart and monitor
kubectl rollout restart deployment/erp-ui-app -n ${NAMESPACE}
kubectl get pods -n ${NAMESPACE} -w
```

---

## Contact / Escalation
If issues persist, collect:

- `argocd app get erp-ui -o yaml`
- `kubectl describe pod -n erp <pod>`
- `kubectl get events -n erp --sort-by='.metadata.creationTimestamp' | tail -n 50`

Share these with the DevOps team (Titus) for further debugging.

---

*Generated: 2025-10-14 — includes automation steps from `build.sh` and recommended manual equivalents.*
