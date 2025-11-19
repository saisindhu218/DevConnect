import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

import Navbar from "@/components/layout/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import {
  Download,
  PlayCircle,
  LogOut,
  Send,
  Clock,
  Terminal,
} from "lucide-react";

import { axiosPrivate } from "@/api/axios";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

/**
 * Singleton socket helper
 */
const getSocket = () => {
  const globalAny = window as any;
  if (!globalAny.__DEVCONNECT_SOCKET) {
    globalAny.__DEVCONNECT_SOCKET = io(
      (import.meta.env.VITE_BACKEND_URL as string) || "http://localhost:5000",
      { withCredentials: true }
    );
  }
  return globalAny.__DEVCONNECT_SOCKET as ReturnType<typeof io>;
};

const socket = getSocket();

const CollaborateRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, accessToken } = useAuth();

  const username = user?.firstName || user?.username || "Guest";

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// Loading...");
  const [stdin, setStdin] = useState(""); // 🔥 NEW: program input box
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [participants, setParticipants] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const [output, setOutput] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  const [lastEdited, setLastEdited] = useState("just now");
  const lastEditRef = useRef(Date.now());
  const [loading, setLoading] = useState(true);

  const handlersRef = useRef({
    participants: (list: string[]) => {},
    chat: (msg: any) => {},
    codeUpdate: (newCode: string) => {},
  });

  // Auto-scroll console
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // "Last edited" updater
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - lastEditRef.current) / 1000);
      if (diff < 5) setLastEdited("just now");
      else if (diff < 60) setLastEdited(`${diff}s ago`);
      else if (diff < 3600) setLastEdited(`${Math.floor(diff / 60)}m ago`);
      else setLastEdited(`${Math.floor(diff / 3600)}h ago`);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Load project + join socket room
  useEffect(() => {
    let mounted = true;

    const handleParticipants = (list: string[]) => {
      if (mounted) setParticipants(list);
    };

    const handleChat = (msg: any) => {
      if (!msg) return;
      setChatMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === msg.sender && last.message === msg.message && last.time === msg.time) {
          return prev;
        }
        return [...prev, { ...msg, isSelf: false }];
      });
    };

    const handleCodeUpdate = (newCode: string) => {
      lastEditRef.current = Date.now();
      setCode(newCode);
    };

    handlersRef.current.participants = handleParticipants;
    handlersRef.current.chat = handleChat;
    handlersRef.current.codeUpdate = handleCodeUpdate;

    const loadProject = async () => {
      try {
        const res = await axiosPrivate.get(`/api/projects/${roomId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });

        const project = res.data;
        setCode(project.code || "");
        setLanguage(project.language || "javascript");

        socket.emit("join-room", roomId, username);

        socket.off("participants-update", handleParticipants);
        socket.off("chat-update", handleChat);
        socket.off("code-update", handleCodeUpdate);

        socket.on("participants-update", handleParticipants);
        socket.on("chat-update", handleChat);
        socket.on("code-update", handleCodeUpdate);

        setLoading(false);
      } catch (err) {
        toast({
          title: "Project Not Found",
          description: "You do not have access.",
          variant: "destructive",
        });
        navigate("/collaborate");
      }
    };

    loadProject();

    return () => {
      mounted = false;

      try {
        socket.emit("leave-room", roomId);
      } catch {}

      socket.off("participants-update", handleParticipants);
      socket.off("chat-update", handleChat);
      socket.off("code-update", handleCodeUpdate);
    };
  }, [roomId, username, accessToken, navigate]);

  // Code sync + auto-save
  const handleCodeChange = useCallback(
    (value?: string) => {
      const newCode = value ?? "";
      setCode(newCode);
      lastEditRef.current = Date.now();

      socket.emit("code-change", roomId, newCode);

      (async () => {
        try {
          await axiosPrivate.put(
            `/api/projects/${roomId}/code`,
            { code: newCode, language },
            { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
          );
        } catch {}
      })();
    },
    [roomId, accessToken, language]
  );

  const handleLanguageChange = async (lang: string) => {
    setLanguage(lang);
    try {
      await axiosPrivate.put(
        `/api/projects/${roomId}/code`,
        { language: lang, code },
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );
    } catch {}
  };

  // Run code (WITH stdin support)
  const handleRun = async () => {
    setOutput((prev) => [
      ...prev,
      `> Running ${language} (${new Date().toLocaleTimeString()})...`,
    ]);

    try {
      const res = await axiosPrivate.post(
        "/api/run",
        { language, code, stdin }, // ✔ SEND INPUT HERE
        { headers: { Authorization: `Bearer ${accessToken}` }, withCredentials: true }
      );

      const outLines: string[] = [];

      if (res.data?.output) outLines.push(...res.data.output.split("\n"));
      if (res.data?.error) outLines.push("Error:\n" + res.data.error);

      setOutput((prev) => [...prev, ...outLines]);
    } catch (err: any) {
      setOutput((prev) => [...prev, `Run failed: ${err.message || err}`]);
      toast({ title: "Execution failed", variant: "destructive" });
    }
  };

  // Download file
  const handleDownload = useCallback(() => {
    if (!code) {
      toast({ title: "Nothing to download", variant: "destructive" });
      return;
    }
    const extMap: Record<string, string> = {
      javascript: "js",
      python: "py",
      cpp: "cpp",
      html: "html",
    };
    const ext = extMap[language] || "txt";
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `project_${roomId}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Downloaded file" });
  }, [code, language, roomId]);

  // Send chat message
  const handleSendMessage = () => {
    if (!message.trim()) return;

    const msg = {
      sender: username,
      message: message.trim(),
      time: new Date().toLocaleTimeString(),
    };

    socket.emit("chat-message", roomId, msg);

    setChatMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === msg.sender && last.message === msg.message && last.time === msg.time) {
        return prev;
      }
      return [...prev, { ...msg, isSelf: true }];
    });

    setMessage("");
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-gray-100">
        <Navbar />
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-400">Loading project room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        
        {/* Header */}
        <Card className="p-4 mb-6 bg-[#161b22] border border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">
              Room: <span className="text-primary">{roomId}</span>
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-gray-400 text-sm">
                <Clock size={14} />
                <span>Last edited {lastEdited}</span>
              </div>

              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger className="w-40 bg-gray-800 text-gray-200 border-gray-600">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 text-gray-200">
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                onClick={handleDownload}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
              >
                <Download size={16} />
                <span>Download</span>
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-12 gap-6">
          
          {/* LEFT SIDE */}
          <div className="col-span-9 space-y-4">

            {/* Editor */}
            <Card className="overflow-hidden h-[500px] bg-[#0d1117] border border-gray-700">
              <Editor
                height="500px"
                language={language}
                value={code}
                theme="vs-dark"
                onChange={handleCodeChange}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  automaticLayout: true,
                }}
              />
            </Card>

            {/* 🔥 Program Input Box */}
            <Card className="p-3 bg-[#0b0f14] border border-gray-700">
              <p className="mb-1 text-sm text-gray-400">Program Input (stdin):</p>
              <textarea
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                placeholder="Enter input for your program, line by line..."
                className="w-full h-20 bg-black text-gray-200 p-2 rounded resize-none"
              />
            </Card>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleRun}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-1"
              >
                <PlayCircle size={16} />
                <span>Run</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="ml-auto flex items-center gap-1"
                onClick={() => {
                  socket.emit("leave-room", roomId);
                  navigate("/collaborate");
                }}
              >
                <LogOut size={16} />
                <span>Leave Room</span>
              </Button>
            </div>

            {/* Console */}
            <Card className="bg-[#0b0f14] border border-gray-700 p-3 mt-3">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <Terminal size={14} />
                <span className="font-semibold text-sm">Console</span>
              </div>
              <div
                ref={outputRef}
                className="bg-black text-gray-200 p-2 rounded h-[180px] overflow-y-auto font-mono text-sm"
              >
                {output.length === 0 ? (
                  <div className="text-gray-500">No output yet...</div>
                ) : (
                  output.map((line, i) => (
                    <div key={i} className="whitespace-pre">
                      {line}
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div className="col-span-3 space-y-6">

            {/* Participants */}
            <Card className="p-4 bg-[#161b22] border border-gray-700">
              <h3 className="font-bold mb-4 text-white">
                Participants ({participants.length})
              </h3>
              <div className="space-y-3">
                {participants.map((name, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {name?.[0] || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-sm text-gray-300">{name}</p>
                  </div>
                ))}
                {participants.length === 0 && (
                  <p className="text-gray-500">No participants yet</p>
                )}
              </div>
            </Card>

            {/* Chat */}
            <Card className="p-4 flex flex-col h-[400px] bg-[#161b22] border border-gray-700">
              <h3 className="font-bold mb-4 text-white">Chat</h3>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {chatMessages.length === 0 && (
                  <p className="text-gray-500">No messages yet</p>
                )}
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`text-sm ${
                      msg.isSelf ? "text-blue-400 text-right" : "text-gray-300 text-left"
                    }`}
                  >
                    <p className="font-semibold">
                      {msg.isSelf ? "You" : msg.sender}
                      <span className="text-xs text-gray-500 ml-2">{msg.time}</span>
                    </p>
                    <p>{msg.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 text-gray-200 border-gray-600"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Send size={16} />
                </Button>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default CollaborateRoom;
