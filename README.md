# TP Kubernetes — TaskBoard

Déploiement de l'application **TaskBoard** (frontend HTML + backend Node.js + PostgreSQL) sur Kubernetes avec Docker Desktop.

## Membres du groupe

| Membre | Rôle |
|--------|------|
| Josué Adami (A) | Infrastructure & Configuration |
| Alexis Redaud (B) | Backend & Robustesse |
| Nicolas Gouy (C) | Frontend, Exposition & Rapport |

---

## Prérequis

- Docker Desktop avec Kubernetes activé
- `kubectl` configuré sur le contexte `docker-desktop`
- nginx Ingress Controller (Phase 4)
- metrics-server (Phase 4 — HPA)

## Structure du repo

```
tp_taskboard/
├── taskboard/          # Application (Docker Compose)
│   ├── backend/        # API Node.js Express (port 3000)
│   ├── frontend/       # Interface HTML/CSS/JS (port 8080)
│   └── database/       # Script SQL d'initialisation
└── k8s/                # Manifests Kubernetes
    ├── namespace.yaml  # Namespace taskboard
    ├── config.yaml     # ConfigMap + Secret
    ├── database.yaml   # PVC + Deployment PostgreSQL + Service
    ├── backend.yaml    # Deployment backend + Service
    ├── frontend.yaml   # Deployment frontend + Service NodePort
    ├── ingress.yaml    # Ingress nginx (/ → frontend, /api → backend)
    ├── hpa.yaml        # HorizontalPodAutoscaler backend
    └── pod-test.yaml   # Pod busybox pour tests réseau internes
```

---

## Déploiement rapide

### 1. Builder les images localement

```bash
docker build -t taskboard-backend:latest ./taskboard/backend
docker build -t taskboard-frontend:latest ./taskboard/frontend
```

### 2. Appliquer les manifests

```bash
# Namespace en premier
kubectl apply -f k8s/namespace.yaml

# Config (ConfigMap + Secret)
kubectl apply -f k8s/config.yaml

# Base de données
kubectl apply -f k8s/database.yaml

# Backend puis frontend
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Ou tout d'un coup (après le namespace)
kubectl apply -f k8s/
```

### 3. Vérifier l'état

```bash
kubectl get all -n taskboard
kubectl get pvc -n taskboard
kubectl describe pod -n taskboard -l component=backend
```

### 4. Accéder à l'application (sans Ingress)

```bash
# Frontend
kubectl port-forward -n taskboard svc/taskboard-frontend 8080:8080
# Ouvrir http://localhost:8080

# Backend (tests directs)
kubectl port-forward -n taskboard svc/taskboard-backend 3000:3000
# Tester : curl http://localhost:3000/health
```

### 5. Tests réseau internes (pod busybox)

```bash
kubectl apply -f k8s/pod-test.yaml
kubectl exec -it pod-test -n taskboard -- sh

# Depuis le pod :
wget -qO- http://taskboard-backend:3000/health
wget -qO- http://taskboard-backend:3000/tasks
nc -zv taskboard-db 5432

kubectl delete pod pod-test -n taskboard
```

---

## Phase 4 — Ingress + HPA

### Installer nginx Ingress Controller

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

### Installer metrics-server (pour le HPA)

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

### Appliquer Ingress et HPA

```bash
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml
```

### Ajouter taskboard.local dans /etc/hosts

```
127.0.0.1  taskboard.local
```

### Accéder via l'Ingress

```
http://taskboard.local       → Frontend
http://taskboard.local/api/tasks  → Backend API
```

### Observer le HPA

```bash
kubectl get hpa -n taskboard -w
```

---

## Commandes utiles

```bash
# Logs backend
kubectl logs -n taskboard -l component=backend --tail=50

# Logs DB
kubectl logs -n taskboard -l component=database --tail=50

# Self-healing : supprimer un pod et observer la recréation
kubectl delete pod -n taskboard -l component=backend

# Scaling manuel
kubectl scale deployment taskboard-backend -n taskboard --replicas=4

# Décrire le HPA
kubectl describe hpa taskboard-backend-hpa -n taskboard

# Tout supprimer
kubectl delete namespace taskboard
```
