/* controller.js */

/** All available controllers, listed in order of preference for use */
var controllerArray;

function processControl(character) {
    character.controller.lastChoice.x = character.controller.choice.x;
    character.controller.lastChoice.y = character.controller.choice.y;
    var wasJumping = character.controller.jump;
    var wasAction = character.controller.action;
    character.controller.poll();
    character.controller.jumpJustPressed = (character.controller.jump && ! wasJumping);
    character.controller.actionJustPressed = (character.controller.action && ! wasAction);
}


/** Returns a control function that uses the keyboard.  keys is an all-uppercase string.  The order 
    is up/lt/dn/rt/choice up/choice dn/jump/action/alt action */
function makeKeyboardFunction(keys) {
    var UP = asciiCode(keys[0]);
    var LT = asciiCode(keys[1]);
    var DN = asciiCode(keys[2]);
    var RT = asciiCode(keys[3]);
    var CHC_LT = asciiCode(keys[4]);
    var CHC_RT = asciiCode(keys[5]);
    var JMP = asciiCode(keys[6]);
    var ACT1 = asciiCode(keys[7]);
    var ACT2 = asciiCode(keys[8]);

    return function() {
        this.direction.x = 0;
        this.direction.y = 0;
        if (keyDown[UP]) { this.direction.y -= 1; }
        if (keyDown[LT]) { this.direction.x -= 1; }
        if (keyDown[DN]) { this.direction.y += 1; }
        if (keyDown[RT]) { this.direction.x += 1; }

        this.action = keyDown[ACT1] || keyDown[ACT2];
        var j = keyDown[JMP];
        this.jump = j;

        this.choice.x = 0;
        this.choice.y = 0;
        if (keyDown[CHC_LT]) { this.choice.x -= 0.7; }
        if (keyDown[CHC_RT]) { this.choice.x += 0.7; }
    };
}


function makeGamepadFunction(num) {
    // Mapping: http://www.html5rocks.com/en/tutorials/doodles/gamepad/#toc-tester
    // Buttons
    var A = 0;
    var B = 1;
    var X = 2;
    var Y = 3;

    var SHOULDER_RT = 5;
    var TRIGGER_RT = 7;
    var TRIGGER_LT = 6;
    var SHOULDER_LT = 4;

    var DPAD_UP = 12;
    var DPAD_LT = 14;
    var DPAD_RT = 15;
    var DPAD_DN = 13;

    var START = 9;
    var SELECT = 8;
    var HOME = 16;

    var STICK1 = 10;
    var STICK2 = 11;

    // Axes
    var STICK1_X = 0;
    var STICK1_Y = 1;

    var STICK2_X = 2;
    var STICK2_Y = 3;

    return function() {
        var gamepad = navigator.getGamepads()[num];
        if (gamepad) {
            // The gamepad is active
            this.direction.x = 0;
            this.direction.y = 0;
            if ((gamepad.buttons[DPAD_UP] > 0.5) || (gamepad.axes[STICK1_Y] < -0.35)) { this.direction.y -= 1; }
            if ((gamepad.buttons[DPAD_LT] > 0.5) || (gamepad.axes[STICK1_X] < -0.35)) { this.direction.x -= 1; }
            if ((gamepad.buttons[DPAD_DN] > 0.5) || (gamepad.axes[STICK1_Y] > +0.35)) { this.direction.y += 1; }
            if ((gamepad.buttons[DPAD_RT] > 0.5) || (gamepad.axes[STICK1_X] > +0.35)) { this.direction.x += 1; }
            
            this.action   = gamepad.buttons[TRIGGER_RT] > 0.5;
            this.jump     = gamepad.buttons[0];

            this.choice.x = joystickThreshold(gamepad.axes[STICK2_X], 0.2);
            this.choice.y = joystickThreshold(gamepad.axes[STICK2_Y], 0.2);
        }
    };
}


function joystickThreshold(value, threshold) {
    if (abs(value) > threshold) {
        return (value - threshold * sign(value)) / (1 - threshold);
    } else {
        return 0;
    }
}


function makeController(title, image, pollFcn, directions, choice, jump, action, availableFcn) {
    return {
        title: title,
        image: image,
        poll: pollFcn,
        isAvailable: availableFcn,
        description: {
            move: directions,
            choose: choice,
            jump: jump,
            action: action 
        },

        action:    false,
        actionJustPressed: false,

        choice:    vec2(0, 0),
        
        // Currently down
        jump:      false,
        jumpJustPressed: false,

        lastChoice: vec2(0, 0),
        direction: vec2(0, 0)
    };
}


function makeDummyController() {
    return makeController("", undefined, function() {}, "", "", "", "", function() { return true; });
}


function initControls() {
    var SHIFT = asciiCharacter(16);
    var ALT   = asciiCharacter(18);
    var ENTER = asciiCharacter(13);
    var PERIOD = asciiCharacter(190);

    function makeJoystickAvailableFunction(num) {
        return function() { return navigator.getGamepads && navigator.getGamepads()[num]; };
    }

    function trueFcn() { return true; }


    controllerArray = [];

    if (navigator.getGamepads) {
        // Supports the joystick API
        for (i = 0; i < Math.max(4, navigator.getGamepads().length); ++i) {
            insertBack(controllerArray,
                       makeController("gamepad " + (i + 1),  
                                      loadImage("gui/gamepad" + (i + 1) + ".png"),
                                      makeGamepadFunction(i), 
                                      "D-pad", "R stick", "A", "R trigger", 
                                      makeJoystickAvailableFunction(i)));
        } // For each controller
    }

    insertBack(controllerArray,
               makeController("keyboard 1", loadImage("gui/keyboard1.png"), 
                              makeKeyboardFunction("WASDQE " + SHIFT + SHIFT), 
                              "W, A, S, & D", "Q & E", "space", "shift", trueFcn));

    insertBack(controllerArray,
               makeController("keyboard 2", loadImage("gui/keyboard2.png"), 
                              makeKeyboardFunction("IJKLUO" + ALT + "BN"),
                              "I, J, K, & L", "U & O", "alt", "B or N", trueFcn));

    insertBack(controllerArray, {title: "disabled", isAvailable: function() { return false; }});

}

initControls();



