import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import UserAvatar from "../../components/UserAvatar";
import {
  fetchConversation,
  fetchMessageThreads,
  fetchUserDirectory,
  sendDirectMessage,
  type DirectMessage,
  type DirectoryUser,
  type MessageThread,
} from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

export default function MessagesPage() {
  const { user, displayUser, error, logout, summary, refreshSummary } = useAuthUser();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("com");
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherName, setOtherName] = useState("");
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");
  const [sending, setSending] = useState(false);

  async function loadThreads() {
    const [t, d] = await Promise.all([fetchMessageThreads(), fetchUserDirectory()]);
    setThreads(t);
    setDirectory(d);
  }

  async function loadConversation(id: string) {
    const data = await fetchConversation(id);
    setMessages(data.messages);
    setOtherName(data.otherUser.name);
    await refreshSummary();
  }

  useEffect(() => {
    loadThreads().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadConversation(selectedId).catch((e) =>
        setLocalError(e instanceof Error ? e.message : "Erro."),
      );
    } else {
      setMessages([]);
      setOtherName("");
    }
  }, [selectedId]);

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedId || !draft.trim()) return;
    setSending(true);
    try {
      await sendDirectMessage(selectedId, draft.trim());
      setDraft("");
      await loadConversation(selectedId);
      await loadThreads();
      await refreshSummary();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error || localError}
      showWidgets={false}
    >
      <section className="cn-page cn-glass cn-page--split">
        <div className="cn-page__col">
          <h2 className="cn-page__title">Mensagens</h2>
          <ul className="cn-list">
            {threads.map((t) => (
              <li key={t.otherUser.id}>
                <button
                  type="button"
                  className={`cn-list__row${selectedId === t.otherUser.id ? " cn-list__row--active" : ""}`}
                  onClick={() => setParams({ com: t.otherUser.id })}
                >
                  <UserAvatar name={t.otherUser.name} size="sm" />
                  <div>
                    <strong>{t.otherUser.name}</strong>
                    <span>{t.lastMessage}</span>
                  </div>
                  {t.unread > 0 && <span className="cn-nav__badge">{t.unread}</span>}
                </button>
              </li>
            ))}
          </ul>
          <h3 className="cn-page__subtitle">Nova conversa</h3>
          <ul className="cn-list cn-list--compact">
            {directory.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className="cn-list__row"
                  onClick={() => setParams({ com: u.id })}
                >
                  <UserAvatar name={u.name} size="sm" />
                  <span>
                    {u.name} · {u.course}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="cn-page__col cn-page__col--chat">
          {selectedId ? (
            <>
              <h3 className="cn-page__title">{otherName}</h3>
              <div className="cn-chat">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`cn-chat__bubble${m.sender.id === user?.id ? " cn-chat__bubble--me" : ""}`}
                  >
                    <span className="cn-chat__meta">{m.sender.name}</span>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
              <form onSubmit={onSend} className="cn-chat__form">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreve a tua mensagem…"
                  maxLength={2000}
                />
                <button type="submit" className="cn-btn cn-btn--primary" disabled={sending}>
                  Enviar
                </button>
              </form>
            </>
          ) : (
            <p className="cn-page__lead">Selecciona uma conversa ou contacto.</p>
          )}
        </div>
      </section>
    </CommunityLayout>
  );
}
