"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Speaking a statement instead of typing it, through the browser's own
 * recogniser. Nothing is recorded and nothing is uploaded: the words land in
 * the same textarea, save down the same path, and an account that was spoken
 * is indistinguishable from one that was typed by the time it is stored.
 */

type Result = { isFinal: boolean; 0: { transcript: string } };
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<Result> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type Ctor = new () => Recognition;

function ctor(): Ctor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: Ctor; webkitSpeechRecognition?: Ctor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const FAILED: Record<string, string> = {
  "not-allowed": "Your browser is blocking the microphone. Allow it in the address bar and try again.",
  "service-not-allowed": "Your browser is blocking the microphone. Allow it in the address bar and try again.",
  network: "The recogniser could not be reached. Check your connection, or just type it.",
  "audio-capture": "No microphone found. Plug one in, or just type it.",
};

export default function Dictate({
  onText,
}: {
  /** Called with each finished phrase, as it is recognised. */
  onText: (chunk: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [heard, setHeard] = useState("");
  const [error, setError] = useState<string | null>(null);

  const rec = useRef<Recognition | null>(null);
  const wanted = useRef(false);
  // onresult closes over this, and the panel hands us a new onText each render.
  const latest = useRef(onText);
  latest.current = onText;

  useEffect(() => setSupported(ctor() !== null), []);

  const stop = useCallback(() => {
    wanted.current = false;
    setOn(false);
    setHeard("");
    rec.current?.stop();
  }, []);

  const start = useCallback(() => {
    const C = ctor();
    if (!C) return;
    const r = new C();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;

    r.onresult = (e) => {
      let done = "";
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) done += result[0].transcript;
        else interim += result[0].transcript;
      }
      // One call per event: two of them would both read the same stale body.
      if (done) latest.current(done);
      setHeard(interim);
    };
    r.onerror = (e) => {
      // A pause in speech ends the run on some browsers; onend restarts it.
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(FAILED[e.error] ?? "The recogniser stopped. You can try again, or just type it.");
      wanted.current = false;
      setOn(false);
    };
    // Chrome ends a continuous run on its own every so often. Pick it back up
    // unless the person actually asked it to stop.
    r.onend = () => {
      setHeard("");
      if (wanted.current) {
        try {
          r.start();
          return;
        } catch {
          /* already restarting */
        }
      }
      setOn(false);
    };

    rec.current = r;
    wanted.current = true;
    setError(null);
    try {
      r.start();
      setOn(true);
    } catch {
      setError("Could not start the microphone. You can just type it.");
      wanted.current = false;
    }
  }, []);

  // Leaving the step, or the page, must not leave the microphone open.
  useEffect(() => () => {
    wanted.current = false;
    rec.current?.abort();
  }, []);

  if (!supported) return null;

  return (
    <div className="dictate">
      <button
        type="button"
        className={`btn ghost dictate-btn${on ? " on" : ""}`}
        aria-pressed={on}
        onClick={() => (on ? stop() : start())}
      >
        <span className="dictate-dot" aria-hidden="true" />
        {on ? "Stop speaking" : "Speak it instead"}
      </button>
      <span className="hint" aria-live="polite">
        {error
          ? error
          : on
            ? heard
              ? `“${heard}”`
              : "Listening. Speak normally; it writes into the box as you go."
            : "Nothing is recorded. Your words arrive in the box as text."}
      </span>
    </div>
  );
}
