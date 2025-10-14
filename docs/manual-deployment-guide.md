# Manual Deployment Guide - BengoERP UI

This guide provides **complete step-by-step procedures** for manually deploying the BengoERP UI when automated workflows are unavailable or require manual intervention. This guide assumes **no prior deployment exists** and walks you through the entire process from start to finish.

## 🚀 Complete Deployment Workflow

### Phase 0: Build & Push Docker Image (Beginner Friendly)
### Phase 1: Prerequisites Verification
## Phase 0: Build & Push Docker Image (Beginner Friendly)

This phase builds the UI container locally and pushes it to your registry, then updates the devops-k8s Helm values to use the new image tag.

### 0.1 Set environment
```bash
# Choose your image repo and tag
export REGISTRY_SERVER=docker.io
export REGISTRY_NAMESPACE=codevertex
export APP_NAME=erp-ui
export IMAGE_REPO="$REGISTRY_SERVER/$REGISTRY_NAMESPACE/$APP_NAME"
export IMAGE_TAG=$(git rev-parse --short=8 HEAD)

# devops repo info
export DEVOPS_REPO=https://github.com/Bengo-Hub/devops-k8s.git
export DEVOPS_DIR=~/devops-k8s
```

### 0.2 Log in to registry
```bash
docker login $REGISTRY_SERVER
```

### 0.3 Build and push image
```bash
# From the UI project root
docker build -t "$IMAGE_REPO:$IMAGE_TAG" .
docker push "$IMAGE_REPO:$IMAGE_TAG"
```

### 0.4 Update devops-k8s values with new tag
```bash
# Clone devops repo if needed
[ -d "$DEVOPS_DIR" ] || git clone "$DEVOPS_REPO" "$DEVOPS_DIR"
cd "$DEVOPS_DIR"

# Ensure yq is installed
yq --version || (echo "Install yq: https://github.com/mikefarah/yq" && exit 1)

# Update image repo and tag
yq e -i ".image.repository = \"$IMAGE_REPO\" | .image.tag = \"$IMAGE_TAG\"" apps/erp-ui/values.yaml

# Commit and push
git checkout main || git checkout -b main
git pull --rebase || true
git add apps/erp-ui/values.yaml
git commit -m "erp-ui:$IMAGE_TAG released"
git push origin HEAD:main
```

After pushing, ArgoCD (if configured) will detect the change and sync automatically. You can also trigger sync manually (see Phase 2).

### Phase 2: Initial ArgoCD Application Deployment
### Phase 3: Application Sync Monitoring
### Phase 4: Post-Deployment Verification
### Phase 5: Troubleshooting & Maintenance

---

## Phase 1: Prerequisites Verification

Before starting deployment, ensure you have:

### 1.1 Access Verification
```bash
# Verify kubectl access to cluster
kubectl cluster-info

# Check if you can access the argocd namespace
kubectl get pods -n argocd

# Verify ArgoCD CLI is available
argocd version
```

### 1.2 Required Tools Check
```bash
# Check if all required tools are installed
which kubectl git docker helm argocd

# Verify Docker registry access
docker login docker.io
```

### 1.3 Repository Access
```bash
# Clone or verify access to devops-k8s repository
git clone https://github.com/Bengo-Hub/devops-k8s.git
cd devops-k8s

# Verify you can access the applications
ls -la apps/erp-ui/
```

**If any prerequisite fails, stop here and resolve the issue before proceeding.**

---

## Phase 2: Initial ArgoCD Application Deployment

Now we'll deploy the ArgoCD applications that will manage your ERP services.

### 2.1 Navigate to DevOps Repository
```bash
# Ensure you're in the devops-k8s directory
cd /path/to/devops-k8s

# Verify current directory
pwd  # Should show: /path/to/devops-k8s
```

### 2.2 Deploy ArgoCD Applications
```bash
# Deploy the ERP UI ArgoCD application (API should be deployed first)
kubectl apply -f apps/erp-api/app.yaml -n argocd
kubectl apply -f apps/erp-ui/app.yaml -n argocd

# Verify applications were created
kubectl get applications.argoproj.io -n argocd
```

**Expected Output:**
```bash
NAME     SYNC STATUS   HEALTH STATUS
erp-api  OutOfSync     Missing
erp-ui   OutOfSync     Missing
```

### 2.3 Initial Application Sync
```bash
# Sync the API application first (creates shared resources)
argocd app sync erp-api

# Wait a moment for resources to be created
sleep 30

# Sync the UI application
argocd app sync erp-ui

# Check sync status
argocd app get erp-api
argocd app get erp-ui
```

**Expected progression:**
1. `OutOfSync` → `Synced` (applications created)
2. Resources appear in `erp` namespace
3. `Health Status` changes from `Missing` to `Healthy`

---

## Phase 3: Application Sync Monitoring

Monitor the applications until they're fully deployed and healthy.

### 3.1 Real-time Monitoring
```bash
# Watch application status in real-time
kubectl get applications.argoproj.io -n argocd -w

# Or monitor specific application
argocd app get erp-ui --watch
```

### 3.2 Resource Creation Verification
```bash
# Check if resources are being created in erp namespace
kubectl get all,ingress,secrets,pvc -n erp

# Monitor pod creation (this takes several minutes)
kubectl get pods -n erp -w

# Check service creation
kubectl get svc -n erp
```

### 3.3 Common Deployment Timeline
```bash
# Typical deployment sequence (5-10 minutes total):
# 1. Namespace created (immediate)
# 2. Secrets created (10-30 seconds)
# 3. ConfigMaps created (10-30 seconds)
# 4. Services created (10-30 seconds)
# 5. Deployments created (30-60 seconds)
# 6. Pods start (1-3 minutes)
# 7. Ingress created (30-60 seconds)
# 8. Certificates issued (2-5 minutes)
# 9. LoadBalancer assigned (2-5 minutes)
```

### 3.4 Wait for Full Deployment
```bash
# Wait for all resources to be ready
kubectl wait --for=condition=available --timeout=600s deployment/erp-ui -n erp

# Verify all pods are running
kubectl get pods -n erp
# Expected: All pods show "Running" with 2/2 READY
```

---

## Phase 4: Post-Deployment Verification

Once applications show `Synced` and `Healthy`, verify everything is working.

### 4.1 Application Status Check
```bash
# Get detailed application information
argocd app get erp-ui --health

# Check application conditions
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.conditions}'
```

### 4.2 Service Verification
```bash
# Check all deployed resources
kubectl get all,ingress,secrets,pvc -n erp

# Verify specific services
kubectl get deployment erp-ui -n erp
kubectl get service erp-ui -n erp

# Check ingress configuration
kubectl get ingress -n erp -o yaml
```

### 4.3 Certificate Verification
```bash
# Check certificate status
kubectl get certificates -n erp

# Verify certificate details
kubectl describe certificate erp-masterspace-tls -n erp

# Check certificate secret exists
kubectl get secret erp-masterspace-tls -n erp
```

### 4.4 DNS and SSL Testing
```bash
# Check DNS resolution
nslookup erp.masterspace.co.ke

# Get LoadBalancer IP
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'

# Test SSL certificate
echo | openssl s_client -servername erp.masterspace.co.ke -connect erp.masterspace.co.ke:443

# Test HTTPS connectivity
curl -k https://erp.masterspace.co.ke/
```

### 4.5 Application Health Checks
```bash
# Test UI health endpoint
curl -k https://erp.masterspace.co.ke/health

# Verify LoadBalancer IP assignment
LB_IP=$(kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
echo "LoadBalancer IP: $LB_IP"
```

---

## Phase 5: Troubleshooting & Maintenance

If any step fails, use these troubleshooting procedures.

### 5.1 Application Sync Issues
```bash
# Check ArgoCD application controller status
kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-application-controller

# Check application controller logs
kubectl logs -f deployment/argocd-application-controller -n argocd

# Check application events
kubectl get events -n argocd --field-selector involvedObject.name=erp-ui

# Check for stuck applications
kubectl get applications.argoproj.io erp-ui -n argocd -o jsonpath='{.status.sync.status}'
```

### 5.2 Pod Startup Issues
# 5.6 Ingress 503 (Service Temporarily Unavailable)

**Likely causes**: No service endpoints (selector/label mismatch), app not listening on target port, or ingress pointing to wrong port.

Run on VPS:
```bash
# Ingress
kubectl -n erp get ingress
kubectl -n erp describe ingress erp-ui || true

# Service and endpoints
kubectl -n erp get svc erp-ui -o wide
kubectl -n erp get endpoints erp-ui -o wide

# Verify pod labels vs service selector
kubectl -n erp describe svc erp-ui | sed -n '/Selector/,$p' | head -5
kubectl -n erp get pods --show-labels | grep erp-ui || kubectl -n erp get pods --show-labels

# Verify container is listening on 3000
kubectl -n erp logs deploy/erp-ui --tail=100 || true
kubectl -n erp exec deploy/erp-ui -- sh -lc 'wget -qO- http://127.0.0.1:3000/health || curl -sf http://127.0.0.1:3000/health || true'

# Ingress controller logs
kubectl -n ingress-nginx logs deploy/ingress-nginx-controller --tail=200 | grep -Ei 'endpoint|upstream|no.*endpoints|unavailable' || true
```

Fixes:
- If endpoints empty: fix Service selector to match Deployment labels or relabel Deployment; then `argocd app sync erp-ui`.
- If port mismatch: ensure chart `service.targetPort=3000` and container `PORT=3000` (server.js listens on 3000).
- Restart after fix: `kubectl -n erp rollout restart deploy/erp-ui`.
```bash
# Check pod logs for errors
kubectl logs -f deployment/erp-ui -n erp

# Check pod events
kubectl describe pod -n erp -l app=erp-ui

# Check resource constraints
kubectl top pods -n erp
kubectl top nodes
```

### 5.3 Certificate Issues
```bash
# Check cert-manager status
kubectl get pods -n cert-manager

# Check certificate events
kubectl get events -n erp --field-selector involvedObject.kind=Certificate

# Check cert-manager logs
kubectl logs -n cert-manager deployment/cert-manager -f

# Manual certificate renewal
kubectl annotate certificate erp-masterspace-tls -n erp cert-manager.io/issue-temporary-certificate="true"
```

### 5.4 Ingress and LoadBalancer Issues
```bash
# Check ingress controller status
kubectl get pods -n ingress-nginx -l app.kubernetes.io/component=controller

# Check LoadBalancer service
kubectl describe svc ingress-nginx-controller -n ingress-nginx

# Check LoadBalancer events
kubectl get events -n ingress-nginx --field-selector involvedObject.name=ingress-nginx-controller

# Wait for LoadBalancer IP assignment
kubectl wait --for=condition=available --timeout=300s deployment/ingress-nginx-controller -n ingress-nginx
```

### 5.5 Network Connectivity Issues
```bash
# Test service accessibility from within cluster
kubectl run test-pod --rm -i --tty --image curlimages/curl -- curl -k http://erp-ui.erp.svc.cluster.local:3000/health

# Port forward for local testing
kubectl port-forward svc/erp-ui 3000:80 -n erp

# Test locally
curl http://localhost:3000/health
```

---

## Emergency Procedures

### Force Application Recreation
```bash
# Delete and recreate applications if they're stuck
kubectl delete application erp-ui -n argocd

# Wait a moment, then recreate
kubectl apply -f apps/erp-ui/app.yaml -n argocd

# Force sync
argocd app sync erp-ui --force
```

### Application Rollback
```bash
# List available revisions
argocd app history erp-ui

# Rollback to previous working version
argocd app rollback erp-ui PREV
```

### Scale Applications
```bash
# Scale down for maintenance
kubectl scale deployment erp-ui -n erp --replicas=0

# Scale back up
kubectl scale deployment erp-ui -n erp --replicas=2
```

---

## Quick Reference Commands

### Status Check
```bash
# Quick status overview
kubectl get applications.argoproj.io -n argocd
kubectl get all,ingress -n erp
kubectl get certificates -n erp
```

### Health Check
```bash
# Test endpoints
curl -k https://erp.masterspace.co.ke/health
```

### Common Fixes
```bash
# Restart applications
kubectl rollout restart deployment/erp-ui -n erp

# Force certificate renewal
kubectl annotate certificate erp-masterspace-tls -n erp cert-manager.io/issue-temporary-certificate="true"
```

---

## Support and Escalation

For issues not covered in this guide:

1. **Check ArgoCD Interface**: Access ArgoCD web UI for visual application status
2. **Review Application Logs**: Check both application and ArgoCD controller logs
3. **Consult System Documentation**: Refer to `devops-k8s/docs/pipelines.md` for additional procedures
4. **Check API Status**: Verify ERP API is functioning correctly
5. **Contact Development Team**: Escalate complex issues requiring code or configuration changes

---

*This manual deployment guide provides a complete walkthrough from initial deployment to ongoing maintenance. Always attempt automated deployment first, and use this guide for troubleshooting or emergency manual operations.*
