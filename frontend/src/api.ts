const API = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  course?: string;
  classGroup?: string;
  bio?: string | null;
  studentNumber?: string;
};

export type Post = {
  id: string;
  content: string;
  type: string;
  createdAt: string;
  author: { id: string; name: string; course?: string; classGroup?: string };
  _count?: { comments: number; reactions: number };
  likedByMe?: boolean;
};

export type Comment = {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string };
};

export type AdminReport = {
  id: string;
  reason: string;
  targetType: string;
  targetId: string;
  description?: string | null;
  createdAt: string;
  reporter: { id: string; name: string };
  post?: {
    id: string;
    content: string;
    deletedAt: string | null;
    author: { name: string; email: string };
  } | null;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

async function handle<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Erro no pedido.");
  return data as T;
}

export async function login(email: string, password: string) {
  return handle<{ token: string; user: User }>(
    await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
}

export async function fetchMe() {
  return handle<User>(await fetch(`${API}/users/me`, { headers: authHeaders() }));
}

export async function updateProfile(data: { bio?: string; name?: string }) {
  return handle<User>(
    await fetch(`${API}/users/me`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    }),
  );
}

export async function fetchPosts() {
  return handle<Post[]>(await fetch(`${API}/posts`, { headers: authHeaders() }));
}

export async function createPost(content: string) {
  return handle<Post>(
    await fetch(`${API}/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    }),
  );
}

export async function reportPost(postId: string, reason: string, description?: string) {
  return handle<unknown>(
    await fetch(`${API}/reports`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        targetType: "POST",
        targetId: postId,
        reason,
        description: description || undefined,
      }),
    }),
  );
}

export async function fetchComments(postId: string) {
  return handle<Comment[]>(
    await fetch(`${API}/posts/${postId}/comments`, { headers: authHeaders() }),
  );
}

export async function addComment(postId: string, content: string) {
  return handle<Comment>(
    await fetch(`${API}/posts/${postId}/comments`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    }),
  );
}

export async function toggleReaction(postId: string) {
  return handle<unknown>(
    await fetch(`${API}/posts/${postId}/reactions`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function fetchPendingUsers() {
  return handle<User[]>(
    await fetch(`${API}/admin/users/pending`, { headers: authHeaders() }),
  );
}

export async function createSchoolUser(body: Record<string, string>) {
  return handle<User>(
    await fetch(`${API}/admin/users`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function approveUser(id: string) {
  return handle<User>(
    await fetch(`${API}/admin/users/${id}/approve`, {
      method: "PATCH",
      headers: authHeaders(),
    }),
  );
}

export async function fetchOpenReports() {
  return handle<AdminReport[]>(
    await fetch(`${API}/admin/reports`, { headers: authHeaders() }),
  );
}

export async function resolveReport(
  id: string,
  body: { status: "RESOLVIDA" | "REJEITADA"; resolutionNote?: string; removePost?: boolean },
) {
  return handle<unknown>(
    await fetch(`${API}/admin/reports/${id}/resolve`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function setUserStatus(id: string, status: string) {
  return handle<User>(
    await fetch(`${API}/admin/users/${id}/status`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    }),
  );
}
