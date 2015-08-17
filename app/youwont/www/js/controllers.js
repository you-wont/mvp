var youwontController = angular.module('youwont.controllers', ['FacebookLogin', 'Challenges', 'ngCordova','youwont.services']);

youwontController.controller('challengeCtrl', function ($scope, challenges, DatabaseService, $sce) {
  $scope.challenges = challenges;
  $scope.getVideo = function (clip) {
    if (clip.match("data:")) {
      console.log("is base64 data");
      return $sce.trustAsResourceUrl(clip);
    } else {
      console.log("video url");
      return clip;
    }
  }
  DatabaseService.updateUserChallenges();
});

youwontController.controller('responsesCtrl', function ($scope, challenges) {
  $scope.challenges = challenges;
});

youwontController.controller('responseCtrl', function ($scope, $stateParams, challenges, $sce) {

  $scope.challenge = null;

  angular.forEach(challenges, function (value, key) {
    if ($stateParams.id === value.id) {
      console.log("Got something", value);
      $scope.challenge = value;
    }
  });

  $scope.getVideo = function (clip) {
    if (clip.match("data:")) {
      console.log("is base64 data");
      return $sce.trustAsResourceUrl(clip);
    } else {
      console.log("video url");
      return clip;
    }
  }

});

youwontController.controller('loginCtrl', function ($scope,authLogin) {
    $scope.logout = authLogin.logout;
    $scope.getAuthState = authLogin.checkState;
    $scope.login = authLogin.logUserIn;
});

youwontController.controller('friendsCtrl', function ($scope,authLogin,DatabaseService) {
    DatabaseService.getFriends(function(friends){
      $scope.friends = friends;
    });
   $scope.addFriend = DatabaseService.addFriend;
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