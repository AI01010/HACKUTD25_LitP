"use client";

import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
// Point workerSrc at a CDN-hosted worker so Next.js dev server doesn't need to
// serve the worker bundle. This avoids "fake worker" warnings and 404s.
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js";
import Link from "next/link";

// Typing animation used while the (simulated) bot composes an answer
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse" />
      <span className="w-2 h-2 rounded-full bg-[#00613C] animate-pulse delay-55" />
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
      text: "Hi! I'm Estate Advisor — ask me about property value, maintenance, or predictions.",
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
  // Extract text from PDFs client-side using pdfjs-dist
  async function extractTextFromPdf(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async function (e) {
        try {
          // workerSrc is configured at module load time to avoid "fake worker" warnings
          const typedarray = new Uint8Array(e.target.result);
          // Use the configured worker (served from CDN) to offload parsing.
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          let text = "";
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
          }
          resolve(text);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
  const speakBufferRef = useRef("");
  const speakTimerRef = useRef(null);

  const [pdfFiles, setPdfFiles] = useState([]);

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

  function simulateBotResponse(promptOrText, explicitResponse = null) {
    setIsSending(true);
    setIsTyping(true);
    setStreamingText("");

    const response = explicitResponse;

    // stream the response char-by-char
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

  // Unified send: sends chat text and/or PDFs if present, all at once.
  async function handleUnifiedSend(e) {
    e?.preventDefault?.();
    setPdfMessage("");
    let sentSomething = false;
    let combinedTexts = [];
    // Send chat text if not empty
    const text = input.trim();
    if (text) {
      combinedTexts.push(text.replace(/\s+/g, " ").trim());
      sentSomething = true;
    }
    // Convert PDFs to text if any are present and not uploading
    let pdfTexts = [];
    if (pdfFiles.length > 0 && !pdfUploading) {
      pdfTexts = await handlePdfFiles(pdfFiles);
      if (pdfTexts.length > 0) {
        sentSomething = true;
        // Compress whitespace in each PDF text
        combinedTexts.push(...pdfTexts.map(t => t.replace(/\s+/g, " ").trim()));
      }
    }
    // If nothing was sent, show a message
    if (!sentSomething) {
      setPdfMessage("Please enter a message or upload a PDF.");
      return;
    }
    // Prepare payload: message and array of files (filename + extracted text)
    const filesPayload = [];
    if (pdfFiles.length > 0 && pdfTexts && pdfTexts.length > 0) {
      for (let i = 0; i < pdfFiles.length; i++) {
        filesPayload.push({ filename: pdfFiles[i].name, text: pdfTexts[i] || "" });
      }
    }

    // Send message + files to backend /send_message
    try {
      const payload = { message: text || "", files: filesPayload };
      const res = await fetch("http://127.0.0.1:5000/send_message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Send failed: ${res.statusText}`);
      const data = await res.json();

      // Append user's message to chat (if present)
      if (text) addMessage("user", text.replace(/\s+/g, " ").trim());

  // Append server reply as bot message (stream + speak)
  const botReply = (data && (data.reply || data.text)) || "(no reply)";
  // Use the streaming/speaking helper so TTS and typing animation work
  simulateBotResponse(botReply, botReply);

      setPdfMessage("Message sent to backend!");
      setPdfFiles([]); // Clear selected PDFs after send
      setInput("");
    } catch (err) {
      setPdfMessage("Error sending message to backend.");
      console.error(err);
    }
  }

  // PDF text extraction only; no upload here
  async function handlePdfFiles(files) {
    setPdfUploading(true);
    setPdfMessage("");
    let allTexts = [];
    try {
      for (const file of files) {
        const text = await extractTextFromPdf(file);
        allTexts.push(text);
      }
      setPdfMessage("All PDFs converted to text!");
    } catch (err) {
      console.error("PDF text extraction error:", err);
      setPdfMessage("Error extracting text from PDFs. See console for details.");
    } finally {
      setPdfUploading(false);
    }
    return allTexts;
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
      u.rate = 2.5;
      u.pitch = 0.9;
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

  // stopSpeaking: immediately cancel any ongoing TTS and clear buffers/timers
  function stopSpeaking() {
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    } catch (e) {
      // ignore
    }
    setSpeakingId(null);
    if (speakTimerRef.current) {
      clearTimeout(speakTimerRef.current);
      speakTimerRef.current = null;
    }
    speakBufferRef.current = "";
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
        try {
          recog.stop();
        } catch (e) {}
        setRecognizing(false);
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
      handleUnifiedSend();
    }
  }

  function clearConversation() {
    setMessages([]);
    addMessage(
      "bot",
      "Hi! I'm Estate Advisor — ask me about property value, maintenance, or predictions."
    );
    setStreamingText("");
    setIsTyping(false);
  }

  // PDF file selection handler
  function handlePdfSelection(e) {
    const files = Array.from(e.target.files);
    setPdfFiles(files);
    setPdfMessage(files.length ? `${files.length} PDF(s) selected: ${files.map(f => f.name).join(", ")}` : "");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-white text-[#00613C]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-bold mb-1 leading-tight">
              Chat with Estate Advisor
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
                <div className="px-6 py-4  max-w-[70%]">
                  <div className="flex items-center gap-2 text-base text-gray-700">
                    <strong className="text-[#00613C]">Estate Advisor</strong>
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
            onSubmit={handleUnifiedSend}
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
              placeholder="Ask Estate Advisor about property value, repairs, or predictions. Press Enter to send, Shift+Enter for newline."
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
                    multiple
                    onChange={handlePdfSelection}
                    style={{ display: "inline-block" }}
                  />
                  <span>
                    {pdfUploading ? "Converting PDF..." : "Choose PDF(s)"}
                  </span>
                </label>
                {/* Show selected file names */}
                {pdfFiles.length > 0 && (
                  <div className="text-xs text-blue-700 ml-2">
                    Selected: {pdfFiles.map(f => f.name).join(", ")}
                  </div>
                )}
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

                {/* Only one submit button, sends all non-empty fields at once */}
                <button
                  type="submit"
                  className="rounded bg-green-600 hover:bg-green-700 px-4 py-2 text-white disabled:opacity-60"
                  disabled={isSending || pdfUploading}
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
