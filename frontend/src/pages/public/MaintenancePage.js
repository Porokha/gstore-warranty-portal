import React, { useEffect, useMemo, useRef, useState } from 'react';
import { maintenanceService } from '../../services/maintenanceService';
import '../../styles/maintenance.css';

const loaderDurationMs = 3500;
const scoreLabels = {
  tetris: 'Lines score',
  snake: 'Apple score',
  invaders: 'Combat score',
};

const createMatrix = (width, height) =>
  Array.from({ length: height }, () => new Array(width).fill(0));

const createTetrisPiece = (type) => {
  if (type === 'T') return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
  if (type === 'O') return [[2, 2], [2, 2]];
  if (type === 'L') return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
  if (type === 'J') return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
  if (type === 'I') return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
  if (type === 'S') return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
  return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
};

const MaintenancePage = () => {
  const [showMainContent, setShowMainContent] = useState(false);
  const [activeGame, setActiveGame] = useState('tetris');
  const [currentScore, setCurrentScore] = useState(0);
  const [statusText, setStatusText] = useState('Stand by');
  const [leaderboards, setLeaderboards] = useState({
    tetris: [],
    snake: [],
    invaders: [],
  });
  const [playerName, setPlayerName] = useState('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [scoreToSave, setScoreToSave] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [scoresError, setScoresError] = useState('');

  const tetrisCanvasRef = useRef(null);
  const snakeCanvasRef = useRef(null);
  const invadersCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timeoutRef = useRef(null);
  const activeGameRef = useRef('tetris');
  const loopTokenRef = useRef(0);
  const keyStateRef = useRef({});
  const saveHandledRef = useRef(false);

  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  useEffect(() => {
    document.body.classList.add('maintenance-mode-body', 'maintenance-loader-active');

    const timer = window.setTimeout(() => {
      setShowMainContent(true);
    }, loaderDurationMs);

    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('maintenance-mode-body', 'maintenance-loader-active');
      stopGameLoops();
    };
  }, []);

  useEffect(() => {
    if (showMainContent) {
      document.body.classList.remove('maintenance-loader-active');
    } else {
      document.body.classList.add('maintenance-loader-active');
    }
  }, [showMainContent]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      keyStateRef.current[event.code] = true;

      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code) &&
        activeGameRef.current
      ) {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      keyStateRef.current[event.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const loadScores = async () => {
      try {
        setIsLoadingScores(true);
        setScoresError('');
        const result = await maintenanceService.getScores();
        setLeaderboards({
          tetris: result.tetris || [],
          snake: result.snake || [],
          invaders: result.invaders || [],
        });
      } catch (error) {
        setScoresError('Could not load top scorers right now.');
      } finally {
        setIsLoadingScores(false);
      }
    };

    loadScores();
  }, []);

  useEffect(() => {
    if (!showMainContent) {
      return;
    }

    stopGameLoops();
    saveHandledRef.current = false;
    setCurrentScore(0);
    setStatusText('Starting...');

    if (activeGame === 'tetris') {
      startTetris();
    } else if (activeGame === 'snake') {
      startSnake();
    } else {
      startInvaders();
    }
  }, [activeGame, showMainContent]);

  const stopGameLoops = () => {
    if (animationFrameRef.current) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    loopTokenRef.current += 1;
  };

  const handleGameOver = (game, score, label) => {
    if (saveHandledRef.current || activeGameRef.current !== game) {
      return;
    }

    saveHandledRef.current = true;
    stopGameLoops();
    setCurrentScore(score);
    setStatusText(label);
    setScoreToSave({ game, score });
    setPlayerName('');
    setSaveError('');
    setSaveModalOpen(true);
  };

  const startTetris = () => {
    const canvas = tetrisCanvasRef.current;
    if (!canvas) {
      return;
    }

    const token = loopTokenRef.current;
    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(20, 20);

    const arena = createMatrix(12, 20);
    const player = { pos: { x: 0, y: 0 }, matrix: null };
    let score = 0;
    let dropCounter = 0;
    let lastTime = 0;

    const drawMatrix = (matrix, offset) => {
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            context.fillStyle = '#a87ffb';
            context.fillRect(x + offset.x, y + offset.y, 1, 1);
            context.strokeStyle = '#050507';
            context.lineWidth = 0.05;
            context.strokeRect(x + offset.x, y + offset.y, 1, 1);
          }
        });
      });
    };

    const collide = () => {
      for (let y = 0; y < player.matrix.length; y += 1) {
        for (let x = 0; x < player.matrix[y].length; x += 1) {
          if (
            player.matrix[y][x] !== 0 &&
            (arena[y + player.pos.y] && arena[y + player.pos.y][x + player.pos.x]) !== 0
          ) {
            return true;
          }
        }
      }

      return false;
    };

    const merge = () => {
      player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            arena[y + player.pos.y][x + player.pos.x] = value;
          }
        });
      });
    };

    const sweepArena = () => {
      let cleared = 0;

      for (let y = arena.length - 1; y > 0; y -= 1) {
        if (!arena[y].every((cell) => cell !== 0)) {
          continue;
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        cleared += 1;
        y += 1;
      }

      if (cleared > 0) {
        score += cleared * 100;
        setCurrentScore(score);
      }
    };

    const resetPlayer = () => {
      const pieces = 'TJLOSZI';
      player.matrix = createTetrisPiece(pieces[Math.floor(Math.random() * pieces.length)]);
      player.pos.y = 0;
      player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);

      if (collide()) {
        handleGameOver('tetris', score, 'Game over');
        return false;
      }

      return true;
    };

    const rotate = (matrix, direction) => {
      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < y; x += 1) {
          const temp = matrix[x][y];
          matrix[x][y] = matrix[y][x];
          matrix[y][x] = temp;
        }
      }

      if (direction > 0) {
        matrix.forEach((row) => row.reverse());
      } else {
        matrix.reverse();
      }
    };

    const movePlayer = (offset) => {
      player.pos.x += offset;
      if (collide()) {
        player.pos.x -= offset;
      }
    };

    const rotatePlayer = (direction) => {
      const originalPosition = player.pos.x;
      let offset = 1;
      rotate(player.matrix, direction);

      while (collide()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));

        if (offset > player.matrix[0].length) {
          rotate(player.matrix, -direction);
          player.pos.x = originalPosition;
          return;
        }
      }
    };

    const dropPlayer = () => {
      player.pos.y += 1;

      if (!collide()) {
        return;
      }

      player.pos.y -= 1;
      merge();
      sweepArena();
      resetPlayer();
    };

    const render = (time = 0) => {
      if (token !== loopTokenRef.current || activeGameRef.current !== 'tetris') {
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;

      if (keyStateRef.current.ArrowLeft) {
        movePlayer(-1);
        keyStateRef.current.ArrowLeft = false;
      }

      if (keyStateRef.current.ArrowRight) {
        movePlayer(1);
        keyStateRef.current.ArrowRight = false;
      }

      if (keyStateRef.current.ArrowUp) {
        rotatePlayer(1);
        keyStateRef.current.ArrowUp = false;
      }

      if (keyStateRef.current.ArrowDown || dropCounter > 1000) {
        dropPlayer();
        dropCounter = 0;
        keyStateRef.current.ArrowDown = false;
      }

      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrix(arena, { x: 0, y: 0 });
      drawMatrix(player.matrix, player.pos);

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    setStatusText('Clear lines');
    setCurrentScore(0);
    if (resetPlayer()) {
      render();
    }
  };

  const startSnake = () => {
    const canvas = snakeCanvasRef.current;
    if (!canvas) {
      return;
    }

    const token = loopTokenRef.current;
    const context = canvas.getContext('2d');
    const grid = 20;
    const snake = {
      x: 160,
      y: 160,
      dx: grid,
      dy: 0,
      cells: [],
      maxCells: 4,
    };
    const apple = { x: 320, y: 320 };
    let score = 0;

    const randomCell = () => Math.floor(Math.random() * 20) * grid;

    const render = () => {
      if (token !== loopTokenRef.current || activeGameRef.current !== 'snake') {
        return;
      }

      if (keyStateRef.current.ArrowLeft && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
      } else if (keyStateRef.current.ArrowUp && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
      } else if (keyStateRef.current.ArrowRight && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
      } else if (keyStateRef.current.ArrowDown && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0 || snake.x >= canvas.width || snake.y < 0 || snake.y >= canvas.height) {
        handleGameOver('snake', score, 'You hit the wall');
        return;
      }

      snake.cells.unshift({ x: snake.x, y: snake.y });
      if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
      }

      context.fillStyle = '#ffffff';
      context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

      context.fillStyle = '#a87ffb';
      for (let index = 0; index < snake.cells.length; index += 1) {
        const cell = snake.cells[index];
        context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells += 1;
          score += 10;
          setCurrentScore(score);
          apple.x = randomCell();
          apple.y = randomCell();
        }

        for (let i = index + 1; i < snake.cells.length; i += 1) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            handleGameOver('snake', score, 'You collided with yourself');
            return;
          }
        }
      }

      timeoutRef.current = window.setTimeout(() => {
        animationFrameRef.current = window.requestAnimationFrame(render);
      }, 90);
    };

    setStatusText('Collect apples');
    setCurrentScore(0);
    render();
  };

  const startInvaders = () => {
    const canvas = invadersCanvasRef.current;
    if (!canvas) {
      return;
    }

    const token = loopTokenRef.current;
    const context = canvas.getContext('2d');
    const player = { x: 180, y: 360, width: 40, height: 20, speed: 5 };
    const bullets = [];
    const aliens = [];
    let alienDirection = 1;
    let lastShotAt = 0;
    let score = 0;

    for (let row = 0; row < 4; row += 1) {
      for (let column = 0; column < 8; column += 1) {
        aliens.push({
          x: 40 * column + 20,
          y: 30 * row + 20,
          width: 20,
          height: 20,
          alive: true,
        });
      }
    }

    const render = (time = 0) => {
      if (token !== loopTokenRef.current || activeGameRef.current !== 'invaders') {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (keyStateRef.current.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
      }

      if (keyStateRef.current.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
      }

      if (keyStateRef.current.Space && bullets.length < 3 && time - lastShotAt > 180) {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y });
        lastShotAt = time;
      }

      context.fillStyle = '#a87ffb';
      context.fillRect(player.x, player.y, player.width, player.height);

      context.fillStyle = '#ffffff';
      for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
        const bullet = bullets[bulletIndex];
        bullet.y -= 7;
        context.fillRect(bullet.x, bullet.y, 4, 10);

        if (bullet.y < 0) {
          bullets.splice(bulletIndex, 1);
        }
      }

      let hitWall = false;
      let livingAliens = 0;

      aliens.forEach((alien) => {
        if (!alien.alive) {
          return;
        }

        livingAliens += 1;
        alien.x += alienDirection * 0.55;

        if (alien.x <= 0 || alien.x >= canvas.width - alien.width) {
          hitWall = true;
        }

        if (alien.y + alien.height >= player.y) {
          handleGameOver('invaders', score, 'Aliens breached the line');
          return;
        }

        context.fillStyle = '#bdbdbd';
        context.fillRect(alien.x, alien.y, alien.width, alien.height);

        for (let bulletIndex = bullets.length - 1; bulletIndex >= 0; bulletIndex -= 1) {
          const bullet = bullets[bulletIndex];
          if (
            bullet.x > alien.x &&
            bullet.x < alien.x + alien.width &&
            bullet.y > alien.y &&
            bullet.y < alien.y + alien.height
          ) {
            alien.alive = false;
            bullets.splice(bulletIndex, 1);
            score += 50;
            setCurrentScore(score);
            break;
          }
        }
      });

      if (hitWall) {
        alienDirection *= -1;
        aliens.forEach((alien) => {
          if (alien.alive) {
            alien.y += 12;
          }
        });
      }

      if (livingAliens === 0) {
        handleGameOver('invaders', score, 'Wave cleared');
        return;
      }

      animationFrameRef.current = window.requestAnimationFrame(render);
    };

    setStatusText('Defend the line');
    setCurrentScore(0);
    render();
  };

  const refreshScores = async () => {
    try {
      const result = await maintenanceService.getScores();
      setLeaderboards({
        tetris: result.tetris || [],
        snake: result.snake || [],
        invaders: result.invaders || [],
      });
    } catch (error) {
      setScoresError('Could not refresh top scorers.');
    }
  };

  const handleSaveScore = async (event) => {
    event.preventDefault();

    if (!scoreToSave) {
      return;
    }

    const trimmedName = playerName.trim();
    if (!trimmedName) {
      setSaveError('Please enter your name.');
      return;
    }

    try {
      setIsSaving(true);
      setSaveError('');
      await maintenanceService.saveScore({
        game: scoreToSave.game,
        player_name: trimmedName,
        score: scoreToSave.score,
      });
      await refreshScores();
      setSaveModalOpen(false);
      setScoreToSave(null);
      setStatusText('Score saved');
    } catch (error) {
      setSaveError('Could not save your score right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const controlHint =
    activeGame === 'tetris'
      ? 'Controls: Arrow keys to move, Up to rotate, Down to drop.'
      : activeGame === 'snake'
        ? 'Controls: Arrow keys to steer. Walls are fatal.'
        : 'Controls: Left/Right to move, Space to shoot.';

  const visibleScores = leaderboards[activeGame] || [];
  const leaderboardRows = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => visibleScores[index] || null),
    [visibleScores],
  );

  return (
    <div className="maintenance-page">
      <div className={`maintenance-loader ${showMainContent ? 'is-hidden' : ''}`}>
        <div className="maintenance-logo-loader">
          <img src="/brand-logo-horizontal.svg" alt="ZEZVA" className="maintenance-logo-base" />
          <img
            src="/brand-logo-horizontal.svg"
            alt=""
            aria-hidden="true"
            className="maintenance-logo-fill"
          />
        </div>
      </div>

      <div className={`maintenance-main ${showMainContent ? 'is-visible' : ''}`}>
        <header className="maintenance-header">
          <img src="/brand-logo-horizontal.svg" alt="ZEZVA" />
        </header>

        <section className="maintenance-hero">
          <h1>We Are Working</h1>
          <p>
            We are currently building the ZEZVA platform. Please standby or enjoy a quick break
            below.
          </p>
        </section>

        <section className="maintenance-console">
          <div className="maintenance-tabs">
            {['tetris', 'snake', 'invaders'].map((game) => (
              <button
                key={game}
                type="button"
                className={`maintenance-tab-btn ${activeGame === game ? 'is-active' : ''}`}
                onClick={() => setActiveGame(game)}
              >
                {game}
              </button>
            ))}
          </div>

          <div className="maintenance-game-head">
            <div>
              <span className="maintenance-game-label">{scoreLabels[activeGame]}</span>
              <strong className="maintenance-game-score">{currentScore}</strong>
            </div>
            <div className="maintenance-game-status">{statusText}</div>
          </div>

          <div className={`maintenance-game maintenance-game-frame ${activeGame === 'tetris' ? 'is-active' : ''}`}>
            <canvas ref={tetrisCanvasRef} width="240" height="400" />
          </div>

          <div className={`maintenance-game maintenance-game-frame ${activeGame === 'snake' ? 'is-active' : ''}`}>
            <canvas ref={snakeCanvasRef} width="400" height="400" />
          </div>

          <div className={`maintenance-game maintenance-game-frame ${activeGame === 'invaders' ? 'is-active' : ''}`}>
            <canvas ref={invadersCanvasRef} width="400" height="400" />
          </div>

          <div className="maintenance-controls-hint">{controlHint}</div>
        </section>

        <section className="maintenance-leaderboard">
          <div className="maintenance-leaderboard-head">
            <h2>Top Scorers</h2>
            <span>{activeGame.toUpperCase()} Top 10</span>
          </div>

          {scoresError && <div className="maintenance-scores-error">{scoresError}</div>}

          <div className="maintenance-score-list">
            {isLoadingScores ? (
              <div className="maintenance-score-empty">Loading top scorers...</div>
            ) : (
              leaderboardRows.map((entry, index) => (
                <div className="maintenance-score-row" key={`${activeGame}-${index}`}>
                  <span className="maintenance-score-rank">#{index + 1}</span>
                  <span className="maintenance-score-name">
                    {entry ? entry.player_name : '---'}
                  </span>
                  <span className="maintenance-score-value">{entry ? entry.score : '---'}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {saveModalOpen && scoreToSave && (
        <div className="maintenance-modal-backdrop">
          <div className="maintenance-modal">
            <h3>Save Your Score</h3>
            <p>
              Your {scoreToSave.game} run ended with <strong>{scoreToSave.score}</strong> points.
            </p>
            <form onSubmit={handleSaveScore}>
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Your name"
                maxLength={60}
                autoFocus
              />
              {saveError && <div className="maintenance-scores-error">{saveError}</div>}
              <div className="maintenance-modal-actions">
                <button
                  type="button"
                  className="maintenance-secondary-btn"
                  onClick={() => {
                    setSaveModalOpen(false);
                    setScoreToSave(null);
                    setStatusText('Score skipped');
                  }}
                >
                  Skip
                </button>
                <button type="submit" className="maintenance-primary-btn" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Score'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
