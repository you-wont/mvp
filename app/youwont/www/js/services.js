angular.module('youwont.services', ['Challenges'])
  .service('VideoService', function($q) {

    var deferred = $q.defer();
    var promise = deferred.promise;

    promise.success = function(fn) {
      promise.then(fn);
      return promise;
    }

    promise.error = function(fn) {
      promise.then(null, fn);
      return promise;
    }

    // Resolve the URL to the local file
    // Start the copy process
    function createFileEntry(fileURI) {
      window.resolveLocalFileSystemURL(fileURI, function(entry) {
        return copyFile(entry);
      }, fail);
    }

    // Create a unique name for the videofile
    // Copy the recorded video to the app dir
    function copyFile(fileEntry) {

      var name = fileEntry.fullPath.substr(fileEntry.fullPath.lastIndexOf('/') + 1);
      var newName = makeid() + name;

      window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function(fileSystem2) {
        fileEntry.copyTo(fileSystem2, newName, function(succ) {
          return onCopySuccess(succ);
        }, fail);
      }, fail);

    }

    // Called on successful copy process
    // Creates a thumbnail from the movie
    // The name is the moviename but with .png instead of .mov
    function onCopySuccess(entry) {
      var name = entry.nativeURL.slice(0, -4);
      window.PKVideoThumbnail.createThumbnail(entry.nativeURL, name + '.png', function(prevSucc) {
        return prevImageSuccess(prevSucc);
      }, fail);
    }

    // Called on thumbnail creation success
    // Generates the correct URL to the local moviefile
    // Finally resolves the promies and returns the name
    function prevImageSuccess(succ) {
      var correctUrl = succ.slice(0, -4);
      correctUrl += '.MOV';
      deferred.resolve(correctUrl);
    }

    // Called when anything fails
    // Rejects the promise with an Error
    function fail(error) {
      console.log('FAIL: ' + error.code);
      deferred.reject('ERROR');
    }

    // Function to make a unique filename
    function makeid() {
      var text = '';
      var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      for (var i = 0; i < 5; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }

    // The object and functions returned from the Service
    return {
      // This is the initial function we call from our controller
      // Gets the videoData and calls the first service function
      // with the local URL of the video and returns the promise
      saveVideo: function(data) {
        createFileEntry(data[0].localURL);
        return promise;
      }
    }

  })
  .service("DatabaseService", function($cordovaFile, challenges) {

    var db = {};
    db.ref = new Firebase("https://sayiwont.firebaseio.com/");

    function getBase64FromFile(file, callback) {
      window.resolveLocalFileSystemURL(file,
        // success callback; generates the FileEntry object needed to convert to Base64 string
        function (fileEntry) {
            // convert to Base64 string
            function win(file) {
              var reader = new FileReader();
              reader.onloadend = function (evt) {
                callback(evt.target.result); // this is the Base64 string
              };
              reader.readAsDataURL(file);
            };
            var fail = function (evt) { };
            fileEntry.file(win, fail);
        },
        // error callback
        function () {
          console.log("error");
        }
      );
    }

    db.addNewUser = function(userName, userProfilePicture, facebookID, uid) {
      //Adding new user to our database 
      var ref = new Firebase("https://sayiwont.firebaseio.com/");    
      if (userName && userProfilePicture && facebookID && uid) {     
        ref.child("users").child(uid).set({            
          id: facebookID,
          name: userName,
          profilePicture: userProfilePicture,
          friends: { "Mark Robson" :{id:"10153502325756226",name:"Mark Robson"}},
          challenges: []
        });    
      }
    };

    db.addNewChallenge = function(challenge) {

      var currentUser = db.ref.getAuth().uid;
      var obj = {};
      db.ref = new Firebase("https://sayiwont.firebaseio.com/challenges/");
      db.getFriends(function(friendsList){
        if (challenge && challenge.title && challenge.description){
          challenge['friends'] = friendsList;

          obj[challenge.id] = challenge;
          getBase64FromFile(challenge.clip, function (data) {
            challenge.clip = data;
            getBase64FromFile(challenge.img, function (data) {
              challenge.img = data;
              db.ref.child(currentUser).set(obj);
            });
          });

          db.addToFriendsChallenges(friendsList,challenge);

        } else {
          console.error('addNewChallenge is missing params')
        }
      })
      
    };

    db.addNewResponse = function(response) {

      var currentUser = db.ref.getAuth().uid;
      var obj = {};
      db.ref = new Firebase("https://sayiwont.firebaseio.com/challenges/" + currentUser + "/" + response.challengeId + "/responses");

      if (response && response.title && response.description){
        obj[response.id] = response;
        getBase64FromFile(response.clip, function (data) {
          response.clip = data;
          getBase64FromFile(response.img, function (data) {
            response.img = data;
            db.ref.set(obj);
          });
        });

      } else {
        console.error('addNewResponse is missing params')
      }
    
    };

    db.addFriend = function(friend,callback) {
      var currentUser = db.ref.getAuth().uid;
      var ref = new Firebase("https://sayiwont.firebaseio.com/users/"+currentUser+"/friends");
      if (friend){
        var friendObject = {
          id: friend.id,
          name: friend.name,
          profilePicture: friend.profilePicture
        }
        ref.child(friendObject.id).set(friendObject);
      }
    }

    db.getFriends = function(callback){
      var ref = new Firebase("https://sayiwont.firebaseio.com/users")
      var friends = [];
      
      ref.orderByKey().on("child_added", function(snapshot) {
     
        friends.push(snapshot.val());
        if (callback){
          callback(friends)
        }
      });

    }

    db.addToFriendsChallenges = function(friendsList, challenge){
      //loop through that users list of friends and add that challenge to their challenges list
      for (var i = 0; i <friendsList.length; i++){
        if (challenge){
          console.dir(friendsList[i].id)
          var ref = new Firebase("https://sayiwont.firebaseio.com/users/");
          ref.child("facebook:"+friendsList[i].id).child('challenges').set(challenge);
        }
      }
    }

    db.updateUserChallenges = function(callback){
      var currentUser = db.ref.getAuth().uid;
      var ref = new Firebase("https://sayiwont.firebaseio.com/users/"+currentUser+"/");
      ref.orderByChild('challenges').on('value', function(snapshot) {
        if(snapshot.val().id){
          db.getChallenges(snapshot.val().challenges);
        }
      });
    }

    db.addResponseToChallenge = function(userID,currentChallengeID,response){
      if (userID && currentChallengeID && response){
        var ref = new Firebase("https://sayiwont.firebaseio.com/challenges/");
        ref.child(userID).child(currentChallengeID).child('responses').set(response);
      }
    }

    db.getChallenges = function () {
      console.log("in getChallenges", challenges);
      var currentUser = db.ref.getAuth().uid;
      var ref = new Firebase("https://sayiwont.firebaseio.com/challenges/"+currentUser+"/");
      ref.on('value', function(snapshot) {
        angular.forEach(snapshot.val(), function (challenge) {
          challenges[challenge.id] = challenge;
        });
      });
    }

    db.getUserByID = function(userID){
      var ref = new Firebase("https://sayiwont.firebaseio.com/users/"+userID + "/");
      ref.on('value',function(snapshot){
       
        return snapshot.val();
      });
    }

    db.getResponsesForChallenge = function(challengeID,userID,callback){
      var ref = new Firebase("https://sayiwont.firebaseio.com/challenges");
      ref.child(userID).child(challengeID).child('responses').on('value',function(snapshot){
          callback(snapshot.val())
          console.dir(snapshot.val())

          
      })

    }

    return db;
  });