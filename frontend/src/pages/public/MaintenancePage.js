import React, { useEffect, useRef, useState } from 'react';
import '../../styles/maintenance.css';

const loaderDurationMs = 3500;

const createMatrix = (width, height) => {
  const matrix = [];
  let rows = height;

  while (rows > 0) {
    rows -= 1;
    matrix.push(new Array(width).fill(0));
  }

  return matrix;
};

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
  const tetrisCanvasRef = useRef(null);
  const snakeCanvasRef = useRef(null);
  const invadersCanvasRef = useRef(null);
  const loopRef = useRef(null);
  const snakeTimeoutRef = useRef(null);
  const keysRef = useRef({});
  const activeGameRef = useRef('tetris');

  useEffect(() => {
    activeGameRef.current = activeGame;
  }, [activeGame]);

  useEffect(() => {
    document.body.classList.add('maintenance-mode-body');

    const timer = window.setTimeout(() => {
      setShowMainContent(true);
    }, loaderDurationMs);

    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove('maintenance-mode-body');
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      keysRef.current[event.code] = true;

      if (activeGameRef.current === 'invaders' && event.code === 'Space') {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!showMainContent) {
      return undefined;
    }

    if (loopRef.current) {
      window.cancelAnimationFrame(loopRef.current);
      loopRef.current = null;
    }

    if (snakeTimeoutRef.current) {
      window.clearTimeout(snakeTimeoutRef.current);
      snakeTimeoutRef.current = null;
    }

    if (activeGame === 'tetris') {
      startTetris();
    } else if (activeGame === 'snake') {
      startSnake();
    } else {
      startInvaders();
    }

    return () => {
      if (loopRef.current) {
        window.cancelAnimationFrame(loopRef.current);
        loopRef.current = null;
      }

      if (snakeTimeoutRef.current) {
        window.clearTimeout(snakeTimeoutRef.current);
        snakeTimeoutRef.current = null;
      }
    };
  }, [activeGame, showMainContent]);

  const startTetris = () => {
    const canvas = tetrisCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.scale(20, 20);

    const arena = createMatrix(12, 20);
    const player = {
      pos: { x: 5, y: 0 },
      matrix: createTetrisPiece('T'),
    };

    const drawMatrix = (matrix, offset) => {
      matrix.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value !== 0) {
            context.fillStyle = '#a87ffb';
            context.fillRect(x + offset.x, y + offset.y, 1, 1);
            context.strokeStyle = '#000000';
            context.lineWidth = 0.05;
            context.strokeRect(x + offset.x, y + offset.y, 1, 1);
          }
        });
      });
    };

    const collide = () => {
      const { matrix, pos } = player;

      for (let y = 0; y < matrix.length; y += 1) {
        for (let x = 0; x < matrix[y].length; x += 1) {
          if (
            matrix[y][x] !== 0 &&
            (arena[y + pos.y] && arena[y + pos.y][x + pos.x]) !== 0
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
      for (let y = arena.length - 1; y > 0; y -= 1) {
        const filled = arena[y].every((cell) => cell !== 0);
        if (!filled) {
          continue;
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        y += 1;
      }
    };

    const resetPlayer = () => {
      const pieces = 'TJLOSZI';
      const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
      player.matrix = createTetrisPiece(randomPiece);
      player.pos.y = 0;
      player.pos.x = Math.floor(arena[0].length / 2) - Math.floor(player.matrix[0].length / 2);

      if (collide()) {
        arena.forEach((row) => row.fill(0));
      }
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
      const position = player.pos.x;
      let offset = 1;
      rotate(player.matrix, direction);

      while (collide()) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));

        if (offset > player.matrix[0].length) {
          rotate(player.matrix, -direction);
          player.pos.x = position;
          return;
        }
      }
    };

    const dropPlayer = () => {
      player.pos.y += 1;

      if (collide()) {
        player.pos.y -= 1;
        merge();
        resetPlayer();
        sweepArena();
      }
    };

    let dropCounter = 0;
    let lastTime = 0;

    const render = (time = 0) => {
      if (activeGameRef.current !== 'tetris') {
        return;
      }

      const deltaTime = time - lastTime;
      lastTime = time;
      dropCounter += deltaTime;

      if (keysRef.current.ArrowLeft) {
        movePlayer(-1);
        keysRef.current.ArrowLeft = false;
      }

      if (keysRef.current.ArrowRight) {
        movePlayer(1);
        keysRef.current.ArrowRight = false;
      }

      if (keysRef.current.ArrowUp) {
        rotatePlayer(1);
        keysRef.current.ArrowUp = false;
      }

      if (keysRef.current.ArrowDown || dropCounter > 1000) {
        dropPlayer();
        dropCounter = 0;
        keysRef.current.ArrowDown = false;
      }

      context.fillStyle = '#000000';
      context.fillRect(0, 0, canvas.width, canvas.height);
      drawMatrix(arena, { x: 0, y: 0 });
      drawMatrix(player.matrix, player.pos);

      loopRef.current = window.requestAnimationFrame(render);
    };

    resetPlayer();
    render();
  };

  const startSnake = () => {
    const canvas = snakeCanvasRef.current;
    if (!canvas) {
      return;
    }

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
    const apple = {
      x: 320,
      y: 320,
    };

    const randomCell = () => Math.floor(Math.random() * 20) * grid;

    const render = () => {
      if (activeGameRef.current !== 'snake') {
        return;
      }

      if (keysRef.current.ArrowLeft && snake.dx === 0) {
        snake.dx = -grid;
        snake.dy = 0;
      } else if (keysRef.current.ArrowUp && snake.dy === 0) {
        snake.dy = -grid;
        snake.dx = 0;
      } else if (keysRef.current.ArrowRight && snake.dx === 0) {
        snake.dx = grid;
        snake.dy = 0;
      } else if (keysRef.current.ArrowDown && snake.dy === 0) {
        snake.dy = grid;
        snake.dx = 0;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);
      snake.x += snake.dx;
      snake.y += snake.dy;

      if (snake.x < 0) {
        snake.x = canvas.width - grid;
      } else if (snake.x >= canvas.width) {
        snake.x = 0;
      }

      if (snake.y < 0) {
        snake.y = canvas.height - grid;
      } else if (snake.y >= canvas.height) {
        snake.y = 0;
      }

      snake.cells.unshift({ x: snake.x, y: snake.y });
      if (snake.cells.length > snake.maxCells) {
        snake.cells.pop();
      }

      context.fillStyle = '#ffffff';
      context.fillRect(apple.x, apple.y, grid - 1, grid - 1);

      context.fillStyle = '#a87ffb';
      snake.cells.forEach((cell, index) => {
        context.fillRect(cell.x, cell.y, grid - 1, grid - 1);

        if (cell.x === apple.x && cell.y === apple.y) {
          snake.maxCells += 1;
          apple.x = randomCell();
          apple.y = randomCell();
        }

        for (let i = index + 1; i < snake.cells.length; i += 1) {
          if (cell.x === snake.cells[i].x && cell.y === snake.cells[i].y) {
            snake.x = 160;
            snake.y = 160;
            snake.cells = [];
            snake.maxCells = 4;
            snake.dx = grid;
            snake.dy = 0;
          }
        }
      });

      snakeTimeoutRef.current = window.setTimeout(() => {
        loopRef.current = window.requestAnimationFrame(render);
      }, 80);
    };

    render();
  };

  const startInvaders = () => {
    const canvas = invadersCanvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');
    const player = {
      x: 180,
      y: 360,
      width: 40,
      height: 20,
      speed: 5,
    };
    const bullets = [];
    const aliens = [];
    let alienDirection = 1;
    let lastShotAt = 0;

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
      if (activeGameRef.current !== 'invaders') {
        return;
      }

      context.clearRect(0, 0, canvas.width, canvas.height);

      if (keysRef.current.ArrowLeft && player.x > 0) {
        player.x -= player.speed;
      }

      if (keysRef.current.ArrowRight && player.x < canvas.width - player.width) {
        player.x += player.speed;
      }

      if (keysRef.current.Space && bullets.length < 3 && time - lastShotAt > 180) {
        bullets.push({
          x: player.x + player.width / 2 - 2,
          y: player.y,
        });
        lastShotAt = time;
      }

      context.fillStyle = '#a87ffb';
      context.fillRect(player.x, player.y, player.width, player.height);

      context.fillStyle = '#ffffff';
      bullets.forEach((bullet, index) => {
        bullet.y -= 7;
        context.fillRect(bullet.x, bullet.y, 4, 10);

        if (bullet.y < 0) {
          bullets.splice(index, 1);
        }
      });

      let hitWall = false;
      aliens.forEach((alien) => {
        if (!alien.alive) {
          return;
        }

        alien.x += alienDirection * 0.5;

        if (alien.x <= 0 || alien.x >= canvas.width - alien.width) {
          hitWall = true;
        }

        context.fillStyle = '#bbbbbb';
        context.fillRect(alien.x, alien.y, alien.width, alien.height);

        bullets.forEach((bullet, bulletIndex) => {
          if (
            bullet.x > alien.x &&
            bullet.x < alien.x + alien.width &&
            bullet.y > alien.y &&
            bullet.y < alien.y + alien.height
          ) {
            alien.alive = false;
            bullets.splice(bulletIndex, 1);
          }
        });
      });

      if (hitWall) {
        alienDirection *= -1;
        aliens.forEach((alien) => {
          alien.y += 10;
        });
      }

      loopRef.current = window.requestAnimationFrame(render);
    };

    render();
  };

  const controlHint =
    activeGame === 'tetris'
      ? 'Controls: Arrow keys to move, Up to rotate.'
      : activeGame === 'snake'
        ? 'Controls: Arrow keys to steer.'
        : 'Controls: Left/Right to move, Space to shoot.';

  return (
    <div className="maintenance-page">
      <div className={`maintenance-loader ${showMainContent ? 'is-hidden' : ''}`}>
        <div className="maintenance-logo-loader">
          <img src="/brand-logo-horizontal.svg" alt="ZEZVA" className="maintenance-logo-base" />
          <img src="/brand-logo-horizontal.svg" alt="" aria-hidden="true" className="maintenance-logo-fill" />
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
            <button
              type="button"
              className={`maintenance-tab-btn ${activeGame === 'tetris' ? 'is-active' : ''}`}
              onClick={() => setActiveGame('tetris')}
            >
              Tetris
            </button>
            <button
              type="button"
              className={`maintenance-tab-btn ${activeGame === 'snake' ? 'is-active' : ''}`}
              onClick={() => setActiveGame('snake')}
            >
              Snake
            </button>
            <button
              type="button"
              className={`maintenance-tab-btn ${activeGame === 'invaders' ? 'is-active' : ''}`}
              onClick={() => setActiveGame('invaders')}
            >
              Invaders
            </button>
          </div>

          <div className={`maintenance-game ${activeGame === 'tetris' ? 'is-active' : ''}`}>
            <canvas ref={tetrisCanvasRef} width="240" height="400" />
          </div>

          <div className={`maintenance-game ${activeGame === 'snake' ? 'is-active' : ''}`}>
            <canvas ref={snakeCanvasRef} width="400" height="400" />
          </div>

          <div className={`maintenance-game ${activeGame === 'invaders' ? 'is-active' : ''}`}>
            <canvas ref={invadersCanvasRef} width="400" height="400" />
          </div>

          <div className="maintenance-controls-hint">{controlHint}</div>
        </section>
      </div>
    </div>
  );
};

export default MaintenancePage;
