import { useState, useEffect } from "react";
import * as api from "./api";
import type { Question, LeaderboardEntry } from "./types";

const App: React.FC = () => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [answered, setAnswered] = useState<Set<number>>(new Set());
  const [images, setImages] = useState<Record<number, string[]>>({});

  const allAnswered = questions.length > 0 && answered.size >= questions.length-1;

  async function fetchImages() {
    const baseUrl = import.meta.env.VITE_API_KEY

    const res = await fetch(`${baseUrl}/uploads.json`)
    const data: Record<number, string[]> = await res.json();

    const urls: Record<number, string[]> = {};
    for (const qid in data) {
      urls[Number(qid)] = data[qid].map(
        (filename) => `${baseUrl}/uploads/${filename}`
      );
    }

    setImages(urls);
  }

  function shuffleArray<T>(array: T[]): T[] {
    return array.sort(() => Math.random() - 0.5);
  }

  useEffect(() => {
    const interval = setInterval(async () => {
      setLeaderboard(await api.getLeaderboard());
      await fetchImages();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const username = (form.elements.namedItem("user") as HTMLInputElement).value;
    const password = (form.elements.namedItem("pass") as HTMLInputElement).value;

    const res = await api.login(username, password);
    if (res.ok) {
      setLoggedIn(true);

      // Fetch questions
      const fetchedQuestions = await api.getQuestions();
      const shuffledQuestions = fetchedQuestions.map((q) => ({
        ...q,
        options: q.options ? shuffleArray([...q.options]) : q.options,
      }));
      setQuestions(shuffledQuestions);

      // 🔥 FETCH ANSWERED QUESTIONS
      const answeredIds = await api.getUserAnswers();
      setAnswered(new Set(answeredIds));
    }

    await fetchImages();
  }


  return (
    <div style={{fontFamily: "Arial, sans-serif", maxWidth: 900, margin: "0 auto" }}>
      {!loggedIn ? (
  <div 
    style={{
      display: "flex",
      width: "100vw",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #0d0d0eff, #292a2dff)",
    }}
  >
    <div 
      style={{
        backgroundColor: "white",
        maxWidth: 1500,
        margin: "0 auto",
        padding: "40px 40px",
        borderRadius: 15,
        boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minWidth: 500,
      }}
    >
      <h1 style={{ marginBottom: 0, color: "#333" }}>Login</h1>
      <h4 style={{ marginBottom: 30, color: "#333" }}>If you lost your password text me :p</h4>
      <form 
        onSubmit={handleLogin} 
        style={{ display: "flex", flexDirection: "column", gap: 15, width: "90%" }}
      >
        <input 
          name="user" 
          placeholder="Username" 
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 20, width: "100%"}} 
        />
        <input 
          name="pass" 
          placeholder="Password" 
          type="password" 
          style={{ padding: 12, borderRadius: 8, border: "1px solid #ccc", fontSize: 20, width: "100%" }} 
        />
        <button 
          type="submit"
          style={{
            padding: "12px 0",
            borderRadius: 8,
            border: "none",
            backgroundColor: "#5a189a",
            color: "white",
            fontSize: 20,
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: 10
          }}
        >
          Login
        </button>
      </form>
    </div>
  </div>
) : (
        <div
          style={{
            display: "flex",
            width: "100vw",
            justifyContent: "center",
            alignItems: "center",
            background: "linear-gradient(135deg, #0d0d0eff, #292a2dff)",
          }}
        >
          <div
          style={{
            width: "100%",
            maxWidth: 1200,
            padding: "40px 20px",
          }}>
          <h1 style={{ textAlign: "center", marginBottom: 10 }}>Trivia Game</h1>
          <p
            style={{
              textAlign: "center",
              color: "#ffffffff",
              marginBottom: 40,
              fontSize: 16,
              maxWidth: 700,
              marginInline: "auto", 
            }}
          >
            Answer the questions, upload your photo, and see how you rank.
            Once you finish everything, there's a surprise waiting for you
          </p>


          <div 
            style={{
              display: "flex",
              gap: 30,
              alignItems: "flex-start",
            }}>
            <div style={{ flex: 2 }}>
              {questions.map((q) => (
                <div key={q.id} 
                style={{
                  backgroundColor: "#201e1eff",
                  borderRadius: 12,
                  padding: 20,
                  marginBottom: 20,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                }}>
                  <h3 style={{ marginBottom: 10 }}>{q.question}</h3>

                  {q.options?.map((opt) => (
                    <button
                      key={opt}
                      disabled={answered.has(q.id)}
                      onClick={async () => {
                        await api.submitAnswer(q.id, opt);
                        setAnswered((prev) => new Set(prev).add(q.id));
                      }}
                      style={{
                        marginRight: 10,
                        marginBottom: 5,
                        padding: "6px 12px",
                        borderRadius: 5,
                        border: "1px solid #5a189a",
                        backgroundColor: answered.has(q.id) ? "#aaa" : "#5a189a",
                        color: "white",
                        cursor: answered.has(q.id) ? "not-allowed" : "pointer",
                      }}
                    >
                      {opt}
                    </button>
                  ))}

                  {q.image_required && (
                    <div style={{ marginTop: 10 }}>
                      <input
                        type="file"
                        disabled={answered.has(q.id)}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            await api.uploadImage(q.id, file);
                            setAnswered((prev) => new Set(prev).add(q.id));
                            await fetchImages();
                          }
                        }}
                      />
                    </div>
                  )}

                  {images[q.id]?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 10 }}>
                      {images[q.id].map((src, idx) => (
                        <img
                          key={idx}
                          src={src}
                          alt={src.split("_")[0]}
                          title={src.split("_")[0]}
                          width={100}
                          style={{ borderRadius: 8, border: "1px solid #ddd", width:500 }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ flex: 1 }}>
              <h2>Leaderboard</h2>
              <div style={{ border: "1px solid #ccc", borderRadius: 10, padding: 10, boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
                {leaderboard.map(([user, score]) => (
                  <div key={user} style={{ padding: 5, borderBottom: "1px solid #eee" }}>
                    <strong>{user}</strong>: {score}
                  </div>
                ))}
              </div>
              {allAnswered && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    textAlign: "center",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                  }}
                >
                  <h2>🎉 You finished the trivia! 🎉</h2>
                  <p>WATCH THIS</p>

                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                    <iframe
                      src="https://www.youtube.com/embed/H6_QFudrp3A"
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        borderRadius: 10,
                      }}
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

export default App;
