var list1, list2, listLength, playingList, sound1, sound2, currentTime, pausedState;
var i = 0;
var k = 1;
var playPauseState = 0;

// -----======================================================CAHNGE HERE restaurant input field for FORM=========================================----
const projectFolderName = 'Sphere'
const placeUniqueName = 'Franky';
$("input[name=place]").val(placeUniqueName);
const placeFolderName = `play${placeUniqueName}`;

const playlists = {
  'Day list': 'tracksDay.txt',
  'Night list': 'tracksNight.txt'
}


//var for like/dislike func
var $formLike = $('form#formLike');
var $formDislike = $('form#formDislike');

//время начала проигрывания второго листа
const hourForPlayingList2 = 18;

$.ajax({
  // -----======================================================CAHNGE HERE restaurant path=========================================----
  url: `https://570427.selcdn.ru/${projectFolderName}/${placeFolderName}/${playlists['Day list']}`,
  contentType: "text/plain; charset=utf-8",
  cache: false,
  success: function (data) {
    //parsing tracks.txt
    list1 = data.split(/\r\n|\r|\n/g);
    
    for (var i = 0; i < list1.length; i++) {
      list1[i] = "https://570427.selcdn.ru/Sphere/musiclibrary/" + list1[i];
    }
    
    //list1 = tracksArray;
    playingList = list1;
    listLength = playingList.length;
    //console.log(list1);
    
    $.ajax({
      url: `https://570427.selcdn.ru/${projectFolderName}/${placeFolderName}/${playlists['Night list']}`,
      contentType: "text/plain; charset=utf-8",
      cache: false,
      success: function (data) {
        // -----======================================================CAHNGE HERE restaurant path=========================================----
        
        //parsing tracks2.txt
        list2 = data.split(/\r\n|\r|\n/g);
        
        for (var i = 0; i < list2.length; i++) {
          list2[i] = "https://570427.selcdn.ru/Sphere/musiclibrary/" + list2[i];
        }
        
        //list2 = tracksArray;
        //listLength = playingList.length;
        //console.log(list2);
        
        var currentTime = new Date;
        var currentHour = currentTime.getHours();
        
        //checking if time is for list1 or already for list2
        if (currentHour < hourForPlayingList2 && currentHour > 6) {
          playingList = list1;
          listLength = playingList.length;
          console.log("playing list is 1");
        } //else time is already for list 2
        else {
          playingList = list2;
          listLength = playingList.length;
          console.log("playing list is 2");
        }
        
        console.log("playing list is" + playingList);
        
        // shuffling 2 arrays
        shuffle(list1);
        shuffle(list2);
        //console.log("shuffled list1" + list1);
        //console.log("shuffled list2" + list2);
  
        animateHowlerPlayButton();
      },
      error: function () {
        // failed to load tracks2.txt
        console.log("failed to load tracks2.txt");
      }
      
    })
  },
  error: function () {
    // failed to load tracks.txt
    console.log("failed to load tracks.txt");
  }
});

function loadingSound1(i) {
  
  sound1 = new Howl({
    src: [playingList[i]],
    preload: true,
    html5: true,
    onend: function () {
      //console.log('i = ' + i + 'k = ' + k);
      sound2.play();

      sound1.off();
      sound1.unload();
      
      var currentTime = new Date;
      var currentHour = currentTime.getHours();
      
      //listLength = playingList.length;
      //checking if all list was played or not
      //if not all then
      if (currentHour < hourForPlayingList2 || playingList == list2) {
        if ((i == (playingList.length - 1)) || (i == (playingList.length - 2))) {
          //console.log("playingList.length= " + playingList.length);
          //console.log("i= " + i);
          //console.log('from start now');
          i = 0;
          loadingSound1(i);
        } else {
          i = i + 2;
          loadingSound1(i);
        }
      } //else change the playing list on next one and load tracks from there
      else if (currentHour >= hourForPlayingList2 && k != 0) {
        i = 0;
        playingList = list2;
        loadingSound1(i);
      } else {
        i = 1;
        playingList = list2;
        loadingSound1(i);
      }
  
      sendLikeDislikeIfScheduled();
    },
    onloaderror: function (e, msg) {
      console.log('onloaderrorrrr');
      console.log('Unable to load file: ' + playingList[i] + ' | error message : ' + msg);
      console.log('First argument error ' + e);
      
      sound1.off();
      
      setTimeout(function () {
        
        if ((i == (playingList.length - 1)) || (i == (playingList.length - 2))) {
          i = 0;
          loadingSound1(i);
        } else {
          i = i + 2;
          loadingSound1(i);
        }
        
      }, 3000);
      
    }
    
  })
}

function loadingSound2(k) {
  
  sound2 = new Howl({
    src: [playingList[k]],
    preload: true,
    html5: true,
    onend: function () {
      //console.log('k = ' + k);
      //listLength = playingList.length;
      sound1.play();
      
      sound2.off();
      sound2.unload();
      
      var currentTime = new Date;
      var currentHour = currentTime.getHours();
      //checking if all list was played or not (k+1) != listLength ||
      //if not all - then
      if (currentHour < hourForPlayingList2 || playingList == list2) {
        
        if ((k == (playingList.length - 1)) || (k == (playingList.length - 2))) {
          k = 1;
          loadingSound2(k);
        } else {
          k = k + 2;
          loadingSound2(k);
        }
        
      } //else change the playing list on next one and load tracks from there
      else if (currentHour >= hourForPlayingList2 && i != 0) {
        k = 0;
        playingList = list2;
        loadingSound2(k);
      } else {
        k = 1;
        playingList = list2;
        loadingSound2(k);
      }
  
      sendLikeDislikeIfScheduled();
    },
    onloaderror: function (e, msg) {
      console.log('onloaderrorrrr');
      console.log('Unable to load file: ' + playingList[k] + ' | error message : ' + msg);
      console.log('First argument error ' + e);
      
      sound2.off();
      
      setTimeout(function () {
        if ((k == (playingList.length - 1)) || (k == (playingList.length - 2))) {
          k = 1;
          loadingSound2(k);
        } else {
          k = k + 2;
          loadingSound2(k);
        }
      }, 3000);
      
    }
  })
}

$("#howler-play").on("click", function () {
  
  
  if (playPauseState == 0) {
    
    loadingSound1(i);
    loadingSound2(k);
    sound1.play();
    console.log("initialiation complete");
    
    playPauseState = "playing";
    
  } else if (playPauseState == "playing") {
    
    if (sound1.playing() && !sound2.playing()) {
      sound1.pause();
      pausedState = 1;
      console.log(pausedState);
    } else if (!sound1.playing() && sound2.playing()) {
      sound2.pause();
      pausedState = 2;
      console.log(pausedState);
    } else if (sound1.playing() && sound2.playing()) {
      sound1.pause();
      sound2.pause();
      pausedState = 3;
      console.log(pausedState);
    } else {
    
    }
    
    playPauseState = "paused";
    console.log("paused complete");
    
  } else {
    
    if (pausedState == 1) {
      sound1.play();
    } else if (pausedState == 2) {
      sound2.play();
    } else if (pausedState == 3) {
      sound1.play();
      sound2.play();
    }
    
    playPauseState = "playing";
    console.log("playing complete");
    
  }
  
});

addLikeDislikeClickHandlers();

function insertingLikeDislikeFormData() {
  
  if (playingList == list1) {
    $("input[name=playlistname]").val("Day list");
  } else if (playingList == list2) {
    $("input[name=playlistname]").val("Night list");
  }
  // else {
  //   $("input[name=playlistname]").val("non-basic playlist");
  // }
  
  if (sound1.playing() && !sound2.playing()) {
    //console.log(sound1._src.split("https://570427.selcdn.ru/Sphere/")[1]);
    var song1name = sound1._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
    $("input[name=songname]").val(song1name);
  } else if (!sound1.playing() && sound2.playing()) {
    //console.log(sound2._src.split("https://570427.selcdn.ru/Sphere/")[1]);
    var song2name = sound2._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
    $("input[name=songname]").val(song2name);
  } else {
    //console.log("сердечко нажалось на кроссфейде или без музыки :(");
  }
  
}

$("#howler-volup").on("click", function () {
  var vol = howler_example.volume();
  vol += 0.1;
  if (vol > 1) {
    vol = 1;
  }
  howler_example.volume(vol);
});

$("#howler-voldown").on("click", function () {
  var vol = howler_example.volume();
  vol -= 0.1;
  if (vol < 0) {
    vol = 0;
  }
  howler_example.volume(vol);
});

