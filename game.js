///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //

// TODO: DECLARE and INTIALIZE your constants here
var START_TIME = currentTime();


///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

// TODO: DECLARE your variables here
var lastKeyCode;


///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

// When setup happens...
function onSetup() {
    // TODO: INITIALIZE your variables here
    lastKeyCode = 0;
}


// When a key is pushed
function onKeyStart(key) {
    lastKeyCode = key;
}


// Called 30 times or more per second
function onTick() {

    // Some sample drawing 
    clearScreen();

    fillText("hello world",
             screenWidth / 2, 
             screenHeight / 2,             
             makeColor(0.5, 0.0, 1.0, 1.0), 
             "300px Times New Roman", 
             "center", 
             "middle");

    fillText(round(currentTime() - START_TIME) + " seconds since start",
             screenWidth / 2, 
             screenHeight / 2 + 300,   
             makeColor(1.0, 1.0, 1.0, 1.0), 
             "100px Arial", 
             "center", 
             "middle");

    fillText("last key code: " + lastKeyCode,
             screenWidth / 2, 
             screenHeight / 2 + 500,             
             makeColor(0.7, 0.7, 0.7, 1.0), 
             "100px Arial", 
             "center", 
             "middle");
}


///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //
