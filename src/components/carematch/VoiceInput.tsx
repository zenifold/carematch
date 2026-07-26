import { useEffect, useRef, useState, type TextareaHTMLAttributes } from "react";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

// Minimal Web Speech API typings (browsers still expose this as vendor-prefixed).
type SpeechRecognitionEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string; isFinal?: boolean }> & { isFinal?: boolean }>;
  resultIndex: number;
};
type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange" | "value"> & {
  value: string;
  onChange: (next: string) => void;
  label?: string;
  helper?: string;
};

/**
 * VoiceInput — textarea with a persistent microphone.
 * Falls back to a plain textarea when speech recognition isn't supported.
 */
export function VoiceInput({
  value,
  onChange,
  label,
  helper,
  placeholder,
  className = "",
  id,
  ...rest
}: Props) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionInstance | null>(null);
  const supportedRef = useRef<boolean>(false);
  const baseValueRef = useRef<string>(value);

  useEffect(() => {
    supportedRef.current = getSpeechRecognition() !== null;
  }, []);

  const toggle = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      toast.info("Voice input isn't supported on this browser. Please type instead.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    baseValueRef.current = value ? value + " " : "";
    rec.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const alt = event.results[i][0];
        if (alt?.transcript) transcript += alt.transcript;
      }
      onChange((baseValueRef.current + transcript).replace(/\s+/g, " ").trimStart());
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const inputId = id ?? `voice-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-lg font-semibold">
          {label}
        </label>
      )}
      <div className="relative mt-2">
        <textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-32 w-full rounded-2xl border border-input bg-card px-5 py-4 pr-16 text-lg outline-none ring-primary focus:ring-2"
          {...rest}
        />
        <button
          type="button"
          onClick={toggle}
          aria-pressed={listening}
          aria-label={listening ? "Stop voice input" : "Start voice input"}
          className={`absolute right-3 top-3 grid size-12 place-items-center rounded-full transition-colors ${
            listening
              ? "bg-destructive text-destructive-foreground animate-pulse"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          }`}
        >
          {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
        </button>
      </div>
      {helper && <p className="mt-2 text-sm text-muted-foreground">{helper}</p>}
    </div>
  );
}
