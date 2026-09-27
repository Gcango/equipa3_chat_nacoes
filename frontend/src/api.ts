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
  avatarUrl?: string | null;
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

export async function updateProfile(data: {
  bio?: string;
  name?: string;
  avatarUrl?: string | null;
}) {
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
  otherUser: {
    id: string;
    name: string;
    course: string;
    classGroup: string;
    avatarUrl?: string | null;
  };
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
  sortOrder?: number;
};

export type DirectoryUser = {
  id: string;
  name: string;
  email: string;
  course: string;
  classGroup: string;
  role: string;
  avatarUrl?: string | null;
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
  return handle<{
    otherUser: { id: string; name: string; avatarUrl?: string | null };
    messages: DirectMessage[];
  }>(
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

export type CourseScheduleEntry = {
  id: string;
  courseId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  label: string;
  sortOrder: number;
};

export type SchoolCourseRecord = {
  id: string;
  slug: string;
  abbr: string;
  name: string;
  teaser: string;
  description: string;
  imagePath?: string | null;
  sortOrder: number;
  published: boolean;
  schedules?: CourseScheduleEntry[];
};

export async function fetchSchoolCourses() {
  return handle<SchoolCourseRecord[]>(
    await fetch(`${API}/community/courses`, { headers: authHeaders() }),
  );
}

export async function adminFetchCourses() {
  return handle<SchoolCourseRecord[]>(
    await fetch(`${API}/admin/courses`, { headers: authHeaders() }),
  );
}

export async function adminCreateCourse(body: Partial<SchoolCourseRecord> & { slug: string; name: string }) {
  return handle<SchoolCourseRecord>(
    await fetch(`${API}/admin/courses`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function adminUpdateCourse(id: string, body: Partial<SchoolCourseRecord>) {
  return handle<SchoolCourseRecord>(
    await fetch(`${API}/admin/courses/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function adminDeleteCourse(id: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/admin/courses/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}

export async function adminAddSchedule(
  courseId: string,
  body: Omit<CourseScheduleEntry, "id" | "courseId">,
) {
  return handle<CourseScheduleEntry>(
    await fetch(`${API}/admin/courses/${courseId}/schedules`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function adminDeleteSchedule(id: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/admin/schedules/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}

export async function adminPublishNews(content: string) {
  return handle<Post>(
    await fetch(`${API}/admin/news`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ content }),
    }),
  );
}

export async function adminFetchEvents() {
  return handle<SchoolEvent[]>(await fetch(`${API}/admin/events`, { headers: authHeaders() }));
}

export async function adminCreateEvent(body: {
  title: string;
  startsAt: string;
  description?: string;
  location?: string;
}) {
  return handle<SchoolEvent>(
    await fetch(`${API}/admin/events`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function adminDeleteEvent(id: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/admin/events/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}

export async function adminCreateResource(body: Omit<ResourceLink, "id">) {
  return handle<ResourceLink>(
    await fetch(`${API}/admin/resources`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body),
    }),
  );
}

export async function adminDeleteResource(id: string) {
  return handle<{ ok: boolean }>(
    await fetch(`${API}/admin/resources/${id}`, { method: "DELETE", headers: authHeaders() }),
  );
}
