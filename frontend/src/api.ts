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
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    throw new Error("Sessão expirada. Inicia sessão novamente.");
  }
  if (!res.ok) {
    const msg =
      typeof data.error === "string"
        ? data.error
        : res.status === 403
          ? "Conta não activa ou sem permissão."
          : res.status >= 500
            ? "Servidor indisponível. Verifica se a API está a correr."
            : "Erro no pedido.";
    throw new Error(msg);
  }
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

export async function fetchPosts(type?: string) {
  const q = type ? `?type=${encodeURIComponent(type)}` : "";
  return handle<Post[]>(await fetch(`${API}/posts${q}`, { headers: authHeaders() }));
}

export async function createPost(content: string, type?: string) {
  return handle<Post>(
    await fetch(`${API}/posts`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content, ...(type ? { type } : {}) }),
    }),
  );
}

export type CommunitySummary = { unreadMessages: number; unreadNotifications: number };

export type MessageThread = {
  otherUser: { id: string; name: string; course: string; classGroup: string };
  lastMessage: string;
  lastAt: string;
  unread: number;
};

export type DirectMessage = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; name: string };
};

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export type CommunityGroup = {
  id: string;
  name: string;
  description: string | null;
  memberCount: number;
  isMember: boolean;
};

export type SchoolEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startsAt: string;
};

export type ResourceLink = {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string | null;
};

export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  course: string;
  classGroup: string;
  role: string;
};

export type SchoolProfile = {
  name: string;
  motto: string;
  tagline: string;
  emailDomain: string;
  values: string[];
  contacts: { label: string; value: string }[];
};

export async function fetchCommunitySummary() {
  return handle<CommunitySummary>(
    await fetch(`${API}/community/summary`, { headers: authHeaders() }),
  );
}

export async function fetchMessageThreads() {
  return handle<MessageThread[]>(
    await fetch(`${API}/community/messages/threads`, { headers: authHeaders() }),
  );
}

export async function fetchConversation(otherUserId: string) {
  return handle<{ otherUser: { id: string; name: string }; messages: DirectMessage[] }>(
    await fetch(`${API}/community/messages/with/${otherUserId}`, { headers: authHeaders() }),
  );
}

export async function sendDirectMessage(recipientId: string, content: string) {
  return handle<DirectMessage>(
    await fetch(`${API}/community/messages`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ recipientId, content }),
    }),
  );
}

export async function fetchNotifications() {
  return handle<AppNotification[]>(
    await fetch(`${API}/community/notifications`, { headers: authHeaders() }),
  );
}

export async function markNotificationRead(id: string) {
  return handle<AppNotification>(
    await fetch(`${API}/community/notifications/${id}/read`, {
      method: "PATCH",
      headers: authHeaders(),
    }),
  );
}

export async function markAllNotificationsRead() {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/community/notifications/read-all`, {
      method: "PATCH",
      headers: authHeaders(),
    }),
  );
}

export async function fetchCommunityGroups() {
  return handle<CommunityGroup[]>(
    await fetch(`${API}/community/groups`, { headers: authHeaders() }),
  );
}

export async function joinCommunityGroup(groupId: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/community/groups/${groupId}/join`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function leaveCommunityGroup(groupId: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/community/groups/${groupId}/leave`, {
      method: "POST",
      headers: authHeaders(),
    }),
  );
}

export async function fetchSchoolEvents() {
  return handle<SchoolEvent[]>(
    await fetch(`${API}/community/events`, { headers: authHeaders() }),
  );
}

export async function fetchResourceLinks() {
  return handle<ResourceLink[]>(
    await fetch(`${API}/community/resources`, { headers: authHeaders() }),
  );
}

export async function fetchSchoolProfile() {
  return handle<SchoolProfile>(
    await fetch(`${API}/community/school`, { headers: authHeaders() }),
  );
}

export async function fetchUserDirectory() {
  return handle<DirectoryUser[]>(
    await fetch(`${API}/users/directory`, { headers: authHeaders() }),
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
