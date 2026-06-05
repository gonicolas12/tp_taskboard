# TP - Déployer et exploiter TaskBoard sur Kubernetes

> **Durée : journée complète.** TP **autonome** : on ne vous donne aucun
> manifeste. À partir de l'application fournie et des exigences ci-dessous, vous
> concevez, écrivez et débuggez **vous-mêmes** tous les objets Kubernetes.
>
> Vous travaillez sur le **Kubernetes intégré à Docker Desktop**.

---

## Contexte

Vous reprenez l'application **TaskBoard** (séance 1), déjà conteneurisée
(frontend statique, API Node.js, base PostgreSQL). En séance 1 elle tournait
avec `docker compose`, sur une seule machine. Votre mission : la **déployer et
l'exploiter sur un cluster Kubernetes**, comme en production - avec
configuration externalisée, persistance, mise à l'échelle et résilience.

**Contrat de l'application (ce dont l'API a besoin) :**

| Variable      | Valeur attendue      | Rôle                              |
|---------------|----------------------|-----------------------------------|
| `PORT`        | `3000`               | port d'écoute de l'API            |
| `DB_HOST`     | nom du Service DB    | hôte PostgreSQL                   |
| `DB_PORT`     | `5432`               | port PostgreSQL                  |
| `DB_NAME`     | `taskboard`          | nom de la base                    |
| `DB_USER`     | `taskboard_user`     | utilisateur                       |
| `DB_PASSWORD` | `taskboard_password` | mot de passe (**sensible**)       |

- L'API expose une route de santé : `GET /health` → `{ "database": "connected" }`.
- Le frontend (`serve`) écoute sur le port **8080** et appelle l'API sur
  `http://localhost:3000` (donc à exposer via port-forward pour les tests).

---

## Prérequis (à faire en premier)

1. **Activer Kubernetes** : Docker Desktop → Settings → Kubernetes → *Enable*.
2. Vérifier : `kubectl get nodes` (un node `Ready`).
3. **Construire les images** (le cluster voit vos images locales) :
   ```bash
   docker build -t taskboard-api:1.0.0 ./backend
   docker build -t taskboard-web:1.0.0 ./frontend
   ```
4. Créer votre dossier de travail `k8s/` (vide). Tous vos manifestes y vivront.

> ⚠️ Comme les images sont **locales**, pensez à `imagePullPolicy: IfNotPresent`
> dans vos conteneurs, sinon Kubernetes tentera un `pull` distant (`ErrImagePull`).

---

## Partie A - Déploiement de la stack *(obligatoire)*

Déployez les trois tiers dans un **namespace dédié** `taskboard`. Vous devez
produire et appliquer des manifestes pour :

1. **Namespace** `taskboard`.
2. **Configuration**
   - une **ConfigMap** pour les variables non sensibles (`PORT`, `DB_HOST`,
     `DB_PORT`, `DB_NAME`, `DB_USER`) ;
   - un **Secret** pour `DB_PASSWORD`.
3. **Base de données PostgreSQL**
   - un **PersistentVolumeClaim** (les données doivent survivre au Pod) ;
   - un **Deployment** `postgres:16-alpine` configuré depuis la ConfigMap +
     le Secret, montant le PVC sur les données ;
   - un **Service** `db` de type **ClusterIP** (jamais exposé hors du cluster).
4. **Backend** : un **Deployment** (image `taskboard-api:1.0.0`, **2 replicas**)
   recevant **toute** sa config depuis la ConfigMap + le Secret, et un
   **Service** `backend`.
5. **Frontend** : un **Deployment** (image `taskboard-web:1.0.0`) + un
   **Service** `frontend`.

**Test de bout en bout** (le navigateur appelle l'API sur `localhost:3000`,
exposez donc les deux) :

```bash
kubectl port-forward -n taskboard svc/frontend 8080:80
kubectl port-forward -n taskboard svc/backend  3000:3000
# http://localhost:8080  → créer et lister des tâches
```

> 🔎 **À résoudre vous-mêmes :** comment la table `tasks` est-elle créée ?
> En séance 1, `database/init.sql` était monté dans
> `/docker-entrypoint-initdb.d/`. À vous de trouver l'équivalent Kubernetes
> (indice : une ConfigMap montée comme volume). À défaut, créez la table à la
> main pour débloquer, mais l'objectif est la version automatique.

---

## Partie B - Robustesse & exploitation *(obligatoire)*

1. **Sondes** : ajoutez une `readinessProbe` (et une `livenessProbe`) HTTP sur
   `/health` au backend. Observez l'effet sur `READY`.
2. **Ressources** : déclarez `requests` et `limits` (CPU/mémoire) sur le backend.
3. **Démonstrations** à capturer pour le rapport :
   - **self-healing** : supprimez un Pod backend → il est recréé.
   - **scaling** : passez à 5 replicas, revenez à 2.
   - **persistance** : créez des tâches, supprimez le Pod DB, vérifiez que les
     données sont toujours là.

---

## Partie C - Exposition & mise à l'échelle automatique *(à faire)*

1. **Ingress** : installez un Ingress Controller, puis créez un **Ingress** qui
   route `/api` → service backend et `/` → service frontend (un seul point
   d'entrée). Installation nginx-ingress :
   ```bash
   kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml
   ```
2. **Autoscaling** : créez un **HorizontalPodAutoscaler** sur le backend
   (CPU 70 %, min 2 / max 10). Provoquez de la charge et observez le scaling.
   > Le HPA exige `resources.requests` (Partie B) + `metrics-server`.

---

## Partie D - Pour aller plus loin *(bonus)*

- **Rolling update** : taggez une `taskboard-api:2.0.0`, déployez-la sans
  coupure (`kubectl set image …`), puis faites un **rollback**.
- **Isolation réseau** : une `NetworkPolicy` qui n'autorise que le backend à
  joindre la DB.
- **Optimisation** : réduire la taille des images, passer le frontend derrière
  un vrai serveur (nginx) au lieu de `serve`.

---

## Repères horaires (indicatifs)

| Créneau        | Objectif                                            |
|----------------|-----------------------------------------------------|
| Matin          | Prérequis + **Partie A** (stack qui tourne)         |
| Début aprèm    | **Partie B** (sondes, ressources, démos)            |
| Milieu aprèm   | **Partie C** (Ingress + HPA)                        |
| Fin de journée | **Partie D** (bonus) + rédaction du rapport         |

---

## Contraintes à respecter (récap)

- [ ] Tout dans le namespace `taskboard`
- [ ] Mot de passe DB dans un **Secret** (jamais en clair dans un Deployment)
- [ ] Configuration dans une **ConfigMap**
- [ ] **PVC** pour PostgreSQL (données persistantes)
- [ ] Backend en **2 replicas** + `readinessProbe`
- [ ] DB en **ClusterIP** (non exposée)
- [ ] Manifestes **commentés**

## Livrable

1. Votre dossier `k8s/` complet et **commenté**.
2. Un **rapport PDF de 2 pages max** :
   - schéma d'architecture Kubernetes ;
   - explication des choix (ConfigMap/Secret, PVC, replicas, probes, Ingress/HPA) ;
   - **preuves** : sortie de `kubectl get all -n taskboard`, captures des démos
     self-healing **et** persistance.

> **IA :** les assistants peuvent aider, mais tout rendu doit être compris,
> testé et justifié - vous devez savoir expliquer chaque ligne.

---

## Boîte à outils (vous cherchez la syntaxe vous-mêmes)

```bash
kubectl explain deployment.spec           # découvrir les champs d'un objet
kubectl explain pod.spec.containers.env
kubectl get all -n taskboard
kubectl describe pod <pod> -n taskboard
kubectl logs -f <pod> -n taskboard
kubectl get events -n taskboard --sort-by=.lastTimestamp
kubectl exec -it <pod> -n taskboard -- sh
```

Documentation officielle : <https://kubernetes.io/docs/concepts/> ·
<https://kubernetes.io/docs/reference/kubectl/>

| Symptôme | Piste |
|----------|-------|
| `ErrImagePull` / `ImagePullBackOff` | image pas buildée localement, ou `imagePullPolicy` manquant |
| `CrashLoopBackOff` | l'app plante au démarrage → lire `kubectl logs` |
| Pod `Pending` | PVC non `Bound`, ou ressources insuffisantes |
| backend ne joint pas la DB | nom de Service `db` ? variables d'env ? Pod DB `Ready` ? |
| `0/1 Ready` | la `readinessProbe` échoue → tester `/health` à la main |
