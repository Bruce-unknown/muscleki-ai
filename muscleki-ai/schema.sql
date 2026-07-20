-- Schema setup for muscleki-ai

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    weight_kg REAL,
    height_cm REAL,
    age INTEGER,
    fitness_goal VARCHAR(50),
    preferred_region VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Workouts Table
CREATE TABLE workouts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled' NOT NULL
);

-- 3. Calendar Tokens Table
CREATE TABLE calendar_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    provider VARCHAR(50) NOT NULL, -- 'google' or 'outlook'
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    CONSTRAINT uq_user_provider UNIQUE (user_id, provider)
);

-- 4. Reminders Table
CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    workout_id INTEGER REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    trigger_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL -- 'pending', 'sent', 'failed'
);

-- 5. Food Logs Table
CREATE TABLE food_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    food_name VARCHAR(255) NOT NULL,
    calories INTEGER NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fats REAL NOT NULL,
    fluid_volume_ml INTEGER,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Hydration Logs Table
CREATE TABLE hydration_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    fluid_type VARCHAR(255) NOT NULL,
    volume_ml INTEGER NOT NULL,
    calories_added INTEGER DEFAULT 0 NOT NULL,
    logged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Form Analyses Table
CREATE TABLE form_analyses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    exercise_type VARCHAR(100) NOT NULL,
    feedback_notes TEXT NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'good' or 'needs_adjustment'
    analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Leaderboard Streaks Table
CREATE TABLE leaderboard_streaks (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    daily_streak INTEGER DEFAULT 0 NOT NULL,
    total_calories INTEGER DEFAULT 0 NOT NULL,
    region VARCHAR(50) NOT NULL -- 'India', 'USA', 'Asia', 'Global', etc.
);


