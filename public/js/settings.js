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
    sessionStorage.enableJoystick = false;
}

// Set the references for the elements.
const musicVolume = document.getElementById('musicVolume');
const soundVolume = document.getElementById('soundVolume');
const buttonMenu = document.getElementById('buttonMenu');
const buttonSignOut = document.getElementById('buttonSignOut');
const joystickSwitch = document.getElementById('joystickSwitch');

// Set the value for the music range slider.
musicVolume.value = sessionStorage.musicVolume;

// Set the value for the sound range slider.
soundVolume.value = sessionStorage.soundVolume;

console.log(sessionStorage.enableJoystick);
// Set the value for the sound range slider.
sessionStorage.enableJoystick === 'true' ? joystickSwitch.checked = true : joystickSwitch.checked = false;

// Update the music volume on value change.
musicVolume.onchange = () => updateMusicVolume();

// Update the sound volume on value change.
soundVolume.onchange = () => updateSoundVolume();

// Opens the menu page when the menu button is clicked.
buttonMenu.onclick = () => openMenu();

// Opens the sign in page when the sigin button is clicked.
buttonSignOut.onclick = () => signOut();

joystickSwitch.onchange = () => {
    sessionStorage.enableJoystick = joystickSwitch.checked;
    console.log("Change");
};

/**
 * @description Update the music volume.
 */
const updateMusicVolume = () => {
    sessionStorage.musicVolume = musicVolume.value;
}

/**
 * @description Update the sound volume.
 */
const updateSoundVolume = () => {
    sessionStorage.soundVolume = soundVolume.value;
}

/**
 * @description Redirects user to the menu page.
 */
const openMenu = () => {
    window.location.replace("../html/menu.html");
};

/**
 * @description Redirects user to the sign in page.
 */
const signOut = () => {
    sessionStorage.userEmail = undefined;
    sessionStorage.userDisplayName = undefined;
    window.location.replace("../html/signIn.html");
};