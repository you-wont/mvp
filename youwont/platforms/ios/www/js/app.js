var youwont = angular.module('youwont', ['ionic', 'ngCordova', 'youwont.controllers', 'youwont.factory', 'youwont.services', 'FacebookLogin', 'Challenges']);

youwont.config(function ($stateProvider, $urlRouterProvider, $compileProvider) {

  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|data):/);

  $urlRouterProvider.otherwise("/");

  $stateProvider
    .state('home', {
      url : "/",
      templateUrl: 'templates/challenge.html',
      controller: "challengeCtrl",
      onEnter: function($state,authLogin){
        if (!authLogin.checkState()){
          $state.go('login')
        }
      }
    })
    .state('responses', {
      url : "/responses",
      templateUrl: 'templates/responses.html',
      controller: "responsesCtrl",
      onEnter: function($state,authLogin){
        if (!authLogin.checkState()){
          $state.go('login')
        }
      }
    })
    .state('response', {
      url : "/response/:id",
      templateUrl: 'templates/response.html',
      controller: "responseCtrl",
      onEnter: function($state,authLogin){
        if (!authLogin.checkState()){
          $state.go('login')
        }
      }
    })
    .state('video', {
      url : "/video",
      templateUrl: 'templates/video.html',
      controller: "videoCtrl",
      onEnter: function($state,authLogin){
        if (!authLogin.checkState()){
          $state.go('login')
        }
      }
    })
     .state('friends', {
      url : "/friends",
      templateUrl: 'templates/friends.html',
      controller: "friendsCtrl",
      onEnter: function($state,authLogin){
        console.log("trying to display friends")
        if (!authLogin.checkState()){
          $state.go('home')
        }
      }
      
    })
    .state('login', {
      url : "/login",
      templateUrl: 'templates/login.html',
      controller: "loginCtrl",
      onEnter: function($state,authLogin){
        if (authLogin.checkState()){
          $state.go('home')
        }
      }
      
    });


});

youwont.run(function($ionicPlatform, $rootScope, authLogin, $state) {

  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      StatusBar.hide();
      ionic.Platform.fullScreen();
    }

    $rootScope.$on('$stateChangeStart',function(event, toState, toParams, fromState, fromParams) {
      if (toState.name !== 'login' && !authLogin.checkState()){
        console.log('prevention')
          $state.go('login')
          event.preventDefault();
      }

      if (toState.name === 'login' && authLogin.checkState()){
          $state.go('home');
          event.preventDefault();
      }

    });

  });

});