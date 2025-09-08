import React, { useState, useEffect } from "react";
import "./UrlShortener.css";

const UrlShortener = () => {
  const [url, setUrl] = useState("");
  const [expiresInMinutes, setExpiresInMinutes] = useState("");
  const [preferredCode, setPreferredCode] = useState("");
  const [shortened, setShortened] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  // ✅ Fetch history from backend when page loads
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/history");
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        console.error("Error loading history", err);
      }
    };
    fetchHistory();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setShortened(null);

    try {
      const response = await fetch("http://localhost:5000/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          expiresInMinutes: Number(expiresInMinutes),
          preferredCode: preferredCode.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setShortened(data);

      // ✅ Update frontend history immediately without waiting refresh
      setHistory((prev) => [data, ...prev]);

      setUrl("");
      setExpiresInMinutes("");
      setPreferredCode("");
    } catch (err) {
      setError("Server not reachable");
    }
  };

  return (
    <div className="container">
      <h1 className="title">URL Shortener</h1>

      <form className="form" onSubmit={handleSubmit}>
        <label className="form-label">
          Long URL:
          <input
            type="text"
            className="form-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </label>

        <label className="form-label">
          Expiry (in minutes):
          <input
            type="number"
            className="form-input"
            value={expiresInMinutes}
            onChange={(e) => setExpiresInMinutes(e.target.value)}
            required
          />
        </label>

        <label className="form-label">
          Preferred Short Code (optional):
          <input
            type="text"
            className="form-input"
            value={preferredCode}
            onChange={(e) => setPreferredCode(e.target.value)}
          />
        </label>

        <button type="submit" className="btn">
          Shorten URL
        </button>
      </form>

      {shortened && (
        <div className="result">
          <p>
            Short URL:{" "}
            <a
              href={shortened.shortUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="short-url"
            >
              {shortened.shortUrl}
            </a>
          </p>
          <p>Expires At: {new Date(shortened.expiresAt).toLocaleString()}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="history">
          <h2>All Shortened URLs Statistics</h2>
          <ul>
            {history.map((item, idx) => (
              <li key={idx} className="history-item">
                <a
                  href={item.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="short-url"
                >
                  {item.shortUrl}
                </a>
                <span> ⏳ {new Date(item.expiresAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default UrlShortener;
