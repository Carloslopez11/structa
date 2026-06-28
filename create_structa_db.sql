-- Script para aislar Structa en tu servidor de Contabo (PostgreSQL)
-- NO EJECUTAR ESTO DENTRO DE LA BD DE TUS OTROS PROYECTOS.

-- 1. Crear una Base de Datos totalmente independiente
CREATE DATABASE structa_db;

-- 2. Conectarse a la nueva base de datos
\c structa_db;

-- 3. Crear la tabla de usuarios
CREATE TABLE users (
    email VARCHAR(255) PRIMARY KEY,
    count INTEGER DEFAULT 0,
    is_pro BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplo para probar
-- INSERT INTO users (email, count, is_pro) VALUES ('test@example.com', 0, false);
