Résumé complet du projet — TP Kubernetes : déployer TaskBoard
Contexte
Tu repars de l'application TaskBoard (frontend + backend Node.js + PostgreSQL) conteneurisée avec Docker Compose en séance 1. L'objectif est de la redéployer et l'exploiter sur Kubernetes via Docker Desktop, avec configuration externalisée, persistance des données et mise à l'échelle automatique.

Architecture cible — namespace taskboard
text
[Internet / port-forward]
       ↓
  frontend Svc  →  frontend Pods
                        ↓
  backend Svc  →  backend Pods ×2
                        ↓
    db Svc  →  db Pod + PVC (PostgreSQL)
La DB n'est jamais exposée hors du cluster (ClusterIP uniquement)

Le frontend appelle le backend, le backend appelle la DB

Fichiers à créer (dossier k8s/)
Fichier	Contenu
pod-test.yaml	Pod jetable pour valider l'étape 1
config.yaml	ConfigMap (variables non sensibles) + Secret (mot de passe DB en base64)
database.yaml	PVC + Deployment + Service (ClusterIP)
backend.yaml	Deployment (2 replicas) + Service
frontend.yaml	Deployment + Service (NodePort ou port-forward)
Aucun manifest n'est fourni — tout est à concevoir et écrire objet par objet.

Contraintes techniques obligatoires
Tous les manifests dans k8s/

ConfigMap pour la config (DB_HOST, ports, noms de base...)

Secret pour le mot de passe DB — jamais en clair dans un Deployment

PVC pour PostgreSQL (persistance des données)

Backend en 2 replicas avec readinessProbe sur /health

livenessProbe également recommandée (étape B)

resources.requests définis sur le backend (requis pour le HPA)

imagePullPolicy: IfNotPresent (ou Never) dans chaque Deployment — spécificité Docker Desktop pour utiliser les images buildées localement

Étapes du TP
A — Stack de base (obligatoire)

Créer le namespace taskboard

Écrire config.yaml : ConfigMap + Secret

Écrire database.yaml : PVC + Deployment + Service

Écrire backend.yaml : Deployment 2 replicas + Service

Écrire frontend.yaml : Deployment + Service

B — Robustesse (obligatoire)

Ajouter readinessProbe et livenessProbe sur /health (port 3000)

Définir resources.requests (CPU/mémoire) sur le backend

Démo self-healing : kubectl delete pod <backend-pod> -n taskboard → vérifier qu'il est recréé

Démo scaling manuel : passer le backend à 5 replicas, observer la répartition

Démo persistance : ajouter des tâches, supprimer le Pod DB, vérifier que les données survivent grâce au PVC

C — Exposition avancée (niveau "attendu")

Installer un Ingress Controller (nginx-ingress)

Écrire un manifest Ingress : /api → service backend, / → service frontend

Configurer un HPA (HorizontalPodAutoscaler) : min 2, max 10 replicas, seuil CPU

D — Bonus (optionnel)

Rolling update : kubectl set image + kubectl rollout undo

NetworkPolicy

Autres extras

Commandes clés
bash
# Déployer tout
kubectl apply -f k8s/

# Vérifier l'état
kubectl get all -n taskboard

# Accéder au frontend
kubectl port-forward -n taskboard svc/frontend 8080:80

# Logs backend
kubectl logs -f deploy/taskboard-backend -n taskboard

# Démo self-healing
kubectl delete pod <backend-pod> -n taskboard
kubectl get pods -n taskboard -w

# Scaling manuel
kubectl scale deployment/taskboard-backend --replicas=5 -n taskboard
Astuces de débogage
bash
kubectl get pods -n taskboard -o wide
kubectl describe pod <pod> -n taskboard
kubectl logs -f <pod> -n taskboard
kubectl get events -n taskboard --sort-by=.lastTimestamp
kubectl exec -it <pod> -n taskboard -- sh
Livrable à rendre
Dossier k8s/ complet et commenté

Rapport PDF 2 pages max contenant :

Schéma d'architecture Kubernetes

Explication des choix (ConfigMap/Secret, PVC, replicas)

Preuves : capture kubectl get all, démo self-healing & persistance (screenshots)

L'IA peut aider mais tout doit être compris, testé et justifié.

Checklist avant rendu
Fonctionnel :

kubectl get all -n taskboard → tout est Running

Frontend accessible via port-forward

On peut créer et lister des tâches

Les données survivent à la suppression du Pod DB

Technique :

Mot de passe DB dans un Secret

Config dans une ConfigMap

Backend en 2 replicas avec readinessProbe

DB en ClusterIP (non exposée hors cluster)

imagePullPolicy: IfNotPresent dans les Deployments

resources.requests définis (si HPA visé)