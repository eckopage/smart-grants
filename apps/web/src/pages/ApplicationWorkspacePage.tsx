import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addMessage,
  addTimelineItem,
  fetchApplication,
  getDocumentDownloadUrl,
  registerDocument,
  requestDocumentUploadUrl,
  updateTimelineItemStatus,
} from '../lib/applications-client';
import { ApiError } from '../lib/api-client';
import type { Grant } from '../types/grant';

const STATUS_LABELS: Record<string, string> = {
  intent: 'Zgłoszenie wysłane',
  matched: 'Dopasowano firmę',
  in_progress: 'W trakcie',
  submitted: 'Wniosek złożony',
  completed: 'Zakończone',
  rejected: 'Odrzucone',
  withdrawn: 'Wycofane',
};

export function ApplicationWorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user, accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [messageText, setMessageText] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: application, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => fetchApplication(id!, accessToken!),
    enabled: !!id && !!accessToken,
  });

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['application', id] });
  }

  if (isLoading || !application) {
    return <p className="p-10 text-slate-500">Ładowanie…</p>;
  }

  const myRole: 'user' | 'company' = application.userId === user?.id ? 'user' : 'company';
  const grant = typeof application.grantId === 'string' ? null : (application.grantId as Grant);

  async function handleSendMessage() {
    if (!messageText.trim()) return;
    setError(null);
    try {
      await addMessage(application!._id, messageText, accessToken!);
      setMessageText('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  async function handleAddTask() {
    if (!newTaskTitle.trim()) return;
    setError(null);
    try {
      await addTimelineItem(application!._id, accessToken!, {
        title: newTaskTitle,
        assignedTo: myRole === 'user' ? 'company' : 'user',
      });
      setNewTaskTitle('');
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  async function handleToggleTask(itemId: string, currentStatus: string) {
    setError(null);
    try {
      await updateTimelineItemStatus(
        application!._id,
        itemId,
        currentStatus === 'done' ? 'pending' : 'done',
        accessToken!,
      );
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Wystąpił błąd');
    }
  }

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    setError(null);
    try {
      const { uploadUrl, key } = await requestDocumentUploadUrl(
        application!._id,
        { fileName: file.name, contentType: file.type || 'application/octet-stream', category: 'inne' },
        accessToken!,
      );
      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      await registerDocument(
        application!._id,
        { fileName: file.name, key, category: 'inne' },
        accessToken!,
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się przesłać pliku');
    }
  }

  async function handleDownload(documentId: string) {
    try {
      const { url } = await getDocumentDownloadUrl(application!._id, documentId, accessToken!);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nie udało się pobrać dokumentu');
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Link to="/dashboard" className="text-sm text-slate-500 underline">
        ← Wróć do panelu
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-slate-900">
        {grant?.title ?? 'Zgłoszenie'}
      </h1>
      <p className="text-slate-500">
        Status: {STATUS_LABELS[application.status] ?? application.status}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Oś czasu</h2>
        <div className="flex flex-col gap-2">
          {application.timeline.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between rounded border border-slate-200 p-3"
            >
              <div>
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="text-xs text-slate-500">
                  Przypisane do: {item.assignedTo === 'user' ? 'przedsiębiorcy' : 'firmy'}
                  {item.dueDate &&
                    ` · termin: ${new Date(item.dueDate).toLocaleDateString('pl-PL')}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleToggleTask(item._id, item.status)}
                className={`rounded px-3 py-1 text-xs ${
                  item.status === 'done'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {item.status === 'done' ? 'Zrobione' : 'Do zrobienia'}
              </button>
            </div>
          ))}
          {application.timeline.length === 0 && (
            <p className="text-sm text-slate-500">Brak pozycji na osi czasu.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Nowe zadanie…"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleAddTask()}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Dodaj
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Dokumenty</h2>
        <div className="flex flex-col gap-2">
          {application.documents.map((doc) => (
            <div
              key={doc._id}
              className="flex items-center justify-between rounded border border-slate-200 p-3 text-sm"
            >
              <span>
                {doc.fileName} (v{doc.version})
              </span>
              <button
                type="button"
                onClick={() => void handleDownload(doc._id)}
                className="text-slate-900 underline"
              >
                Pobierz
              </button>
            </div>
          ))}
          {application.documents.length === 0 && (
            <p className="text-sm text-slate-500">Brak przesłanych dokumentów.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input ref={fileInputRef} type="file" className="text-sm" />
          <button
            type="button"
            onClick={() => void handleUpload()}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Prześlij
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-semibold text-slate-900">Wiadomości</h2>
        <div className="flex flex-col gap-2">
          {application.messages.map((message) => (
            <div
              key={message._id}
              className={`max-w-md rounded p-3 text-sm ${
                message.senderRole === myRole
                  ? 'ml-auto bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              {message.content}
            </div>
          ))}
          {application.messages.length === 0 && (
            <p className="text-sm text-slate-500">Brak wiadomości.</p>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Napisz wiadomość…"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => void handleSendMessage()}
            className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
          >
            Wyślij
          </button>
        </div>
      </section>
    </main>
  );
}
