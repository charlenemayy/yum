	var rendererHUD;
	var sceneHUD;
	var cameraHUD;
	var spotLight;

	function init()
	{	
		sceneHUD = new THREE.Scene();

		// Initial setup
		setupHUDCamera();
		setupHUDRenderer();
		addSpotlight();

		// HUD Renderer
		var containerHUD = document.getElementById( "HUDView" );
		containerHUD.appendChild( rendererHUD.domElement );

		render();
	}

	function setupHUDCamera()
	{
		cameraHUD = new THREE.PerspectiveCamera(10, window.innerWidth / 100, 0.1, 4000); // ca, ar
		cameraHUD.position.y = 41;
		cameraHUD.lookAt( new THREE.Vector3(0,0,0) );
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

	function addSpotlight()
	{
		spotLight = new THREE.SpotLight( 0xffffff, 2, 200, 1);
        spotLight.position.set( 0, -150, 100 );
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 50;
        spotLight.castShadow = true;
        sceneHUD.add(spotLight);
	}

	function render()
	{	
		requestAnimationFrame( render );
		rendererHUD.render( sceneHUD, cameraHUD );
	}
