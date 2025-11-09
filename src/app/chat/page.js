"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

// Typing animation used while the (simulated) bot composes an answer
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse delay-75" />
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse delay-150" />
    </span>
  );
}

// ChatPage: client-side chat UI with small demo bot behavior. Key features:
// - Messages array containing both user and bot messages
// - A simple `simulateBotResponse` function that streams characters to
//   the UI and pushes a final bot message
// - Optional speech recognition (microphone) and TTS (speechSynthesis)
// - Integration with the upload API: the upload handler posts a PDF to
//   `/api/upload` and uses any extracted text as a user message
export default function ChatPage() {
  // chat messages: each message { id, sender: 'user'|'bot', text, time }
  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: "bot",
      text: "Hi! I'm EstateAdvisor — ask me about property value, maintenance, or predictions.",
      time: new Date().toISOString(),
    },
  ]);

  // Controlled input for typing
  const [input, setInput] = useState("");

  // PDF upload state (used by the small PDF upload control in the UI)
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfMessage, setPdfMessage] = useState("");

  // Bot UI state for streaming/typing
  const [isTyping, setIsTyping] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Refs and vars for scrolling, recognition, and TTS handling
  const bottomRef = useRef(null);
  const recognitionRef = useRef(null);
  const [recognizing, setRecognizing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(
    () =>
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition) &&
      "speechSynthesis" in window
  );
  const [speakingId, setSpeakingId] = useState(null);
  const speakBufferRef = useRef("");
  const speakTimerRef = useRef(null);

  useEffect(() => {
    // keep scrolled to bottom when conversation updates
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, streamingText, isTyping]);

  // Helper: append a message to the conversation
  function addMessage(sender, text) {
    setMessages((m) => [
      ...m,
      {
        id: Date.now() + Math.random(),
        sender,
        text,
        time: new Date().toISOString(),
      },
    ]);
  }

  // Send a message (either raw param or current input). Triggers bot reply.
  function handleSend(raw = null) {
    const text = (raw ?? input).trim();
    if (!text) return;
    addMessage("user", text);
    setInput("");
    simulateBotResponse(text);
  }

  // PDF upload handler: posts the file to /api/upload and, on success,
  // uses the server-extracted text as a user message in the chat.
  async function handlePdfFile(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setPdfMessage("Please select a PDF file.");
      return;
    }

    setPdfUploading(true);
    setPdfMessage("");
    try {
      // Use FormData and target the Python Flask backend. The Flask upload
      // endpoint expects a multipart/form-data POST with a file field named
      // 'file'. We don't set Content-Type so the browser adds the boundary.
      const form = new FormData();
      form.append("file", file, file.name);

      const res = await fetch("http://127.0.0.1:5000/upload", {
        method: "POST",
        body: form,
        // mode: 'cors' // uncomment if running cross-origin and backend has CORS enabled
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
      const data = await res.json();
      if (data && data.text) {
        setPdfMessage("PDF uploaded and text extracted.");
        console.log(data.text);
        // send extracted text into chat as user's message
        handleSend(data.text);
      } else if (data && data.parseError) {
        setPdfMessage(`Uploaded but parse error: ${data.parseError}`);
      } else {
        setPdfMessage("Uploaded but no text extracted from PDF.");
      }
    } catch (err) {
      console.error(err);
      setPdfMessage("PDF upload failed. See console for details.");
    } finally {
      setPdfUploading(false);
    }
  }

  // Simple simulated bot behavior: picks a canned response and streams it.
  function simulateBotResponse(prompt) {
    setIsSending(true);
    setIsTyping(true);
    setStreamingText("");

    // simple canned response based on keywords for demo
    let response =
      "Thanks — I looked over that. For this property I'd estimate values will trend up moderately. Check water and maintenance to improve value. Here's a short checklist: 1) Inspect plumbing; 2) Update electrical panels if older than 20 years; 3) Fix visible cracks.\nWould you like a prediction breakdown?";
    if (/rent|income/i.test(prompt)) {
      response =
        "If you're considering rental income, estimate monthly rent at 0.8%–1% of property value depending on location and condition. I can run scenarios if you provide local comps.";
    } else if (/crack|foundation/i.test(prompt)) {
      response =
        "Cracks can indicate settlement; prioritize structural inspection. Small hairline cracks are low urgency, but wide or stepping cracks need immediate attention.";
    } else if (/value|price|worth/i.test(prompt)) {
      response =
        "Estimated market value looks stable; predicted appreciation ~3% yearly assuming no major repairs. Improvements to water/electrical systems can raise offers by 5-8%.";
    }

    // Stream the response char-by-char
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      // append to visible streaming text
      setStreamingText((s) => s + response.charAt(i - 1));
      // buffer for TTS streaming
      speakBufferRef.current += response.charAt(i - 1);
      // schedule a short debounce to speak buffered text while typing
      if (speakTimerRef.current) clearTimeout(speakTimerRef.current);
      speakTimerRef.current = setTimeout(() => {
        if (!recognizing && speechSupported && speakBufferRef.current) {
          speak(speakBufferRef.current);
        }
        // clear buffer after speaking (or skipping when recording)
        speakBufferRef.current = "";
        speakTimerRef.current = null;
      }, 300);
      // when done
      if (i >= response.length) {
        clearInterval(interval);
        // finalize: push bot message
        setMessages((m) => [
          ...m,
          {
            id: Date.now() + Math.random(),
            sender: "bot",
            text: response,
            time: new Date().toISOString(),
          },
        ]);
        setStreamingText("");
        setIsTyping(false);
        setIsSending(false);
        // speak any remaining buffered text immediately (unless recording)
        if (speakTimerRef.current) {
          clearTimeout(speakTimerRef.current);
          speakTimerRef.current = null;
        }
        if (!recognizing && speechSupported && speakBufferRef.current) {
          speak(speakBufferRef.current);
          speakBufferRef.current = "";
        }
      }
    }, 18);
  }

  useEffect(() => {
    // cleanup on unmount: stop recognition, cancel speech, clear timers
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onresult = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      speakBufferRef.current = "";
    };
  }, []);

  // speak: wrapper around speechSynthesis
  function speak(text, id = null) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      setSpeakingId(id);
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 1;
      u.pitch = 1;
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length) {
        const v =
          voices.find((vv) => vv.lang && vv.lang.startsWith("en")) || voices[0];
        if (v) u.voice = v;
      }
      u.onend = () => {
        setSpeakingId(null);
      };
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error("TTS error", e);
      setSpeakingId(null);
    }
  }

  // toggleMic: start/stop web speech recognition
  function toggleMic() {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    if (recognizing && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
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
      // show interim transcript in input
      if (final) {
        // send final transcript automatically
        setInput("");
        addMessage("user", final.trim());
        try {
          recog.stop();
        } catch (e) {}
        setRecognizing(false);
        simulateBotResponse(final.trim());
      } else {
        setInput(() => interim);
      }
    };

    recog.onerror = (e) => {
      console.error("Speech recognition error", e);
      setRecognizing(false);
    };

    recog.onend = () => {
      setRecognizing(false);
    };

    recognitionRef.current = recog;
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      }
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
      speakBufferRef.current = "";
      recog.start();
      setRecognizing(true);
    } catch (e) {
      console.error("Failed to start recognition", e);
      setRecognizing(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearConversation() {
    setMessages([]);
    addMessage(
      "bot",
      "Hi! I'm EstateAdvisor — ask me about property value, maintenance, or predictions."
    );
    setStreamingText("");
    setIsTyping(false);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white text-[#00613C]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-1 leading-tight">
              Chat with EstateAdvisor
            </h1>
            <p className="text-xl text-green-700 mb-1 leading-relaxed">
              Get instant answers about property values, maintenance insights, and market predictions.
            </p>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-1 flex flex-col gap-3">
        {/* <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={clearConversation}
              className="inline-flex items-center gap-2 text-[#00613C] font-semibold hover:text-[#00613C]/80 transition-colors"
            >
              New Conversation
            </button>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#00613C] font-semibold hover:text-[#00613C]/80 transition-colors">
              View Dashboard
            </Link>
          </div>
        </div> */}

        <div
          className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm flex-1 flex flex-col"
          style={{ minHeight: 600 }}
        >
          <div className="flex-1 overflow-auto pr-2 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`${
                    m.sender === "user"
                      ? "bg-[#00613C] text-white"
                      : "bg-gray-50 text-gray-900"
                  } max-w-[80%] px-6 py-4 rounded-xl shadow-sm border border-gray-100`}
                >
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="text-[10px] opacity-60">
                      {new Date(m.time).toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {speechSupported ? (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              if (
                                typeof window !== "undefined" &&
                                "speechSynthesis" in window &&
                                window.speechSynthesis.speaking
                              ) {
                                window.speechSynthesis.cancel();
                                setSpeakingId(null);
                                return;
                              }
                            } catch (e) {}
                            speak(m.text, m.id);
                          }}
                          className="text-xs px-2 py-1 rounded bg-white/20 dark:bg-white/5"
                        >
                          {speakingId === m.id ? "◼️" : "🎙️"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="TTS not supported"
                          disabled
                          className="text-xs px-2 py-1 rounded bg-white/5 opacity-40"
                        >
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
                <div className="bg-gray-50 px-6 py-4 rounded-xl shadow-sm border border-gray-100 max-w-[70%]">
                  <div className="flex items-center gap-2 text-base text-gray-700">
                    <strong className="text-[#00613C]">EstateAdvisor</strong>
                    <TypingDots />
                  </div>
                </div>
              </div>
            )}

            {streamingText && (
              <div className="flex justify-start">
                <div className="bg-gray-50 px-6 py-4 rounded-xl shadow-sm border border-gray-100 max-w-[70%]">
                  <div className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {streamingText}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <form
            className="mt-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <label htmlFor="chat-input" className="sr-only">
              Type a message
            </label>
            <textarea
              id="chat-input"
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full resize-none rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#fbfbfb] dark:text-gray-900"
              placeholder="Ask EstateAdvisor about property value, repairs, or predictions. Press Enter to send, Shift+Enter for newline."
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Tip: include the property price or condition for better answers.
              </div>
              <div className="flex items-center gap-2">
                {/* PDF upload input (small control) */}
                <label className="flex items-center gap-2 rounded px-3 py-2 border bg-white dark:bg-[#0b0b0b] text-sm cursor-pointer">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) handlePdfFile(f);
                      // reset the input so same file can be selected again if needed
                      e.target.value = null;
                    }}
                    style={{ display: "inline-block" }}
                  />
                  <span>
                    {pdfUploading ? "Uploading PDF..." : "Upload PDF"}
                  </span>
                </label>
                {pdfMessage && (
                  <div className="text-xs text-gray-600 ml-2">{pdfMessage}</div>
                )}

                {speechSupported ? (
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`rounded px-3 py-2 border ${
                      recognizing
                        ? "bg-red-500 text-white"
                        : "bg-white dark:bg-gray-100 hover:bg-gray-300 text-gray-700 dark:text-gray-200"
                    }`}
                    title={recognizing ? "Stop recording" : "Record voice"}
                  >
                    {recognizing ? "◼️" : "🎤"}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Speech not supported"
                    className="rounded px-3 py-2 border opacity-40"
                  >
                    🎤
                  </button>
                )}

                <button
                  type="submit"
                  className="rounded bg-green-600 hover:bg-green-700 px-4 py-2 text-white disabled:opacity-60"
                  disabled={isSending}
                >
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
