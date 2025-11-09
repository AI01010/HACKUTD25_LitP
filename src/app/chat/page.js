
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function TypingDots() {
	return (
		<span className="inline-flex items-center gap-1">
			<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
			<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-75" />
			<span className="w-2 h-2 rounded-full bg-green-500 animate-pulse delay-150" />
		</span>
	);
}

export default function ChatPage() {
	const [messages, setMessages] = useState(() => [
		{ id: 1, sender: "bot", text: "Hi! I'm EstateAdvisor — ask me about property value, maintenance, or predictions.", time: new Date().toISOString() },
	]);
	const [input, setInput] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const [streamingText, setStreamingText] = useState("");
	const [isSending, setIsSending] = useState(false);
	const bottomRef = useRef(null);

	useEffect(() => {
		// keep scrolled to bottom
		bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [messages, streamingText, isTyping]);

	function addMessage(sender, text) {
		setMessages((m) => [...m, { id: Date.now() + Math.random(), sender, text, time: new Date().toISOString() }]);
	}

	function handleSend(raw = null) {
		const text = (raw ?? input).trim();
		if (!text) return;
		// user message
		addMessage("user", text);
		setInput("");
		// simulate bot response
		simulateBotResponse(text);
	}

	function simulateBotResponse(prompt) {
		setIsSending(true);
		setIsTyping(true);
		setStreamingText("");

		// simple canned response based on keywords for demo
		let response = "Thanks — I looked over that. For this property I'd estimate values will trend up moderately. Check water and maintenance to improve value. Here's a short checklist: 1) Inspect plumbing; 2) Update electrical panels if older than 20 years; 3) Fix visible cracks.\nWould you like a prediction breakdown?";
		if (/rent|income/i.test(prompt)) {
			response = "If you're considering rental income, estimate monthly rent at 0.8%–1% of property value depending on location and condition. I can run scenarios if you provide local comps.";
		} else if (/crack|foundation/i.test(prompt)) {
			response = "Cracks can indicate settlement; prioritize structural inspection. Small hairline cracks are low urgency, but wide or stepping cracks need immediate attention.";
		} else if (/value|price|worth/i.test(prompt)) {
			response = "Estimated market value looks stable; predicted appreciation ~3% yearly assuming no major repairs. Improvements to water/electrical systems can raise offers by 5-8%.";
		}

		// stream the response char-by-char
		let i = 0;
		const interval = setInterval(() => {
			i += 1;
			setStreamingText((s) => s + response.charAt(i - 1));
			// when done
			if (i >= response.length) {
				clearInterval(interval);
				// finalize: push bot message
				setMessages((m) => [...m, { id: Date.now() + Math.random(), sender: "bot", text: response, time: new Date().toISOString() }]);
				setStreamingText("");
				setIsTyping(false);
				setIsSending(false);
			}
		}, 18);
	}

	function handleKeyDown(e) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	function clearConversation() {
		setMessages([]);
		addMessage("bot", "Hi! I'm EstateAdvisor — ask me about property value, maintenance, or predictions.");
		setStreamingText("");
		setIsTyping(false);
	}

	return (
		<div className="min-h-screen bg-zinc-50 dark:bg-black p-6">
			<main className="mx-auto max-w-3xl flex flex-col gap-4">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">EstateAdvisor Chat</h1>
					<div className="flex items-center gap-3">
						<Link href="/dashboard" className="text-sm text-green-600">Dashboard</Link>
						<button onClick={clearConversation} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-300">New convo</button>
					</div>
				</div>

				<div className="rounded-md border bg-white dark:bg-[#0b0b0b] p-4 shadow-sm flex-1 flex flex-col" style={{ minHeight: 420 }}>
					<div className="flex-1 overflow-auto pr-2 space-y-3">
						{messages.map((m) => (
							<div key={m.id} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
								<div className={`${m.sender === "user" ? "bg-green-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"} max-w-[80%] px-4 py-2 rounded-lg`}> 
									<div className="text-sm whitespace-pre-wrap">{m.text}</div>
									<div className="text-[10px] opacity-60 mt-1 text-right">{new Date(m.time).toLocaleTimeString()}</div>
								</div>
							</div>
						))}

						{isTyping && (
							<div className="flex justify-start">
								<div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg max-w-[70%]">
									<div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200"> 
										<strong className="text-green-600">EstateAdvisor</strong>
										<TypingDots />
									</div>
								</div>
							</div>
						)}

						{streamingText && (
							<div className="flex justify-start">
								<div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg max-w-[70%]">
									<div className="text-sm whitespace-pre-wrap">{streamingText}</div>
								</div>
							</div>
						)}

						<div ref={bottomRef} />
					</div>

					<form className="mt-4" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
						<label htmlFor="chat-input" className="sr-only">Type a message</label>
						<textarea
							id="chat-input"
							rows={2}
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							className="w-full resize-none rounded-md border px-3 py-2 text-sm bg-white dark:bg-[#0b0b0b] dark:text-gray-100"
							placeholder="Ask EstateAdvisor about property value, repairs, or predictions. Press Enter to send, Shift+Enter for newline."
						/>

						<div className="mt-3 flex items-center justify-between">
							<div className="text-sm text-gray-500">Tip: include the property price or condition for better answers.</div>
							<div className="flex items-center gap-2">
								<button type="submit" className="rounded bg-green-600 hover:bg-green-700 px-4 py-2 text-white disabled:opacity-60" disabled={isSending}>Send</button>
							</div>
						</div>
					</form>
				</div>
			</main>
		</div>
	);
}
