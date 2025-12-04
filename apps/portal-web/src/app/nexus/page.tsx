"use client";

import { FractureShell } from "@/components/fracture/FractureShell";
import { HeroPanel } from "@/components/fracture/HeroPanel";
import { useEffect, useState, useRef, useCallback } from "react";
import { MessageSquare, Send, Sparkles, MoreVertical, MessageCircle, VolumeX, Flag, Image as ImageIcon, X, EyeOff, Plus, Settings, Users, Music, Shield, Network, Activity, Upload, Download, Server } from "lucide-react";
import { FabricTopology } from "@/components/fracture/FabricTopology";
import { HealthPanel } from "@/components/observability/HealthPanel";
import { useRitual } from "@/lib/rituals/RitualContextProvider";
import { GENESIS_CONFIG } from "@/config/genesis";
import { useGenesis } from "@/lib/genesis/GenesisContextProvider";
import { useFabricService } from "@/lib/fabric/FabricServiceSelector";
import { OpsLogView } from "@/components/ops/OpsLogView";
import {
  graphqlRequest,
  getChatHeaders,
  QUERIES,
  MUTATIONS,
  type ChatMessage,
  type ChatRoom,
  type ChatUser,
  type RoomMusicItem,
} from "@/lib/graphql";
import { MusicPlayer } from "@/components/chat/MusicPlayer";
import { DEMIURGE_RPC_URL } from "@/config/demiurge";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";

type ChatView = "world" | "dm" | "custom" | null;
type ActiveRoom = 
  | { type: "world" } 
  | { type: "dm"; roomId: string; recipient: ChatUser }
  | { type: "custom"; roomId: string; room: ChatRoom };

interface ContextMenu {
  x: number;
  y: number;
  message: ChatMessage;
}

type NexusTab = "chat" | "analytics" | "ops";

export default function NexusPage() {
  const { identity } = useAbyssID();
  const { fabricRitualEffects } = useRitual();
  
  // Use FabricServiceProvider for unified Fabric data
  const fabricService = useFabricService();
  
  // Genesis mode: use synthetic Fabric data (fallback)
  let genesisContext: ReturnType<typeof useGenesis> | null = null;
  try {
    if (GENESIS_CONFIG.enabled) {
      genesisContext = useGenesis();
    }
  } catch {
    // Genesis context not available
  }
  const [activeTab, setActiveTab] = useState<NexusTab>("chat");
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [currentUsername, setCurrentUsername] = useState<string>("");
  const [activeView, setActiveView] = useState<ChatView>(null);
  
  // P2P Analytics state
  const [p2pStats, setP2pStats] = useState({
    connectedPeers: 0,
    totalBandwidth: { up: 0, down: 0 },
    seededContent: 0,
    downloadedContent: 0,
    networkHealth: "unknown" as "healthy" | "degraded" | "offline" | "unknown",
  });
  const [seedingEnabled, setSeedingEnabled] = useState(false);
  const [loadingP2P, setLoadingP2P] = useState(false);
  const [activeRoom, setActiveRoom] = useState<ActiveRoom | null>(null);
  const [worldMessages, setWorldMessages] = useState<ChatMessage[]>([]);
  const [dmRooms, setDmRooms] = useState<ChatRoom[]>([]);
  const [roomMessages, setRoomMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null);
  const [silencedUsers, setSilencedUsers] = useState<Set<string>>(new Set());
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: string } | null>(null);
  const [userNfts, setUserNfts] = useState<any[]>([]);
  const [loadingNfts, setLoadingNfts] = useState(false);
  const [customRooms, setCustomRooms] = useState<ChatRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showRoomSettings, setShowRoomSettings] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomDescription, setNewRoomDescription] = useState("");
  const [newRoomSlug, setNewRoomSlug] = useState("");
  const [audioData, setAudioData] = useState<{ frequency: number; amplitude: number } | null>(null);
  const [isWindowFocused, setIsWindowFocused] = useState(true);
  const [muteWhenUnfocused, setMuteWhenUnfocused] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [archivedDms, setArchivedDms] = useState<Set<string>>(new Set());
  const [hoveredDm, setHoveredDm] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [roomSettingsFontFamily, setRoomSettingsFontFamily] = useState<string>("");
  const [roomSettingsFontSize, setRoomSettingsFontSize] = useState<number>(14);
  const [roomSettingsRules, setRoomSettingsRules] = useState<string>("");
  const [showAddMusic, setShowAddMusic] = useState(false);
  const [newMusicSourceType, setNewMusicSourceType] = useState<string>("spotify");
  const [newMusicSourceUrl, setNewMusicSourceUrl] = useState<string>("");
  const [newMusicTitle, setNewMusicTitle] = useState<string>("");
  const [newMusicArtist, setNewMusicArtist] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Load silenced users from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("demiurge_silenced_users");
    if (stored) {
      try {
        setSilencedUsers(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to load silenced users:", e);
      }
    }
  }, []);

  // Load archived DMs from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("demiurge_archived_dms");
    if (stored) {
      try {
        setArchivedDms(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to load archived DMs:", e);
      }
    }
  }, []);

  const handleArchiveDm = (roomId: string) => {
    const newArchived = new Set(archivedDms);
    newArchived.add(roomId);
    setArchivedDms(newArchived);
    localStorage.setItem("demiurge_archived_dms", JSON.stringify(Array.from(newArchived)));
    setHoveredDm(null);
  };

  // Load user settings
  useEffect(() => {
    const stored = localStorage.getItem("demiurge_chat_settings");
    if (stored) {
      try {
        const settings = JSON.parse(stored);
        setMuteWhenUnfocused(settings.muteWhenUnfocused || false);
      } catch (e) {
        console.error("Failed to load chat settings:", e);
      }
    }
  }, []);

  // Save user settings
  const saveChatSettings = useCallback(() => {
    localStorage.setItem("demiurge_chat_settings", JSON.stringify({
      muteWhenUnfocused,
    }));
  }, [muteWhenUnfocused]);

  useEffect(() => {
    saveChatSettings();
  }, [muteWhenUnfocused, saveChatSettings]);

  // Window focus tracking
  useEffect(() => {
    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);
    
    window.addEventListener("focus", handleFocus);
    window.addEventListener("blur", handleBlur);
    
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  // Audio-reactive effects
  useEffect(() => {
    if (!chatContainerRef.current || !audioData) return;

    const container = chatContainerRef.current;
    const intensity = audioData.amplitude * 0.3;
    const hue = (audioData.frequency * 360) % 360;

    const messages = container.querySelectorAll(".chat-message");
    messages.forEach((msg) => {
      const element = msg as HTMLElement;
      element.style.textShadow = `0 0 ${intensity * 10}px hsla(${hue}, 70%, 60%, ${intensity})`;
      element.style.transition = "text-shadow 0.1s ease-out";
    });

    container.style.boxShadow = `inset 0 0 ${intensity * 30}px hsla(${hue}, 70%, 60%, ${intensity * 0.5})`;
    container.style.transition = "box-shadow 0.1s ease-out";

    return () => {
      messages.forEach((msg) => {
        const element = msg as HTMLElement;
        element.style.textShadow = "";
      });
      container.style.boxShadow = "";
    };
  }, [audioData]);

  // Save silenced users to localStorage
  const saveSilencedUsers = (users: Set<string>) => {
    setSilencedUsers(users);
    localStorage.setItem("demiurge_silenced_users", JSON.stringify(Array.from(users)));
  };

  // Load current user identity from AbyssID or legacy storage
  useEffect(() => {
    // Try AbyssID first
    if (identity?.address) {
      setCurrentAddress(identity.address);
      if (identity.username) {
        setCurrentUsername(identity.username);
      }
      loadUserNfts(identity.address);
      setLoading(false);
      return;
    }

    // Fallback to legacy storage
    const storedAddress = localStorage.getItem("demiurge_urgeid_wallet_address");
    
    if (storedAddress) {
      setCurrentAddress(storedAddress);
      
      // Try to get username from profile
      fetch(DEMIURGE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "urgeid_get",
          params: { address: storedAddress },
          id: 1,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.result?.username) {
            setCurrentUsername(data.result.username);
          }
        })
        .catch(() => {
          // Ignore errors
        });
      
      loadUserNfts(storedAddress);
    }
    
    setLoading(false);
  }, [identity]);
  
  const loadUserNfts = async (address: string) => {
    setLoadingNfts(true);
    try {
      const response = await fetch(`http://127.0.0.1:8545/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "cgt_getNftsByOwner",
          params: { address },
          id: 1,
        }),
      });
      const data = await response.json();
      if (data.result?.nfts) {
        setUserNfts(data.result.nfts);
      }
    } catch (err) {
      console.error("Failed to load NFTs:", err);
    } finally {
      setLoadingNfts(false);
    }
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }
    
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "video/webm"];
    if (!validTypes.includes(file.type)) {
      alert("Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM)");
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setSelectedMedia({ url: dataUrl, type: file.type });
      setShowMediaSelector(false);
    };
    reader.readAsDataURL(file);
  };
  
  const handleNftSelect = (nftId: string) => {
    setSelectedMedia({ url: `nft://${nftId}`, type: "nft" });
    setShowMediaSelector(false);
  };
  
  const handleRemoveMedia = () => {
    setSelectedMedia(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [contextMenu]);

  // Load world chat messages
  const loadWorldMessages = async () => {
    if (!currentAddress) return;
    
    try {
      const data = await graphqlRequest<{ worldChatMessages: ChatMessage[] }>(
        QUERIES.WORLD_CHAT_MESSAGES,
        { limit: 50 },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      const filtered = data.worldChatMessages.filter(
        (msg) => !silencedUsers.has(msg.sender.address)
      );
      setWorldMessages(filtered);
    } catch (err: any) {
      console.error("Failed to load world messages:", err);
      if (err.message?.includes("Connection failed")) {
        console.warn("Abyss Gateway not available - chat features disabled");
      }
    }
  };

  // Load DM rooms
  const loadDmRooms = async () => {
    if (!currentAddress) return;
    
    try {
      const data = await graphqlRequest<{ dmRooms: ChatRoom[] }>(
        QUERIES.DM_ROOMS,
        {},
        getChatHeaders(currentAddress, currentUsername)
      );
      setDmRooms(data.dmRooms);
    } catch (err: any) {
      console.error("Failed to load DM rooms:", err);
      if (err.message?.includes("Connection failed")) {
        console.warn("Abyss Gateway not available");
      }
    }
  };

  // Load room messages
  const loadRoomMessages = async (roomId: string) => {
    if (!currentAddress) return;
    
    try {
      const data = await graphqlRequest<{ roomMessages: ChatMessage[] }>(
        QUERIES.ROOM_MESSAGES,
        { roomId, limit: 50 },
        getChatHeaders(currentAddress, currentUsername)
      );
      setRoomMessages(data.roomMessages);
    } catch (err) {
      console.error("Failed to load room messages:", err);
    }
  };

  // Load custom rooms
  const loadCustomRooms = async () => {
    try {
      const headers = currentAddress ? getChatHeaders(currentAddress, currentUsername) : undefined;
      const data = await graphqlRequest<{ customRooms: ChatRoom[] }>(
        QUERIES.CUSTOM_ROOMS,
        {},
        headers
      );
      setCustomRooms(data.customRooms || []);
      
      if (activeRoom?.type === "custom") {
        const updatedRoom = data.customRooms?.find((r) => r.id === activeRoom.roomId);
        if (updatedRoom) {
          setActiveRoom({ type: "custom", roomId: updatedRoom.id, room: updatedRoom });
        }
      }
    } catch (err: any) {
      console.error("Failed to load custom rooms:", err);
      if (err.message?.includes("Connection failed")) {
        console.warn("Abyss Gateway not available for custom rooms");
      }
    }
  };

  // Initial load
  useEffect(() => {
    loadCustomRooms();
    
    if (currentAddress) {
      loadWorldMessages();
      loadDmRooms();
    }
  }, [currentAddress, currentUsername]);

  // Load room messages when active room changes
  useEffect(() => {
    if (activeRoom?.type === "dm") {
      loadRoomMessages(activeRoom.roomId);
    } else if (activeRoom?.type === "world") {
      loadWorldMessages();
    } else if (activeRoom?.type === "custom") {
      loadRoomMessages(activeRoom.roomId);
      if (activeRoom.room.settings) {
        setRoomSettingsFontFamily(activeRoom.room.settings.fontFamily || "");
        setRoomSettingsFontSize(activeRoom.room.settings.fontSize || 14);
        setRoomSettingsRules(activeRoom.room.settings.rules || "");
      }
      if (activeRoom.room.settings?.rules) {
        const hasSeenRules = localStorage.getItem(`demiurge_room_rules_${activeRoom.roomId}`);
        if (!hasSeenRules) {
          setShowRules(true);
          localStorage.setItem(`demiurge_room_rules_${activeRoom.roomId}`, "true");
        }
      }
    }
  }, [activeRoom]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [worldMessages, roomMessages]);

  // Polling for new messages
  useEffect(() => {
    if (!currentAddress) return;
    
    const interval = setInterval(() => {
      if (activeRoom?.type === "world") {
        loadWorldMessages();
      } else if (activeRoom?.type === "dm") {
        loadRoomMessages(activeRoom.roomId);
      } else if (activeRoom?.type === "custom") {
        loadRoomMessages(activeRoom.roomId);
      }
      loadDmRooms();
      loadCustomRooms();
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRoom, currentAddress, silencedUsers]);

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedMedia) || !currentAddress || sending || !activeRoom) return;
    
    setSending(true);
    
    try {
      const variables: any = {
        content: messageInput.trim() || (selectedMedia ? "📎 Media" : ""),
      };
      
      if (selectedMedia) {
        variables.mediaUrl = selectedMedia.url;
        variables.mediaType = selectedMedia.type;
      }
      
      if (activeRoom.type === "world") {
        const response = await graphqlRequest<{ sendWorldMessage: ChatMessage }>(
          MUTATIONS.SEND_WORLD_MESSAGE,
          variables,
          getChatHeaders(currentAddress, currentUsername)
        );
        setMessageInput("");
        setSelectedMedia(null);
        setTimeout(loadWorldMessages, 500);
      } else if (activeRoom.type === "dm") {
        const response = await graphqlRequest<{ sendDirectMessage: ChatMessage }>(
          MUTATIONS.SEND_DIRECT_MESSAGE,
          {
            ...variables,
            toUsername: activeRoom.recipient.username,
          },
          getChatHeaders(currentAddress, currentUsername)
        );
        setMessageInput("");
        setSelectedMedia(null);
        setTimeout(() => loadRoomMessages(activeRoom.roomId), 500);
      } else if (activeRoom.type === "custom") {
        const response = await graphqlRequest<{ sendRoomMessage: ChatMessage }>(
          MUTATIONS.SEND_ROOM_MESSAGE,
          {
            ...variables,
            roomId: activeRoom.roomId,
          },
          getChatHeaders(currentAddress, currentUsername)
        );
        setMessageInput("");
        setSelectedMedia(null);
        setTimeout(() => loadRoomMessages(activeRoom.roomId), 500);
      }
    } catch (err: any) {
      console.error("Failed to send message:", err);
      alert(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleOpenWorldChat = () => {
    setActiveView("world");
    setActiveRoom({ type: "world" });
    setShowRoomSettings(false);
  };

  const handleOpenCustomRoom = (room: ChatRoom) => {
    setActiveView("custom");
    setActiveRoom({ type: "custom", roomId: room.id, room });
    setShowRoomSettings(false);
  };

  const handleJoinCustomRoom = async (roomId: string) => {
    if (!currentAddress) return;

    try {
      const data = await graphqlRequest<{ joinCustomRoom: ChatRoom }>(
        MUTATIONS.JOIN_CUSTOM_ROOM,
        { roomId },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      const updatedRooms = customRooms.map((r) => 
        r.id === roomId ? data.joinCustomRoom : r
      );
      if (!updatedRooms.find((r) => r.id === roomId)) {
        updatedRooms.push(data.joinCustomRoom);
      }
      setCustomRooms(updatedRooms);
      
      handleOpenCustomRoom(data.joinCustomRoom);
    } catch (err: any) {
      console.error("Failed to join room:", err);
      alert(err.message || "Failed to join room");
    }
  };

  const handleLeaveRoom = async (roomId: string) => {
    if (!currentAddress) return;

    if (!confirm("Are you sure you want to leave this room?")) {
      return;
    }

    try {
      await graphqlRequest<{ leaveCustomRoom: boolean }>(
        MUTATIONS.LEAVE_CUSTOM_ROOM,
        { roomId },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      setCustomRooms(customRooms.filter((r) => r.id !== roomId));
      
      if (activeRoom?.type === "custom" && activeRoom.roomId === roomId) {
        setActiveRoom(null);
        setActiveView(null);
      }
      
      await loadCustomRooms();
    } catch (err: any) {
      console.error("Failed to leave room:", err);
      alert(err.message || "Failed to leave room");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim() || !newRoomSlug.trim() || !currentAddress) {
      alert("Please fill in room name and slug");
      return;
    }

    try {
      const slug = newRoomSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
      const data = await graphqlRequest<{ createCustomRoom: ChatRoom }>(
        MUTATIONS.CREATE_CUSTOM_ROOM,
        {
          name: newRoomName.trim(),
          description: newRoomDescription.trim() || null,
          slug: slug,
        },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      await loadCustomRooms();
      setShowCreateRoom(false);
      setNewRoomName("");
      setNewRoomDescription("");
      setNewRoomSlug("");
      handleOpenCustomRoom(data.createCustomRoom);
    } catch (err: any) {
      console.error("Failed to create room:", err);
      const errorMsg = err.message || "Failed to create room";
      if (errorMsg.includes("already taken")) {
        alert(`Room name "${newRoomName.trim()}" is already taken. Please choose a different name.`);
      } else {
        alert(errorMsg);
      }
    }
  };


  const handlePlayMusic = async (musicId: string | null) => {
    if (!activeRoom || activeRoom.type === "world" || !currentAddress) return;

    try {
      await graphqlRequest<{ setPlayingMusic: boolean }>(
        MUTATIONS.SET_PLAYING_MUSIC,
        { roomId: activeRoom.roomId, musicId },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      loadCustomRooms();
    } catch (err: any) {
      console.error("Failed to play music:", err);
    }
  };

  const isRoomModerator = (room: ChatRoom): boolean => {
    if (!currentAddress) return false;
    return room.moderators?.some((m) => m.address === currentAddress) || false;
  };

  const handleOpenDm = (room: ChatRoom) => {
    const otherMember = room.members.find((m) => m.address !== currentAddress);
    if (otherMember) {
      setActiveView("dm");
      setActiveRoom({ type: "dm", roomId: room.id, recipient: otherMember });
    }
  };


  const handleContextMenu = (e: React.MouseEvent, message: ChatMessage) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      message,
    });
  };

  const handleOpenDmFromMessage = async (message: ChatMessage) => {
    if (!currentAddress || message.sender.address === currentAddress) return;
    
    setContextMenu(null);
    
    try {
      await graphqlRequest<{ sendDirectMessage: ChatMessage }>(
        MUTATIONS.SEND_DIRECT_MESSAGE,
        { toUsername: message.sender.username, content: "Hello!" },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      await loadDmRooms();
      const updatedRooms = await graphqlRequest<{ dmRooms: ChatRoom[] }>(
        QUERIES.DM_ROOMS,
        {},
        getChatHeaders(currentAddress, currentUsername)
      );
      const room = updatedRooms.dmRooms.find(
        (r) => r.members.some((m) => m.address === message.sender.address)
      );
      if (room) {
        const otherMember = room.members.find((m) => m.address !== currentAddress);
        if (otherMember) {
          setActiveView("dm");
          setActiveRoom({ type: "dm", roomId: room.id, recipient: otherMember });
        }
      }
    } catch (err: any) {
      console.error("Failed to open DM:", err);
      alert(err.message || "Failed to open DM");
    }
  };

  const handleSilenceUser = (message: ChatMessage) => {
    const newSilenced = new Set(silencedUsers);
    newSilenced.add(message.sender.address);
    saveSilencedUsers(newSilenced);
    setContextMenu(null);
    
    if (activeRoom?.type === "world") {
      loadWorldMessages();
    }
    
    alert(`@${message.sender.username} has been silenced. Their messages will be hidden.`);
  };

  const handleBlurMedia = async (message: ChatMessage) => {
    if (!currentAddress || !message.mediaUrl) return;
    
    setContextMenu(null);
    
    try {
      await graphqlRequest<{ blurMedia: ChatMessage }>(
        MUTATIONS.BLUR_MEDIA,
        { messageId: message.id },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      if (activeRoom?.type === "world") {
        setTimeout(loadWorldMessages, 300);
      } else if (activeRoom?.type === "dm") {
        setTimeout(() => loadRoomMessages(activeRoom.roomId), 300);
      }
    } catch (err: any) {
      console.error("Failed to blur media:", err);
      alert(err.message || "Failed to blur media");
    }
  };

  const handleReportUser = async (message: ChatMessage) => {
    if (!currentAddress) return;
    
    setContextMenu(null);
    
    try {
      const moderatorUsername = "sabaoth";
      
      const reportContent = `REPORT: User @${message.sender.username} (${message.sender.address})\n\nMessage ID: ${message.id}\nMessage: "${message.content}"\n\nReported by: @${currentUsername || "anonymous"}`;
      
      await graphqlRequest<{ sendDirectMessage: ChatMessage }>(
        MUTATIONS.SEND_DIRECT_MESSAGE,
        { toUsername: moderatorUsername, content: reportContent },
        getChatHeaders(currentAddress, currentUsername)
      );
      
      await loadDmRooms();
      const updatedRooms = await graphqlRequest<{ dmRooms: ChatRoom[] }>(
        QUERIES.DM_ROOMS,
        {},
        getChatHeaders(currentAddress, currentUsername)
      );
      const room = updatedRooms.dmRooms.find(
        (r) => r.members.some((m) => m.username === moderatorUsername)
      );
      if (room) {
        const otherMember = room.members.find((m) => m.address !== currentAddress);
        if (otherMember) {
          setActiveView("dm");
          setActiveRoom({ type: "dm", roomId: room.id, recipient: otherMember });
        }
      }
      
      alert(`Report sent to @${moderatorUsername}. A DM has been opened with the moderator.`);
    } catch (err: any) {
      console.error("Failed to send report:", err);
      alert(err.message || "Failed to send report");
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <FractureShell>
        <div className="flex h-screen items-center justify-center">
          <div className="text-zinc-400">Loading chat...</div>
        </div>
      </FractureShell>
    );
  }

  if (!currentAddress) {
    return (
      <FractureShell>
        <HeroPanel
          title="Nexus"
          subtitle="P2P analytics & seeding"
        />
        <div className="text-center space-y-4">
          <p className="text-zinc-400">Please create an AbyssID to use chat.</p>
          <p className="text-sm text-zinc-500">
            Chat features require an identity. Create one from Haven.
          </p>
        </div>
      </FractureShell>
    );
  }

  const currentMessages = 
    activeRoom?.type === "world" 
      ? worldMessages 
      : activeRoom?.type === "custom" 
      ? roomMessages 
      : roomMessages;
  const activeRecipient = activeRoom?.type === "dm" ? activeRoom.recipient : null;
  const activeCustomRoom = activeRoom?.type === "custom" ? activeRoom.room : null;
  const isMod = activeCustomRoom ? isRoomModerator(activeCustomRoom) : false;

  // Load P2P stats (placeholder - replace with actual API)
  useEffect(() => {
    if (activeTab === "analytics" && identity?.address) {
      setLoadingP2P(true);
      // TODO: Replace with actual P2P network API calls
      setTimeout(() => {
        setP2pStats({
          connectedPeers: 12,
          totalBandwidth: { up: 2.5, down: 1.8 },
          seededContent: 8,
          downloadedContent: 15,
          networkHealth: "healthy",
        });
        setLoadingP2P(false);
      }, 500);
    }
  }, [activeTab, identity]);

  return (
    <FractureShell showNav={true}>
      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "chat"
              ? "border-b-2 border-cyan-500 text-cyan-300"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </div>
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "analytics"
              ? "border-b-2 border-cyan-500 text-cyan-300"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4" />
            P2P Analytics
          </div>
        </button>
        <button
          onClick={() => setActiveTab("ops")}
          className={`px-6 py-3 font-semibold transition-all ${
            activeTab === "ops"
              ? "border-b-2 border-cyan-500 text-cyan-300"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Ops Log
          </div>
        </button>
      </div>

      {/* P2P Analytics View */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <HeroPanel
            title="Nexus"
            subtitle="P2P analytics & seeding controls"
          />

          {!identity ? (
            <div className="text-center space-y-4 p-8 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-zinc-400">Please create an AbyssID to view P2P analytics.</p>
              <p className="text-sm text-zinc-500">
                P2P features require an identity. Create one from Haven.
              </p>
            </div>
          ) : (
            <>
              {/* Network Status Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <p className="text-xs text-zinc-400">Connected Peers</p>
                  </div>
                  {loadingP2P ? (
                    <p className="text-xl font-mono font-semibold text-zinc-500">...</p>
                  ) : (
                    <p className="text-xl font-mono font-semibold text-cyan-400">
                      {p2pStats.connectedPeers}
                    </p>
                  )}
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-4 w-4 text-fuchsia-400" />
                    <p className="text-xs text-zinc-400">Upload Speed</p>
                  </div>
                  {loadingP2P ? (
                    <p className="text-xl font-mono font-semibold text-zinc-500">...</p>
                  ) : (
                    <p className="text-xl font-mono font-semibold text-fuchsia-400">
                      {p2pStats.totalBandwidth.up.toFixed(1)} MB/s
                    </p>
                  )}
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Download className="h-4 w-4 text-purple-400" />
                    <p className="text-xs text-zinc-400">Download Speed</p>
                  </div>
                  {loadingP2P ? (
                    <p className="text-xl font-mono font-semibold text-zinc-500">...</p>
                  ) : (
                    <p className="text-xl font-mono font-semibold text-purple-400">
                      {p2pStats.totalBandwidth.down.toFixed(1)} MB/s
                    </p>
                  )}
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    <p className="text-xs text-zinc-400">Network Health</p>
                  </div>
                  {loadingP2P ? (
                    <p className="text-xl font-mono font-semibold text-zinc-500">...</p>
                  ) : (
                    <p className={`text-sm font-semibold ${
                      p2pStats.networkHealth === "healthy" ? "text-emerald-400" :
                      p2pStats.networkHealth === "degraded" ? "text-yellow-400" :
                      "text-red-400"
                    }`}>
                      {p2pStats.networkHealth.toUpperCase()}
                    </p>
                  )}
                </div>
              </div>

              {/* Seeding Controls */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
                      <Server className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">Content Seeding</h3>
                      <p className="text-xs text-zinc-400">Share content and earn Syzygy rewards</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSeedingEnabled(!seedingEnabled)}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      seedingEnabled
                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-800/50 border border-white/10 text-zinc-400"
                    }`}
                  >
                    {seedingEnabled ? "Seeding Active" : "Start Seeding"}
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                    <p className="text-xs text-zinc-400 mb-1">Content Seeded</p>
                    {loadingP2P ? (
                      <p className="text-2xl font-mono font-semibold text-zinc-500">...</p>
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-cyan-400">
                        {p2pStats.seededContent}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">Active seeders</p>
                  </div>

                  <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                    <p className="text-xs text-zinc-400 mb-1">Content Downloaded</p>
                    {loadingP2P ? (
                      <p className="text-2xl font-mono font-semibold text-zinc-500">...</p>
                    ) : (
                      <p className="text-2xl font-mono font-semibold text-fuchsia-400">
                        {p2pStats.downloadedContent}
                      </p>
                    )}
                    <p className="text-xs text-zinc-500 mt-1">Total downloads</p>
                  </div>
                </div>

                {seedingEnabled && (
                  <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <p className="text-sm text-emerald-300">
                      ✓ Seeding is active. You're contributing to the Fabric network and earning Syzygy rewards.
                    </p>
                  </div>
                )}
              </div>

              {/* Health Panel */}
              <HealthPanel />

              {/* Network Topology */}
              <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
                    <Network className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-100">Fabric Network Topology</h3>
                    <p className="text-xs text-zinc-400">Interactive visualization of P2P connections</p>
                  </div>
                </div>
                <div className="p-4 bg-black/20 rounded-lg border border-white/10 min-h-[400px]">
                  <FabricTopology 
                    connectedPeers={fabricService.state.nodes.length || genesisContext?.fabricState?.nodes.length || p2pStats.connectedPeers}
                    ritualEffects={fabricRitualEffects || undefined}
                    genesisNodes={fabricService.state.nodes.length > 0 ? fabricService.state.nodes : genesisContext?.fabricState?.nodes}
                    genesisEdges={fabricService.state.edges.length > 0 ? fabricService.state.edges : genesisContext?.fabricState?.edges}
                  />
                </div>
                <p className="text-xs text-zinc-500 mt-3">
                  Click nodes to view details. Hover to highlight connections.
                </p>
              </div>

              {/* Info Section */}
              <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-fuchsia-500/10 border border-cyan-500/20 rounded-xl">
                <h3 className="text-lg font-semibold text-zinc-100 mb-2">
                  About P2P Analytics
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Nexus provides real-time insights into the Fabric P2P network. Monitor your connection status,
                  bandwidth usage, and content seeding activity. By seeding content, you contribute to the network
                  and earn Syzygy rewards. The network topology view shows how nodes are connected across the Fabric.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Ops Log View */}
      {activeTab === "ops" && (
        <div className="space-y-6">
          <HeroPanel
            title="Operations Log"
            subtitle="System events, ArchonAI actions, and operator activities"
          />
          <OpsLogView />
        </div>
      )}

      {/* Chat View */}
      {activeTab === "chat" && (
        <div className="flex h-[calc(100vh-8rem)] bg-zinc-950/50 text-zinc-100 rounded-xl border border-white/10 overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:block w-80 border-r border-white/10 bg-zinc-950/50">
          <div className="border-b border-white/10 p-4">
            <h1 className="text-xl font-bold text-zinc-100">Chat</h1>
          </div>

          <div className="overflow-y-auto" style={{ height: "calc(100vh - 12rem)" }}>
            {/* World Chat */}
            <button
              onClick={handleOpenWorldChat}
              className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                activeRoom?.type === "world" ? "bg-white/10" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-cyan-400" />
                <span className="font-semibold text-zinc-100">World Chat</span>
              </div>
            </button>

            {/* Custom Rooms */}
            {customRooms.length > 0 && (
              <div className="border-t border-white/10">
                {customRooms.map((room) => {
                  const isMember = room.members?.some((m) => m.address === currentAddress);
                  return (
                    <div
                      key={room.id}
                      className="relative"
                      onMouseEnter={() => setHoveredRoom(room.id)}
                      onMouseLeave={() => setHoveredRoom(null)}
                    >
                      <button
                        onClick={() => {
                          if (isMember) {
                            handleOpenCustomRoom(room);
                          } else {
                            handleJoinCustomRoom(room.id);
                          }
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                          activeRoom?.type === "custom" && activeRoom.roomId === room.id
                            ? "bg-white/10"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-fuchsia-400" />
                          <div className="flex-1">
                            <div className="font-semibold text-zinc-100">{room.name || `Room ${room.id}`}</div>
                            {room.description && (
                              <div className="truncate text-xs text-zinc-400">{room.description}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {isRoomModerator(room) && (
                              <div title="Moderator">
                                <Shield className="h-4 w-4 text-rose-400" />
                              </div>
                            )}
                            <div className="relative">
                              <Users className="h-4 w-4 text-zinc-400" />
                              {hoveredRoom === room.id && room.activeUsers && room.activeUsers.length > 0 && (
                                <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-2 shadow-xl">
                                  <div className="text-xs font-semibold text-zinc-300 mb-1">Active Users ({room.activeUsers.length})</div>
                                  <div className="space-y-1 max-h-48 overflow-y-auto">
                                    {room.activeUsers.map((user) => (
                                      <div key={user.id} className="text-xs text-zinc-400">
                                        @{user.username}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                      {hoveredRoom === room.id && isMember && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLeaveRoom(room.id);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-rose-600/20 border border-rose-500/30 px-2 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-600/30 z-10"
                          title="Leave Room"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateRoom(true)}
              className="w-full border-t border-white/10 px-4 py-3 text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                <span className="font-semibold text-zinc-100">Create New Room</span>
              </div>
            </button>

            {/* Direct Messages */}
            <div className="border-t border-white/10 px-4 py-2">
              <h2 className="mb-2 text-sm font-semibold text-zinc-400">Your DMs</h2>
              {dmRooms.filter((room) => !archivedDms.has(room.id)).length === 0 ? (
                <p className="text-xs text-zinc-500">No direct messages yet</p>
              ) : (
                dmRooms
                  .filter((room) => !archivedDms.has(room.id))
                  .map((room) => {
                    const otherMember = room.members.find((m) => m.address !== currentAddress);
                    if (!otherMember) return null;
                    
                    return (
                      <div
                        key={room.id}
                        className="relative mb-1"
                        onMouseEnter={() => setHoveredDm(room.id)}
                        onMouseLeave={() => setHoveredDm(null)}
                      >
                        <button
                          onClick={() => handleOpenDm(room)}
                          className={`w-full rounded px-2 py-2 text-left text-sm hover:bg-white/5 transition-colors ${
                            activeRoom?.type === "dm" && activeRoom.roomId === room.id
                              ? "bg-white/10"
                              : ""
                          }`}
                        >
                          <div className="font-medium text-zinc-200">@{otherMember.username}</div>
                          {room.lastMessage && (
                            <div className="truncate text-xs text-zinc-400">
                              {room.lastMessage.content.slice(0, 30)}...
                            </div>
                          )}
                        </button>
                        {hoveredDm === room.id && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchiveDm(room.id);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-zinc-800/50 border border-white/10 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    );
                  })
              )}
            </div>

          </div>
        </div>

        {/* Main Chat Panel */}
        <div className="flex flex-1 flex-col">
          {activeRoom ? (
            <>
              {/* Header */}
              <div className="border-b border-white/10 bg-zinc-950/50">
                <div className="flex h-12 items-center justify-between px-4">
                  <div className="flex items-center gap-2">
                    {activeRoom.type === "world" ? (
                      <h2 className="text-sm font-semibold text-zinc-100">World Chat</h2>
                    ) : activeRoom.type === "custom" ? (
                      <>
                        <h2 className="text-sm font-semibold text-zinc-100">{activeCustomRoom?.name || `Room ${activeRoom.roomId}`}</h2>
                        {isMod && (
                          <div title="You are a moderator">
                            <Shield className="h-3 w-3 text-rose-400" />
                          </div>
                        )}
                      </>
                    ) : (
                      <h2 className="text-sm font-semibold text-zinc-100">@{activeRecipient?.username}</h2>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {(activeRoom.type === "custom" || activeRoom.type === "world") && (
                      <MusicPlayer
                        musicQueue={activeRoom.type === "custom" && activeCustomRoom?.musicQueue ? activeCustomRoom.musicQueue : []}
                        roomId={activeRoom.type === "custom" ? activeRoom.roomId : "world"}
                        isModerator={activeRoom.type === "custom" ? isMod : false}
                        onPlayMusic={handlePlayMusic}
                        onAudioData={setAudioData}
                        isWindowFocused={isWindowFocused}
                        muteWhenUnfocused={muteWhenUnfocused}
                      />
                    )}
                    {activeRoom.type === "custom" && (
                      <button
                        onClick={() => setShowRoomSettings(!showRoomSettings)}
                        className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors"
                        title="Room Settings"
                      >
                        <Settings className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto p-4"
                style={activeCustomRoom?.settings ? {
                  fontFamily: activeCustomRoom.settings.fontFamily || undefined,
                  fontSize: activeCustomRoom.settings.fontSize ? `${activeCustomRoom.settings.fontSize}px` : undefined,
                } : {}}
              >
                {currentMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-zinc-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="chat-message group flex gap-3 hover:bg-white/5 rounded p-2 -m-2 transition-colors"
                        onContextMenu={(e) => handleContextMenu(e, msg)}
                      >
                        <div className="flex-shrink-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 border border-white/10">
                            <span className="text-xs font-bold text-zinc-300">
                              @{msg.sender.username.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="mb-1 flex items-center gap-2">
                            <span className="font-semibold text-zinc-200">@{msg.sender.username}</span>
                            {msg.sender.isArchon && (
                              <Sparkles className="h-3 w-3 text-amber-400" />
                            )}
                            <span className="text-xs text-zinc-500">
                              {formatTimestamp(msg.createdAt)}
                            </span>
                          </div>
                          <div className="text-zinc-300">{msg.content}</div>
                          {msg.mediaUrl && (
                            <div className="mt-2 relative">
                              {msg.mediaType?.startsWith("image/") ? (
                                <div className="relative">
                                  <img
                                    src={msg.mediaUrl}
                                    alt="Shared media"
                                    className={`max-w-md rounded-lg border border-white/10 ${msg.isBlurred ? "blur-md" : ""}`}
                                    style={{ maxHeight: "400px" }}
                                  />
                                  {msg.isBlurred && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-lg">
                                      <div className="text-center text-zinc-400">
                                        <EyeOff className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-sm">Media blurred for safety</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : msg.mediaType?.startsWith("video/") ? (
                                <div className="relative">
                                  <video
                                    src={msg.mediaUrl}
                                    controls
                                    className={`max-w-md rounded-lg border border-white/10 ${msg.isBlurred ? "blur-md" : ""}`}
                                    style={{ maxHeight: "400px" }}
                                  />
                                  {msg.isBlurred && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 rounded-lg pointer-events-none">
                                      <div className="text-center text-zinc-400">
                                        <EyeOff className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-sm">Media blurred for safety</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : msg.mediaType === "nft" ? (
                                <div className={`rounded-lg border border-white/10 bg-white/5 p-3 ${msg.isBlurred ? "opacity-50" : ""}`}>
                                  <span className="text-sm text-zinc-400">NFT: {msg.mediaUrl.replace("nft://", "")}</span>
                                  {msg.isBlurred && (
                                    <div className="mt-2 text-xs text-zinc-500 flex items-center gap-1">
                                      <EyeOff className="h-3 w-3" />
                                      Blurred for safety
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
                          {msg.nftId && (
                            <a
                              href={`/marketplace/${msg.nftId}`}
                              className="mt-2 inline-block rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-1 text-xs text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                            >
                              NFT #{msg.nftId}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-white/10 bg-zinc-950/50 p-4">
                {selectedMedia && (
                  <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-2">
                    {selectedMedia.type.startsWith("image/") ? (
                      <img
                        src={selectedMedia.url}
                        alt="Selected media"
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : selectedMedia.type.startsWith("video/") ? (
                      <video
                        src={selectedMedia.url}
                        className="h-16 w-16 rounded object-cover"
                      />
                    ) : selectedMedia.type === "nft" ? (
                      <div className="flex h-16 w-16 items-center justify-center rounded bg-white/5 text-xs">
                        NFT
                      </div>
                    ) : null}
                    <div className="flex-1">
                      <div className="text-sm text-zinc-300">
                        {selectedMedia.type === "nft"
                          ? `NFT: ${selectedMedia.url.replace("nft://", "")}`
                          : "Media attached"}
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveMedia}
                      className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMediaSelector(true)}
                    className="rounded bg-white/5 border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/10 transition-colors"
                    title="Attach media"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="flex-1 rounded bg-white/5 border border-white/10 px-4 py-2 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || (!messageInput.trim() && !selectedMedia)}
                    className="rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 transition-all"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-500">
              Select a chat from the sidebar to start messaging
            </div>
          )}
        </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl shadow-xl"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="py-1">
            {contextMenu.message.sender.address !== currentAddress && (
              <>
                <button
                  onClick={() => handleOpenDmFromMessage(contextMenu.message)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  DM
                </button>
                <button
                  onClick={() => handleSilenceUser(contextMenu.message)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <VolumeX className="h-4 w-4" />
                  Silence
                </button>
                {contextMenu.message.mediaUrl && !contextMenu.message.isBlurred && (
                  <button
                    onClick={() => handleBlurMedia(contextMenu.message)}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-amber-300 hover:bg-white/5 transition-colors"
                  >
                    <EyeOff className="h-4 w-4" />
                    Blur 4 All
                  </button>
                )}
                <button
                  onClick={() => handleReportUser(contextMenu.message)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 transition-colors"
                >
                  <Flag className="h-4 w-4" />
                  Report
                </button>
              </>
            )}
            {contextMenu.message.sender.address === currentAddress && (
              <div className="px-4 py-2 text-xs text-zinc-500">
                Right-click other users' messages for options
              </div>
            )}
          </div>
        </div>
      )}

      {/* Media Selector Modal */}
      {showMediaSelector && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowMediaSelector(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Share Media</h3>
              <button
                onClick={() => setShowMediaSelector(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  Upload from Device
                </label>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-zinc-300 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <span>Choose File (Images or Videos)</span>
                  </div>
                </button>
                <p className="mt-1 text-xs text-zinc-500">
                  Max 10MB. Supported: JPEG, PNG, GIF, WebP, MP4, WebM
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">
                  From NFT Collection
                </label>
                {loadingNfts ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-zinc-400">
                    Loading NFTs...
                  </div>
                ) : userNfts.length === 0 ? (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center text-zinc-400">
                    No NFTs in your collection
                  </div>
                ) : (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-white/5 p-2">
                    {userNfts.map((nft: any) => (
                      <button
                        key={nft.id}
                        onClick={() => handleNftSelect(String(nft.id))}
                        className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-white/10 transition-colors"
                      >
                        NFT #{nft.id}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Create Custom Room</h3>
              <button
                onClick={() => {
                  setShowCreateRoom(false);
                  setNewRoomName("");
                  setNewRoomDescription("");
                  setNewRoomSlug("");
                }}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Room Name *</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="My Awesome Room"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Slug (URL-friendly) *</label>
                <input
                  type="text"
                  value={newRoomSlug}
                  onChange={(e) => setNewRoomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="my-awesome-room"
                />
                <p className="mt-1 text-xs text-zinc-500">Used in room URL. Only lowercase letters, numbers, and hyphens.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-300">Description (Optional)</label>
                <textarea
                  value={newRoomDescription}
                  onChange={(e) => setNewRoomDescription(e.target.value)}
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  placeholder="A room for awesome discussions..."
                  rows={3}
                />
              </div>
              {!currentAddress && (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
                  You need to be logged in to create a room. Please access your Void first.
                </div>
              )}
              <button
                onClick={handleCreateRoom}
                disabled={!newRoomName.trim() || !newRoomSlug.trim() || !currentAddress}
                className="w-full rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Settings Panel - Continue with rest of modals */}
      {showRoomSettings && activeRoom?.type === "custom" && isMod && activeCustomRoom && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Room Settings: {activeCustomRoom.name}</h3>
              <button
                onClick={() => setShowRoomSettings(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">Font Settings</h4>
                <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Font Family</label>
                    <select
                      value={roomSettingsFontFamily || activeCustomRoom.settings?.fontFamily || "system-ui"}
                      onChange={(e) => setRoomSettingsFontFamily(e.target.value)}
                      className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    >
                      <option value="system-ui">System UI</option>
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-zinc-400">Font Size</label>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={roomSettingsFontSize || activeCustomRoom.settings?.fontSize || 14}
                      onChange={(e) => setRoomSettingsFontSize(parseInt(e.target.value) || 14)}
                      className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        await graphqlRequest<{ updateRoomSettings: any }>(
                          MUTATIONS.UPDATE_ROOM_SETTINGS,
                          {
                            roomId: activeRoom.roomId,
                            fontFamily: roomSettingsFontFamily || activeCustomRoom.settings?.fontFamily,
                            fontSize: roomSettingsFontSize || activeCustomRoom.settings?.fontSize,
                          },
                          getChatHeaders(currentAddress, currentUsername)
                        );
                        await loadCustomRooms();
                        alert("Font settings updated!");
                      } catch (err: any) {
                        alert(err.message || "Failed to update settings");
                      }
                    }}
                    className="w-full rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition-all"
                  >
                    Update Font Settings
                  </button>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold text-zinc-300">Room Rules</h4>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  <textarea
                    value={roomSettingsRules || activeCustomRoom.settings?.rules || ""}
                    onChange={(e) => setRoomSettingsRules(e.target.value)}
                    placeholder="Enter room rules here..."
                    rows={4}
                    className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  <button
                    onClick={async () => {
                      try {
                        await graphqlRequest<{ updateRoomSettings: any }>(
                          MUTATIONS.UPDATE_ROOM_SETTINGS,
                          {
                            roomId: activeRoom.roomId,
                            rules: roomSettingsRules,
                          },
                          getChatHeaders(currentAddress, currentUsername)
                        );
                        await loadCustomRooms();
                        alert("Room rules updated!");
                      } catch (err: any) {
                        alert(err.message || "Failed to update rules");
                      }
                    }}
                    className="mt-2 w-full rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition-all"
                  >
                    Update Rules
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-zinc-300">Music Queue</h4>
                  <button
                    onClick={() => setShowAddMusic(true)}
                    className="rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-1 text-xs font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition-all"
                  >
                    <Music className="mr-1 inline h-3 w-3" />
                    Add Music
                  </button>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                  {activeCustomRoom.musicQueue && activeCustomRoom.musicQueue.length > 0 ? (
                    <div className="space-y-2">
                      {activeCustomRoom.musicQueue.map((music) => (
                        <div key={music.id} className="flex items-center justify-between rounded bg-white/5 p-2">
                          <div className="flex-1">
                            <div className="text-sm text-zinc-200">
                              {music.title || music.sourceUrl}
                            </div>
                            {music.artist && (
                              <div className="text-xs text-zinc-400">{music.artist}</div>
                            )}
                            <div className="text-xs text-zinc-500">{music.sourceType}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {music.isPlaying && (
                              <span className="text-xs text-cyan-400">▶ Playing</span>
                            )}
                            <button
                              onClick={async () => {
                                try {
                                  await graphqlRequest<{ removeMusicFromQueue: boolean }>(
                                    MUTATIONS.REMOVE_MUSIC_FROM_QUEUE,
                                    { musicId: music.id },
                                    getChatHeaders(currentAddress, currentUsername)
                                  );
                                  await loadCustomRooms();
                                } catch (err: any) {
                                  alert(err.message || "Failed to remove music");
                                }
                              }}
                              className="rounded bg-white/5 border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">No music in queue. Add some to get started!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Music Modal */}
      {showAddMusic && activeRoom?.type === "custom" && isMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Add Music to Queue</h3>
              <button
                onClick={() => {
                  setShowAddMusic(false);
                  setNewMusicSourceUrl("");
                  setNewMusicTitle("");
                  setNewMusicArtist("");
                }}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Source Type</label>
                <select
                  value={newMusicSourceType}
                  onChange={(e) => setNewMusicSourceType(e.target.value)}
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                >
                  <option value="spotify">Spotify</option>
                  <option value="soundcloud">SoundCloud</option>
                  <option value="youtube">YouTube Music</option>
                  <option value="nft">NFT Music File</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Source URL</label>
                <input
                  type="text"
                  value={newMusicSourceUrl}
                  onChange={(e) => setNewMusicSourceUrl(e.target.value)}
                  placeholder="Enter music URL..."
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Title (Optional)</label>
                <input
                  type="text"
                  value={newMusicTitle}
                  onChange={(e) => setNewMusicTitle(e.target.value)}
                  placeholder="Song title..."
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-300">Artist (Optional)</label>
                <input
                  type="text"
                  value={newMusicArtist}
                  onChange={(e) => setNewMusicArtist(e.target.value)}
                  placeholder="Artist name..."
                  className="w-full rounded border border-white/10 bg-white/5 px-3 py-2 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                />
              </div>
              <button
                onClick={async () => {
                  if (!newMusicSourceUrl.trim()) {
                    alert("Please enter a source URL");
                    return;
                  }
                  try {
                    await graphqlRequest<{ addMusicToQueue: any }>(
                      MUTATIONS.ADD_MUSIC_TO_QUEUE,
                      {
                        roomId: activeRoom.roomId,
                        sourceType: newMusicSourceType,
                        sourceUrl: newMusicSourceUrl,
                        title: newMusicTitle || null,
                        artist: newMusicArtist || null,
                      },
                      getChatHeaders(currentAddress, currentUsername)
                    );
                    await loadCustomRooms();
                    setShowAddMusic(false);
                    setNewMusicSourceUrl("");
                    setNewMusicTitle("");
                    setNewMusicArtist("");
                  } catch (err: any) {
                    alert(err.message || "Failed to add music");
                  }
                }}
                className="w-full rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition-all"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && activeRoom?.type === "custom" && activeCustomRoom?.settings?.rules && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/95 backdrop-blur-xl p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-zinc-100">Room Rules</h3>
              <button
                onClick={() => setShowRules(false)}
                className="rounded p-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="text-sm text-zinc-300 whitespace-pre-line">
              {activeCustomRoom.settings.rules}
            </div>
            <button
              onClick={() => setShowRules(false)}
              className="mt-4 w-full rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-4 py-2 font-semibold text-white hover:from-cyan-400 hover:to-fuchsia-400 transition-all"
            >
              I Understand
            </button>
          </div>
        </div>
      )}
    </FractureShell>
  );
}
