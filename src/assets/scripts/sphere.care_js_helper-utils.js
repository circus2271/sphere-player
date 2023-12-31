// source of true for serverlessFunctionUrl
// window['serverlessFunctionUrl'] = 'https://ru-1.gateway.serverless.selcloud.ru/api/v1/web/a111e1aadaa5439abf8153af6cb9d16c/default/test-gateway-api-manager'
window['serverlessFunctionUrl'] = 'https://functions.yandexcloud.net/d4e64i9nn91mr709f0sf?integration=raw'
// window['serverlessFunctionUrl'] = 'https://functions.yandexcloud.net/d4etmtd3bo311js8af3l?integration=raw'

// таким образом, если мы захотим поменять адрес, то нам нужно будет сделать это только в одном месте (здесь)
// подключаем этот скрипт перед основнмыми скриптами


// HELPERS

// LIKES DISLIKES ON SONG END
// ================
let likeDislikeState = {
  shouldLike: false,
  shouldDislike: false,
  requestData: {}
}

function scheduleLikeOnSongEnd() {
  likeDislikeState = {
    shouldLike: true,
    shouldDislike: false,
  }

  likeDislikeState.requestData = getRequestData()
}

function scheduleDislikeOnSongEnd() {
  likeDislikeState = {
    shouldLike: false,
    shouldDislike: true,
  }

  likeDislikeState.requestData = getRequestData()
}

function resetLikeDislikeState() {
  likeDislikeState = {
    shouldLike: false,
    shouldDislike: false,
    requestData: {}
  }
}

function getRequestData() {
  insertingLikeDislikeFormData();

  let formData;
  if (likeDislikeState.shouldLike === true) formData = $formLike.serializeObject();
  if (likeDislikeState.shouldDislike === true) formData = $formDislike.serializeObject();
  // reset like dislike app state

  const requestData = {
    ...formData,
    login: formData.place,
    password: localStorage.getItem('password'),
    projectFolderName, // should be defined in a playRules script
    placeFolderName, // should be defined in a playRules script
    playlistFileName: playlists[formData.playlistname], // "playlists" should be defined in a playRules script
    'client timestamp': new Date().toLocaleString("ru-RU")
  }

  return requestData
}

// ================
// function insertingLikeDislikeFormDataFunctionExample() {
//
//   if (playingList == list1) {
//     $("input[name=playlistname]").val("Day list");
//   } else {
//     $("input[name=playlistname]").val("Weekend playlist");
//   }
//
//   if (sound1.playing() && !sound2.playing()) {
//     //console.log(sound1._src.split("musicLibrary/")[1]);
//     var song1name = sound1._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
//     $("input[name=songname]").val(song1name);
//   } else if (!sound1.playing() && sound2.playing()) {
//     //console.log(sound2._src.split("musicLibrary/")[1]);
//     var song2name = sound2._src.split("https://570427.selcdn.ru/Sphere/musiclibrary/")[1];
//     $("input[name=songname]").val(song2name);
//   } else {
//     $("input[name=songname]").val("?error?");
//   }
// }


function sendLikeDislikeIfScheduled() {
  if (likeDislikeState.shouldLike || likeDislikeState.shouldDislike) {
    sendLikeDislikeToServer()
  }
}

function sendLikeDislikeToServer() {

  const requestData = likeDislikeState.requestData
  resetLikeDislikeState()

  if (playingList && requestData.value === 'dislike') {
    const dislikedSongName = requestData.songname

    playingList = playingList.filter(songURL => {
      // extract songName from song url (get part of the url, that goes after last slash)
      const songName = songURL.replace(/.*[/]/ig, '');

      return songName !== dislikedSongName
    })
  }

  var jqxhr = $.ajax({
    url: serverlessFunctionUrl,
    method: "POST",
    contentType: 'text/plain',
    // data: JSON.stringify($formLike.serializeObject()),
    data: JSON.stringify(requestData),
    success: console.log("value sended")
  })
    .done(function (res) {
      if (res.result === 'success') console.log(res.message);
      if (res.result === 'error') console.error(res.message);
    });
}

// function for shuffling array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function animateHowlerPlayButton() {
  document.querySelector("#howler-play").style.transition = 'visibility, opacity 0.25s ease-in'
  document.querySelector("#howler-play").style.visibility = 'visible'
  document.querySelector("#howler-play").style.opacity = 1
}

function seekPlayingSongToAnEnd(secondsBeforeEnd = 10) {
  // secondsBeforeEnd is an overridable default value
  if (!sound1 && !sound2) {
    console.warn('для перемотки трэка нужно сначала включить плеер')
    return
  }
  if ((sound1 && !sound1.playing()) && (sound2 && !sound2.playing())) {
    console.warn('перемотка работает только во время воспроизведения трэка')
    return
  }
  if (sound1 && sound1.playing()) {
    sound1.seek(sound1.duration() - secondsBeforeEnd)
    console.log(`sound1 перемотана, до следующей песни осталось ${secondsBeforeEnd} секунд`)
  }
  if (sound2 && sound2.playing()) {
    sound2.seek(sound2.duration() - secondsBeforeEnd)
    console.log(`sound2 перемотана, до следующей песни осталось ${secondsBeforeEnd} секунд`)
  }
}

function addLikeDislikeClickHandlers() {
  $("#submitLike").on("click", function (e) {

    if (sound1 == undefined || sound2 === undefined) {
      console.error('Error! Start player to enable likes');
      return;
    }

    scheduleLikeOnSongEnd()
  });

  $("#submitDislike").on("click", function (e) {

    if (sound1 == undefined || sound2 === undefined) {
      console.error('Error! Start player to enable dislikes');
      return;
    }

    scheduleDislikeOnSongEnd()
  });
}

console.log('helpers')
