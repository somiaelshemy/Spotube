function TracksList({ children, numTracks, onConfirmMigration }) {
  return (
    <>
      <div className="header">
        <h1>{numTracks > 1 ? `Found ${numTracks} Tracks` : "Found 1 Track"}</h1>
        <h3>You can remove any unwanted ones or confirm them all.</h3>
      </div>
      {children}
      <button className="confirm-btn floating-btn" onClick={onConfirmMigration}>
        Confirm
      </button>
    </>
  );
}

export default TracksList;
