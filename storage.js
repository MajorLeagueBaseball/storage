define(function( require, exports, module ) {
	"use strict"
	
	var namespace = 'storage-';

	var localObjects = {};
	var sessionObjects = {};

	var localExpirationDates = JSON.parse( localStorage.getItem(namespace+'storageModuleExpirationDates') || '{}' );
	var sessionExpirationDates = JSON.parse( sessionStorage.getItem(namespace+'storageModuleExpirationDates') || '{}' );
	
	// turn expiration dates into Dates.
	for (var key in localExpirationDates) {
		localExpirationDates[key] = new Date( localExpirationDates[key] );
	}
	for (var key in sessionExpirationDates) {
		sessionExpirationDates[key] = new Date( sessionExpirationDates[key] );
	}

	// removeds a key from storage
	function expire( key, expirationObject, activeObjects, storageMethod ) {
		storageMethod.removeItem(key);
		delete expirationObject[key];
		delete activeObjects[key];
	}

	// checks expiration objects for expired data
	function checkExpirations( expirationObject, activeObjects, storageMethod ) {
		var now = new Date();
		for (var key in expirationObject) {
			if (localExpirationDates[key] < now) {
				expire( key, expirationObject, activeObjects, storageMethod );
			}
		}
	}

	function get( key, expirationDateFromGet, expirationObject, activeObjects, storageMethod ) {
		key = namespace+key;

		if (expirationDateFromGet) {
			expirationDateFromGet = new Date(expirationDateFromGet)
		}

		if (!activeObjects[key]) {
			if (!expirationObject[key]) {
				activeObjects[key] = {};
			} else {
				activeObjects[key] = JSON.parse(storageMethod.getItem(key)) || {};
			}
			// extend storage object with save function
			activeObjects[key].save = function save( expirationDate ) {
				
				if (!expirationDate && expirationDateFromGet) {
					expirationDate = expirationDateFromGet;
				} else if (!expirationDate) {
					expirationDate = new Date().getTime() + (1000 * 60 * 60 * 24 * 365);
				}

				if (new Date() < expirationDate) {
					delete activeObjects[key].save;
					expirationObject[key] = expirationDate;
					storageMethod.setItem( namespace+'storageModuleExpirationDates', JSON.stringify(expirationObject) )
					storageMethod.setItem(key, JSON.stringify(activeObjects[key]));
					activeObjects[key].save = save;
				} else {
					expire( key, expirationObject, activeObjects, storageMethod );
				}
			};
		}

		return activeObjects[key];
	}

	checkExpirations( localExpirationDates, localObjects, localStorage );
	checkExpirations( sessionExpirationDates, sessionObjects, sessionStorage );

	exports.get = function( key, expirationDate ) {
		return get( key, expirationDate, localExpirationDates, localObjects, localStorage );
	};

	exports.getSession = function( key, expirationDate ) {
		return get( key, expirationDate, sessionExpirationDates, sessionObjects, sessionStorage );
	};

});