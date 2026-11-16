import { useCallback, useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

async function getErrorMessage(response, fallback) {
  const result = await response.json().catch(() => null);
  return typeof result?.error === "string" ? result.error : fallback;
}

async function getEntries(signal) {
  const response = await fetch(`${API_URL}/entries`, { signal });
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "Failed to load entries."));
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("The server returned an invalid entries response.");
  }
  return data;
}

function App() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("list");
  const [currentEntry, setCurrentEntry] = useState({ title: "", body: "" });

  const fetchEntries = useCallback(async () => {
    try {
      setEntries(await getEntries());
      setError("");
    } catch (err) {
      setError(
        err.message ||
          "Failed to load entries. Check that the server and database are running.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    getEntries(controller.signal)
      .then((data) => {
        setEntries(data);
        setError("");
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(
            err.message ||
              "Failed to load entries. Check that the server and database are running.",
          );
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const isEdit = view === "edit";
    const url = isEdit
      ? `${API_URL}/entries/${currentEntry.id}`
      : `${API_URL}/entries`;

    try {
      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: currentEntry.title.trim(),
          body: currentEntry.body.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Failed to save entry."),
        );
      }

      await fetchEntries();
      setCurrentEntry({ title: "", body: "" });
      setView("list");
    } catch (err) {
      setError(err.message || "Failed to save entry.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this entry?")) return;

    setError("");
    try {
      const response = await fetch(`${API_URL}/entries/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(
          await getErrorMessage(response, "Failed to delete entry."),
        );
      }

      await fetchEntries();
      setView("list");
    } catch (err) {
      setError(err.message || "Failed to delete entry.");
    }
  };

  const startCreate = () => {
    setCurrentEntry({ title: "", body: "" });
    setView("create");
  };

  const startEdit = (entry) => {
    setCurrentEntry({ ...entry });
    setView("edit");
  };

  const viewDetail = (entry) => {
    setCurrentEntry({ ...entry });
    setView("detail");
  };

  const renderList = () => (
    <section aria-label="Journal entries">
      <div className="list-heading">
        <h2>Your entries</h2>
        <button className="new-btn" onClick={startCreate} type="button">
          New entry
        </button>
      </div>
      {entries.length === 0 ? (
        <div className="empty-state">
          <h2>Your journal is empty</h2>
          <p>Write your first entry to get started.</p>
        </div>
      ) : (
        <ul className="entry-list">
          {entries.map((entry) => (
            <li className="entry-card" key={entry.id}>
              <button
                className="entry-title"
                onClick={() => viewDetail(entry)}
                type="button">
                {entry.title}
              </button>
              <p className="date">
                {new Date(entry.createdAt).toLocaleString()}
              </p>
              <p className="entry-preview">{entry.body}</p>
              <div className="actions">
                <button onClick={() => startEdit(entry)} type="button">
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(entry.id)}
                  type="button">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  const renderForm = () => (
    <section>
      <h2>{view === "edit" ? "Edit entry" : "New entry"}</h2>
      <form className="entry-form" onSubmit={handleSave}>
        <label htmlFor="entry-title">Title</label>
        <input
          autoFocus
          id="entry-title"
          maxLength={200}
          onChange={(event) =>
            setCurrentEntry({ ...currentEntry, title: event.target.value })
          }
          placeholder="Give your entry a title"
          required
          value={currentEntry.title}
        />
        <label htmlFor="entry-body">Entry</label>
        <textarea
          id="entry-body"
          onChange={(event) =>
            setCurrentEntry({ ...currentEntry, body: event.target.value })
          }
          placeholder="What would you like to remember?"
          required
          rows={10}
          value={currentEntry.body}
        />
        <div className="form-actions">
          <button disabled={saving} type="submit">
            {saving ? "Saving..." : "Save entry"}
          </button>
          <button
            className="secondary-btn"
            disabled={saving}
            onClick={() => setView("list")}
            type="button">
            Cancel
          </button>
        </div>
      </form>
    </section>
  );

  const renderDetail = () => (
    <article className="entry-detail">
      <button
        className="secondary-btn"
        onClick={() => setView("list")}
        type="button">
        Back to entries
      </button>
      <h2>{currentEntry.title}</h2>
      <p className="date">
        {new Date(currentEntry.createdAt).toLocaleString()}
      </p>
      <p className="body-content">{currentEntry.body}</p>
      <div className="actions">
        <button onClick={() => startEdit(currentEntry)} type="button">
          Edit
        </button>
        <button
          className="delete-btn"
          onClick={() => handleDelete(currentEntry.id)}
          type="button">
          Delete
        </button>
      </div>
    </article>
  );

  return (
    <div className="app-container">
      <header>
        <h1>My Personal Journal</h1>
      </header>

      <main>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            {view === "list" && (
              <button
                className="retry-btn"
                onClick={fetchEntries}
                type="button">
                Try again
              </button>
            )}
          </div>
        )}
        {loading ? (
          <p aria-live="polite" className="loading">
            Loading your journal...
          </p>
        ) : (
          <>
            {view === "list" && renderList()}
            {(view === "create" || view === "edit") && renderForm()}
            {view === "detail" && renderDetail()}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
