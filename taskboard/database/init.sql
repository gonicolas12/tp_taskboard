CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tasks (title, description)
VALUES
    ('Préparer le Dockerfile backend', 'Utiliser une image Node légère'),
    ('Créer le docker-compose.yml', 'Relier frontend, backend et PostgreSQL'),
    ('Ajouter un volume nommé', 'Conserver les données PostgreSQL');