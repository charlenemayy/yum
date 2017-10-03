	var renderer, rendererHUD;
	var scene;
	var controls;
	var camera, cameraHUD;
	var spotLight, spotlight2, ambientlight;

	var point = [];
	const RAD = Math.PI / 180;


	function init()
	{	
		// Physics
		Physijs.scripts.worker = 'libs/physijs_worker.js';
		Physijs.scripts.ammo = 'ammo.js';

		scene = new Physijs.Scene();
		scene.setGravity(new THREE.Vector3( 0, 0, -30 ));

		sceneHUD = new THREE.Scene();

		// Initial setup
		setupCamera();
		setupRenderer();
		addSpotLight();
		loadSounds();

		setupHUDCamera();
		setupHUDRenderer();
		addHUDSpotLight();

		// Additional setup
		createPlane();
		createBoundingWalls();
		createMaze();
		createPlayer();
		createOpponents();
		createPellets();
		createHUDScoreBoard();

		// Main Renderer
		var container = document.getElementById( "mainView" );
		container.appendChild( renderer.domElement );

		// HUD Renderer
		var containerHUD = document.getElementById( "HUDView" );
		containerHUD.appendChild( rendererHUD.domElement );

		document.addEventListener( 'keydown', onKeyDown, false );

		render();
	}

	function render()
	{	
		maintainPlayer();
		maintainOpponents();
		scene.simulate();		

		requestAnimationFrame( render );
		renderer.render( scene, camera );
		rendererHUD.render( sceneHUD, cameraHUD );
	}

	function setupCamera()
	{
		camera = new THREE.PerspectiveCamera( 5, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.x = 0;
		camera.position.y = -52;
		camera.position.z = 3;
		camera.rotation.x = 89 * RAD;
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

        ambientlight = new THREE.AmbientLight(0xbababa);
        scene.add(ambientlight);
	}

	function setupHUDCamera()
	{
		cameraHUD = new THREE.PerspectiveCamera(10, window.innerWidth / 100, 0.1, 4000); // ca, ar
		cameraHUD.position.y = -31;
		cameraHUD.lookAt( new THREE.Vector3(0,0,0) );
	}

	function setupHUDRenderer()
	{
		rendererHUD = new THREE.WebGLRenderer();
		rendererHUD.setClearColor( 0xBABABA, 0 );
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

	var scoreValue;
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

	    var score = new THREE.Mesh( geo, mat );

	    score.position.set(.3, 0, 23.3);
	    score.rotation.x = 90 * RAD;
	    score.rotation.z = 270 * RAD;
	    sceneHUD.add( score );

	   	scoreValue = 0;

	    updateScoreBoard(scoreValue);
	}

	var scoreMesh;
	function updateScoreBoard( scoreValue )
	{
		if(scoreMesh != null)	
			sceneHUD.remove(scoreMesh);

		// Update scores
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

	    scoreMesh.position.set(-2, 0, 21.5);
	    scoreMesh.rotation.x = 90 * RAD;
	    scoreMesh.rotation.z = 270 * RAD;

	    sceneHUD.add( scoreMesh );
	}

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
		var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color:'blue', shading: THREE.FlatShading}), .95, 0 );
		
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

	const MARGIN = 4;
	const NUMWALLS = 0;
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
			var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color:'white', shading: THREE.FlatShading}), .95, 0 );
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
		        color: 0x95d5ed,
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );


		player = new Physijs.SphereMesh( geo, mat );
    	player.addEventListener( 'collision', checkCollision);

		player.position.set(0, 0, 2);
		player.name = "Player";
		scene.add( player );
	}

	const NUMENEMIES = 4;
	var opponentList, collision, directionList, time;
	function createOpponents()
	{	
		opponentList = [];
		directionList = [];
		collision = false;
		time = 120;

		var geo = new THREE.TetrahedronGeometry( 1, 1 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 'purple',
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );

		for(var i = 0; i < NUMENEMIES; i++)
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

	const NUMPELLETS = 100;
	var pelletList;
	function createPellets()
	{
		pelletList = [];

		var geo = new THREE.TetrahedronGeometry( .7, 0 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 'purple',
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

	function generateParameters( lowerBound, upperBound )
	{	
		return Math.floor( Math.random() * ( upperBound - lowerBound + 1 )) + lowerBound;
	}

	function generateSpacedParameters( lowerBound, upperBound, margin )
	{	
		var n = Math.floor(( Math.floor( Math.random() * ( upperBound - lowerBound + 1 )) + lowerBound) / margin ) * margin;

		if(n < lowerBound)
			n = lowerBound;

		return n;
	}

	const PLAYERSPEED = .2;
	function maintainPlayer()
	{	
		player.__dirtyPosition = true;
		player.__dirtyRotation = true;

		player.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    	player.setAngularVelocity(new THREE.Vector3(0, 0, 0));

    	if(firstperson)
    	{
			if( dPress == 0 ){
				camera.position.x = player.position.x;
				camera.position.y = player.position.y - 52;
				camera.rotation.x = 89 * RAD;
			}
			else if( dPress == 1 ){
				camera.position.x = player.position.x - 52;
				camera.position.y = player.position.y;
			}
			else if( dPress == 2 ){
				camera.position.x = player.position.x;
				camera.position.y = player.position.y + 52;
				camera.rotation.x = 91 * RAD;
			}
			else if( dPress == 3 ){
				camera.position.x = player.position.x + 52;
				camera.position.y = player.position.y;
			}

			// Up/Down
			if( Key.isDown(Key.W))
			{	
				if( dPress == 0)
					player.position.y += PLAYERSPEED;
				if( dPress == 2)
					player.position.y -= PLAYERSPEED;
			}
			else if( Key.isDown(Key.S))
			{
				if( dPress == 0)
					player.position.y -= PLAYERSPEED;
				if( dPress == 2)
					player.position.y += PLAYERSPEED;
			}
		}
	}

	const OPPONENTSPEED = .1;
	var counter = 0;
	var time = 120;
	function maintainOpponents()
	{	
		for(var i = 0; i < NUMENEMIES; i++)
		{	
			opponentList[i].__dirtyPosition = true;
			opponentList[i].__dirtyRotation = true;

			opponentList[i].setLinearVelocity(new THREE.Vector3(0, 0, 0));
	    	opponentList[i].setAngularVelocity(new THREE.Vector3(0, 0, 0));

	    	// Generate new direction every couple of frames
	    	if(counter % 300 == 0)
	    		if(generateParameters(0, 1))
					switchDirection( i );

	    	// Store current location
	    	if(counter % 60 == 0)
	    	{	
	    		//console.log('store' + counter);
	    		var time = counter + 59;
	    		var prevx = opponentList[i].position.x;
	    		var prevy = opponentList[i].position.y;
	    	}

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

	    	if(counter == time)
	    	{	
	    		console.log('check' + counter)
		    	// Compare movement to check if stuck
		    	if( directionList[i] == 1 || directionList[i] == 2 )
		    	{	
		    		if(( opponentList[i].position.y - prevy ) < OPPONENTSPEED )
		    			console.log('nonmoving')
		    	}
		    	else
		    	{	
		    		if(( opponentList[i].position.x - prevx ) < OPPONENTSPEED )
		    			console.log('nonmoving')
		    	}
		    }
		}

		counter++;
	}

	function switchDirection( index )
	{	
		var previous = directionList[index];

		while(directionList[index] == previous)
			directionList[index] = generateParameters( 1, 4 );

		//console.log('Switching index ' + index + ' from ' + previous + ' to ' + directionList[index]);
	}

	function checkCollision( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Opponent' )
			console.log('GAME OVER')
		else if( other_object.name == 'Pellet' )
		{
			scene.remove(other_object);
			updateScoreBoard( ++scoreValue );
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
						camera.rotation.y += 90 * RAD;

					dPress++; // Stores direction value

					if(dPress > 3)
						dPress = 0;
					break;

				// A Key
				case 65:
					if( firstperson )
						camera.rotation.y -= 90 * RAD;

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
		console.log(camera.position)
		console.log(camera.rotation)

		firstperson = false;
	}

	function toggleFirstPerson()
	{	
		scene.remove( camera )
		setupCamera();

		firstperson = true;
	}

	var explode, one, two, three, four, five;
	function loadSounds()
	{
		explode = new Audio("sounds/shotgun.mp3");
		music = new Audio("sounds/train station_12.mp3")

		music.addEventListener('ended', function() 
		{
			this.currentTime = 0;
			this.play();
		}, false);

		music.volume = .3;
		//music.play();
	}

	window.onload = init;