# TaskBoard - projet fil rouge (séance 2 : Kubernetes)

Application reprise de la séance 1 (déjà conteneurisée). En séance 2, vous la
**déployez sur Kubernetes** (Docker Desktop) en écrivant **vous-mêmes** les
manifestes.

## Stack

- Frontend : HTML / CSS / JS (servi par `serve`, port 8080)
- Backend : Node.js / Express (port 3000, route `/health`)
- Base de données : PostgreSQL

## Ce qui est fourni

- Le **code** de l'application (`frontend/`, `backend/`, `database/init.sql`)
- Les **Dockerfile** (séance 1)
- `docker-compose.yml` (rappel séance 1)

## Ce que vous produisez

- Un dossier `k8s/` que **vous créez**, avec tous les manifestes Kubernetes.
- **Aucun YAML Kubernetes n'est fourni** : c'est l'objet du travail.

## Par où commencer

Le sujet complet du TP : **`../TP-Kubernetes.md`**.

```bash
# Prérequis : activer Kubernetes dans Docker Desktop, puis :
docker build -t taskboard-api:1.0.0 ./backend
docker build -t taskboard-web:1.0.0 ./frontend
mkdir k8s
```
