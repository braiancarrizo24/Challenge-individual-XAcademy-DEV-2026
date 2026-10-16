
CREATE DATABASE IF NOT EXISTS fifa_stats
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fifa_stats;

CREATE TABLE IF NOT EXISTS players (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  nationality VARCHAR(100) NULL,
  gender VARCHAR(20) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_editions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_id INT NOT NULL,
  edition INT NOT NULL,
  age INT NULL,
  club VARCHAR(150) NULL,
  position VARCHAR(80) NULL,
  rating INT NULL,

  CONSTRAINT uq_player_edition
    UNIQUE (player_id, edition),

  CONSTRAINT fk_edition_player
    FOREIGN KEY (player_id)
    REFERENCES players(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_skills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  player_edition_id INT NOT NULL,
  skill VARCHAR(80) NOT NULL,
  value DECIMAL(5,2) NOT NULL,

  CONSTRAINT uq_edition_skill
    UNIQUE (player_edition_id, skill),

  CONSTRAINT fk_skill_edition
    FOREIGN KEY (player_edition_id)
    REFERENCES player_editions(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;
