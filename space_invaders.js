document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const context = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const startButton = document.getElementById('startButton');
    const levelScreen = document.getElementById('levelScreen');
    const levelMessage = document.getElementById('levelMessage');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const gameOverMessage = document.getElementById('gameOverMessage');
    const nicknameInput = document.getElementById('nicknameInput');
    const submitScoreButton = document.getElementById('submitScoreButton');
    const highScores = document.getElementById('highScores');
    const highScoreList = document.getElementById('highScoreList');

    let score = 0;
    let level = 1;
    let gameInterval;
    let bullets = [];
    let alienBullets = [];
    let alienDirection = 1;
    let canShoot = true;
    let canAlienShoot = true;

    const player = {
        x: canvas.width / 2 - 15,
        y: canvas.height - 30,
        width: 30,
        height: 30,
        speed: 5,
        dx: 0
    };

    const aliens = [];
    const alienRows = 4; // Eine Reihe entfernt
    const alienCols = 11;
    const alienWidth = 30;
    const alienHeight = 30;
    const alienPadding = 10;
    const alienOffsetTop = 30;
    const alienOffsetLeft = 30;

    function createAliens() {
        for (let row = 0; row < alienRows; row++) {
            aliens[row] = [];
            for (let col = 0; col < alienCols; col++) {
                aliens[row][col] = { x: col * (alienWidth + alienPadding) + alienOffsetLeft, y: row * (alienHeight + alienPadding) + alienOffsetTop, status: 1 };
            }
        }
    }

    function drawPlayer() {
        context.fillStyle = 'green';
        context.fillRect(player.x, player.y, player.width, player.height);
    }

    function drawAliens() {
        for (let row = 0; row < alienRows; row++) {
            for (let col = 0; col < alienCols; col++) {
                if (aliens[row][col].status === 1) {
                    const alien = aliens[row][col];
                    context.fillStyle = 'red';
                    context.fillRect(alien.x, alien.y, alienWidth, alienHeight);
                }
            }
        }
    }

    function drawBullets() {
        context.fillStyle = 'yellow';
        bullets.forEach((bullet, index) => {
            context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            bullet.y -= bullet.speed;

            // Entferne Kugeln, die aus dem Bildschirm fliegen
            if (bullet.y < 0) {
                bullets.splice(index, 1);
            }

            // Überprüfe Kollision mit Aliens
            for (let row = 0; row < alienRows; row++) {
                for (let col = 0; col < alienCols; col++) {
                    const alien = aliens[row][col];
                    if (alien.status === 1 && bullet.x < alien.x + alienWidth && bullet.x + bullet.width > alien.x && bullet.y < alien.y + alienHeight && bullet.y + bullet.height > alien.y) {
                        alien.status = 0;
                        bullets.splice(index, 1);
                        score += 10;
                    }
                }
            }
        });
    }

    function drawAlienBullets() {
        context.fillStyle = 'red';
        alienBullets.forEach((bullet, index) => {
            context.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            bullet.y += bullet.speed;

            // Entferne Kugeln, die aus dem Bildschirm fliegen
            if (bullet.y > canvas.height) {
                alienBullets.splice(index, 1);
            }

            // Überprüfe Kollision mit dem Spieler
            if (bullet.x < player.x + player.width && bullet.x + bullet.width > player.x && bullet.y < player.y + player.height && bullet.y + bullet.height > player.y) {
                gameOver("Du wurdest getroffen!");
            }
        });
    }

    function drawScore() {
        context.fillStyle = 'white';
        context.font = '16px Arial';
        context.fillText('Score: ' + score, 8, 20);
    }

    function drawLevel() {
        context.fillStyle = 'white';
        context.font = '16px Arial';
        context.fillText('Level: ' + level, canvas.width - 100, 20);
    }

    function clear() {
        context.clearRect(0, 0, canvas.width, canvas.height);
    }

    function newPos() {
        player.x += player.dx;

        // Grenzen des Spielfelds
        if (player.x < 0) {
            player.x = 0;
        }

        if (player.x + player.width > canvas.width) {
            player.x = canvas.width - player.width;
        }
    }

    function updateAliens() {
        let edgeReached = false;

        for (let row = 0; row < alienRows; row++) {
            for (let col = 0; col < alienCols; col++) {
                const alien = aliens[row][col];
                if (alien.status === 1) {
                    alien.x += alienDirection * (1 + level); // Geschwindigkeit erhöht sich mit jedem Level

                    if (alien.x + alienWidth > canvas.width || alien.x < 0) {
                        edgeReached = true;
                    }
                }
            }
        }

        if (edgeReached) {
            alienDirection *= -1;
            for (let row = 0; row < alienRows; row++) {
                for (let col = 0; col < alienCols; col++) {
                    aliens[row][col].y += alienHeight;

                    // Überprüfe, ob die Aliens das Schiff berühren oder den unteren Rand erreichen
                    if (aliens[row][col].y + alienHeight > canvas.height || (aliens[row][col].status === 1 && aliens[row][col].y + alienHeight > player.y)) {
                        gameOver("Die Aliens sind gelandet");
                    }
                }
            }
        }

        // Aliens schießen ab Level 2
        if (level >= 2 && canAlienShoot) {
            const shootingAliens = aliens.flat().filter(alien => alien.status === 1);
            if (shootingAliens.length > 0) {
                const randomAlien = shootingAliens[Math.floor(Math.random() * shootingAliens.length)];
                alienBullets.push({
                    x: randomAlien.x + alienWidth / 2 - 2.5,
                    y: randomAlien.y + alienHeight,
                    width: 5,
                    height: 10,
                    speed: 3 + level // Geschwindigkeit der Alien-Kugeln erhöht sich mit jedem Level
                });
                canAlienShoot = false;
                setTimeout(() => {
                    canAlienShoot = true;
                }, 1000); // Verzögerung von 1000ms zwischen den Schüssen
            }
        }
    }

    function updateGame() {
        clear();
        drawPlayer();
        drawAliens();
        drawBullets();
        drawAlienBullets();
        drawScore();
        drawLevel();
        newPos();
        updateAliens();

        // Überprüfe, ob alle Aliens besiegt sind
        if (aliens.every(row => row.every(alien => alien.status === 0))) {
            levelUp();
        }
    }

    function levelUp() {
        clearInterval(gameInterval);
        level++;
        levelMessage.textContent = `Level ${level}`;
        levelScreen.style.display = 'flex';
        setTimeout(() => {
            levelScreen.style.display = 'none';
            createAliens();
            gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
        }, 2000);
    }

    function moveRight() {
        player.dx = player.speed;
    }

    function moveLeft() {
        player.dx = -player.speed;
    }

    function shoot() {
        if (canShoot) {
            bullets.push({
                x: player.x + player.width / 2 - 2.5,
                y: player.y,
                width: 5,
                height: 10,
                speed: 7
            });
            canShoot = false;
            setTimeout(() => {
                canShoot = true;
            }, 300); // Verzögerung von 300ms zwischen den Schüssen
        }
    }

    function keyDown(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right') {
            moveRight();
        } else if (e.key === 'ArrowLeft' || e.key === 'Left') {
            moveLeft();
        } else if (e.key === ' ') {
            shoot();
        }
    }

    function keyUp(e) {
        if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'ArrowLeft' || e.key === 'Left') {
            player.dx = 0;
        }
    }

    function startGame() {
        startScreen.style.display = 'none';
        canvas.style.display = 'block';
        levelMessage.textContent = `Level ${level}`;
        levelScreen.style.display = 'flex';
        setTimeout(() => {
            levelScreen.style.display = 'none';
            createAliens();
            gameInterval = setInterval(updateGame, 1000 / 60); // 60 FPS
        }, 2000);
    }

function gameOver(message) {
    clearInterval(gameInterval);
    canvas.style.display = 'none';
    gameOverMessage.textContent = message;
    finalScoreValue.textContent = score; // Punkteanzeige aktualisieren
    gameOverScreen.style.display = 'flex';
}

function restartGame() {
    location.reload(); // Seite neu laden, um das Spiel neu zu starten
}

function goBack() {
    history.back(); // Zurück zur vorherigen Seite
}

submitScoreButton.addEventListener('click', submitScore);
restartButton.addEventListener('click', restartGame); // Neustart Button Event Listener
backButton.addEventListener('click', goBack); // Zurück Button Event Listener


    function submitScore() {
        const nickname = nicknameInput.value;
        if (nickname.length > 0) {
            const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
            highScores.push({ nickname, score });
            highScores.sort((a, b) => b.score - a.score);
            highScores.splice(10);
            localStorage.setItem('highScores', JSON.stringify(highScores));
            displayHighScores();
        }
    }

function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScoreList.innerHTML = highScores.map(score => `<li>${score.nickname}: ${score.score}</li>`).join('');
}

// Highscores beim Laden der Seite anzeigen
document.addEventListener('DOMContentLoaded', (event) => {
    displayHighScores();
});


    startButton.addEventListener('click', startGame);
    startButton.addEventListener('touchstart', startGame); // Für Touch-Geräte
    submitScoreButton.addEventListener('click', submitScore);
    document.addEventListener('keydown', keyDown);
    document.addEventListener('keyup', keyUp);
});
