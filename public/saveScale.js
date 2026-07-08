// public/saveScale.js

const SESSION_STORAGE_KEY = 'microtonal_scale_session_id';

/**
 * 実験セッションIDを取得する。
 * なければ新しく作って localStorage に保存する。
 */
export function getOrCreateSessionId() {
  let sessionId = localStorage.getItem(SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = `${Date.now()}_${crypto.randomUUID()}`;
    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
}

/**
 * 参加者コードをURLから取得する。
 * 例: v1.html?participant=P001
 */
export function getParticipantCode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('participant') || null;
}

/**
 * 音階データをSupabaseへ保存するための共通関数。
 *
 * v1 / v2 / v6 からこの関数を呼ぶ。
 */
export async function saveScaleSubmission({
  systemId,
  systemName,
  baseFrequency = 261.63,
  notes,
  rawUiData = {}
}) {
  if (!systemId) {
    throw new Error('systemId is required');
  }

  if (!Array.isArray(notes) || notes.length === 0) {
    throw new Error('notes must be a non-empty array');
  }

  const payload = {
    participant_code: getParticipantCode(),
    session_id: getOrCreateSessionId(),
    system_id: systemId,
    system_name: systemName,
    base_frequency: baseFrequency,
    notes,
    raw_ui_data: rawUiData
  };

  const response = await fetch('/api/submit-scale', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    console.error('保存エラー:', result);
    throw new Error(result.error || '音階データの保存に失敗しました');
  }

  return result;
}