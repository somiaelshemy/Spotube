function Track({ track, onRemove }) {
  return (
    <li>
      <div className="album-track-container">
        <img
          src={track.cover}
          alt={`${track.name} album cover`}
          className="album-cover"
        />
        <strong>{track.name}</strong>
      </div>
      <i>{track.artists}</i>
      {track.album}
      <button className="remove-btn" onClick={() => onRemove(track.id)}>
        X
      </button>
    </li>
  );
}

export default Track;
