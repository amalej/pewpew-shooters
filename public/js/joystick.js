// Set the references for the elements.
const joystickCanvas = document.getElementById('joystickCanvas');
const canvasContainer = document.getElementById('canvasContainer');

// Create reference for canvas context.
const joystickCtx = joystickCanvas.getContext('2d');
const isMobile = navigator.userAgentData.mobile;

/**
 * @description Draws the joystick.
 * @param {!Object} offset Positon of the joystick.
 */
const drawJoystick = (offset = { x: joystickCanvas.width / 2, y: joystickCanvas.height / 2 }) => {
    clearJoystick();

    joystickCtx.imageSmoothingEnabled = false; /* standard */
    const c = joystickCanvas;
    const r = c.height / 4.5;

    joystickCtx.beginPath();
    joystickCtx.arc(c.width / 2, c.height / 2, c.height / 2.7, 0, Math.PI * 2, false);
    joystickCtx.strokeStyle = "white";
    joystickCtx.lineWidth = 1;
    joystickCtx.stroke();

    joystickCtx.beginPath();
    joystickCtx.arc(c.width / 2, c.height / 2, c.height / 3.2, 0, Math.PI * 2, false);
    joystickCtx.strokeStyle = "white";
    joystickCtx.lineWidth = 1;
    joystickCtx.stroke();

    joystickCtx.beginPath();
    const maxDist = c.height / 2.1;
    const x = offset.x;
    const y = offset.y;
    const angle = Math.atan2(y - c.height / 2, x - c.width / 2);
    projectileAngle = angle;
    if (Math.hypot(x - c.width / 2, y - c.height / 2) > (maxDist - r) * 0.75) isTouchFar = true;
    else isTouchFar = false;
    if (Math.hypot(x - c.width / 2, y - c.height / 2) > maxDist - r) {
        joystickCtx.arc(c.width / 2 + r * Math.cos(angle), c.height / 2 + r * Math.sin(angle), r, 0, Math.PI * 2, false);
    } else {
        joystickCtx.arc(x, y, r, 0, Math.PI * 2, false);
    }
    joystickCtx.fillStyle = '#4db6ac';
    joystickCtx.fill();
}

/**
 * @description Clears the joystick canvas.
 */
const clearJoystick = () => {
    joystickCtx.clearRect(0, 0, joystickCanvas.width, joystickCanvas.height);
}

// Listener for when player touches the canvas.
joystickCanvas.addEventListener('touchstart', (e) => {
    if (isGameRunning) {
        e.preventDefault();
        isTouching = true;
        const { x, y } = getTouchPosition(joystickCanvas, e);
        drawJoystick({ x, y })
    }
});

// Add listener for touched event.
joystickCanvas.addEventListener('touchend', (e) => {
    if (isGameRunning) {
        e.preventDefault();
        drawJoystick();
        isTouching = false;
    }
});

// Handle stick movements.
const handleStickMove = (e) => {
    if (isGameRunning) {
        const { x, y } = getTouchPosition(joystickCanvas, e);
        drawJoystick({ x, y })
    }
}

/**
 * @description Adjusts the click position.
 * @param {!Object} canvas HTML Canvas Object.
 * @param {!Object} e Mouse click event.
 * @returns {int, int} Adjusted values of the click.
 */
const getTouchPosition = (canvas, e) => {
    let x;
    let y;
    if (e.pageX || e.pageY) {
        x = e.pageX;
        y = e.pageY;
    } else {
        x = e.touches[0].clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
        y = e.touches[0].clientY + document.body.scrollTop + document.documentElement.scrollTop;
    }
    const { width, height } = canvas.getBoundingClientRect();
    x = (x / width) * canvas.width;
    x -= (canvas.offsetLeft / width) * canvas.width;
    y = (y / height) * canvas.height
    y -= (canvas.offsetTop / height) * canvas.height;
    return { x, y };
};

// Handle touch events.
joystickCanvas.addEventListener('touchmove', handleStickMove);

// Check if user is using mobile phone and joystick is enabled.
if (isMobile && sessionStorage.enableJoystick === 'true') {
    if (sessionStorage.enableJoystick === 'true') firebaseAnalytics.logEvent(`mobile_joystick_enabled`);
    else firebaseAnalytics.logEvent(`mobile_joystick_disabled`);
    canvasContainer.style.display = 'visible';
    drawJoystick();
} else {
    canvasContainer.style.display = 'none';
}