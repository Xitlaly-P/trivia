const API = import.meta.env.VITE_API_KEY;

export async function login(
  username: string,
  password: string
): Promise<Response> {
  return fetch(`${API}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export async function getQuestions(): Promise<any[]> {
  return fetch(`${API}/question`, {
    credentials: "include",
  }).then((res) => res.json());
}

export async function submitAnswer(
  id: number,
  answer: string
): Promise<Response> {
  return fetch(`${API}/answer`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, answer }),
  });
}

export async function uploadImage(
  id: number,
  file: File
): Promise<Response> {
  const form = new FormData();
  form.append("id", id.toString());
  form.append("image", file);

  return fetch(`${API}/upload`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
}

export async function getLeaderboard(): Promise<[string, number][]> {
  return fetch(`${API}/leaderboard`).then((res) => res.json());
}
