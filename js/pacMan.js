	var renderer, rendererHUD;
	var scene;
	var controls;
	var camera, cameraHUD;
	var spotLight;

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

		var barrelGeometry = new THREE.SphereGeometry( 3, 1, 1 );
		var barrelMaterial = new THREE.MeshLambertMaterial({
		        color: 'pink',
		        shading: THREE.FlatShading,
		        metalness: 0,
		        roughness: 0.8,
		    });

		var barrel = new THREE.Mesh( barrelGeometry, barrelMaterial );
		barrel.position.set( 0, 0, 0 );
		scene.add(barrel);

		// Initial setup
		setupCamera();
		setupHUDCamera();
		setupRenderer();
		setupHUDRenderer();
		addSpotLight();
		loadSounds();

		console.log(window.innerHeight);

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
		scene.simulate();		
		requestAnimationFrame( render );
		renderer.render( scene, camera );
		rendererHUD.render( sceneHUD, cameraHUD );
	}

	function setupCamera()
	{
		// Camera
		camera = new THREE.PerspectiveCamera(         				     
			10,											// field of view
			window.innerWidth / window.innerHeight, 	// aspect ratio
			0.1,                   			 			// frustum near plane
			1100);										// frustum far plane

		// Stationary Camera
		camera.position.set( -70, -100, 40 );
		camera.lookAt(scene.position);
		//camera.rotation.z = -10 * Math.PI / 180;
	}

	function setupHUDCamera()
	{
		cameraHUD = new THREE.PerspectiveCamera(10, window.innerWidth / 100, 0.1, 4000); // ca, ar
		cameraHUD.position.y = 41;
		cameraHUD.lookAt( new THREE.Vector3(0,0,0) );
	}

	function setupRenderer()
	{

		renderer = new THREE.WebGLRenderer({});
		renderer.setClearColor( 0xffffff, 0.0 );
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
		spotLight = new THREE.SpotLight( 0xffffff, 1.5 );
        spotLight.position.set( 0, -50, 8 );
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 50;
        spotLight.castShadow = true;
        scene.add(spotLight);

        spotLight2 = new THREE.SpotLight( 0xffffff, 1 );
        spotLight2.position.set( 0, 50, 8 );
        spotLight2.shadowCameraNear = 20;
        spotLight2.shadowCameraFar = 50;
        spotLight2.castShadow = true;
        scene.add(spotLight2);

       spotLight3 = new THREE.SpotLight( 0xffffff, 1.5 );
        spotLight3.position.set( 0, 50, 20 );
        spotLight3.rotation.x = Math.PI / 2;
        spotLight3.shadowCameraNear = 20;
        spotLight3.shadowCameraFar = 50;
        spotLight3.castShadow = true;
        scene.add( spotLight3 );
        scene.add( spotLight3.target );
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
		music.play();
	}

	window.onload = init;