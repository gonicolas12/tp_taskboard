# Phase 4 — Configuration Exposition (Nicolas)
 
## 1. Installation nginx Ingress Controller
 
```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

# Phase 4 — Configuration Exposition (Nicolas)
## 1. Installation nginx Ingress Controller
```powershell
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/cloud/deploy.yaml
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=120s
```

Vérification :
```bash
kubectl get pods -n ingress-nginx
```

## 2. Application du manifest Ingress
```bash
kubectl apply -f k8s/ingress.yaml
kubectl get ingress -n taskboard
```

## 3. Configuration du fichier hosts
Fichier modifié : C:\Windows\System32\drivers\etc\hosts (en tant qu'administrateur)
Ligne ajoutée :
```
127.0.0.1  taskboard.local
```

Vidage du cache DNS :
```powershell
ipconfig /flushdns
```

## 4. Routage configuré
| URL | Destination | Service backend |
|-----|-------------|-----------------|
| http://taskboard.local/ | Frontend | taskboard-frontend:8080 |
| http://taskboard.local/api/tasks | Backend (rewrite → /tasks) | taskboard-backend:3000 |
| http://taskboard.local/api/health | Backend (rewrite → /health) | taskboard-backend:3000 |

Le rewrite /$2 dans l'annotation nginx supprime le préfixe /api avant de transmettre au backend.

## 5. Fix API_BASE_URL côté frontend
Le frontend lisait par défaut http://localhost:3000, ce qui échoue derrière l'Ingress (navigateur ne voit pas le backend).
Modification dans taskboard/frontend/app.js :
```bash
// Avantconst API_BASE_URL = window.API_BASE_URL || "http://localhost:3000";// Aprèsconst API_BASE_URL = window.API_BASE_URL || "/api";
```

Rebuild + reimport dans le node Kubernetes (Docker Desktop K8s isolé) :
```bash
docker build -t taskboard-frontend:latest ./taskboard/frontend
docker save taskboard-frontend:latest -o frontend.tar
docker cp frontend.tar desktop-control-plane:/frontend.tar
docker exec desktop-control-plane ctr --namespace k8s.io images import /frontend.tar
kubectl rollout restart deployment/taskboard-frontend -n taskboard
```

## 6. Tests validés
- [x] http://taskboard.local affiche le frontend TaskBoard
- [x] La liste des tâches se charge correctement
- [x] L'ajout d'une nouvelle tâche fonctionne
- [x] http://taskboard.local/api/health renvoie {"status":"ok","database":"connected"}

## 7. Difficultés rencontrées

- 503 Service Temporarily Unavailable : causé par des pods backend/frontend en ImagePullBackOff car les images locales n'étaient pas chargées dans le node Kubernetes

- Solution : utiliser docker save + docker cp + ctr import pour charger les images dans le containerd du node desktop-control-plane (Docker Desktop K8s utilise un node isolé qui ne partage pas le cache Docker du host)

- ERR_CONNECTION_REFUSED sur localhost:3000 : le frontend ciblait localhost au lieu de passer par l'Ingress → fix de API_BASE_URL