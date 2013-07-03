// See the original ActionScript documentation at 
// http://www.box2dflash.org/docs/2.1a/reference/
include("Box2D.min.js");
include("utils.js");
include("controller.js");


///////////////////////////////////////////////////////////////
//                                                           //
//                    CONSTANT STATE                         //

// Physics simulator iterations.  Increase for stability, decrease for
// speed.
var VELOCITY_ITERATIONS = 10;
var POSITION_ITERATIONS = 12;

var BOX2D_LOGO_IMAGE = loadImage("Box2D.png");



// Box2D is tuned for stability at the scale of 1cm-10m objects
// with gravitational acceleration around 10 m/s^2

var PIXELS_PER_METER = 100;
var METERS_PER_PIXEL = 1 / PIXELS_PER_METER;

var METERS = 1;
var CENTIMETERS = METERS / 100;
var MILLIMETERS = METERS / 1000;
var SECONDS = 1;
var MINUTES = 60 * SECONDS;
var HOURS   = 60 * MINUTES;

var TICKS_PER_ANIMATION_FRAME = 2;

var TICK_TIME     = 1 / 30;

var JUMP_VELOCITY = 1500; // pixels / second
var RUN_VELOCITY  = 1850; // pixels / second
var GRAVITY_ACCELERATION = 6000; // pixels / second^2

var PRINCESS_SPRITE = {
    image : loadImage("princess.png"),
    animation : {
        IDLE:   {y:0, x:0, numFrames:3, loop:"reverse"},
        JUMP:   {y:0, x:3, numFrames:4, loop:false},
        RUN:    {y:1, x:0, numFrames:8, loop:true},
        ATTACK: {y:2, x:0, numFrames:6, loop:false},
        DUCK:   {y:2, x:6, numFrames:2, loop:false}
    },

    // Extent of an entire animation frame
    cellSize: vec2(264, 162),

    // Position of the feet
    origin: vec2(134, 147),

    source: "By Morgan McGuire from Jetrel's http://opengameart.org/content/castle-platformer"
};

var BACKGROUND = loadImage("exterior-1.png");
var MOON       = loadImage("moon.png");
var TILES      = loadImage("tiles.png");

// Platform positions are in the center
var PLATFORM_ARRAY = 
    [{position: vec2(1010, 950),  size: vec2(1530, 50)},
     {position: vec2(2185, 1100), size: vec2(760, 50)},
     {position: vec2(2965, 950),  size: vec2(760, 50)}];

///////////////////////////////////////////////////////////////
//                                                           //
//                     MUTABLE STATE                         //

var level; /*
	     world  : b2World
	     player : 
	     name : string
	     objects : {object}
	                object = {
			            sprite
				    physicsBodyDef
			         }
	    */

var mode; // "MENU", "PLAY", "LEVEL_EDITOR"

/** Track all keys that are pressed.  Because JavaScript treats
    unassigned elements of an array as 'undefined' and undefined as
    'false', this is effectively an array of false values.  */
var keyIsDown = makeArray();

///////////////////////////////////////////////////////////////
//                                                           //
//                      EVENT RULES                          //

defineGame("X", "Michael Mara", "", "H", false);


var b2Vec, b2BodyDef, b2FixtureDef, b2Fixture, b2World, b2MassData;
var b2PolygonShape, b2CircleShape, b2MouseJointDef, b2AABB;

function importBox2DNames() {
    // Shorthand naming conventions
    b2Vec2         = Box2D.Common.Math.b2Vec2;
    b2BodyDef      = Box2D.Dynamics.b2BodyDef;
    b2Body         = Box2D.Dynamics.b2Body;
    b2FixtureDef   = Box2D.Dynamics.b2FixtureDef;
    b2Fixture      = Box2D.Dynamics.b2Fixture;
    b2World        = Box2D.Dynamics.b2World;
    b2MassData     = Box2D.Collision.Shapes.b2MassData;
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    b2CircleShape  = Box2D.Collision.Shapes.b2CircleShape;
    b2DebugDraw    = Box2D.Dynamics.b2DebugDraw;
    b2MouseJointDef = Box2D.Dynamics.Joints.b2MouseJointDef;
    b2AABB         = Box2D.Collision.b2AABB;
}


function toB2Vec2(v) {
    return new b2Vec2(v.x, v.y);
}


/*
  levelDef = {
    gravity   : vec2 !meters/second^2
    objects   : [levelObjectDef]
    playerPos : vec2 !meters
  }

  levelObjectDef = {
    name     : string
    fixtures : [b2FixtureDef]
    bodyDef  : b2BodyDef
  }

 */


function makeStaticSpriteSpec(image, upperLeftSrc, extentSrc, upperLeftDst, extentDst) {
    var staticSprite = makeObject();
    staticSprite.type = "static";
    staticSprite.image = image;
    staticSprite.upperLeftSrc = upperLeftSrc;
    staticSprite.extentSrc    = extentSrc;
    staticSprite.upperLeftDst = upperLeftDst;
    staticSprite.extentDst    = extentDst;
    return staticSprite;
}

function makeDynamicSpriteSpec(image, animation, cellSize, upperLeftDst, extentDst) {
    var sprite = makeObject();
    sprite.type = "dynamic";
    sprite.image        = image;
    sprite.upperLeftDst = upperLeftDst;
    sprite.extentDst    = extentDst;
    sprite.cellSize     = cellSize;
    sprite.animation    = animation;
    return sprite;
}

function makeSpriteFromSpec(spec) {
    var sprite = makeObject();
    sprite.type = spec.type;

    if (sprite.type == "static") {
	sprite.upperLeftSrc = spec.upperLeftSrc;
	sprite.extentSrc    = spec.extentSrc;
    } else if (sprite.type == "dynamic") {
	sprite.cellSize     = spec.cellSize;
	sprite.animation    = spec.animation;
    } else {
	alert("Unsupported sprite type: " + sprite);
    }

    sprite.upperLeftDst = spec.upperLeftDst;
    sprite.extentDst    = spec.extentDst;
    sprite.image        = loadImage(spec.image);
    return sprite;
}

function loadSpriteSpecs(specArray) {
    var spriteArray = makeArray();
    for (var i = 0; i < length(specArray); ++i) {
	insertBack(spriteArray, makeSpriteFromSpec(specArray[i]) );
    }
    return spriteArray;
}




function createTestLevelDef() {
    var levelDef     = makeObject();
    levelDef.gravity = vec2(0,10); // m/s^2

    levelDef.objects = makeObject();
    
    var ground      = makeObject();
    ground.fixtures = makeArray();
    var fixDef = makeObject();
    fixDef.density     = 1.0;
    fixDef.friction    = 0.5;
    fixDef.restitution = 0.3;

    fixDef.shapeType = "box";
    fixDef.shape = vec2(METERS_PER_PIXEL * screenWidth / 4, METERS_PER_PIXEL * screenHeight * 0.05);
    
    insertBack(ground.fixtures, fixDef);


    var bodyDef = makeObject();

    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position = vec2(METERS_PER_PIXEL * screenWidth / 2,
			    METERS_PER_PIXEL * screenHeight * 0.85);

    ground.bodyDef = bodyDef;


    ground.graphics = makeArray();


    var upperLeftSrc = vec2(72, 192);
    var extentSrc    = vec2(192, 336);
    var extentDst    = extentSrc;
    var upperLeftDst = vec2(-192/2, -screenHeight * 0.05);
    var groundSprite;
    for(var i = -2; i <= 2; ++i) {
	groundSprite = makeStaticSpriteSpec("tiles.png", upperLeftSrc, extentSrc, add(upperLeftDst, vec2(extentDst.x*i,0)), extentDst);
	insertBack(ground.graphics, groundSprite); 
    }


    ground.name = "The Ground";
    levelDef.objects.ground = ground;


    var wall      = makeObject();
    wall.fixtures = makeArray();
    fixDef    = makeObject();
    fixDef.density     = 1.0;
    fixDef.friction    = 0.5;
    fixDef.restitution = 0.3;

    fixDef.shapeType = "box";
    fixDef.shape = vec2(METERS_PER_PIXEL * 45, METERS_PER_PIXEL * 144);
    insertBack(wall.fixtures, fixDef);

    bodyDef = makeObject();

    bodyDef.type = b2Body.b2_staticBody;
    bodyDef.position = vec2(METERS_PER_PIXEL * 450,
			    METERS_PER_PIXEL * 880);

    wall.bodyDef = bodyDef;
    wall.graphics = makeArray();


    upperLeftSrc = vec2(481, 0);
    extentSrc    = vec2(45, 144);
    extentDst    = vec2(45*2, 144*2);//extentSrc;
    upperLeftDst = vec2(-45, -144);
    var wallSprite;

    wallSprite = makeStaticSpriteSpec("tiles.png", upperLeftSrc, extentSrc, upperLeftDst, extentDst);
    insertBack(wall.graphics, wallSprite); 



    wall.name = "The Ground";
    levelDef.objects.wall = wall;



    levelDef.playerPos = vec2(7,7);


    return levelDef;
}


function createPlayerBody(location) {
    var playerWidth  = METERS_PER_PIXEL * 90;
    var playerHeight = METERS_PER_PIXEL * PRINCESS_SPRITE.cellSize.y;
    var playerRadius = playerWidth/2;    

    var playerBodDef = new b2BodyDef();

    playerBodDef.position.Set(location.x, location.y); 
    playerBodDef.type = Box2D.Dynamics.b2Body.b2_dynamicBody;
    var playerTorso = new b2PolygonShape();

    playerTorso.SetAsOrientedBox(playerRadius,  (playerHeight - playerRadius)/2, new b2Vec2(0,-playerRadius/2), 0 );
    
    var playerBod = level.world.CreateBody(playerBodDef);

    var fixture = new b2FixtureDef();
    fixture.shape = playerTorso;
    fixture.density = 1.0;
    playerBod.CreateFixture(fixture);

    fixture.shape = new b2CircleShape(playerRadius);
    fixture.shape.SetLocalPosition(new b2Vec2(0, -(playerRadius-(playerHeight/2) ) ) );
    //    playerBase.localPosition.y = ;
    playerBod.CreateFixture(fixture);
    return playerBod;
}

function getBodyDefFromSpec(bodySpec) {
    var bodyDef = new b2BodyDef();
    bodyDef.position = toB2Vec2(bodySpec.position);
    bodyDef.type     = bodySpec.type;
    console.log(bodyDef);
    return bodyDef;
}


function getFixtureDefFromSpec(fixSpec) {
    var fixDef = new b2FixtureDef();
    console.log(fixDef);
    console.log(fixSpec);
    if (fixSpec.shapeType == "box") {
	fixDef.shape = new b2PolygonShape();
	fixDef.shape.SetAsBox(fixSpec.shape.x, fixSpec.shape.y);
    } else if (fixSpec.shapeType == "circle") {
	fixDef.shape = new b2CircleShape(fixSpec.shape.radius);
	fixDef.shape.SetLocalPosition(toB2Vec2(fixSpec.shape.localPosition));
    } else if (fixSpec.shapeType == "orientedBox") {
	fixDef.shape = new b2PolygonShape();
	fixDef.SetAsOrientedBox(fixSpec.shape.extent.x, fixSpec.shape.extent.y, 
				toB2Vec2(fixSpec.shape.localPosition), fixSpec.shape.rotation );
    } else if (fixSpec.shapeType == "polygon") {
	alert("Not yet implemented");
    } else {
	alert("Invalid shape type" + fixSpec.shapeType); 
    }
    fixDef.density     = fixSpec.density;
    fixDef.friction    = fixSpec.friction;
    fixDef.restitution = fixSpec.restitution;;


    console.log(fixDef);

    return fixDef;
}

function loadBodyFromObjectSpec(obj) {
    var bodyDef = getBodyDefFromSpec(obj.bodyDef);
    var body = level.world.CreateBody(bodyDef);
    for (var i = 0; i < obj.fixtures.length; i++) {
	var fixSpec = obj.fixtures[i];
	var fixDef = getFixtureDefFromSpec(fixSpec);
	body.CreateFixture(fixDef);
    }
    return body;
}

function loadLevel(levelDef) {
    level = makeObject();

    var gravity    = new b2Vec2(levelDef.gravity.x * METERS / pow(SECONDS, 2), 
				levelDef.gravity.y * METERS / pow(SECONDS, 2));
    var allowSleep = true;
    level.world = new b2World(gravity, allowSleep);
    

    level.objects = makeArray();
    console.log(levelDef.objects);    
    for (objName in levelDef.objects) {
	var obj = levelDef.objects[objName];
	var levelObject = makeObject();
	levelObject.sprites     = loadSpriteSpecs(obj.graphics);
	levelObject.physicsBody = loadBodyFromObjectSpec(obj);
	insertBack(level.objects, levelObject);
    } 

    
    var playerBod = createPlayerBody(levelDef.playerPos);
    level.player = {
	desiredVelocity : vec2(0, 0),
        facing   : +1,
        count    : 0,
        action   : "IDLE",
        sprite   : PRINCESS_SPRITE,
	physicsBody : playerBod
    };


}


function loadLevelFromFile(url) {
    console.log(url);
    var lvlJSON = getRemoteFileAsString(url);
    console.log(lvlJSON);
    loadLevel(JSON.parse(lvlJSON));
}

var box2DSprite;
function onSetup() {
    importBox2DNames();

    var testLevel = createTestLevelDef();
    console.log(testLevel);
    var testLevelJSON = JSON.stringify(testLevel, null, 2);
    console.log(testLevelJSON);
    var unparsedLevel = JSON.parse(testLevelJSON);
    console.log(unparsedLevel);

    downloadTextFile("test.lvl.json", testLevelJSON);
    loadLevel(unparsedLevel);

    
    //    loadLevelFromFile("test.lvl.json");
    console.log(level);

    // Configure the Box2D debugging visualization library.  This is
    // not intended for game graphics, just for debugging physics.
    var debugDraw = new b2DebugDraw();
    box2DSprite = canvas.getContext("2d");
    debugDraw.SetSprite(box2DSprite);
    debugDraw.SetDrawScale(PIXELS_PER_METER);
    debugDraw.SetFillAlpha(0.5);
    debugDraw.SetLineThickness(2.0);

    // What do you want to see?
    // e_aabbBit  e_centerOfMassBit  e_controllerBit  e_jointBit   e_pairBit  e_shapeBit 
    debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
    level.world.SetDebugDraw(debugDraw);

}

function canvasCoordinates(p) {
    return vec2(p.physicsBody.GetPosition().x / METERS_PER_PIXEL,
		p.physicsBody.GetPosition().y / METERS_PER_PIXEL);
}


function doPhysics(dt) {
    level.world.Step(dt, VELOCITY_ITERATIONS, POSITION_ITERATIONS);

    level.world.ClearForces();
}


// When a key is pushed
function onKeyStart(key) {
    keyIsDown[key] = true;
}


function onKeyEnd(key) {
    keyIsDown[key] = false;
}


var last = currentTime();
// Called 30 times or more per second
function onTick() {
    var t0 = currentTime();
    var t1, t2;
    var dt = 1 / 30; // seconds
    var interval = t0 - last;
    last = t0;


    simulate();
    // Run the physics simulation
    doPhysics(dt);
    t1 = currentTime();

    draw();

    // Draw physics debugging info
    var playerPosition = canvasCoordinates(level.player);
    var x = playerPosition.x - screenWidth / 2;
     box2DSprite.translate(-x, 0);
    level.world.DrawDebugData();
    box2DSprite.translate(x, 0);


    t2 = currentTime();

    // UI
    codeheart.drawLogo();
    fillText("and", 330, screenHeight - 26, makeColor(0.3, 0.3, 0.3), "30px Arial");
    drawImage(BOX2D_LOGO_IMAGE, 400, screenHeight - 70);

    fillText("Framerate: " + round(1 / interval) + " fps", 50,  50, makeColor(0, 0, 0), "40px Arial");
    fillText("Physics:       " + round((t1 - t0) * 1000) + " ms", 50, 100, makeColor(0, 0, 0), "40px Arial");
    fillText("Graphics:     " + round((t2 - t1) * 1000) + " ms", 50, 150, makeColor(0, 0, 0), "40px Arial");


}

///////////////////////////////////////////////////////////////
//                                                           //
//                      HELPER RULES                         //

function simulate() {
    
    var player = level.player;
    ++player.count;

    var lastAction = player.action;
    var endOfAttackAction = (player.action == "ATTACK") && 
        (player.count / TICKS_PER_ANIMATION_FRAME >= player.sprite.animation[player.action].numFrames);

    var onGround = false;
    var i, platform;
    player.desiredVelocity.x = 0;
    player.desiredVelocity.y = 0;
    var currentActionIsInterruptable = (player.action == "RUN") || (player.action == "IDLE");

    var controller = controllerArray[0];
    controller.poll();
    if (currentActionIsInterruptable) {
        if (controller.action) {
            // Can only attack when running or idle, not falling or attacking
            player.action = "ATTACK";
            // Count will be immediately incremented to 0 in simulate()
            player.count = -1;
        } else if (controller.jump) {
            player.action = "JUMP";
            player.count = -1;

            // Move up slightly, forcing the player into jump mode
            player.desiredVelocity.y = -JUMP_VELOCITY;
        }
    }



    // The action may be temporarily set to RUN below, but if falling it will revert to "JUMP"
    if (endOfAttackAction || (player.action != "ATTACK")) {
	//console.log(controller);

	if (controller.direction.x > 0.05) {
	    player.action = "RUN";
	    player.facing = 1;
	} else if (controller.direction.x < -0.05){
	    player.action = "RUN";
	    player.facing = -1;
	} else {
	    player.action = "IDLE";
	}

        if (player.action == "RUN") {
            player.desiredVelocity.x = RUN_VELOCITY * controller.direction.x;
        }

    }

    if (lastAction != player.action) {
        // Go to the first frame of this new animation
        player.count = 0;
    }


    var playerForce = new b2Vec2(player.desiredVelocity.x, player.desiredVelocity.y);

    player.physicsBody.ApplyForce(playerForce, player.physicsBody.GetPosition() );
    // Integrate
    //    player.position = add(player.position, mul(player.velocity, TICK_TIME));
    //    player.position.y = min(950, player.position.y);
}


function drawObject(obj, offset) {
    var position = sub(canvasCoordinates(obj), offset);
    //console.log(canvasCoordinates(obj));
    for (i = 0; i < length(obj.sprites); ++i) {
	var sprite = obj.sprites[i];
	if (sprite.type == "dynamic") {
	    drawSprite(sprite, obj.currentAction, position, 1, 0);
	} else if (sprite.type == "static") {
	    drawStaticSprite(sprite, position);	    
	} else {
	    alert("Invalid sprite type" + sprite.type);
	}


    }

}


function draw() {
    var i;
    var player = level.player;
    //    console.log(level.player);

    //var playerPosition = canvasCoordinates(player);
    var playerPosition = canvasCoordinates(level.player);

    // Shift everything based on the player position
    var xShift = playerPosition.x - screenWidth / 2;

    // Mountains (infinitely tiled by three copies)
    var shift = floor(xShift / (2 * BACKGROUND.width));
    for (i = 0; i < 3; ++i) {
        drawImage(BACKGROUND, BACKGROUND.width * (i + shift) - xShift / 2);
    }

    // Moon
    drawImage(MOON, 1000 - xShift / 6, 200);
    var screenOffset = vec2(xShift, 0);
    var i;
    //console.log(screenOffset);
    for(i = 0; i < length(level.objects); ++i) {
	drawObject(level.objects[i], screenOffset);
    } 
    
    drawSprite(player.sprite, player.action, vec2(screenWidth / 2, playerPosition.y + (player.sprite.cellSize.y/2)), 
               player.facing, floor(player.count / TICKS_PER_ANIMATION_FRAME));


}

function drawStaticSprite(sprite, pos) {
    //    console.log(sprite);
    //console.log(pos);
    drawImage
        (sprite.image, 
	 pos.x + sprite.upperLeftDst.x,
	 pos.y + sprite.upperLeftDst.y,
         sprite.extentDst.x, 
	 sprite.extentDst.y,
	 sprite.upperLeftSrc.x,
	 sprite.upperLeftSrc.y,	
         sprite.extentSrc.x, 
	 sprite.extentSrc.y)
}





/** 
  action: name of the action from the sprite animation table
  facing: either +1 (positive x) or -1 (negative x)
  */
function drawSprite(sprite, action, pos, facing, frame) {
    var animation = sprite.animation[action];

    var offset;
    switch (animation.loop) {
    case "reverse":
        // Cycle through frames both forwards and backwards
        var cycle = frame % (animation.numFrames * 2 - 2);
        if (cycle < animation.numFrames) {
            offset = cycle;
        } else {
            offset = 2 * animation.numFrames - 2 - cycle;
        }
        break;

    case true:
        // Cycle through frames forwards
        offset = frame % animation.numFrames;
        break;

    case false:
        // Clamp to the maximum frame number
        offset = min(frame, animation.numFrames - 1);
        break;
    }

    drawTransformedImage
        (sprite.image, pos.x - sprite.origin.x + sprite.cellSize.x / 2,
         pos.y - sprite.origin.y + sprite.cellSize.y / 2, 
         0, facing, 1,  
         (animation.x + offset) * sprite.cellSize.x, animation.y * sprite.cellSize.y, 
         sprite.cellSize.x, sprite.cellSize.y);
}
