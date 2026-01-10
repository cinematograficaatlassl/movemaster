"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/useAuth";
import { getActiveWorkspaceId } from "@/lib/workspace/bootstrap";
import { addAttachment, addComment, subscribeComments, subscribeTask, updateTaskFields } from "@/lib/firestore/taskDetail";
import { uploadTaskAttachment } from "@/lib/storage/upload";
import { deleteTask } from "@/lib/firestore/taskCrud";

export default function TaskDetailPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const params = useParams<{ taskId: string }>();
  const taskId = typeof params?.taskId === "string" ? params.taskId : Array.isArray(params?.taskId) ? params.taskId[0] : "";

  const [wsId, setWsId] = useState<string | null>(null);
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    setWsId(getActiveWorkspaceId());
  }, []);

  useEffect(() => {
    if (!wsId) return;
    if (!taskId) return;
    const unsub = subscribeTask(wsId, taskId, setTask);
    return () => unsub();
  }, [wsId, taskId]);

  useEffect(() => {
    if (!wsId) return;
    if (!taskId) return;
    const unsub = subscribeComments(wsId, taskId, setComments);
    return () => unsub();
  }, [wsId, taskId]);

  const checklist = useMemo(() => (task?.checklist ?? []) as { text: string; done: boolean }[], [task]);

  return (
    <div className="min-h-dvh">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Tarea</h1>
            <p className="text-sm text-zinc-600">Detalle + comentarios + adjuntos (MVP)</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="h-9 rounded-xl border border-rose-300 bg-white px-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
              disabled={!wsId || !taskId || deleting}
              onClick={async () => {
                if (!wsId || !taskId) return;
                const ok = window.confirm("¿Eliminar esta tarea? Esto no se puede deshacer.");
                if (!ok) return;
                try {
                  setDeleting(true);
                  await deleteTask(wsId, taskId);
                  router.replace("/app/board");
                } catch (e: any) {
                  setErr(e?.message ?? "No se pudo eliminar la tarea.");
                } finally {
                  setDeleting(false);
                }
              }}
            >
              Eliminar
            </button>
            <Link className="text-sm font-semibold text-zinc-900 underline" href="/app/board">
              Volver
            </Link>
          </div>
        </div>

        {err ? <p className="mt-3 text-sm text-red-600">{err}</p> : null}

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <label className="text-xs font-medium text-zinc-700">Título</label>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
            value={task?.title ?? ""}
            onChange={(e) => setTask((t: any) => ({ ...(t ?? {}), title: e.target.value }))}
            onBlur={async () => {
              if (!wsId || !task?.title) return;
              await updateTaskFields(wsId, taskId, { title: task.title });
            }}
          />

          <label className="mt-4 block text-xs font-medium text-zinc-700">Descripción</label>
          <textarea
            className="mt-2 min-h-24 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm"
            value={task?.description ?? ""}
            onChange={(e) => setTask((t: any) => ({ ...(t ?? {}), description: e.target.value }))}
            onBlur={async () => {
              if (!wsId) return;
              await updateTaskFields(wsId, taskId, { description: task?.description ?? "" });
            }}
          />

          <div className="mt-4 grid gap-2">
            <div className="text-xs font-medium text-zinc-700">Checklist</div>
            {checklist.length === 0 ? (
              <div className="text-sm text-zinc-600">Sin checklist.</div>
            ) : (
              checklist.map((it, idx) => (
                <label key={idx} className="flex items-center gap-2 text-sm text-zinc-800">
                  <input
                    type="checkbox"
                    checked={!!it.done}
                    onChange={async (e) => {
                      if (!wsId) return;
                      const next = checklist.map((x, i) => (i === idx ? { ...x, done: e.target.checked } : x));
                      setTask((t: any) => ({ ...(t ?? {}), checklist: next }));
                      await updateTaskFields(wsId, taskId, { checklist: next });
                    }}
                  />
                  <span className={it.done ? "line-through text-zinc-500" : ""}>{it.text}</span>
                </label>
              ))
            )}
          </div>

          <div className="mt-6">
            <div className="text-xs font-medium text-zinc-700">Adjuntos</div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="file"
                className="block w-full text-sm"
                onChange={async (e) => {
                  if (!wsId || !user?.uid) return;
                  const f = e.target.files?.[0];
                  if (!f) return;
                  try {
                    setBusy(true);
                    const up = await uploadTaskAttachment(wsId, taskId, f);
                    await addAttachment(wsId, taskId, { ...up, uploadedBy: user.uid, uploadedAt: new Date().toISOString() });
                  } catch (ex: any) {
                    setErr(ex?.message ?? "No se pudo subir el adjunto.");
                  } finally {
                    setBusy(false);
                    e.target.value = "";
                  }
                }}
                disabled={busy}
              />
            </div>
            <div className="mt-2 grid gap-2">
              {(task?.attachments ?? []).map((a: any) => (
                <a
                  key={a.path}
                  href={a.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-900 underline"
                >
                  {a.name}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">Comentarios</div>
          <div className="mt-3 grid gap-2">
            {comments.map((c: any) => (
              <div key={c.id} className="rounded-xl bg-zinc-50 px-3 py-2">
                <div className="text-xs text-zinc-500">{c.createdBy}</div>
                <div className="text-sm text-zinc-900">{c.text}</div>
              </div>
            ))}
            {comments.length === 0 ? <div className="text-sm text-zinc-600">Sin comentarios.</div> : null}
          </div>

          <div className="mt-3 flex gap-2">
            <input
              className="h-11 w-full rounded-xl border border-zinc-200 px-3 text-sm"
              placeholder="Escribe un comentario… (usa @menciones)"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white disabled:opacity-50"
              disabled={!newComment.trim() || busy}
              onClick={async () => {
                if (!wsId || !user?.uid) return;
                try {
                  setBusy(true);
                  await addComment(wsId, taskId, newComment.trim(), user.uid);
                  setNewComment("");
                } catch (ex: any) {
                  setErr(ex?.message ?? "No se pudo enviar el comentario.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

