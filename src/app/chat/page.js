"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Typing animation dots
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse delay-55" />
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse delay-150" />
    </span>
  );
}

export default function ChatPage() {
  // --- State ---
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm Estate Advisor — ask me about property value, maintenance, or predictions.",
      time: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [pdfFiles, setPdfFiles] = useState([]);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(
    typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition) &&
      "speechSynthesis" in window
  );
  const [speakingId, setSpeakingId] = useState(null);

  // --- Refs ---
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const speakBufferRef = useRef("");
  const speakTimerRef = useRef(null);

  // --- Effects ---
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText, isTyping]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  // --- TTS ---
  function speak(text, id = null) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      setSpeakingId(id);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 1.5;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      if (voices.length) {
        const v = voices.find((vv) => vv.lang.startsWith("en")) || voices[0];
        if (v) u.voice = v;
      }
      u.onend = () => setSpeakingId(null);
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("TTS error", e);
      setSpeakingId(null);
    }
  }

  function stopSpeaking() {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
    setSpeakingId(null);
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    speakBufferRef.current = "";
  }

  // --- PDF upload ---
  function handlePdfSelection(e) {
    const files = Array.from(e.target.files);
    setPdfFiles(files);
    setPdfMessage(
      files.length ? `Selected ${files.length} PDF(s): ${files.map(f => f.name).join(", ")}` : ""
    );
  }

  // --- Add message ---
  function addMessage(sender, text) {
    setMessages((m) => [
      ...m,
      { id: Date.now() + Math.random(), sender, text, time: new Date().toISOString() },
    ]);
  }

  // --- Speech recognition ---
  function toggleMic() {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    // Stop existing recognition
    if (recognizing && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setRecognizing(false);
      return;
    }

    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.maxAlternatives = 1;

    recog.onresult = (ev) => {
      let interim = "";
      let final = "";
      for (let i = ev.resultIndex; i < ev.results.length; ++i) {
        const res = ev.results[i];
        if (res.isFinal) final += res[0].transcript;
        else interim += res[0].transcript;
      }
      if (final) {
        try { recog.stop(); } catch {}
        setRecognizing(false);
        setInput(final);
      } else {
        setInput(interim);
      }
    };

    recog.onerror = () => setRecognizing(false);
    recog.onend = () => setRecognizing(false);

    recognitionRef.current = recog;
    try {
      stopSpeaking();
      recog.start();
      setRecognizing(true);
    } catch (e) {
      console.error("Failed to start recognition", e);
      setRecognizing(false);
    }
  }

  // --- Bot response ---
  function simulateBotResponse(promptOrText, explicitResponse = null) {
    setIsSending(true);
    setIsTyping(true);
    setStreamingText("");

    const response = explicitResponse;
    let i = 0;

    const interval = setInterval(() => {
      i += 1;
      const nextChar = response.charAt(i - 1);

      // Update visible text
      setStreamingText((s) => s + nextChar);

      // Buffer for TTS
      speakBufferRef.current += nextChar;

      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      speakTimerRef.current = setTimeout(() => {
        if (!recognizing && speakBufferRef.current) {
          speak(speakBufferRef.current);
          speakBufferRef.current = "";
        }
        speakTimerRef.current = null;
      }, 150);

      if (i >= response.length) {
        clearInterval(interval);
        addMessage("bot", response);
        setStreamingText("");
        setIsTyping(false);
        setIsSending(false);
        if (speakBufferRef.current) speak(speakBufferRef.current);
        speakBufferRef.current = "";
      }
    }, 20);
  }

  // --- Send handler ---
  async function handleUnifiedSend(e) {
    e?.preventDefault?.();
    stopSpeaking();

    if (!input.trim() && pdfFiles.length === 0) {
      setPdfMessage("Please type a message or upload a PDF.");
      return;
    }

    // Append user message
    if (input.trim()) addMessage("user", input.trim());

    // For now: simulate bot reply
    const botReply = "This is a demo response from Estate Advisor.";
    simulateBotResponse(input, botReply);

    setInput("");
    setPdfFiles([]);
    setPdfMessage("");
  }

  // --- Enter key ---
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleUnifiedSend();
    }
  }

  // --- Clear conversation ---
  function clearConversation() {
    setMessages([]);
    addMessage("bot", "Hi! I'm Estate Advisor — ask me about property value, maintenance, or predictions.");
    setStreamingText("");
    setIsTyping(false);
  }

  // --- Render ---
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="bg-white text-[#00613C]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-1 leading-tight">
              Chat with Estate Advisor
            </h1>
            <p className="text-xl text-[#00613C] mb-1 leading-relaxed">
              Get instant answers about property values, maintenance insights, and market predictions.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-1 flex flex-col gap-3">
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col" style={{ minHeight: 600 }}>
          <div className="flex-1 overflow-auto pr-2 space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`${m.sender === "user" ? "bg-[#00613C] text-white" : "bg-gray-50 text-gray-900"} max-w-[80%] px-6 py-4 rounded-xl shadow-sm border border-gray-100`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-[10px] opacity-60">{new Date(m.time).toLocaleTimeString()}</div>
                    <div className="flex items-center gap-2">
                      {speechSupported ? (
                        <button type="button" onClick={() => {
                          if (window.speechSynthesis.speaking) stopSpeaking();
                          else speak(m.text, m.id);
                        }} className="text-xs px-2 py-1 rounded bg-white/20">
                          {speakingId === m.id ? "◼️" : "🎙️"}
                        </button>
                      ) : (
                        <button type="button" disabled className="text-xs px-2 py-1 rounded bg-white/5 opacity-40">
                          🎙️
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="px-6 py-4 max-w-[70%] flex items-center gap-2 text-base text-gray-700">
                  <strong className="text-[#00613C]">Estate Advisor</strong>
                  <TypingDots />
                </div>
              </div>
            )}

            {streamingText && (
              <div className="flex justify-start">
                <div className="bg-gray-50 px-6 py-4 rounded-xl shadow-sm border border-gray-100 max-w-[70%]">
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">{streamingText}</div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form className="mt-4" onSubmit={handleUnifiedSend}>
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm bg-white"
              placeholder="Ask Estate Advisor about property value, repairs, or predictions. Press Enter to send, Shift+Enter for newline."
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">Tip: include the property price or condition for better answers.</div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 rounded px-3 py-2 border bg-white text-sm cursor-pointer">
                  <input type="file" accept="application/pdf" multiple onChange={handlePdfSelection} style={{ display: "inline-block" }} />
                  <span>{pdfUploading ? "Converting PDF..." : "Choose PDF(s)"}</span>
                </label>
                {pdfFiles.length > 0 && <div className="text-xs text-blue-700 ml-2">Selected: {pdfFiles.map(f => f.name).join(", ")}</div>}
                {pdfMessage && <div className="text-xs text-gray-600 ml-2">{pdfMessage}</div>}

                <button type="button" onClick={toggleMic} className={`rounded px-3 py-2 border ${recognizing ? "bg-red-500 text-white" : "bg-white hover:bg-gray-300 text-gray-700"}`} title={recognizing ? "Stop recording" : "Record voice"}>
                  {recognizing ? "◼️" : "🎤"}
                </button>

                <button type="submit" className="rounded bg-green-600 hover:bg-green-700 px-4 py-2 text-white disabled:opacity-60" disabled={isSending || pdfUploading}>
                  Send
                </button>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
