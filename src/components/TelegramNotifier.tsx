import React, { useState, useEffect } from "react";
import { getDatabase, ref, get, set } from "firebase/database";
import { initializeApp } from "firebase/app";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save,
  Send,
  Trash2,
  Image as ImageIcon,
  MessageSquare,
  Settings,
  Loader2,
  Wifi,
  WifiOff,
  Plus
} from "lucide-react";

// ------------------- Firebase Config -------------------
const firebaseConfig = {
  apiKey: "AIzaSyCAKMRzJCEsggLYQH8JjltkUAnVNbL43pg",
  authDomain: "revenueearn-3a001.firebaseapp.com",
  databaseURL: "https://revenueearn-3a001-default-rtdb.firebaseio.com",
  projectId: "revenueearn-3a001",
  storageBucket: "revenueearn-3a001.firebasestorage.app",
  messagingSenderId: "95210268419",
  appId: "1:95210268419:web:1050be3f3884f52fb82b36",
  measurementId: "G-H35J7NTZ32"
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const CLOUD_NAME = "deu1ngeov";
const UPLOAD_PRESET = "ml_default";
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

interface Button {
  text: string;
  url: string;
}

type ButtonLayout = "vertical" | "horizontal";

const TelegramNotifier: React.FC = () => {
  const [botToken, setBotToken] = useState("");
  const [message, setMessage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [buttons, setButtons] = useState<Button[]>([
    { text: "Button 1", url: "https://example.com/1" },
    { text: "Button 2", url: "https://example.com/2" }
  ]);
  const [buttonLayout] = useState<ButtonLayout>("vertical");
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [, setConnectionStatus] = useState("checking");

  // ------------------- Effects -------------------
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch(
          "https://7a04fb8f-f6f0-44ff-81aa-4749b3cbe3cd.e1-us-east-azure.choreoapps.dev"
        );
        if (response.ok) {
          const data = await response.json();
          setIsBackendOnline(data.status === "healthy");
          setConnectionStatus("connected");
        } else {
          setIsBackendOnline(false);
          setConnectionStatus("error");
        }
      } catch (error) {
        setIsBackendOnline(false);
        setConnectionStatus("error");
        console.error("connection failed:", error);
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchBotToken = async () => {
      try {
        const snapshot = await get(ref(db, "botToken"));
        if (snapshot.exists()) setBotToken(snapshot.val());
      } catch (err) {
        console.error("Error fetching bot token:", err);
      }
    };
    fetchBotToken();
  }, []);

  // ------------------- Actions -------------------
  const saveBotToken = async () => {
    if (!botToken) return alert("Bot token cannot be empty");
    try {
      await set(ref(db, "botToken"), botToken);
      alert("Bot token updated successfully!");
    } catch (err) {
      alert("Failed to update bot token: " + err);
    }
  };

  const handleButtonChange = (
    index: number,
    field: "text" | "url",
    value: string
  ) => {
    const newButtons = [...buttons];
    newButtons[index][field] = value;
    setButtons(newButtons);
  };

  const addButton = () => {
    setButtons((prev) => [
      ...prev,
      { text: `Button ${prev.length + 1}`, url: "https://example.com" }
    ]);
  };

  const removeButton = (index: number) => {
    const newButtons = buttons.filter((_, i) => i !== index);
    setButtons(newButtons);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
      const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error("Image upload failed:", err);
      return null;
    }
  };

  const testBotToken = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(
        "https://cf287f23-1c3e-41ca-8c89-8ea0fcf09712.e1-us-east-azure.choreoapps.dev/api/test-notification",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ botToken: token, buttonLayout: buttonLayout })
        }
      );

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error("Bot token test failed:", error);
      return false;
    }
  };

  const sendNotification = async () => {
    if (!message && !imageFile) {
      alert("Please type a message or select an image.");
      return;
    }

    if (!botToken) {
      alert("Please save your bot token first.");
      return;
    }

    setIsLoading(true);
    try {
      const isTokenValid = await testBotToken(botToken);
      if (!isTokenValid) {
        alert("❌ Invalid bot token. Please check your bot token and try again.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      alert("❌ Failed to validate bot token. Please check your connection.");
      setIsLoading(false);
      return;
    }

    const imageUrl = await uploadImage();
    const payload = {
      message,
      imageUrl,
      buttons: buttons.filter((btn) => btn.text && btn.url),
      botToken,
      buttonLayout
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(
        "https://cf287f23-1c3e-41ca-8c89-8ea0fcf09712.e1-us-east-azure.choreoapps.dev/api/send-notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.success) {
        alert(
          `✅ Notification sent successfully!\n\n📊 Stats:\n• Total users: ${data.stats.totalUsers}\n• Successful: ${data.stats.successful}\n• Failed: ${data.stats.failed}\n• Layout: ${buttonLayout}`
        );

        setMessage("");
        setImageFile(null);
        setButtons([
          { text: "Button 1", url: "https://example.com/1" },
          { text: "Button 2", url: "https://example.com/2" }
        ]);

        const fileInput = document.getElementById(
          "image-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        alert(`❌ Failed to send notification: ${data.error}`);
      }
    } catch (err: any) {
      console.error("Full error details:", err);

      if (err.name === "AbortError") {
        alert(
          "⏰ Request timeout: Backend is taking too long to respond. Please try again."
        );
      } else if (err.message.includes("Failed to fetch")) {
        alert(
          "🌐 Network error: Cannot connect to backend server. Please check:\n• Your internet connection\n• Backend server status"
        );
      } else if (err.message.includes("Invalid bot token")) {
        alert(
          "🔑 Invalid bot token: Please check your bot token and ensure the bot exists."
        );
      } else {
        alert(`🚨 Error sending notification: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------- Motion Variants -------------------
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  } as const;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  } as const;

  // ------------------- UI -------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-6 sm:py-8 px-3 sm:px-4">
      <motion.div
        className="mx-auto w-full max-w-lg sm:max-w-2xl lg:max-w-4xl bg-slate-800/80 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border border-slate-700"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Header */}
        <motion.div
          className="bg-gradient-to-r from-blue-800 via-blue-700 to-indigo-800 px-4 sm:px-6 py-5 sm:py-6"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          
        </motion.div>

        {/* Connection Status */}
        <motion.div
          className={`px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-medium flex items-center justify-center gap-2 ${
            isBackendOnline
              ? "bg-green-900/50 text-green-300"
              : "bg-red-900/50 text-red-300"
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {isBackendOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>❌ Backend offline - check server status</span>
            </>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Bot Token */}
          <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
            <label className="block text-xs sm:text-sm font-semibold text-blue-200 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Bot Token</span>
            </label>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
              <input
                type="text"
                autoComplete="off"
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="Enter your bot token"
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-white placeholder-slate-400"
              />
              <motion.button
                onClick={saveBotToken}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-3 sm:px-4 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all font-medium inline-flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Save</span>
              </motion.button>
            </div>
          </motion.div>

          {/* Grid: Message & Image side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
            {/* Message */}
            <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-semibold text-blue-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>Message</span>
              </label>
              <textarea
                placeholder="Type your notification message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-white placeholder-slate-400 resize-y min-h-[120px]"
              />
            </motion.div>

            {/* Image Upload */}
            <motion.div variants={itemVariants} className="space-y-2 sm:space-y-3">
              <label className="block text-xs sm:text-sm font-semibold text-blue-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Image Attachment</span>
              </label>
              <motion.div
                className="border-2 border-dashed border-slate-600 rounded-lg p-4 sm:p-6 text-center transition-all hover:border-blue-500 hover:bg-blue-900/20 cursor-pointer"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <span className="text-xs sm:text-sm text-slate-300 break-all">
                    {imageFile ? imageFile.name : "Click to upload an image"}
                  </span>
                  {imageFile && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-green-400 mt-2"
                    >
                      ✓ Image selected
                    </motion.p>
                  )}
                </label>
              </motion.div>
            </motion.div>
          </div>

          {/* Buttons Section */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="block text-xs sm:text-sm font-semibold text-blue-200">
                Quick Action Buttons
              </span>
              <motion.button
                onClick={addButton}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-100"
              >
                <Plus className="w-4 h-4" /> Add Button
              </motion.button>
            </div>

            <div className="space-y-3 max-h-64 sm:max-h-72 overflow-y-auto pr-1 sm:pr-2 custom-scroll">
              <AnimatePresence>
                {buttons.map((btn, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-slate-700/50 p-3 sm:p-4 rounded-lg border border-slate-600 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-300 bg-slate-600/70 px-2 py-1 rounded">
                        Button {index + 1}
                      </span>
                      {buttons.length > 1 && (
                        <motion.button
                          onClick={() => removeButton(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="text-red-400 hover:text-red-300 transition-colors p-1 rounded"
                          aria-label={`Remove Button ${index + 1}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                      <input
                        type="text"
                        placeholder="Button Text"
                        value={btn.text}
                        onChange={(e) => handleButtonChange(index, "text", e.target.value)}
                        className="px-3 py-2 bg-slate-600/80 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm text-white placeholder-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Button URL"
                        value={btn.url}
                        onChange={(e) => handleButtonChange(index, "url", e.target.value)}
                        className="px-3 py-2 bg-slate-600/80 border border-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-sm text-white placeholder-slate-400"
                      />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Send Button */}
          <motion.button
            onClick={sendNotification}
            disabled={isLoading || !isBackendOnline}
            variants={itemVariants}
            whileHover={{ scale: isLoading || !isBackendOnline ? 1 : 1.02 }}
            whileTap={{ scale: isLoading || !isBackendOnline ? 1 : 0.98 }}
            className={`w-full py-3.5 sm:py-4 rounded-lg font-semibold text-white transition-all focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-800 ${
              isLoading || !isBackendOnline
                ? "bg-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-lg hover:shadow-xl"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending...</span>
              </div>
            ) : !isBackendOnline ? (
              <div className="flex items-center justify-center gap-2">
                <WifiOff className="w-5 h-5" />
                <span>Backend Offline</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <Send className="w-5 h-5" />
                <span>Send Notification</span>
              </div>
            )}
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Small utility: custom scrollbar for WebKit */}
      <style>{`
        .custom-scroll::-webkit-scrollbar { height: 8px; width: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.3); border-radius: 8px; }
        .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.5); }
      `}</style>
    </div>
  );
};

export default TelegramNotifier;
