require(["StartClient"],(sc)=>{ //Load StartClient modules.
	let modulesImported = Object.keys(require.s.contexts._.registry);
	let modulesToLoad = [];

	for (let a of modulesImported) { //Index imported modules.
		if (a != "StartServer" && !a.startsWith("Server") && !a.startsWith("_")){ //Prevent server modules from being loaded as well as weird modules.
			modulesToLoad.push(a);
		}
	}

	require(modulesToLoad,()=>{ //Load all other modules.
		window.globalThis.dgclient = sc.StartClient("gamecontainer");
	});
});
