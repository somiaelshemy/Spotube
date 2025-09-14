import { useState } from "react";
import Track from "./components/Track";
import MainPage from "./components/MainPage";
import TracksList from "./components/TracksList";

const initialTracks = [
  {
    id: 51016546,
    name: "Shamandora",
    artists: "Mohamed Mounir",
    album: "Ahmar Shafayef",
    cover:
      "https://t2.genius.com/unsafe/381x381/https%3A%2F%2Fimages.genius.com%2F29d0bbc7d76b36ddbbd351e90209e0ca.1000x1000x1.png",
  },
  {
    id: 51016547,
    name: "The Adults Are Talking",
    artists: "The Strokes",
    album: "The New Abnormal",
    cover:
      "https://th.bing.com/th/id/OIP.PL-l_Zy4Ux7hc9Ru603K_gHaHa?w=186&h=186&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3",
  },
  {
    id: 51016548,
    name: "Why Are Sundays So Depressing",
    artists: "The Strokes",
    album: "The New Abnormal",
    cover:
      "https://th.bing.com/th/id/OIP.PL-l_Zy4Ux7hc9Ru603K_gHaHa?w=186&h=186&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3",
  },
];

function App() {
  const [tracks, setTracks] = useState(initialTracks);
  const [playlistLink, setPlaylistLink] = useState("");
  const [error, setError] = useState(null);

  function handleRemoveTrack(trackId) {
    setTracks(tracks.filter((el) => el.id !== trackId));
  }

  function handleImportTracks(playlistName, playlistDescription) {
    const playlistId = playlistLink.split("playlist/")[1];
    console.log(playlistId);
    if (!playlistId) {
      setError("invalid playlist URL");
      return console.log("invalid playlist URL");
    }
    // fetch("http://127.0.0.1:3000/", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ playlistName, playlistDescription }),
    // })
    //   .then((res) => res.json())
    //   .then((data) => console.log(data))
    //   .catch((err) => {
    //     setError(err.message);
    //   });
  }

  function handleMigration() {}

  return (
    <div className="app">
      {!tracks.length ? (
        <MainPage
          playlistLink={playlistLink}
          setPlaylistLink={setPlaylistLink}
          onImportTracks={handleImportTracks}
          error={error}
          setError={setError}
        ></MainPage>
      ) : (
        <TracksList
          numTracks={tracks.length}
          onConfirmMigration={handleMigration}
        >
          <ul className="class-list">
            {tracks.map((el) => (
              <Track track={el} onRemove={handleRemoveTrack} key={el.id} />
            ))}
          </ul>
        </TracksList>
      )}
    </div>
  );
}

export default App;
