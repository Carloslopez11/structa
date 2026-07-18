-- PASO A PASO PARA CREAR LA TABLA DE PROYECTOS SIN ROMPER NADA
-- 
-- 1. Asegúrate de estar conectado ESPECÍFICAMENTE a la base de datos "structa_db".
--    Si usas la terminal psql, escribe:
--    \c structa_db;
--
-- 2. Copia y pega el siguiente código para crear la nueva tabla.
--    Este código NO toca la tabla "users" ni ninguna otra base de datos de tu Contabo.

CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255),
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY(user_email) 
        REFERENCES users(email)
        ON DELETE CASCADE
);

-- 3. (Opcional) Si quieres ver que se creó correctamente, ejecuta:
-- \dt
-- o
-- SELECT * FROM projects;
