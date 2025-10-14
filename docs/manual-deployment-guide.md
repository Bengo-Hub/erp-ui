# 🧭 Manual Deployment Guide - BengoERP UI (Improved & Corrected)

This guide walks you through **manual deployment of the BengoERP UI** when automated CI/CD pipelines are unavailable.  
It includes **gap fixes**, improved **Git handling**, and **deployment verification steps**.

---

## 🚦 Deployment Overview

The manual deployment involves five main phases:

1. **Build & Push Docker Image**
2. **Verify Prerequisites**
3. **Deploy via ArgoCD**
4. **Monitor and Verify Deployment**
5. **Troubleshoot if needed**

---

## 🧱 Phase 0: Build & Push Docker Image

This phase builds your Docker image, pushes it to the registry, and updates the Helm values in your DevOps repository.

### 0.1 Set Environment Variables
```bash
export REGISTRY_SERVER=docker.io
export REGISTRY_NAMESPACE=codevertex
export APP_NAME=erp-ui
export IMAGE_REPO="$REGISTRY_SERVER/$REGISTRY_NAMESPACE/$APP_NAME"
export IMAGE_TAG=$(git rev-parse --short=8 HEAD)
export DEVOPS_REPO=https://github.com/Bengo-Hub/devops-k8s.git
export DEVOPS_DIR=~/devops-k8s
```

### 0.2 Log in to Registry
```bash
docker login $REGISTRY_SERVER
```

### 0.3 Build & Push Image
```bash
docker build -t "$IMAGE_REPO:$IMAGE_TAG" .
docker push "$IMAGE_REPO:$IMAGE_TAG"
```

### 0.4 Update Helm Values
```bash
# Clone or update the DevOps repo
if [ ! -d "$DEVOPS_DIR" ]; then
  git clone "$DEVOPS_REPO" "$DEVOPS_DIR"
fi

cd "$DEVOPS_DIR"

# Ensure clean working directory
git reset --hard HEAD
git pull origin main

# Update image tag using yq
yq e -i ".image.repository = \"$IMAGE_REPO\" | .image.tag = \"$IMAGE_TAG\"" apps/erp-ui/values.yaml

# Commit and push changes
git add apps/erp-ui/values.yaml
git commit -m "erp-ui:$IMAGE_TAG released" || echo "No changes to commit."
git push origin main
```

✅ **Fixes introduced here:**
- Added `git reset --hard` before pull to avoid unstaged changes error.
- Avoided rebase conflicts by using direct pull.
- Handles empty commits gracefully.

---

## 🔍 Phase 1: Prerequisites Verification

Before deploying, ensure all tools and permissions are in place.

### 1.1 Verify Access
```bash
kubectl cluster-info
kubectl get pods -n argocd
argocd version
```

### 1.2 Verify Tools
```bash
which kubectl git docker helm argocd yq
docker login docker.io
```

### 1.3 Verify Repo Access
```bash
cd $DEVOPS_DIR || git clone $DEVOPS_REPO $DEVOPS_DIR
ls apps/erp-ui/
```

---

## 🚀 Phase 2: ArgoCD Application Deployment

Deploy and manage ERP UI through ArgoCD.

### 2.1 Apply ArgoCD Application Definitions
```bash
cd $DEVOPS_DIR
kubectl apply -f apps/erp-api/app.yaml -n argocd
kubectl apply -f apps/erp-ui/app.yaml -n argocd
```

### 2.2 Sync Applications
```bash
argocd app sync erp-api
sleep 30
argocd app sync erp-ui
```

### 2.3 Verify Sync Status
```bash
argocd app get erp-api
argocd app get erp-ui
```

---

## 📊 Phase 3: Monitor Deployment

### 3.1 Monitor Application Status
```bash
kubectl get applications.argoproj.io -n argocd -w
argocd app get erp-ui --watch
```

### 3.2 Monitor Namespace Resources
```bash
kubectl get all,ingress,secrets,pvc -n erp
kubectl get pods -n erp -w
kubectl get svc -n erp
```

---

## ✅ Phase 4: Post-Deployment Verification

### 4.1 Application Health
```bash
argocd app get erp-ui --health
kubectl get deployment erp-ui -n erp
kubectl get pods -n erp
```

### 4.2 Check Ingress & SSL
```bash
kubectl get ingress -n erp
kubectl get certificates -n erp
kubectl describe certificate erp-masterspace-tls -n erp
```

### 4.3 Validate Access
```bash
curl -k https://erp.masterspace.co.ke/
curl -k https://erp.masterspace.co.ke/health
```

---

## 🧰 Phase 5: Troubleshooting

### 5.1 Git Push Denied (Deploy Key)
- Ensure the deploy key has **write permissions** in GitHub repository settings.
- Use a **personal access token (PAT)** with repo permissions for automation.
- If using SSH key, confirm key path and permissions:
  ```bash
  chmod 600 ~/.ssh/git_deploy_key
  eval "$(ssh-agent -s)"
  ssh-add ~/.ssh/git_deploy_key
  ```

### 5.2 ArgoCD Sync Issues
```bash
kubectl logs -n argocd deployment/argocd-application-controller
kubectl get events -n argocd --field-selector involvedObject.name=erp-ui
```

### 5.3 Ingress or Service Not Working
```bash
kubectl -n erp describe ingress erp-ui
kubectl -n erp get svc erp-ui -o wide
kubectl -n erp get endpoints erp-ui -o wide
kubectl -n ingress-nginx logs deploy/ingress-nginx-controller --tail=200
```

---

## 🧾 Summary of Fixes and Improvements

| Issue | Original Cause | Fix |
|-------|----------------|-----|
| Git unstaged changes during pull | `git pull --rebase` with local edits | Added `git reset --hard` before pulling |
| Permission denied on push | Deploy key had read-only access | Clarified need for write-enabled key or PAT |
| Incomplete cleanup | Manual directory reuse | Added conditional clone & cleanup |
| No handling for empty commits | Commit fails if no change | Added graceful handling with `|| echo` |
| Rebase conflicts | Rebase on dirty branch | Replaced with `git pull origin main` |

---

**Final Note:**  
Always verify ArgoCD sync status and ingress accessibility after updates.  
For repeated deployment automation, integrate this guide into your GitHub Actions or CI/CD pipeline.
