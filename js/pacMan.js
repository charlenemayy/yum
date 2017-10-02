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
		setupHUDCamera();
		setupRenderer();
		setupHUDRenderer();
		addSpotLight();
		loadSounds();

		// Additional setup
		createPlane();
		createBoundingWalls();
		createMaze();
		createPlayer();
		createOpponents();
		//createPellets();

		// Main Renderer
		var container = document.getElementById( "mainView" );
		container.appendChild( renderer.domElement );

		// HUD Renderer
		var containerHUD = document.getElementById( "HUDView" );
		containerHUD.appendChild( rendererHUD.domElement );

		//document.addEventListener( 'keydown', onKeyDown, false );

		render();
	}

	function render()
	{	
		maintainPlayer();
		//maintainOpponents();

		scene.simulate();		

		requestAnimationFrame( render );
		renderer.render( scene, camera );
		rendererHUD.render( sceneHUD, cameraHUD );
	}

	function setupCamera()
	{
		// Camera
		camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
		camera.position.x = 0;
		camera.position.y = -100;
		camera.position.z = 100;
		camera.lookAt( scene.position );
	}

	function setupHUDCamera()
	{
		cameraHUD = new THREE.PerspectiveCamera(10, window.innerWidth / 100, 0.1, 4000); // ca, ar
		cameraHUD.position.y = 41;
		cameraHUD.lookAt( new THREE.Vector3(0,0,0) );
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

	function setupHUDRenderer()
	{
		rendererHUD = new THREE.WebGLRenderer();
		rendererHUD.setClearColor( 0x000000, 0 );
		rendererHUD.setSize( window.innerWidth, 100 ); // r.width, r.height
		rendererHUD.shadowMapEnabled = true;

		rendererHUD.enableScissorTest(true);
		rendererHUD.setViewport( 0, 0, window.innerWidth, 100 );
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
		var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color:'blue', shading: THREE.FlatShading}), .95, .95 );
		
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
	const NUMWALLS = 5;
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
				sizeList[i][1] = generateParameters( 5, 30 );

				positionList[i][0] = generateSpacedParameters( -49 + MARGIN, 49 - MARGIN, MARGIN );
				positionList[i][1] = generateSpacedParameters( -50 + ( sizeList[i][1] / 2 ), 50 - ( sizeList[i][1] / 2 ), 4 );
			}
			// Modify x length; y = 2;
			else
			{
				sizeList[i][0] = generateParameters( 5, 30 );	
				sizeList[i][1] = 2;

				positionList[i][0] = generateSpacedParameters( -50 + ( sizeList[i][0] / 2 ), 50 - ( sizeList[i][0] / 2 ), 4 );
				positionList[i][1] = generateSpacedParameters( -49 + MARGIN, 49 - MARGIN, MARGIN );
			}

			// Create wall
			var geo = new THREE.BoxGeometry( sizeList[i][0], sizeList[i][1], 8 );
			var mat = Physijs.createMaterial( new THREE.MeshPhongMaterial({color:'white', shading: THREE.FlatShading}), .95, .95 );
			var wall = new Physijs.BoxMesh( geo, mat, 0 );
			wall.name = 'Wall';

			// Choose position
			wall.position.set( positionList[i][0], positionList[i][1], 4 );

			// DEBUG: Log sizes + position
			
			/*console.log('WALL ' + i + ':');
			console.log(vertical);
			console.log(sizeList[i]);
			console.log(positionList[i]);*/

			wallList.push( wall );
			scene.add( wall );
		}
	}

	var player;
	function createPlayer()
	{	
		var geo = new THREE.TetrahedronGeometry( 2, 2 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 0x95d5ed,
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );


		player = new Physijs.SphereMesh( geo, mat );
    	player.addEventListener( 'collision', checkCollision);
		// No physics
		/*var mat = new THREE.MeshPhongMaterial({
		        color: 0x95d5ed,
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    });
		player = new THREE.Mesh( geo, mat );
		*/

		player.position.set(0, 0, 2);
		scene.add( player );
	}

	const NUMENEMIES = 4;
	var opponentList;
	function createOpponents()
	{	
		opponentList = [];

		var geo = new THREE.TetrahedronGeometry( 2, 1 );
		var mat =  new Physijs.createMaterial( new THREE.MeshPhongMaterial({
		        color: 'purple',
		        shading: THREE.FlatShading ,
		        metalness: 0,
		        roughness: 0.8,
		    }), 0, 0 );

		for(var i = 0; i < NUMENEMIES; i++)
		{
			var opponent = new Physijs.SphereMesh( geo, mat, 0 );
			var x = generateParameters(-49, 49);
			var y = generateParameters(-49, 49);

			opponent.position.set(x, y, 2);
			scene.add(opponent);
    		opponent.addEventListener( 'collision', checkOpponentCollision);

			opponentList.push(opponent);
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



		// Up/Down
		if( Key.isDown(Key.W))
		{
			player.position.y += PLAYERSPEED;
		}
		else if( Key.isDown(Key.S))
		{
			player.position.y -= PLAYERSPEED;
		}
		// Left/Right
		else if( Key.isDown(Key.A))
		{
			player.position.x -= PLAYERSPEED;
		}
			
		else if( Key.isDown(Key.D))
		{
			player.position.x += PLAYERSPEED;
		}
	}

	const OPPONENTSPEED = .1;
	function maintainOpponents()
	{	
		for(var i = 0; i < NUMENEMIES; i++)
		{
			opponentList[i].__dirtyPosition = true;
			opponentList[i].__dirtyRotation = true;

			opponentList[i].setLinearVelocity(new THREE.Vector3(0, 0, 0));
	    	opponentList[i].setAngularVelocity(new THREE.Vector3(0, 0, 0));

			// Move vertically first
			// if( !collision )
			if( opponentList[i].position.x < player.position.x )
				opponentList[i].position.x += OPPONENTSPEED;
			else
				opponentList[i].position.x -= OPPONENTSPEED;

			// if( collision )
			if( opponentList[i].position.y < player.position.y )
				opponentList[i].position.y += OPPONENTSPEED;
			else
				opponentList[i].position.y -= OPPONENTSPEED;

			// Check for collisions
			//opponentList[i].addEventListener( 'collision', checkCollision);
		}
	}

	function checkCollision( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
			console.log('hitme');
		}
	}

	function checkOpponentCollision( other_object, linear_velocity, angular_velocity )
	{
		if( other_object.name == 'Wall' )
		{
			
		}
	}

	var press = 0, firstperson;
	function onKeyDown( event )
	{	
		switch( event.keyCode )
		{
				case 16: 
				if(press % 2 == 0)
					toggleFirstPerson();
				else
					toggleThirdPerson();

				press++;

				break;
		}
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