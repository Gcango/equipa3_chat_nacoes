import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import CommunityLayout from "../../components/CommunityLayout";
import UserAvatar from "../../components/UserAvatar";
import {
  fetchCommunityGroups,
  fetchConversation,
  fetchMessageThreads,
  fetchUserDirectory,
  sendDirectMessage,
  type CommunityGroup,
  type DirectMessage,
  type DirectoryUser,
  type MessageThread,
} from "../../api";
import { useAuthUser } from "../../hooks/useAuthUser";

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const { user, displayUser, error, logout, summary, refreshSummary } = useAuthUser();
  const [params, setParams] = useSearchParams();
  const selectedUserId = params.get("com");
  const selectedGroupId = params.get("grupo");
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [directory, setDirectory] = useState<DirectoryUser[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [otherName, setOtherName] = useState("");
  const [otherAvatar, setOtherAvatar] = useState<string | null | undefined>();
  const [draft, setDraft] = useState("");
  const [localError, setLocalError] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");

  const myGroups = useMemo(() => groups.filter((g) => g.isMember), [groups]);
  const activeGroup = useMemo(
    () => (selectedGroupId ? groups.find((g) => g.id === selectedGroupId) : undefined),
    [groups, selectedGroupId],
  );

  async function loadThreads() {
    const [t, d, g] = await Promise.all([
      fetchMessageThreads(),
      fetchUserDirectory(),
      fetchCommunityGroups(),
    ]);
    setThreads(t);
    setDirectory(d);
    setGroups(g);
  }

  async function loadConversation(id: string) {
    const data = await fetchConversation(id);
    setMessages(data.messages);
    setOtherName(data.otherUser.name);
    setOtherAvatar(data.otherUser.avatarUrl);
    await refreshSummary();
  }

  useEffect(() => {
    loadThreads().catch((e) => setLocalError(e instanceof Error ? e.message : "Erro."));
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      loadConversation(selectedUserId).catch((e) =>
        setLocalError(e instanceof Error ? e.message : "Erro."),
      );
    } else {
      setMessages([]);
      setOtherName("");
      setOtherAvatar(undefined);
    }
  }, [selectedUserId]);

  const q = query.trim().toLowerCase();
  const filteredThreads = threads.filter((t) => !q || t.otherUser.name.toLowerCase().includes(q));
  const filteredGroups = myGroups.filter((g) => !q || g.name.toLowerCase().includes(q));

  async function onSend(e: FormEvent) {
    e.preventDefault();
    if (!selectedUserId || !draft.trim()) return;
    setSending(true);
    try {
      await sendDirectMessage(selectedUserId, draft.trim());
      setDraft("");
      await loadConversation(selectedUserId);
      await loadThreads();
      await refreshSummary();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Erro ao enviar.");
    } finally {
      setSending(false);
    }
  }

  function openDirect(id: string) {
    setParams({ com: id });
  }

  function openGroup(id: string) {
    setParams({ grupo: id });
  }

  const showChat = Boolean(selectedUserId);
  const showGroupPane = Boolean(selectedGroupId && !selectedUserId);

  return (
    <CommunityLayout
      user={user}
      displayUser={displayUser}
      onLogout={logout}
      summary={summary}
      error={error || localError}
      showWidgets={false}
    >
      <div className="cn-im">
        <aside className="cn-im__list" aria-label="Grupos e conversas">
          <header className="cn-im__list-head">
            <h1 className="cn-im__list-title">Mensagens</h1>
            <p className="cn-im__list-sub">Grupos à esquerda · conversas à direita</p>
          </header>

          <label className="cn-im__search">
            <span className="visually-hidden">Pesquisar</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pesquisar grupos ou contactos…"
            />
          </label>

          <section className="cn-im__block">
            <h2 className="cn-im__block-title">Os meus grupos</h2>
            <ul className="cn-im__threads">
              {filteredGroups.length === 0 && (
                <li className="cn-im__empty-row">Ainda não pertences a nenhum grupo.</li>
              )}
              {filteredGroups.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    className={`cn-im__thread${selectedGroupId === g.id && !selectedUserId ? " cn-im__thread--active" : ""}`}
                    onClick={() => openGroup(g.id)}
                  >
                    <span className="cn-im__thread-avatar cn-im__thread-avatar--group" aria-hidden>
                      {g.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="cn-im__thread-body">
                      <span className="cn-im__thread-top">
                        <strong>{g.name}</strong>
                        <span className="cn-im__thread-tag">Grupo</span>
                      </span>
                      <span className="cn-im__thread-preview">
                        {g.memberCount} membros · toca para abrir
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="cn-im__block">
            <h2 className="cn-im__block-title">Conversas</h2>
            <ul className="cn-im__threads">
              {filteredThreads.length === 0 && (
                <li className="cn-im__empty-row">Sem conversas. Escolhe um contacto abaixo.</li>
              )}
              {filteredThreads.map((t) => (
                <li key={t.otherUser.id}>
                  <button
                    type="button"
                    className={`cn-im__thread${selectedUserId === t.otherUser.id ? " cn-im__thread--active" : ""}`}
                    onClick={() => openDirect(t.otherUser.id)}
                  >
                    <UserAvatar
                      name={t.otherUser.name}
                      avatarUrl={t.otherUser.avatarUrl}
                      size="md"
                    />
                    <span className="cn-im__thread-body">
                      <span className="cn-im__thread-top">
                        <strong>{t.otherUser.name}</strong>
                        <time dateTime={t.lastAt}>{formatTime(t.lastAt)}</time>
                      </span>
                      <span className="cn-im__thread-preview">{t.lastMessage}</span>
                    </span>
                    {t.unread > 0 && <span className="cn-im__unread">{t.unread}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          {directory.length > 0 && (
            <section className="cn-im__block cn-im__block--contacts">
              <h2 className="cn-im__block-title">Nova conversa</h2>
              <ul className="cn-im__contacts">
                {directory.slice(0, 8).map((u) => (
                  <li key={u.id}>
                    <button type="button" className="cn-im__contact" onClick={() => openDirect(u.id)}>
                      <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                      <span>
                        {u.name}
                        <small>
                          {u.course} · {u.classGroup}
                        </small>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        <div className="cn-im__pane">
          {showChat ? (
            <>
              <header className="cn-im__pane-head">
                <UserAvatar name={otherName} avatarUrl={otherAvatar} size="md" />
                <div className="cn-im__pane-head-text">
                  <strong>{otherName}</strong>
                  <span>Mensagens privadas · comunidade escolar</span>
                </div>
              </header>
              <div className="cn-im__messages" role="log" aria-live="polite">
                {messages.map((m) => {
                  const mine = m.sender.id === user?.id;
                  return (
                    <div
                      key={m.id}
                      className={`cn-im__msg${mine ? " cn-im__msg--out" : " cn-im__msg--in"}`}
                    >
                      <div className="cn-im__msg-bubble">
                        {!mine && <span className="cn-im__msg-sender">{m.sender.name}</span>}
                        <p>{m.content}</p>
                        <time dateTime={m.createdAt}>{formatMessageTime(m.createdAt)}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form className="cn-im__composer" onSubmit={onSend}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escreve uma mensagem…"
                  maxLength={2000}
                  autoComplete="off"
                />
                <button type="submit" className="cn-im__send" disabled={sending || !draft.trim()}>
                  Enviar
                </button>
              </form>
            </>
          ) : showGroupPane && activeGroup ? (
            <>
              <header className="cn-im__pane-head">
                <span className="cn-im__thread-avatar cn-im__thread-avatar--group cn-im__thread-avatar--lg">
                  {activeGroup.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="cn-im__pane-head-text">
                  <strong>{activeGroup.name}</strong>
                  <span>{activeGroup.memberCount} membros · {activeGroup.description}</span>
                </div>
              </header>
              <div className="cn-im__group-body">
                <p className="cn-im__group-lead">
                  Este é o espaço do grupo. As mensagens em tempo real para turmas chegam numa
                  próxima actualização — por agora, inicia conversas privadas com colegas na lista
                  à esquerda.
                </p>
                <h3 className="cn-im__group-sub">Contactos da escola</h3>
                <ul className="cn-im__contacts cn-im__contacts--grid">
                  {directory.slice(0, 6).map((u) => (
                    <li key={u.id}>
                      <button type="button" className="cn-im__contact" onClick={() => openDirect(u.id)}>
                        <UserAvatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
                        <span>{u.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="cn-im__welcome">
              <div className="cn-im__welcome-icon" aria-hidden />
              <h2>Comunidade Gerabriel</h2>
              <p>Selecciona um grupo ou uma conversa para começar.</p>
            </div>
          )}
        </div>
      </div>
    </CommunityLayout>
  );
}
