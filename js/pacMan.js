	var renderer, rendererHUD;
	var scene;
	var controls;
	var camera, cameraHUD;
	var spotLight, spotlight2, ambientlight;
	var continueplay = true;

	const RAD = Math.PI / 180; // Degree to radian conversion
	const MARGIN = 4; // Space between walls
	const NUMWALLS = 100; // Number of walls
	const NUMOPPONENT = 20; // Number of opponents
	const NUMPELLETS = 100; // Number of pellets
	const PLAYERSPEED = .2; // Player movement speed
	const OPPONENTSPEED = .15; // Opponent movement speed

	// Note: Sometimes it takes a long time for THREEjs to detect collisions (I'm assuming thats the case), 
	// so the player is able to go through walls for a couple of seconds at the start

	function init()
	{	
		// Physics
		Physijs.scripts.worker = 'libs/physijs_worker.js';
		Physijs.scripts.ammo = 'ammo.js';

		scene = new Physijs.Scene();
		scene.setGravity(new THREE.Vector3( 0, 0, -40 ));

		sceneHUD = new THREE.Scene();

		// Initial setup
		setupCamera();
		setupRenderer();
		addSpotLight();
		loadSounds();

		setupHUDCamera();
		setupHUDRenderer();
		addHUDSpotLight();

		// Asset Creation
		createPlane();
		createBoundingWalls();
		createMaze();
		createPlayer();
		createOpponents();
		createPellets();
		createHUDScoreBoard();
		createHUDHelpText();
		createName();

		// Main Renderer
		var container = document.getElementById( "mainView" );
		container.appendChild( renderer.domElement );

		// HUD Renderer
		var containerHUD = document.getElementById( "HUDView" );
		containerHUD.appendChild( rendererHUD.domElement );

		document.addEventListener( 'keydown', onKeyDown, false );

		render();
	}

	/*
	 * INITIAL SETUP
	 */
	function setupCamera()
	{
		camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.x = 0;
		camera.position.y = -3;
		camera.position.z = 3;
		camera.rotation.x = 80 * RAD;
	}

	function setupRenderer()
	{
		renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		renderer.setClearColor( 0x000000, 0.0 );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
		
		renderer.shadowMapEnabled = true;
		renderer.shadowMapType = THREE.BasicShadowMap;
	}
	
	function addSpotLight()
	{	
		spotLight = new THREE.SpotLight( 0xffffff, 2, 200, 1);
        spotLight.position.set( 0, -150, 100 );
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 50;
        spotLight.castShadow = true;
        scene.add(spotLight);

        spotLight2 = new THREE.SpotLight( 0xffffff, 2, 200, 1 );
        spotLight2.position.set( 0, 150, 100 );
        spotLight2.shadowCameraNear = 20;
        spotLight2.shadowCameraFar = 50;
        spotLight2.castShadow = true;
        scene.add(spotLight2);

        spotLight3 = new THREE.SpotLight( 0xffffff, 2, 200, 1 );
        spotLight3.position.set( 150, 0, 100 );
        spotLight3.shadowCameraNear = 20;
        spotLight3.shadowCameraFar = 50;
        spotLight3.castShadow = true;
        scene.add(spotLight3);

        spotLight4 = new THREE.SpotLight( 0xffffff, 2, 200, 1 );
        spotLight4.position.set( -150, 0, 100 );
        spotLight4.shadowCameraNear = 20;
        spotLight4.shadowCameraFar = 50;
        spotLight4.castShadow = true;
        scene.add(spotLight4);

        ambientlight = new THREE.AmbientLight(0xbababa);
        scene.add(ambientlight);
	}

	var gotitem, endgame, jump;
	function loadSounds()
	{
		gotitem = new Audio("sounds/gotitem.mp3");
		endgame = new Audio("sounds/gameover.wav");
		jump = new Audio("sounds/jump.wav");
		music = new Audio("sounds/Bespin.mp3");

		music.addEventListener('ended', function() 
		{
			this.currentTime = 0;
			this.play();
		}, false);

		music.volume = .3;
		music.play();
	}

	function setupHUDCamera()
	{
		cameraHUD = new THREE.PerspectiveCamera(10, window.innerWidth / 100, 0.1, 4000); // ca, ar
		cameraHUD.position.y = -31;
		cameraHUD.lookAt( new THREE.Vector3(0,0,0) );
	}

	function setupHUDRenderer()
	{
		rendererHUD = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		rendererHUD.setClearColor( 0x000000, 0 );
		rendererHUD.setSize( window.innerWidth, 100 ); // r.width, r.height
		rendererHUD.shadowMapEnabled = true;

		//rendererHUD.enableScissorTest(true);
		rendererHUD.setViewport( 10, 10, window.innerWidth, 100 );
	}

	function addHUDSpotLight()
	{
		spotLightHUD = new THREE.SpotLight( 0xffffff, 2.5, 200, 1);
		spotLightHUD.position.set( 0, -31, 50 );
		spotLightHUD.lookAt( new THREE.Vector3(0, 0, 21));
        spotLightHUD.shadowCameraNear = 20;
        spotLightHUD.shadowCameraFar = 50;
        spotLightHUD.castShadow = true;
        sceneHUD.add(spotLightHUD);


        ambientlightHUD = new THREE.AmbientLight(0xe0e0e0);
        //sceneHUD.add(ambientlightHUD);
	}

	function render()
	{	
		maintainPlayer();
		maintainOpponents();
		//maintainPellets();
		scene.simulate();		

		requestAnimationFrame( render );
		renderer.render( scene, camera );
		rendererHUD.render( sceneHUD, cameraHUD );
	}

	/*
	 * ASSET CREATION
	 */
	var groundPlane;
	function createPlane()
	{
		var texture = THREE.ImageUtils.loadTexture('images/img.jpg');
		var planeGeometry = new THREE.PlaneGeometry( 100, 100, 10, 10 );
		var planeMaterial = new Physijs.createMaterial(new THREE.MeshPhongMaterial({map:texture}), 0, 0 );
		//var planeMaterial = new THREE.MeshLambertMaterial();

		groundPlane = new Physijs.BoxMesh( planeGeometry, planeMaterial, 0 );
		groundPlane.name = "GroundPlane";
		scene.add( groundPlane );
	}	

	function createBoundingWalls()
	{
		var hgeo = new THREE.BoxGeometry( 100, 2, 8 );
		var vgeo = new THREE.BoxGeometry( 2, 104, 8 );
		var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color:0x3d4bff, shading: THREE.FlatShading}), 1, 0 );
		
		var upperWall = new Physijs.BoxMesh( hgeo, mat, 0 );
		var lowerWall = new Physijs.BoxMesh( hgeo, mat, 0 );
		var leftWall = new Physijs.BoxMesh( vgeo, mat, 0 );
		var rightWall = new Physijs.BoxMesh( vgeo, mat, 0 );
		
		upperWall.position.set( 0, 51, 4 );
		lowerWall.position.set( 0, -51, 4);
		leftWall.position.set( -51, 0, 4 );
		rightWall.position.set( 51, 0, 4);

		upperWall.name = 'Wall';
		lowerWall.name = 'Wall';
		leftWall.name = 'Wall';
		rightWall.name = 'Wall';

		scene.add( upperWall );
		scene.add( lowerWall );
		scene.add( leftWall );
		scene.add( rightWall );
	}

	var sizeList, positionList, wallList;
	function createMaze()
	{	
		wallList = [];

		sizeList = new Array(NUMWALLS);
		positionList = new Array(NUMWALLS);


		for(var i = 0; i < NUMWALLS; i++)
		{	
			sizeList[i] = new Array(2);
			positionList[i] = new Array(2);

			// Determine wall rotation
			vertical = Math.floor( Math.random() * 2 ) == 0;

			// Modify y length (10 - 30); x = 2;
			if ( vertical )
			{
				sizeList[i][0] = 2;
				sizeList[i][1] = 10;

				positionList[i][0] = generateSpacedParameters( -49 + MARGIN, 49 - MARGIN, MARGIN );
				positionList[i][1] = generateSpacedParameters( -50 + ( sizeList[i][1] / 2 ), 50 - ( sizeList[i][1] / 2 ), 4 );
			}
			// Modify x length; y = 2;
			else
			{
				sizeList[i][0] = 10;	
				sizeList[i][1] = 2;

				positionList[i][0] = generateSpacedParameters( -50 + ( sizeList[i][0] / 2 ), 50 - ( sizeList[i][0] / 2 ), 4 );
				positionList[i][1] = generateSpacedParameters( -49 + MARGIN, 49 - MARGIN, MARGIN );
			}

			var geo = new THREE.BoxGeometry( sizeList[i][0], sizeList[i][1], 8 );
			var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color: 0x3d4bff, shading: THREE.FlatShading}), .95, 0 );
			var wall = new Physijs.BoxMesh( geo, mat, 0 );
			wall.name = 'Wall';

			// Choose position
			wall.position.set( positionList[i][0], positionList[i][1], 4 );

			wallList.push( wall );
			scene.add( wall );
		}
	}

	var player;
	function createPlayer()
	{	
		var geo = new THREE.TetrahedronGeometry( 1, 2 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 0x72b1ff,
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 1, 0 );


		player = new Physijs.SphereMesh( geo, mat );
    	player.addEventListener( 'collision', checkCollision);

		player.position.set(0, 0, 1);
		player.name = "Player";
		scene.add( player );
	}

	var opponentList, collision, directionList, time;
	function createOpponents()
	{	
		opponentList = [];
		directionList = [];
		collision = false;
		time = 120;

		var geo = new THREE.TetrahedronGeometry( 1, 1 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 'white',
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );

		for(var i = 0; i < NUMOPPONENT; i++)
		{
			// Generate position
			var opponent = new Physijs.SphereMesh( geo, mat );
			var x = generateParameters(-49, 49);
			var y = generateParameters(-49, 49);

			opponent.position.set(x, y, 2);
			scene.add(opponent);
    		opponent.name = "Opponent";

    		// Save to opponentList
			opponentList.push(opponent);

			// Generate random direction
	    	directionList[i] = generateParameters( 1, 4 );
		}

		// Add event listeners for each enemy
		opponentList[0].addEventListener( 'collision', checkOpponentCollision0);
		opponentList[1].addEventListener( 'collision', checkOpponentCollision1);
		opponentList[2].addEventListener( 'collision', checkOpponentCollision2);
		opponentList[3].addEventListener( 'collision', checkOpponentCollision3);
	}

	var pelletList;
	function createPellets()
	{
		pelletList = [];

		var geo = new THREE.TetrahedronGeometry( .7, 0 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 'yellow',
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );

		for(var i = 0; i < NUMPELLETS; i++)
		{
			var pellet = new Physijs.SphereMesh( geo, mat, 0 );
			var x = generateParameters(-49, 49);
			var y = generateParameters(-49, 49);

			pellet.position.set(x, y, 1);
			scene.add(pellet);
    		pellet.name = "Pellet";

    		// Save to opponentList
			pelletList.push(pellet);
		}
	}

	var scoreValue, score;
	function createHUDScoreBoard()
	{
		var mat = new THREE.MeshLambertMaterial({color:'white'});
	    var geo = new THREE.TextGeometry( 'Score', {
	    	font: 'calibri',
	        size: 1.5,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );

	    score = new THREE.Mesh( geo, mat );

	    score.position.set(.3, 0, 3);
	    score.rotation.x = 90 * RAD;
	    score.rotation.z = 270 * RAD;
	    sceneHUD.add( score );

	   	scoreValue = 0;

	    updateScoreBoard(scoreValue);
	}

	var line1, line2, line3, line4;
	function createHUDHelpText()
	{	
		var text1 = 'W / S - Forward / Backward';
		var text2 = 'A / D - Rotate Player';
		var text3 = 'Shift - Toggle View';
		var text4 = 'Space - Jump';

		var mat = new THREE.MeshLambertMaterial({color:'white'});
	   
	    var geo1 = new THREE.TextGeometry( text1, {
	    	font: 'calibri',
	        size: .5,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );
	   	var geo2 = new THREE.TextGeometry( text2, {
	    	font: 'calibri',
	        size: .5,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );
	   	var geo3 = new THREE.TextGeometry( text3, {
	    	font: 'calibri',
	        size: .5,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );
	   	var geo4 = new THREE.TextGeometry( text4, {
	    	font: 'calibri',
	        size: .5,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );


	    line1 = new THREE.Mesh( geo1, mat );
	    line1.rotation.x = 90 * RAD;
	    line1.rotation.z = 270 * RAD;

	    line2 = new THREE.Mesh( geo2, mat );
	    line2.rotation.x = 90 * RAD;
	    line2.rotation.z = 270 * RAD;

	    line3 = new THREE.Mesh( geo3, mat );
	    line3.rotation.x = 90 * RAD;
	    line3.rotation.z = 270 * RAD;

	    line4 = new THREE.Mesh( geo4, mat );
	    line4.rotation.x = 90 * RAD;
	    line4.rotation.z = 270 * RAD;

	    line1.position.set(1, 0, -4);
	    line2.position.set(0, 0, -4 );
	    line3.position.set(-1,0, -4 );
	    line4.position.set(-2, 0, -4 );

	    sceneHUD.add(line1);
	    sceneHUD.add(line2);
	    sceneHUD.add(line3);
	    sceneHUD.add(line4);
	}

	function createName()
	{
		var name = 'Charlene Juvida'

		var mat = new THREE.MeshLambertMaterial({color:'white'});
	   	var geo = new THREE.TextGeometry( name, {
	    	font: 'calibri',
	        size: 8,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );

	   	var mesh = new THREE.Mesh(geo, mat);
	   	mesh.position.set(-35, -50, 20);
	   	scene.add(mesh);
	}

	/*
	 * RENDER + ANIMATION
	 */
	 function maintainPlayer()
	{	
		player.__dirtyPosition = true;
		player.__dirtyRotation = true;

		player.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    	player.setAngularVelocity(new THREE.Vector3(0, 0, 0));

    	if(firstperson && continueplay)
    	{
			if( dPress == 0 ){
				camera.position.x = player.position.x;
				camera.position.y = player.position.y - 3;

				camera.position.z = 3;
				camera.rotation.x = 80 * RAD;
				camera.rotation.y = 0;
				camera.rotation.z = 0;

				displayDirection( 0 );
			}
			else if( dPress == 1 ){
				camera.position.x = player.position.x - 3;
				camera.position.y = player.position.y;

				camera.position.z = 2.5;
				camera.rotation.x = 80 * RAD;
				camera.rotation.z = -10 * RAD;

				displayDirection( 1 );
			}
			else if( dPress == 2 ){
				camera.position.x = player.position.x;
				camera.position.y = player.position.y + 3;

				camera.position.z = 3;
				camera.rotation.x = 97 * RAD;
				camera.rotation.z = 0;

				displayDirection( 2 );
			}
			else if( dPress == 3 ){
				camera.position.x = player.position.x + 3;
				camera.position.y = player.position.y;
				
				camera.position.z = 2.5;
				camera.rotation.x = 80 * RAD;
				camera.rotation.z = 10 * RAD;

				displayDirection( 3 );
			}

			if( Key.isDown(Key.W))
			{	
				if( dPress == 0)
					player.position.y += PLAYERSPEED;
				if( dPress == 2)
					player.position.y -= PLAYERSPEED;
				if( dPress == 1)
					player.position.x += PLAYERSPEED;
				if(dPress == 3)
					player.position.x -= PLAYERSPEED;
			}	
			else if( Key.isDown(Key.S))
			{
				if( dPress == 0)
					player.position.y -= PLAYERSPEED;
				if( dPress == 2)
					player.position.y += PLAYERSPEED;
				if( dPress == 1)
					player.position.x -= PLAYERSPEED;
				if(dPress == 3)
					player.position.x += PLAYERSPEED;
			}

			if( Key.isDown(Key.SPACE)){
				player.position.z = player.position.z +.05;
				jump.play();
				if (player.position.z > 2)
				{
					player.position.z = 2;
				}
			}
		}
	}

	var counter = 0;
	function maintainOpponents()
	{	
		for(var i = 0; i < NUMOPPONENT; i++)
		{	
			opponentList[i].__dirtyPosition = true;
			opponentList[i].__dirtyRotation = true;

			opponentList[i].setLinearVelocity(new THREE.Vector3(0, 0, 0));
	    	opponentList[i].setAngularVelocity(new THREE.Vector3(0, 0, 0));

	    	// Generate new direction every couple of frames
	    	if(counter % 100 == 0)
	    		if(generateParameters(0, 1))
					switchDirection( i );

	    	// Move opponent
	    	if(directionList[i] == 1) // Up
	    	{
	    		opponentList[i].position.y += OPPONENTSPEED;
	    	}
	    	else if(directionList[i] == 2) // Down
	    	{
	    		opponentList[i].position.y -= OPPONENTSPEED;
	    	}
	    	else if(directionList[i] == 3) // Left
	    	{
	    		opponentList[i].position.x -= OPPONENTSPEED;
	    	}
	    	else if(directionList[i] == 4) // Right
	    	{
	    		opponentList[i].position.x += OPPONENTSPEED;
	    	}
		}
		counter++;
	}

	var rise = true;
	function maintainPellets()
	{
		for(var i = 0; i < NUMPELLETS; i++)
		{	
			if(pelletList[i] != null || pelletList[i] != undefined){
				pelletList[i].__dirtyPosition = true;
				pelletList[i].__dirtyRotation = true;

				pelletList[i].setLinearVelocity(new THREE.Vector3(0, 0, 0));
		    	pelletList[i].setAngularVelocity(new THREE.Vector3(0, 0, 0));
				
				if(rise)
				{
					pelletList[i].position.z = pelletList[i].position.z + .01;
					
					if(pelletList[i].position.z > 1.5)
						rise = false;
				}
				else
				{
					pelletList[i].position.z = pelletList[i].position.z - .01;
					if(pelletList[i].position.z < 1)
						rise = true;;
				}
			}
			
		}
	}

	/*
	 * HELPER FUNCTIONS
	 */
	// Displays game over
	function displayGameOver()
	{	
		console.log('game over');
		sceneHUD.remove(scoreMesh);
		sceneHUD.remove(score);
		sceneHUD.remove(line1);
		sceneHUD.remove(line2);
		sceneHUD.remove(line3);
		sceneHUD.remove(line4);
		sceneHUD.remove(dMesh);

		var mat = new THREE.MeshLambertMaterial({color:'white'});
	    var geo = new THREE.TextGeometry( 'GAME OVER', {
	    	font: 'calibri',
	        size: 3,
	        height: .5,
	        curveSegments: 20,
	        bevelEnabled: false,
	        bevelThickness: .025,
	        bevelSize: 0
	   	} );

	    var gameover = new THREE.Mesh(geo, mat);
	    gameover.position.set(-1, 0, 10);
	    gameover.rotation.x = 90 * RAD;
	    gameover.rotation.z = 270 * RAD;
	    sceneHUD.add(gameover);

	    continueplay = false;
	}

	// Switches opponent direction at collision or at random
	function switchDirection( index )
	{	
		var previous = directionList[index];

		while(directionList[index] == previous)
			directionList[index] = generateParameters( 1, 4 );
	}


	// Displays direction in HUD Renderer
	var dMesh;
	function displayDirection( direction )
	{	
		var text; 

		if(direction == 0)
			text = 'N';
		if(direction == 1)
			text = 'E';
		if(direction == 2)
			text = 'S';
		if(direction == 3)
			text = 'W';

		// Remove old mesh
		if (dMesh != null)
			sceneHUD.remove(dMesh);

		var geo = new THREE.TextGeometry((text),
	    {
	    	font: 'calibri',
	        size: 2.5,
	        height: .5,
	        curveSegments: 10,
	        bevelEnabled: false,
	        bevelThickness: .25,
	        bevelSize: 0
	    });

	    var mat = new THREE.MeshLambertMaterial({color:'white'});
	    dMesh = new THREE.Mesh( geo, mat );
	   	
		dMesh.position.set(-1.5, 0, -13);
		dMesh.rotation.x = 90 * RAD;
		dMesh.rotation.z = 270 * RAD;

		sceneHUD.add(dMesh);
	}

	var scoreMesh;
	function updateScoreBoard( scoreValue )
	{
		if(scoreMesh != null)	
			sceneHUD.remove(scoreMesh);

		// Update score value
		var scoreString = ( scoreValue < 10 ) ? '0' + scoreValue.toString() : scoreValue.toString();

	    var scoreText = new THREE.TextGeometry((scoreValue),
	    {
	    	font: 'calibri',
	        size: 2,
	        height: .5,
	        curveSegments: 10,
	        bevelEnabled: false,
	        bevelThickness: .25,
	        bevelSize: 0
	    });

	    var material = new THREE.MeshLambertMaterial({color:'white'});
	    scoreMesh = new THREE.Mesh( scoreText, material );

	    scoreMesh.position.set(-2, 0, 1.3);
	    scoreMesh.rotation.x = 90 * RAD;
	    scoreMesh.rotation.z = 270 * RAD;

	    sceneHUD.add( scoreMesh );
	}

	// Generates random values between 2 values
	function generateParameters( lowerBound, upperBound )
	{	
		return Math.floor( Math.random() * ( upperBound - lowerBound + 1 )) + lowerBound;
	}

	// Generates random values between 2 values at intervals
	function generateSpacedParameters( lowerBound, upperBound, margin )
	{	
		var n = Math.floor(( Math.floor( Math.random() * ( upperBound - lowerBound + 1 )) + lowerBound) / margin ) * margin;

		if(n < lowerBound)
			n = lowerBound;

		return n;
	}

	/*
	 * EVENT LISTENERS
	 */
	function checkCollision( other_object, linear_velocity, angular_velocity )
	{	
		if( other_object.name == 'Opponent' ){
			displayGameOver();
			endgame.play();
		}
		else if( other_object.name == 'Pellet' )
		{
			scene.remove(other_object);
			updateScoreBoard( ++scoreValue );
			gotitem.play();
		}
	}

	function checkOpponentCollision0( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
        	switchDirection( 0 );
		}
	}

	function checkOpponentCollision1( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
        	switchDirection( 1 );
		}
	}

	function checkOpponentCollision2( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
        	switchDirection( 2 );
		}
	}

	function checkOpponentCollision3( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
        	switchDirection( 3 );
		}
	}

	var shiftPress = 0, dPress = 0, firstperson = true;
	function onKeyDown( event )
	{	
		switch( event.keyCode )
		{		
				// Shift Key
				case 16: 
					if(shiftPress % 2 == 1)
						toggleFirstPerson();
					else
						toggleThirdPerson();

					shiftPress++;
					break;

				// D Key
				case 68: 
					if( firstperson )
					{
						camera.rotation.y -= 90 * RAD;
					}

					dPress++; // Stores direction value

					if(dPress > 3)
						dPress = 0;
					break;

				// A Key
				case 65:
					if( firstperson )
					{
						camera.rotation.y += 90 * RAD;
					}

					dPress--;

					if(dPress < 0)
						dPress = 3;
					break;
		}
	}

	function toggleThirdPerson()
	{	
		scene.remove( camera )
		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.x = 0;
		camera.position.y = -80;
		camera.position.z = 100;
		camera.rotation.x = .674;
		camera.lookAt( scene.position );

		firstperson = false;
	}

	function toggleFirstPerson()
	{	
		scene.remove( camera )
		dPress = 0;
		setupCamera();

		firstperson = true;
	}

	window.onload = init;