const http = require('http');
const fs = require('fs');

/* ============================ SERVER DATA ============================ */
let artists = JSON.parse(fs.readFileSync('./seeds/artists.json'));
let albums = JSON.parse(fs.readFileSync('./seeds/albums.json'));
let songs = JSON.parse(fs.readFileSync('./seeds/songs.json'));

let nextArtistId = 2;
let nextAlbumId = 2;
let nextSongId = 2;

// returns an artistId for a new artist
function getNewArtistId() {
  const newArtistId = nextArtistId;
  nextArtistId++;
  return newArtistId;
}

// returns an albumId for a new album
function getNewAlbumId() {
  const newAlbumId = nextAlbumId;
  nextAlbumId++;
  return newAlbumId;
}

// returns an songId for a new song
function getNewSongId() {
  const newSongId = nextSongId;
  nextSongId++;
  return newSongId;
}

/* ======================= PROCESS SERVER REQUESTS ======================= */
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // assemble the request body
  let reqBody = "";
  req.on("data", (data) => {
    reqBody += data;
  });

  req.on("end", () => { // finished assembling the entire request body
    // Parsing the body of the request depending on the "Content-Type" header
    if (reqBody) {
      switch (req.headers['content-type']) {
        case "application/json":
          req.body = JSON.parse(reqBody);
          break;
        case "application/x-www-form-urlencoded":
          req.body = reqBody
            .split("&")
            .map((keyValuePair) => keyValuePair.split("="))
            .map(([key, value]) => [key, value.replace(/\+/g, " ")])
            .map(([key, value]) => [key, decodeURIComponent(value)])
            .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
            }, {});
          break;
        default:
          break;
      }
      console.log(req.body);
    }

    /* ========================== ROUTE HANDLERS ========================== */

    // Your code here
    // 1 Get all the artists
    if (req.method === 'GET' && req.url === '/artists') {
      const allArtists = Object.values(artists);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      console.log(artists);
      res.body = JSON.stringify(allArtists);
      return res.end(res.body)
    }

    // 2 Get a specific artist's details based on artistId
    if (req.method === 'GET' && req.url.split('/').length === 3 && req.url.startsWith('/artists/')) {
      const artistId = req.url.split('/')[2];
      if (artistId in artists) {
        const detailedArtist = {...artists[artistId]};
        const allAlbums = Object.values(albums);
        const seletedAtistAlbum = allAlbums.filter(el => el.artistId == artistId);
        detailedArtist.albums = seletedAtistAlbum;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(detailedArtist);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 3 Add an artist
    if (req.method === 'POST' && req.url === '/artists') {
      const {name} = req.body;
      const newArtistId = getNewArtistId();
      const newArtist = {};
      newArtist.artistId = newArtistId;
      newArtist.name = name;
      artists[newArtistId] = newArtist;

      res.statusCode = 201;
      res.setHeader("Content-Type", "application/json");
      res.body = JSON.stringify(newArtist);
      return res.end(res.body);
    }

    // 4 Edit a specified artist by artistID
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.split('/').length === 3 && req.url.startsWith('/artists/')) {
      const artistId = req.url.split('/')[2];
      if (artistId in artists) {
        const {name} = req.body;
        if (name) {
          artists[artistId].name = name;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(artists[artistId]);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 5 Delete a specified artist by artistId
    if (req.method === 'DELETE' && req.url.split('/').length === 3 && req.url.startsWith('/artists/')) {
      const artistId = req.url.split('/')[2];

      if (artistId in artists) {
        delete artists[artistId];
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end("Delete completed");
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 6 Get all albums of a specific artist based on artistId
    if (req.method === 'GET' && req.url.split('/').length === 4 && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      const artistId = req.url.split('/')[2];

      if (artistId in artists) {
        const allAlbums = Object.values(albums);
        const seletedAtistAlbum = allAlbums.filter(el => el.artistId == artistId);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(seletedAtistAlbum);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 7 Get a specific album's details based on albumId
    if (req.method === 'GET' && req.url.split('/').length === 3 && req.url.startsWith('/albums/')) {
      const albumId = req.url.split('/')[2];

      if (albums[albumId] === undefined) {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Album not found");
      } else {
        const detailedAlbum = {...albums[albumId]};
        const seletedArtistId = detailedAlbum.artistId;
        detailedAlbum.artist = {...artists[seletedArtistId]};
        const allSongs = Object.values(songs);
        const seletedSongs = allSongs.filter(el => el.albumId == albumId);
        detailedAlbum.songs = seletedSongs;

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(detailedAlbum);
        return res.end(res.body);
      }
    }

    // 8 Add an album to a specific artist based on artistId
    if (req.method === 'POST' && req.url.split('/').length === 4 && req.url.startsWith('/artists/') && req.url.endsWith('/albums')) {
      const artistId = req.url.split('/')[2];

      if (artistId in artists) {
        const {name} = req.body;
        const newAlbumId = getNewAlbumId();
        const newAlbum = {};

        newAlbum.albumId = newAlbumId;
        newAlbum.name = name;
        newAlbum.artistId = artistId;
        albums[newAlbumId] = newAlbum;

        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(newAlbum);
        return res.end(res.body);

      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 9 Edit a specified album by albumId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.split('/').length === 3 && req.url.startsWith('/albums/')) {
      const albumId = req.url.split('/')[2];

      if (albumId in albums) {
        const {name} = req.body;
        if (name) {
          albums[albumId].name = name;
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", 'application/json');
        res.body =JSON.stringify(albums[albumId]);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Album not found");
      }
    }

    // 10 Delete a specified album by albumId
    if (req.method === 'DELETE' && req.url.split('/').length === 3 && req.url.startsWith('/albums')) {
      const albumId = req.url.split('/')[2];
      if (albumId in albums) {
        delete albums[albumId];
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end("Delete Completed");
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Album not found");
      }
    }

    // 11 Get all songs of a specific artist based on artistId
    if (req.method === 'GET' && req.url.split('/').length === 4 && req.url.startsWith('/artists/') && req.url.endsWith('/songs')) {
      const artistId = req.url.split('/')[2];
      if (artistId in artists) {
        const allSongs = Object.values(songs);
        const selectedAlbum = new Set();
        for (let key in albums) {
          if (albums[key].artistId == artistId) {
            selectedAlbum.add(albums[key].albumId);
          }
        }
        const selectedSongs = allSongs.filter(el => selectedAlbum.has(el.albumId));

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(selectedSongs);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Artist not found");
      }
    }

    // 12 Get all songs of a specific album based on albumId
    if (req.method === 'GET' && req.url.split('/').length === 4 && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      const albumId = req.url.split('/')[2];

      if (albumId in albums) {
        const allSongs = Object.values(songs);
        const selectedSong = allSongs.filter(el => el.albumId == albumId);

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(selectedSong);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Album not found");
      }
    }

    // 13 Get all songs of a specified trackNumber
    if (req.method === 'GET' && req.url.split('/').length === 4 && req.url.startsWith('/trackNumbers/') && req.url.endsWith('/songs')) {
      const trackNumber = req.url.split('/')[2];
      const allSongs = Object.values(songs);
      const selectedSongs = allSongs.filter(el => el.trackNumber == trackNumber);

      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.body = JSON.stringify(selectedSongs);
      return res.end(res.body);
    }

    // 14 Get a specific song's details based on songId
    if (req.method === 'GET' && req.url.split('/').length === 3 && req.url.startsWith('/songs/')) {
      const songId = req.url.split('/')[2];

      if (songId in songs) {
        const selectedSong = {...songs[songId]};
        const selectedAlbumId = selectedSong.albumId;
        const selectedArtistId = albums[selectedAlbumId].artistId;

        selectedSong.album = albums[selectedAlbumId];
        selectedSong.artist = artists[selectedArtistId];

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(selectedSong);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Song not found");
      }
    }

    // 15 Add a song to a specific album based on albumId
    if (req.method === 'POST' && req.url.split('/').length === 4 && req.url.startsWith('/albums/') && req.url.endsWith('/songs')) {
      const albumId = req.url.split('/')[2];

      if (albumId in albums) {
        const {name, trackNumber, lyrics} = req.body;
        const newSong = {};

        newSong.name = name;
        newSong.lyrics = lyrics;
        newSong.trackNumber = trackNumber;
        newSong.songId = getNewSongId();
        newSong.albumId = albumId;

        songs[newSong.songId] = newSong;

        res.statusCode = 201;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(newSong);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Album not found");
      }
    }

    // 16 Edit a specified song by songId
    if ((req.method === 'PUT' || req.method === 'PATCH') && req.url.split('/').length === 3 && req.url.startsWith('/songs')) {
      const songId = req.url.split('/')[2];

      if (songId in songs) {
        const {name, trackNumber, lyrics} = req.body;

        if (name) {
          songs[songId].name = name;
        }
        if (trackNumber) {
          songs[songId].trackNumber = trackNumber;
        }
        if (lyrics) {
          songs[songId].lyrics = lyrics;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.body = JSON.stringify(songs[songId]);
        return res.end(res.body);
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Song not found");
      }
    }

    // 17 Delete a specified song by songId
    if (req.method === 'DELETE' && req.url.split('/').length === 3 && req.url.startsWith('/songs')) {
      const songId = req.url.split('/')[2];

      if (songId in songs) {
        delete songs[songId];
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end("Delete Completed");
      } else {
        res.statusCode = 404;
        res.setHeader("Content-Type", "application/json");
        return res.end("Song not found");
      }
    }


    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.write("Endpoint not found");
    return res.end();
  });
});

const port = 5000;

server.listen(port, () => console.log('Server is listening on port', port));
