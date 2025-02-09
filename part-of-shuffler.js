var started,
    tracks = 0,
    playlistID = '',
    selectedPlaylists = [],
    sourcePlaylist = [],
    finalPlaylist = [],
    processingPlaylistId = '',
    processingTracks = 0,
    selectedMethod = '',
    perRequest = 100,
    maxTries = 10,
    previousIndex = -1,
    currentAttempts = 0;
var spotifyShuffleApp = this;

let spotifyApi = new SpotifyWebApi();
spotifyApi.setAccessToken(spotifyToken);

/**
 * prepare the playlist for processing
 * */
function prepareProcess(playlist, processMethod) {    
    document.querySelector('#progress-' + playlist).style.width = '0%';
    document.querySelector('#processing-' + playlist).classList.remove('d-none');

    // Prepare the shuffle list
    var trackCount = parseInt(document.getElementById('row-' + playlist).getAttribute('data-tracks'), 10);
    processingTracks = trackCount;

    sourcePlaylist = [];
    finalPlaylist = [];    
    selectedMethod = processMethod;

    for (var i = 0; i < trackCount; i++) {
        sourcePlaylist.push({ index: i });
    }
    finalPlaylist = JSON.parse(JSON.stringify(sourcePlaylist));

    if (processMethod === 'shuffle') {
        shuffleArray(sourcePlaylist);

    } else {
        finalPlaylist = finalPlaylist.reverse();

    }

    processingPlaylistId = playlist;
    processPlaylist(0);
}

/**
 * Go through the actual source playlist now
 * */
function processPlaylist(index) {
    if (index < processingTracks) {
        // Update progress percentage
        var percentDone = ((index + 1) / processingTracks) * 100;
        document.querySelector('#progress-' + processingPlaylistId).style.width = percentDone + '%';

        var finalIndex = finalPlaylist[index].index;
        var fromIndex = sourcePlaylist.findIndex(obj => obj.index === finalIndex);

        if (previousIndex !== index)
            currentAttempts = 0;

        if (fromIndex !== index) {
            previousIndex = index;

            try {
                spotifyApi.reorderTracksInPlaylist(processingPlaylistId, fromIndex, index)
                    .then((response) => {
                        arrayMoveFromToIndex(sourcePlaylist, fromIndex, index);
                        processPlaylist(index + 1);
                    },
                        (err) => {
                            checkErrorCode(err, processPlaylist.bind(null, index));
                        });
            } catch {

            }

        } else {
            processPlaylist(index + 1);
        }

    }
    else {
        // Finished processing
        // Clean up all the stuff
        finishedProcessing();
    }
}

function checkErrorCode(err, callback) {
    if (err.status === 401) {
        refreshToken(callback);

    } else {
        console.log('If you see this, please copy and email the following error to stevenaleong@outlook.com');
        console.log('Right click, copy JSON', err.response);
        log(err.status, JSON.stringify(err.response));

        if (currentAttempts < maxTries || err.status === 429) {
            currentAttempts++;

            let retryCount = currentAttempts < 2 ? 1 : currentAttempts;

            // Either there was a communication api error
            // or 
            // Rate limit hit, pause the timer
            // Need to figure out the time to pause but lets just wait 5 seconds and that should clear it up.
            if (callback)
                setTimeout(callback, retryCount * 2500);

        } else {
            // Failed... reload?
            alert('There was an error! Crap. If you have a blocker, please allow outgoing calls to api.spotify.com as that is needed to send the commands! If this continues to happen, please leave a comment letting me know and I will try and dig into it and hopefully squash it.');
            window.location = '/tools/spotifyplaylistrandomizer';
        }
    }
}
