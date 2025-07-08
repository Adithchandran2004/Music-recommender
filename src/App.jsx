
import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const realRecommendSongs = async (song) => {
  try {
    const response = await fetch("http://127.0.0.1:5000/recommend", {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song })
    });

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
};

function App() {
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoId, setVideoId] = useState(null);
  const playerRef = useRef(null);

  const handleRecommend = async () => {
    if (!input.trim()) {
      setError("Please enter a song name.");
      return;
    }

    setError('');
    setLoading(true);
    try {
      const songs = await realRecommendSongs(input);
      setRecommendations(songs);
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSongClick = async (songName, artist) => {
    const query = encodeURIComponent(`${songName} ${artist}`);
    const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=1&q=${query}&key=AIzaSyDsy6K4j9Y6TU_FIZ3NhTpPsEQqvQOfYY4`);
    const data = await response.json();
    if (data.items && data.items.length > 0) {
      setVideoId(data.items[0].id.videoId);
    }
  };

  useEffect(() => {
    if (videoId) {
      if (playerRef.current) {
        playerRef.current.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      }
    }
  }, [videoId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center p-4">
      <div className="bg-white text-black rounded-xl p-6 max-w-md w-full shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">🎧 Music Recommender</h1>
        <input
          type="text"
          placeholder="Enter a song name..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />
        <button
          onClick={handleRecommend}
          className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
        >
          Recommend
        </button>

        {loading && <p className="mt-4 text-center text-sm">Loading...</p>}
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}

        {!loading && recommendations.length > 0 && (
          <ul className="mt-4 space-y-2">
            {recommendations.map((rec, index) => (
              <li
                key={index}
                className="bg-indigo-100 text-indigo-800 px-4 py-2 rounded cursor-pointer"
                onClick={() => handleSongClick(rec.song, rec.artist)}
              >
                🎵 {rec.song} <span className="italic text-sm">by {rec.artist}</span>
              </li>
            ))}
          </ul>
        )}

        {videoId && (
          <div className="mt-4">
            <iframe
              ref={playerRef}
              width="100%"
              height="200"
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Song Preview"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
