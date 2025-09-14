import { useState } from "react";
import Error from "./Error";
function MainPage({
  playlistLink,
  setPlaylistLink,
  onImportTracks,
  error = null,
  setError,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="main-page">
      <h1 className="header">Import your First Tracks 🎶 </h1>
      <form>
        <input
          id="playlist-link"
          type="text"
          value={playlistLink}
          placeholder="Paste Your Spotify Playlist Link Here . . ."
          onChange={(e) => setPlaylistLink(e.target.value)}
        />

        <div className="form-field">
          <label for="playlist-name">New Playlist Name</label>
          <input
            id="playlist-name"
            type="text"
            value={name}
            placeholder="i.e. Spotube . ."
            onChange={(e) => setName(e.target.value)}
          ></input>
        </div>

        <div className="form-field">
          <label for="playlist-description">Playlist Description</label>
          <input
            id="playlist-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder=" . . 🎶"
          ></input>
        </div>
      </form>
      {error && <Error e={error}></Error>}
      <button
        className="confirm-btn"
        onClick={() => onImportTracks(name, description)}
      >
        Import
      </button>
    </div>
  );
}

export default MainPage;
