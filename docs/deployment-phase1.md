# Phase 1 — Déploiement Infrastructure (Josue)

## Manifests créés dans k8s/

| Fichier | Contenu |
|---|---|
| `namespace.yaml` | Namespace `taskboard` |
| `config.yaml` | ConfigMap (DB_HOST, DB_PORT, DB_NAME, DB_USER, ports) + Secret (DB_PASSWORD base64) |
| `database.yaml` | ConfigMap init.sql + PVC 1Gi + Deployment postgres:16-alpine + Service ClusterIP |
| `backend.yaml` | Deployment 2 replicas + envFrom + readinessProbe + livenessProbe + resources.requests + Service ClusterIP |
| `frontend.yaml` | Deployment + Service NodePort |
| `pod-test.yaml` | Pod busybox pour tests réseau internes |
| `ingress.yaml` | Nginx routing : /api/* → backend, / → frontend |
| `hpa.yaml` | HPA min:2 max:10 CPU 50% |

## Déploiement validé

```
kubectl get all -n taskboard

NAME                                      READY   STATUS    RESTARTS   AGE
pod/taskboard-backend-856c77fc9c-8vkcj    1/1     Running   0          119s
pod/taskboard-backend-856c77fc9c-rltbk    1/1     Running   0          119s
pod/taskboard-db-56f4dc5b54-krqfc         1/1     Running   0          119s
pod/taskboard-frontend-6c69cb5d55-cxw4k   1/1     Running   0          118s

NAME                         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)          AGE
service/taskboard-backend    ClusterIP   10.96.205.245   <none>        3000/TCP         119s
service/taskboard-db         ClusterIP   10.96.172.213   <none>        5432/TCP         119s
service/taskboard-frontend   NodePort    10.96.41.252    <none>        8080:32358/TCP   118s

NAME                                 READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/taskboard-backend    2/2     2            2           119s
deployment.apps/taskboard-db         1/1     1            1           119s
deployment.apps/taskboard-frontend   1/1     1            1           118s
```

## Vérifications réalisées

- [x] 2/2 backend pods Running
- [x] 1/1 DB pod Running avec readinessProbe pg_isready
- [x] 1/1 frontend pod Running
- [x] Service DB en ClusterIP uniquement (jamais exposé hors du cluster)
- [x] Service frontend en NodePort (port 32358)
- [x] imagePullPolicy: IfNotPresent sur tous les Deployments
- [x] ConfigMap et Secret appliqués (mot de passe DB uniquement dans le Secret)
- [x] PVC taskboard-db-pvc créé et Bound (1Gi)
- [x] resources.requests définis sur le backend (cpu: 100m, memory: 128Mi)
- [x] Health check backend : `{"status":"ok","database":"connected"}`

## Commandes utilisées

```bash
# Build des images locales
docker build -t taskboard-backend:latest ./taskboard/backend
docker build -t taskboard-frontend:latest ./taskboard/frontend

# Déploiement
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/config.yaml
kubectl apply -f k8s/database.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml

# Vérification
kubectl get all -n taskboard
kubectl port-forward -n taskboard svc/taskboard-frontend 8080:8080
kubectl port-forward -n taskboard svc/taskboard-backend 3000:3000
curl http://localhost:3000/health
```
