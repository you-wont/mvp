var youwontFactory = angular.module('youwont.factory', ['youwont.services']);
//Facebook OAuth Login Factory
var facebookLoginFactory = angular.module('FacebookLogin', []);
facebookLoginFactory.factory('authLogin', function($state, DatabaseService) {
  //URL to the sayiwont Firebase DB
  var appURL = "https://sayiwont.firebaseio.com";
  // var appURL = "http://10.6.28.140:8100/#/login";
  var login = {};

  //track current logged in user
  login.loggedInUser = null;

  //reference to our Firebase DB
  login.ref = new Firebase(appURL);
  //function to perform OAuth login with FB
  login.logUserIn = function() {
   
    login.ref.authWithOAuthPopup("facebook", function(error, authData) {
        
      if (error) {
        console.log("Login Failed!", error);
      } else {
        
        //set to auth to give us all the properties of the auth data
        
        //user is successfully logged in and routed to the home page
        //we are adding the user to our database by calling addNewUser()
        var facebookID = authData['facebook']['id'];
        var userName = authData['facebook']['displayName'];
        var userProfilePicture = authData['facebook']['profileImageURL'];
        var uid = authData.uid;
        DatabaseService.addNewUser(userName, userProfilePicture, facebookID, uid);
        // console.log("Authenticated successfully with payload:", authData);
       
        $state.go('home')
      
      }
    });
  }
	
	login.logout = function(){
		//routes to the login page and unauthorizes the user
    
		login.ref.unauth();
		console.log('USER LOGGED OUT' + login.checkState())
    login.loggedInUser = null;
		$state.go('login');
	}

	login.checkState = function(){
		//get auth status
		var isLoggedIn = false;
		var authData = login.ref.getAuth();
		
		if (authData){
			isLoggedIn = true;
		} else {
			isLoggedIn = false;
		}
		return isLoggedIn
	};
	return login;
});

//Factory to share challenges and responses
var challengesFactory = angular.module('Challenges', []);
challengesFactory.factory('challenges', function () {
	var challenges = {};
  
	return challenges;
});

var friendsFactory = angular.module('Friends', ['localStorageFactory']);
friendsFactory.factory('friends', function ($localstorage) {
  var friends = $localstorage.get('friends') || [];
  return friends;
});

var localStorageFactory = angular.module('ionic.utils', []);
localStorageFactory.factory('$localstorage', ['$window', function($window) {
  return {
    set: function(key, value) {
      $window.localStorage[key] = value;
    },
    get: function(key, defaultValue) {
      return $window.localStorage[key] || defaultValue;
    },
    setObject: function(key, value) {
      $window.localStorage[key] = JSON.stringify(value);
    },
    getObject: function(key) {
      return JSON.parse($window.localStorage[key] || '{}');
    }
  }
}]);