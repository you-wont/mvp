var youwontController = angular.module('youwont.controllers', ['FacebookLogin', 'Challenges', 'ngCordova','youwont.services']);

youwontController.controller('challengeCtrl', function ($scope, challenges, DatabaseService, $sce) {
  $scope.challenges = challenges;

  //TODO: add this as a directive - duplicated below
  $scope.getVideo = function (clip) {
    if (clip.match("data:")) {
      return $sce.trustAsResourceUrl(clip);
    } else {
      return clip;
    }
  }

  DatabaseService.updateUserChallenges();

});

youwontController.controller('responsesCtrl', function ($scope, challenges,DatabaseService) {

  $scope.challenges = challenges;
  
});

youwontController.controller('responseCtrl', function ($scope, $state, $stateParams, challenges, $sce) {

  $scope.challenge = null;

  angular.forEach(challenges, function (value, key) {
    if ($stateParams.id === value.id) {
      $scope.challenge = value;
    }
  });

  //TODO: add this as a directive
  $scope.getVideo = function (clip) {
    if (clip.match("data:")) {
      return $sce.trustAsResourceUrl(clip);
    } else {
      console.log("video url");
      return clip;
    }
  }

  $scope.respond = function(id) {
    $state.go('respond', { id : id });
  }

});

youwontController.controller('loginCtrl', function ($scope, authLogin) {
  $scope.logout = authLogin.logout;
  $scope.getAuthState = authLogin.checkState;
  $scope.login = authLogin.logUserIn;0
});

youwontController.controller('friendsCtrl', function ($scope, authLogin, DatabaseService) {
    DatabaseService.getFriends(function(friends){
      $scope.friends = friends;
    });
   $scope.addFriend = DatabaseService.addFriend;
});

youwontController.controller('respondCtrl', function ($scope, challenges, $ionicPlatform, $state, $cordovaCamera, $cordovaCapture, VideoService, DatabaseService, authLogin, $stateParams) {

  $scope.response = {
    challengeId : $stateParams.id
  };
  reset();

  //helper function to reset challenges
  function reset() {
    $scope.response.clip = null;
    $scope.response.status = '';
    $scope.response.userID = authLogin.ref.getAuth().uid;
    $scope.response.img = '';
    $scope.response.title = '';
    $scope.response.description = '';
  }

  function createId(clipUrl) {
    return clipUrl.substr(clipUrl.lastIndexOf('/') + 1).slice(0, -4);
  }

  $scope.captureVideo = function() {

    var options = { 
      limit: 3, 
      duration: 15
    };

    $ionicPlatform.ready(function() { //wrapper to ensure device is ready
      $cordovaCapture
        .captureVideo(options).then(function(videoData) {
            VideoService.saveVideo(videoData)
            .success(function(data) {
                //create unique id for video/challenge
                $scope.response.id = createId(data);
                //data is the path on the local file system
                $scope.response.clip = data;
                //create a png thumb for video and return local path
                $scope.response.img = $scope.generateThumb(data);
                $scope.$apply();
              }).error(function(data) {
                console.log("Error creating video file");
              });
          }, function(err) {
            $scope.response.status = err.message;
          });
    }); //wrapper

  };

  $scope.generateThumb = function(clipUrl) {
    var name = clipUrl.substr(clipUrl.lastIndexOf('/') + 1);
    var trueOrigin = cordova.file.dataDirectory + name;
    var sliced = trueOrigin.slice(0, -4);
    return sliced + '.png';
  }

  $scope.save = function () {
    var newResponse;
    if ($scope.response.img && $scope.response.clip) {
      //create a copy
      if (!challenges[$scope.response.challengeId].responses) {
        challenges[$scope.response.challengeId].responses = {};
      }
      challenges[$scope.response.challengeId].responses[$scope.response.id] = angular.copy($scope.response);
      //create another copy for the server
      newResponse = angular.copy($scope.response);
      DatabaseService.addNewResponse(newResponse);
      //reset previous
      reset();
    } //else notify user
  };

});

youwontController.controller('videoCtrl', function ($scope, challenges, $ionicPlatform, $state, $cordovaCamera, $cordovaCapture, VideoService, DatabaseService, authLogin) {

  $scope.challenge = {};
  reset();

  //helper function to reset challenges
  function reset() {
    $scope.challenge.clip = null;
    $scope.challenge.status = '';
    $scope.challenge.userID = authLogin.ref.getAuth().uid;
    $scope.challenge.img = '';
    $scope.challenge.title = '';
    $scope.challenge.description = '';
  }

  function createId(clipUrl) {
    return clipUrl.substr(clipUrl.lastIndexOf('/') + 1).slice(0, -4);
  }

  $scope.captureVideo = function() {

    var options = { 
      limit: 3, 
      duration: 15
    };

    $ionicPlatform.ready(function() { //wrapper to ensure device is ready
      $cordovaCapture
        .captureVideo(options).then(function(videoData) {
            VideoService.saveVideo(videoData)
            .success(function(data) {
                //create unique id for video/challenge
                $scope.challenge.id = createId(data);
                //data is the path on the local file system
                $scope.challenge.clip = data;
                //create a png thumb for video and return local path
                $scope.challenge.img = $scope.generateThumb(data);
                $scope.$apply();
              }).error(function(data) {
                console.log("Error creating video file");
              });
          }, function(err) {
            $scope.challenge.status = err.message;
          });
    }); //wrapper

  };

  $scope.generateThumb = function(clipUrl) {
    var name = clipUrl.substr(clipUrl.lastIndexOf('/') + 1);
    var trueOrigin = cordova.file.dataDirectory + name;
    var sliced = trueOrigin.slice(0, -4);
    return sliced + '.png';
  }

  $scope.save = function () {
    var newChallenge;
    if ($scope.challenge.img && $scope.challenge.clip) {
      //create a copy
      challenges.push(angular.copy($scope.challenge));
      //create another copy for the server
      newChallenge = angular.copy($scope.challenge);
      DatabaseService.addNewChallenge(newChallenge);
      //reset previous
      reset();
    } //else notify user
  };

});