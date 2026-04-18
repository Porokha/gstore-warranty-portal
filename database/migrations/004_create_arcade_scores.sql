CREATE TABLE IF NOT EXISTS arcade_scores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    game ENUM('tetris', 'snake', 'invaders') NOT NULL,
    player_name VARCHAR(60) NOT NULL,
    score INT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_arcade_scores_game_score (game, score, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
