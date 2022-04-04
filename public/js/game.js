// Check if there is a logged user. If none, sign in.
if (!sessionStorage.userEmail) window.location.replace("../html/signIn.html");

// Check if there is default music volume.
if (!sessionStorage.musicVolume) {
    sessionStorage.musicVolume = 100;
};

// Check if there is default sound volume.
if (!sessionStorage.soundVolume) {
    sessionStorage.soundVolume = 100;
};

// Check if there is default joystick settings.
if (sessionStorage.enableJoystick === undefined) {
    sessionStorage.enableJoystick = 'false';
}

// Set the references for the elements.
const canvas = document.getElementById('gameCanvas');
const scoreValue = document.getElementById('scoreValue');
const usernameValue = document.getElementById('usernameValue');
const buttonPause = document.getElementById('buttonPause');
const newHighScore = document.getElementById('newHighScore');
const musicVolume = document.getElementById('musicVolume');
const soundVolume = document.getElementById('soundVolume');

// Set the username value.
usernameValue.innerHTML = sessionStorage.userDisplayName;

// Set the value for the music range slider.
musicVolume.value = sessionStorage.musicVolume;

// Set the value for the sound range slider.
soundVolume.value = sessionStorage.soundVolume;

// Pause the game on click.
buttonPause.onclick = () => {
    pauseGame();
};

// Update the music volume on value change.
musicVolume.onchange = () => {
    updateMusicVolume();
};

// Update the sound volume on value change.
soundVolume.onchange = () => {
    updateSoundVolume();
};

// Default sound values.
const gameMusicBaseVolume = 0.4;
const shootBaseVolume = 0.8;
const enemyHitBaseVolume = 0.8;
const enemyDeathBaseVolume = 0.8;
const playerDeathBaseVolume = 0.8;

// Sound Effects.
const sfx = {
    gameMusic: new Howl({
        src: ["../sounds/game-music.ogg"],
        loop: true,
        volume: gameMusicBaseVolume * (sessionStorage.musicVolume / 100),
    }),

    shoot: new Howl({
        src: ["../sounds/pew.wav"],
        volume: shootBaseVolume * (sessionStorage.soundVolume / 100),
        preload: true,
        html5: true,
    }),

    enemyHit: new Howl({
        src: ["../sounds/enemy-hit.wav"],
        volume: enemyHitBaseVolume * (sessionStorage.soundVolume / 100),
    }),

    enemyDeath: new Howl({
        src: ["../sounds/enemy-death.wav"],
        volume: enemyDeathBaseVolume * (sessionStorage.soundVolume / 100),
        preload: true,
        html5: true,
    }),

    playerDeath: new Howl({
        src: ["../sounds/player-death.wav"],
        volume: playerDeathBaseVolume * (sessionStorage.soundVolume / 100),
        preload: true,
        html5: true,
    }),
};

/**
 * @description Firebase config file.
 */
const firebaseConfig = {
    // Prod.
    apiKey: "AIzaSyCuTFZvbUxoR20j1x3NGBD43Ugk27khy-o",
    authDomain: "pewpewshooters.firebaseapp.com",
    projectId: "pewpewshooters",
    storageBucket: "pewpewshooters.appspot.com",
    messagingSenderId: "27720464394",
    appId: "1:27720464394:web:9033605db4ab32e68947f3",
    measurementId: "G-0DNXMX49DJ"
};

// Initialize Firebase.
firebase.initializeApp(firebaseConfig);

// Initialize Firebase Analytics.
const firebaseAnalytics = firebase.analytics();

// Initialize Firebase Performance Monitoring.
const firebasePerf = firebase.performance();

// Initialize Firebase Firestore.
const firestoreDB = firebase.firestore();

// Set default values.
canvas.width = 1024;
canvas.height = 1024;

// Create reference for canvas context.
const c = canvas.getContext('2d');

// Player class.
class Player {
    constructor(x, y, radius, color) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
    }

    draw = () => {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }
};

// Projectile class.
class Projectile {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw = () => {
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.globalAlpha = 1;
        c.fillStyle = this.color;
        c.fill();
    }

    update = () => {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
};

// Enemy class.
class Enemy {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw = () => {
        c.beginPath()
        c.globalAlpha = 1;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update = () => {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
};

// Rotating Enemy class.
class EnemyRotating {
    constructor(center, x, y, radius, color, velocity) {
        this.center = center;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity / 5;
        this.baseVelocity = velocity;
        this.rotationAngle = 0;
        this.maxRotation = 360;
        this.rotationRadius = (canvas.width / 2) * Math.sqrt(2) + this.radius;
        this.rushRange = Math.floor(Math.random() * (canvas.width / 1.5)) + (canvas.width / 8);
    }

    draw = () => {
        c.beginPath()
        c.globalAlpha = 1;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update = () => {
        this.draw();
        const dist = Math.hypot(this.center.x - this.x, this.center.y - this.y);
        if (dist + this.radius <= this.rushRange) {
            const xDiff = this.center.x - this.x;
            const yDiff = this.center.y - this.y;
            const angle = Math.atan2(yDiff, xDiff);
            this.x += this.baseVelocity * Math.cos(angle);
            this.y += this.baseVelocity * Math.sin(angle);
        } else {
            this.rotationAngle = this.rotationAngle >= 360 ? 0 : this.rotationAngle;
            this.x = this.center.x + this.rotationRadius * Math.cos((this.rotationAngle / 360) * 2 * Math.PI);
            this.y = this.center.y + this.rotationRadius * Math.sin((this.rotationAngle / 360) * 2 * Math.PI);
            this.rotationAngle += this.velocity;
            this.rotationRadius -= (Math.random() * (1 - 0.2) + 0.2) * this.velocity * Math.atan(canvas.width / dist);
        }
    }
};

// Boss Enemy class.
class EnemyBoss {
    constructor(x, y, radius, color, velocity) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
    }

    draw = () => {
        c.beginPath()
        c.globalAlpha = 1;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update = () => {
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
};

// Particle class. Particles are the objects created when projectiles collide with enemies.
class Particle {
    constructor(x, y, radius, color, velocity, duration = 150) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.velocity = velocity;
        this.duration = duration;
        this.lifeSpan = 0;
    }

    draw = () => {
        c.beginPath()
        c.globalAlpha = 1;
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        c.fillStyle = this.color;
        c.fill();
    }

    update = () => {
        this.lifeSpan += 1;
        this.draw();
        this.x += this.velocity.x;
        this.y += this.velocity.y;
    }
};

// Animation ID. Reference for the animtion frame.
let animationID = undefined;

// Check if game if paused/stopped.
let isGameRunning = false;

// Base radius as reference for all objects in canvas.
const baseRadius = innerHeight * 0.12;

// Default player values.
const playerX = canvas.width * 0.5;
const playerY = canvas.height * 0.5;
const playerRadius = baseRadius * 0.2;
let playerScore = 0;
const player = new Player(playerX, playerY, playerRadius, 'white'); // Create a player instance;

// Default projectile values.
let projectileRadius = baseRadius * 0.05;
const projectileRadiusMin = baseRadius * 0.05;
const projectileRadiusMax = baseRadius * 0.14;
let projectileSpeed = 4;
const projectileSpeedMin = 4;
const projectileSpeedMax = 10;
const projectiles = [];
let projectileAngle = undefined;

// Default reload values.
let reloadCounter = 0;
let reloadCounterLimit = 35;
const reloadCounterLimitBase = 35;
const reloadCounterLimitMin = 8;
let canShoot = true;
let isMousePressed = false; // For mouse.
let isTouching = false; // For touch screens joystick.
let isTouchFar = false; // Check if the ditance of joystick is far enough.
let isTouchingCanvas = false // For touch screens now using joystick.

// Default enemy values.
const enemyRadiusMin = baseRadius * 0.15;
let enemyRadiusMax = baseRadius * 0.8;
let enemySpeedMax = 2.75;
let enemySpeedMin = 1;
let enemyScoreMultiplier = 1.00;
const enemyScoreMultiplierBase = 1.00;
const enemyScoreMultiplierMax = 1.025;
const enemyScoreKill = 100;
const enemyScoreHit = 50;
const enemies = [];
let enemyGenerationTimeCounter = 0;
let enemyGenerationTimeBase = 75; // 10 minimum value
let enemyGenerationTimeMin = 100; // 50 minimum value
let enemyGenerationTimeCounterLimit = 100;

// Default partile values.
const particles = [];
const particleRadiusMin = baseRadius * 0.02;
const particleDurationBase = 50;
const particleSpeed = 3;
const particleMinAmount = 3;

/**
 * @description Update the music volume.
 */
const updateMusicVolume = () => {
    // Log music volume change event.
    firebaseAnalytics.logEvent(`music_volume_change`, {
        volume: musicVolume.value,
    });

    sessionStorage.musicVolume = musicVolume.value;
    sfx.gameMusic.volume(gameMusicBaseVolume * (sessionStorage.musicVolume / 100));
}

/**
 * @description Update the sound volume.
 */
const updateSoundVolume = () => {
    // Log sound volume change event.
    firebaseAnalytics.logEvent(`sound_volume_change`, {
        volume: soundVolume.value,
    });

    sessionStorage.soundVolume = soundVolume.value;
    sfx.shoot.volume(shootBaseVolume * (sessionStorage.soundVolume / 100));
    sfx.enemyHit.volume(enemyHitBaseVolume * (sessionStorage.soundVolume / 100));
    sfx.enemyDeath.volume(enemyDeathBaseVolume * (sessionStorage.soundVolume / 100));
    sfx.playerDeath.volume(playerDeathBaseVolume * (sessionStorage.soundVolume / 100));
}

/**
 * @description Start the game and sets the default values.
 */
const startGame = () => {
    // Log Start game event.
    firebaseAnalytics.logEvent(`start_game`);

    // Change to game is running.
    isGameRunning = true;

    // Clear the Projectiles.
    enemies.splice(0, enemies.length);
    projectiles.splice(0, projectiles.length);
    particles.splice(0, particles.length);

    // Animate the frames.
    animate();

    // Pause the music.
    sfx.gameMusic.play();

    // Update score.
    playerScore = 0; // Since all game adjustments are based on the player score. Resetting this effectively resets all values.
    scoreValue.innerHTML = playerScore;
};

/**
 * @description Stops the animation of the game and opens the pause modal.
 */
const pauseGame = () => {
    // Stop the animation.
    cancelAnimationFrame(animationID);

    // Change to game is not running.
    isGameRunning = false;

    // Pause the music.
    sfx.gameMusic.pause();

    const modal = document.getElementById('modalPause');
    const modalInstance = M.Modal.init(modal, {
        dismissible: false
    });

    const buttonResume = document.getElementById('buttonResume');
    buttonResume.onclick = () => {
        animate();

        // Change to game is running.
        isGameRunning = true;

        // Play the music.
        sfx.gameMusic.play();
        modalInstance.close();
    };

    const buttonPauseQuit = document.getElementById('buttonPauseQuit');
    buttonPauseQuit.onclick = () => {
        modalInstance.close();
        setTimeout(() => {
            window.location.replace("../html/menu.html");
        }, 100);
    };

    modalInstance.open();
};

/**
 * @description Adjusts the game's difficulty.
 */
const adjustGame = () => {
    // For testing only.
    const testFactor = 1;

    // Adjust reload time.
    reloadCounterLimit = reloadCounterLimitBase - (playerScore / (1250 * testFactor));
    if (reloadCounterLimit <= reloadCounterLimitMin) reloadCounterLimit = reloadCounterLimitMin;

    // Adjust projectile speed.
    projectileSpeed = projectileSpeedMin + (playerScore / (5000 * testFactor));
    if (projectileSpeed >= projectileSpeedMax) projectileSpeed = projectileSpeedMax;

    // Adjust projectile radius.
    projectileRadius = projectileRadiusMin + (playerScore / (10000 * testFactor));
    if (projectileRadius >= projectileRadiusMax) projectileRadius = projectileRadiusMax;

    // Adjust enemy spawn rate.
    enemyGenerationTimeBase = 75 - (playerScore / (600 * testFactor));
    if (enemyGenerationTimeBase < 10) enemyGenerationTimeBase = 10;
    enemyGenerationTimeMin = 100 - (playerScore / (600 * testFactor));
    if (enemyGenerationTimeMin < 50) enemyGenerationTimeMin = 50;

    // Adjust enemy max radius.
    enemyRadiusMax = enemyRadiusMin + (playerScore / (1500 * testFactor));
    if (enemyRadiusMax >= baseRadius * 0.8) enemyRadiusMax = baseRadius * 0.8;

    // Adjust score multiplier.
    enemyScoreMultiplier = enemyScoreMultiplierBase + (playerScore / (1000000 * testFactor));
    if (enemyScoreMultiplier >= enemyScoreMultiplierMax) enemyScoreMultiplier = enemyScoreMultiplierMax;
};

/**
 * @description Stops the game and opens the game over modal.
 */
const gameOver = () => {
    // Log an Analytics event for the player score.
    firebaseAnalytics.logEvent(`game_over`, {
        score: Math.floor(playerScore / 1000) * 1000,
    });

    // Change to game is not running.
    isGameRunning = false;

    // Update user's highscores in Firestore.
    writeScoreToFirestore(playerScore);

    // Stop the game.
    cancelAnimationFrame(animationID);

    // Pause the music.
    sfx.gameMusic.pause();

    // Play the player death audio.
    sfx.playerDeath.play();

    const modal = document.getElementById('modalGameOver');
    const modalInstance = M.Modal.init(modal, {
        dismissible: false
    });

    // Update the score.
    const gameOverScorevalue = document.getElementById('gameOverScoreValue');
    gameOverScorevalue.innerHTML = playerScore;

    const buttonPlayAgain = document.getElementById('buttonPlayAgain');
    buttonPlayAgain.onclick = () => {
        firebaseAnalytics.logEvent(`play_again`, {
            score: Math.floor(playerScore / 1000) * 1000,
        });
        startGame();
        newHighScore.innerHTML = '';
        modalInstance.close();
    };

    const buttonQuit = document.getElementById('buttonQuit');
    buttonQuit.onclick = () => {
        firebaseAnalytics.logEvent(`game_over_quit`, {
            score: Math.floor(playerScore / 1000) * 1000,
        });
        setTimeout(() => {
            modalInstance.close();
            newHighScore.innerHTML = '';
            setTimeout(() => {
                window.location.replace("../html/menu.html");
            }, 100);
        }, 1500);
    };

    // Open the game over modal.
    modalInstance.open();
};

/**
 * @description Write the player score to Firestore.
 * @param {!int} score Score of the player.
 */
const writeScoreToFirestore = async(score) => {
    const userRef = firestoreDB.collection('users').doc(sessionStorage.userEmail);
    const updateScoreTrace = firebasePerf.trace("new_user_high_score");
    updateScoreTrace.start();
    const firestoreDoc = await userRef.get();
    const docData = firestoreDoc.data();

    // Update the document if it exists.
    if (docData) {
        let highscores = docData.highscores;
        highscores.push(score);
        highscores = highscores.sort((a, b) => { return b - a });
        highscores = highscores.slice(0, 10);
        await userRef.update({
            highscores,
        });
        updateOverallHighscore(score); // Write new score to overall Highscore Firestore document.
    }
    updateScoreTrace.stop();
};

/**
 * @description Updates the overall highscore.
 * @param {!int} score Score of the player.
 */
const updateOverallHighscore = async(score) => {
    // Create trace for updating highscore duration.
    const updateHighscoreTrace = firebasePerf.trace("update_overall_highscore");
    updateHighscoreTrace.start();

    // Create reference for highscores document.
    const highscoresRef = firestoreDB.collection('highscores').doc('highscores');
    const firestoreDoc = await highscoresRef.get();
    const docData = firestoreDoc.data();

    // Create a unique identifier.
    const dateNow = new Date();
    const dateNowString = dateNow.toUTCString().replace(/[, :]/g, '_');
    const email = sessionStorage.userEmail.replace(/[.]/g, '>');
    const uniqueIdentifier = `${dateNowString}_${email}`;

    if (!docData) { // If document does not exist, create one.
        await highscoresRef.set({
            [uniqueIdentifier]: {
                identifier: uniqueIdentifier,
                email: sessionStorage.userEmail,
                username: sessionStorage.userDisplayName,
                score: score,
            },
        });
    } else { // If document does not exist, update.
        const _highscoreMap = new Map();
        const scoreList = [];
        Object.keys(docData).forEach((identifier) => {
            _highscoreMap.set(identifier, {
                identifier: identifier,
                email: docData[identifier]['email'],
                username: docData[identifier]['username'],
                score: docData[identifier]['score'],
            });
            scoreList.push(docData[identifier].score);
        });

        if (scoreList.length < 100) { // If there are not enough scores, just write the score.
            if (score > Math.max(...scoreList)) {
                // Log new top highscore event.
                firebaseAnalytics.logEvent(`new_top_high_score`);
                updateHighscoreTrace.putAttribute("ScoreType", "top score");

                // Promt user.
                newHighScore.innerHTML = "Top Highscore !!!";
            } else {
                // Log new highscore event.
                firebaseAnalytics.logEvent(`new_high_score`);
                updateHighscoreTrace.putAttribute("ScoreType", "high score");

                // Promt user.
                newHighScore.innerHTML = "New Highscore !!!";
            }

            // Add the score to the highscore list.
            await highscoresRef.update({
                [uniqueIdentifier]: {
                    identifier: uniqueIdentifier,
                    email: sessionStorage.userEmail,
                    username: sessionStorage.userDisplayName,
                    score: score,
                },
            });
        } else {
            if (score > Math.min(...scoreList)) { // Check if the score is higher than the lowest highscore.
                if (score > Math.max(...scoreList)) {
                    // Log new top highscore event.
                    firebaseAnalytics.logEvent(`new_top_high_score`);
                    updateHighscoreTrace.putAttribute("ScoreType", "top score");

                    // Promt user.
                    newHighScore.innerHTML = "Top Highscore !!!";
                } else {
                    // Log new highscore event.
                    firebaseAnalytics.logEvent(`new_high_score`);
                    updateHighscoreTrace.putAttribute("ScoreType", "high score");

                    // Promt user.
                    newHighScore.innerHTML = "New Highscore !!!";
                }

                // Sort the highscore map.
                const sortedHighscoreMap = new Map([..._highscoreMap.entries()].sort((a, b) => b[1]['score'] - a[1]['score']));

                // Get the last element of the map.
                const lastMapElement = Array.from(sortedHighscoreMap.values()).pop();

                // Add the new highscore and delete the lowest highscore.
                await highscoresRef.update({
                    [uniqueIdentifier]: {
                        identifier: uniqueIdentifier,
                        email: sessionStorage.userEmail,
                        username: sessionStorage.userDisplayName,
                        score: score,
                    },
                    [lastMapElement.identifier]: firebase.firestore.FieldValue.delete(),
                })
            } else {
                // Log event that the score was too low.
                firebaseAnalytics.logEvent(`score_too_low`);
                updateHighscoreTrace.putAttribute("ScoreType", "score too low");
            }
        }
    }
    updateHighscoreTrace.stop();
};

/**
 * @description Clears the canvas.
 */
const clearCanvas = () => {
    c.fillStyle = 'rgba(0, 0, 0, 0.15)';
    c.fillRect(0, 0, canvas.width, canvas.height);
};

/**
 * @description Draws a grid on the canvas.
 */
const drawGrid = () => {
    const p = 0;
    for (let x = 0; x <= canvas.width; x += canvas.width / 16) {
        c.moveTo(0.5 + x + p, p);
        c.lineTo(0.5 + x + p, canvas.height + p);
    }

    for (var x = 0; x <= canvas.height; x += canvas.height / 16) {
        c.moveTo(p, 0.5 + x + p);
        c.lineTo(canvas.width + p, 0.5 + x + p);
    }
    c.strokeStyle = 'rgba(155, 155, 155, 0.10)';
    c.stroke();
};

/**
 * @description Animates the frame.
 */
const animate = () => {
    animationID = requestAnimationFrame(animate);

    // Clear screen.
    clearCanvas();

    // Update game difficulty.
    adjustGame();

    // Draw grid.
    drawGrid();

    // Manage bullet reload.
    if (reloadCounter >= reloadCounterLimit) canShoot = true;
    else reloadCounter += 1;

    // Spawn Enemies.
    if (enemyGenerationTimeCounter >= enemyGenerationTimeCounterLimit) {
        spawnEnemies();
        enemyGenerationTimeCounterLimit = Math.floor(Math.random() * enemyGenerationTimeBase) + enemyGenerationTimeMin;
        enemyGenerationTimeCounter = 0;
    } else enemyGenerationTimeCounter += 1;

    // Draw Projectiles.
    projectiles.forEach((projectile, projectileIndex) => {
        projectile.update();
        // Remove from projectile is off the left of the screen.
        if (projectile.x + projectile.radius < 0) {
            projectiles.splice(projectileIndex, 1);
        }
        // Remove from projectile is off the right of the screen.
        else if (projectile.x - projectile.radius > canvas.width) {
            projectiles.splice(projectileIndex, 1);
        }
        // Remove from projectile is off the top of the screen.
        if (projectile.y + projectile.radius < 0) {
            projectiles.splice(projectileIndex, 1);
        }
        // Remove from projectile is off the right of the screen.
        else if (projectile.y - projectile.radius > canvas.height) {
            projectiles.splice(projectileIndex, 1);
        }
    });

    // Draw Enemies.
    enemies.forEach((enemy, enemyIndex) => {
        enemy.update();

        // Player Collision.
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist <= enemy.radius + player.radius * 0.9) {
            setTimeout(() => {
                gameOver();
            }, 0);
        }

        // Enemy collides with projectile.
        projectiles.forEach((projectile, projectileIndex) => {
            const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y);
            if (dist <= enemy.radius + projectile.radius * 0.8) {

                // Generate particle effects.
                const particleAmount = Math.floor(Math.abs(particleMinAmount * Math.atan(enemy.radius)) * Math.random() + particleMinAmount);
                for (let i = 0; i < particleAmount; i++) {
                    const particleRadius = Math.floor(Math.random() * (enemy.radius - particleRadiusMin) * 0.15) + particleRadiusMin;
                    const particleDuration = particleDurationBase * Math.atan(particleRadius);
                    particles.push(
                        new Particle(
                            projectile.x,
                            projectile.y,
                            particleRadius,
                            enemy.color, {
                                x: (Math.random() - 0.5) * particleSpeed,
                                y: (Math.random() - 0.5) * particleSpeed,
                            },
                            particleDuration,
                        ))
                }

                // Remove enemy.
                if (enemy.radius - projectile.radius < enemyRadiusMin) {
                    // Play enemy death audio.
                    sfx.enemyDeath.play();

                    playerScore += Math.floor(enemyScoreMultiplier * enemyScoreKill * enemy.radius / enemyRadiusMin);
                    gsap.to(enemy, {
                        radius: enemy.radius / (enemyScoreMultiplier ** 5) - projectile.radius,
                    });
                    enemies.splice(enemyIndex, 1);
                    projectiles.splice(projectileIndex, 1);
                }
                // Reduce enemy size.
                else {
                    // Play enemy hit audio.
                    sfx.enemyHit.play();

                    playerScore += Math.floor(enemyScoreMultiplier * enemyScoreHit * enemy.radius / enemyRadiusMin);
                    gsap.to(enemy, {
                        radius: enemy.radius / (enemyScoreMultiplier ** 5) - projectile.radius
                    });
                    projectiles.splice(projectileIndex, 1);
                }

                // Update score.
                scoreValue.innerHTML = playerScore;
            }
        })
    });

    // Draw particles.
    particles.forEach((particle, particleIndex) => {
        particle.update();
        if (particle.lifeSpan >= particle.duration) {
            setTimeout(() => {
                particles.splice(particleIndex, 1);
            }, 0);
        }
    });

    if (isTouching && sessionStorage.enableJoystick === 'true') createGuideline();
    if (isMousePressed || (isTouching && isTouchFar) || isTouchingCanvas) {
        shootProjectile(projectileAngle);
    }

    // Draw player.
    player.draw();
}

/**
 * @description Create guideline for joystick.
 */
const createGuideline = () => {
    c.beginPath();
    c.moveTo(playerX, playerY);
    const longLen = canvas.width * Math.sqrt(2);
    const endLine = { x: playerX + longLen * Math.cos(projectileAngle), y: playerY + longLen * Math.sin(projectileAngle) };
    c.lineTo(endLine.x, endLine.y);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    c.stroke();
    c.lineWidth = 1;
}

/**
 * @description Randomly spawns an enemy with random properties.
 */
const spawnEnemies = () => {
    // Determine enemy properties.
    const enemyRadius = Math.floor(Math.random() * (enemyRadiusMax - enemyRadiusMin)) + enemyRadiusMin;
    let enemyX = 0;
    let enemyY = 0
    if (Math.random() <= 0.5) {
        enemyX = Math.random() <= 0.5 ? 0 - enemyRadius : canvas.width + enemyRadius;
        enemyY = Math.floor(Math.random() * (canvas.height - enemyRadius)) + enemyRadius;
    } else {
        enemyX = Math.floor(Math.random() * (canvas.width - enemyRadius)) + enemyRadius;
        enemyY = Math.random() <= 0.5 ? 0 - enemyRadius : canvas.height + enemyRadius;
    }

    // Determine enemy direction.
    const xDiff = playerX - enemyX;
    const yDiff = playerY - enemyY;
    const angle = Math.atan2(yDiff, xDiff);
    let maxSpeed = enemySpeedMax;
    if (enemyRadius >= baseRadius * 0.6) maxSpeed = 1.5;
    const baseSpeed = Math.floor(Math.random() * (maxSpeed - enemySpeedMin)) + enemySpeedMin;
    const enemyColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
    const randNum = Math.random();

    // Create the enemy.
    let enemy;
    if (randNum >= 0.3) {
        enemy = new Enemy(enemyX, enemyY, enemyRadius, enemyColor, { x: baseSpeed * Math.cos(angle), y: baseSpeed * Math.sin(angle) });
    } else if (randNum >= 0.05) {
        enemy = new EnemyRotating({ x: playerX, y: playerY }, enemyX, enemyY, enemyRadius, enemyColor, baseSpeed);
    } else {
        // If boss, change all properties and reset direction.
        let enemyRadius = Math.floor(Math.random() * (3 * enemyRadiusMax - 1.5 * enemyRadiusMax)) + (1.5 * enemyRadiusMax);
        let enemyX = 0;
        let enemyY = 0
        if (Math.random() <= 0.5) {
            enemyX = Math.random() <= 0.5 ? 0 - enemyRadius : canvas.width + enemyRadius;
            enemyY = Math.floor(Math.random() * (canvas.height - enemyRadius)) + enemyRadius;
        } else {
            enemyX = Math.floor(Math.random() * (canvas.width - enemyRadius)) + enemyRadius;
            enemyY = Math.random() <= 0.5 ? 0 - enemyRadius : canvas.height + enemyRadius;
        }
        const xDiff = playerX - enemyX;
        const yDiff = playerY - enemyY;
        const angle = Math.atan2(yDiff, xDiff);
        const baseSpeedBoss = baseSpeed / 4;
        enemy = new EnemyBoss(enemyX, enemyY, enemyRadius, enemyColor, { x: baseSpeedBoss * Math.cos(angle), y: baseSpeedBoss * Math.sin(angle) });
    }

    // Add the new enemy to the enemies array.
    enemies.push(enemy);
};

/**
 * @description Adjusts the click position.
 * @param {!Object} canvas HTML Canvas Object.
 * @param {!Object} e Mouse click event.
 * @returns {int, int} Adjusted values of the click.
 */
const getCursorPosition = (canvas, e) => {
    let x;
    let y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    const { width, height } = canvas.getBoundingClientRect();
    x = (x / width) * canvas.width;
    x -= (canvas.offsetLeft / width) * canvas.width;
    y = (y / height) * canvas.height;
    y -= (canvas.offsetTop / height) * canvas.height;
    return { x, y };
};

// Mouse is pressed.
document.addEventListener('mousedown', (e) => {
    isMousePressed = true;
    const clickPosition = getCursorPosition(canvas, e);
    const xDiff = clickPosition.x - playerX;
    const yDiff = clickPosition.y - playerY;
    projectileAngle = Math.atan2(yDiff, xDiff);
});

// Mouse is released.
document.addEventListener('mouseup', () => {
    isMousePressed = false;
});

// Mouse is moved.
document.addEventListener('mousemove', (e) => {
    const clickPosition = getCursorPosition(canvas, e);
    const xDiff = clickPosition.x - playerX;
    const yDiff = clickPosition.y - playerY;
    projectileAngle = Math.atan2(yDiff, xDiff);
});


// Add event listener for player clicks.
addEventListener('click', (e) => {
    shootProjectile(projectileAngle);
})

// Listener for when player touches the canvas.
canvas.addEventListener('touchstart', (e) => {
    if (isGameRunning) {
        e.preventDefault();
        isTouchingCanvas = true;
        const clickPosition = getTouchPosition(canvas, e);
        const xDiff = clickPosition.x - playerX;
        const yDiff = clickPosition.y - playerY;
        projectileAngle = Math.atan2(yDiff, xDiff);
    }
});

// Add listener for touched event.
canvas.addEventListener('touchend', (e) => {
    if (isGameRunning) {
        e.preventDefault();
        isTouchingCanvas = false;
    }
});

// Handle touch events.
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (isGameRunning) {
        e.preventDefault();
        const clickPosition = getTouchPosition(canvas, e);
        const xDiff = clickPosition.x - playerX;
        const yDiff = clickPosition.y - playerY;
        projectileAngle = Math.atan2(yDiff, xDiff);
    }
});

// Shoot projectile.
const shootProjectile = (angle) => {
    if (canShoot) {
        sfx.shoot.play();

        const projectile = new Projectile(playerX + playerRadius * Math.cos(angle), playerY + playerRadius * Math.sin(angle), projectileRadius, 'white', { x: projectileSpeed * Math.cos(angle), y: projectileSpeed * Math.sin(angle) });
        projectiles.push(projectile);
        canShoot = false; // Disable shooting.
        reloadCounter = 0;
    }

}

// Detect if tab is changed.
document.addEventListener("visibilitychange", e => {
    if (document.visibilityState == "visible") {
        if (isGameRunning) {
            sfx.gameMusic.play();
        }
    } else {
        // Log music volume change event.
        firebaseAnalytics.logEvent(`tab_change`);
        if (isGameRunning) {
            sfx.gameMusic.pause();
        }
    }
})

// Start the game.
startGame();