import { useMemo, useState } from 'react';
import { useAbyssIDIdentity } from '../../../hooks/useAbyssIDIdentity';
import { Button } from '../../shared/Button';

type Tab = 'rooms' | 'dms' | 'friends' | 'discover' | 'profile' | 'quickmatch' | 'settings';

interface Profile {
  abyssId: string;
  username: string;
  avatar?: string;
  bio?: string;
  tags: string[];
  locationOptIn: boolean;
  city?: string;
}

interface Room {
  id: string;
  name: string;
  description: string;
  tags: string[];
  visibility: 'public' | 'private';
  ownerId: string;
  memberCount: number;
}

interface Message {
  id: string;
  roomId: string;
  from: string;
  content: string;
  timestamp: number;
}

interface DmThread {
  id: string;
  with: string;
  lastMessage: string;
  timestamp: number;
}

const sampleRooms: Room[] = [
  { id: 'room-global', name: 'Global Lounge', description: 'World-wide premium lounge', tags: ['global', 'premium'], visibility: 'public', ownerId: 'founder', memberCount: 482 },
  { id: 'room-build', name: 'Builders Hub', description: 'Ship mode. Code, chain, media.', tags: ['dev', 'media'], visibility: 'public', ownerId: 'core', memberCount: 188 },
  { id: 'room-omni', name: 'Omni Vision', description: 'Video-first social showcase', tags: ['video', 'live'], visibility: 'public', ownerId: 'omnix', memberCount: 96 },
];

const sampleMessages: Message[] = [
  { id: 'm1', roomId: 'room-global', from: 'nova', content: 'Welcome to VYB Social — stay cosmic.', timestamp: Date.now() - 1000 * 60 * 4 },
  { id: 'm2', roomId: 'room-global', from: 'core', content: 'Geo-discovery is live. Opt in via Profile.', timestamp: Date.now() - 1000 * 60 * 2 },
];

const sampleThreads: DmThread[] = [
  { id: 'dm1', with: 'solstice', lastMessage: 'Let’s sync later today.', timestamp: Date.now() - 1000 * 60 * 60 },
  { id: 'dm2', with: 'aether', lastMessage: 'Design drop is 🔥', timestamp: Date.now() - 1000 * 60 * 5 },
];

export function VYBSocialApp() {
  const { identity, isAuthenticated } = useAbyssIDIdentity();
  const [activeTab, setActiveTab] = useState<Tab>('rooms');
  const [rooms, setRooms] = useState<Room[]>(sampleRooms);
  const [messages, setMessages] = useState<Message[]>(sampleMessages);
  const [threads] = useState<DmThread[]>(sampleThreads);
  const [selectedRoomId, setSelectedRoomId] = useState<string>(sampleRooms[0]?.id || '');
  const [composer, setComposer] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [quickMatchLooking, setQuickMatchLooking] = useState(false);
  const [profileDraft, setProfileDraft] = useState<Profile | null>(() =>
    identity
      ? {
          abyssId: identity.publicKey || identity.username || 'me',
          username: identity.username || 'you',
          tags: ['premium', 'abyss'],
          locationOptIn: false,
          bio: 'Define your signal. Geo-discovery is opt-in.',
        }
      : null
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) || rooms[0],
    [rooms, selectedRoomId]
  );

  const roomMessages = useMemo(
    () => messages.filter((m) => m.roomId === selectedRoom?.id).sort((a, b) => a.timestamp - b.timestamp),
    [messages, selectedRoom]
  );

  const handleSend = () => {
    if (!selectedRoom || !composer.trim() || !identity?.username) return;
    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      roomId: selectedRoom.id,
      from: identity.username,
      content: composer.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setComposer('');
  };

  const handleCreateRoom = () => {
    if (!newRoomName.trim()) return;
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      description: newRoomDescription.trim() || 'Premium room',
      tags: ['custom'],
      visibility: 'public',
      ownerId: identity?.username || 'me',
      memberCount: 1,
    };
    setRooms((prev) => [newRoom, ...prev]);
    setSelectedRoomId(newRoom.id);
    setNewRoomName('');
    setNewRoomDescription('');
  };

  const startQuickMatch = () => {
    setQuickMatchLooking(true);
    setTimeout(() => setQuickMatchLooking(false), 2500);
  };

  if (!isAuthenticated || !identity) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-genesis-glass-light text-genesis-text-secondary">
        <div className="text-center space-y-3">
          <div className="text-xl font-semibold">Sign in with QorID to enter VYB Social</div>
          <div className="text-sm text-genesis-text-tertiary">Profiles, rooms, and chat all ride on your QorID.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex bg-genesis-glass-light/90 text-gray-100">
      {/* Left nav */}
      <div className="w-56 border-r border-genesis-border-default/20 bg-genesis-glass-light/60 backdrop-blur-sm p-4 space-y-2">
        {(['rooms', 'dms', 'friends', 'discover', 'profile', 'quickmatch', 'settings'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`w-full text-left px-3 py-2 rounded transition-colors ${
              activeTab === tab ? 'bg-abyss-cyan text-black font-semibold' : 'hover:bg-abyss-cyan/10'
            }`}
          >
            {tab === 'rooms' && 'Rooms'}
            {tab === 'dms' && 'DMs & Inbox'}
            {tab === 'friends' && 'Friends'}
            {tab === 'discover' && 'Discover'}
            {tab === 'profile' && 'Profile'}
            {tab === 'quickmatch' && 'Quick Match'}
            {tab === 'settings' && 'Settings / Moderation'}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-6 py-4 border-b border-genesis-border-default/20 flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-genesis-cipher-cyan">VYB Social</div>
            <div className="text-sm text-genesis-text-tertiary">Premium on-chain social tied to QorID</div>
          </div>
          <div className="text-sm text-genesis-text-secondary">
            Signed in as <span className="text-genesis-cipher-cyan font-semibold">{identity.username}</span>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {activeTab === 'rooms' && selectedRoom && (
            <div className="grid grid-cols-3 gap-4">
              {/* Room list */}
              <div className="col-span-1 bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-200">Chatrooms</div>
                  <span className="text-xs text-genesis-text-tertiary">{rooms.length} live</span>
                </div>
                <div className="space-y-2 overflow-auto max-h-[420px] pr-1">
                  {rooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedRoomId(room.id)}
                      className={`w-full text-left px-3 py-2 rounded border transition-all ${
                        selectedRoomId === room.id
                          ? 'border-genesis-border-default bg-abyss-cyan/10'
                          : 'border-genesis-border-default/20 hover:border-genesis-border-default/50'
                      }`}
                    >
                      <div className="font-semibold text-gray-100">{room.name}</div>
                      <div className="text-xs text-genesis-text-tertiary line-clamp-2">{room.description}</div>
                      <div className="text-[11px] text-genesis-cipher-cyan mt-1">
                        {room.tags.join(' • ')} · {room.memberCount} online
                      </div>
                    </button>
                  ))}
                </div>
                {/* Create room */}
                <div className="pt-3 border-t border-genesis-border-default/20 space-y-2">
                  <div className="text-sm text-genesis-text-secondary font-semibold">Create room</div>
                  <input
                    className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    placeholder="Room name"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                  />
                  <input
                    className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    placeholder="Description"
                    value={newRoomDescription}
                    onChange={(e) => setNewRoomDescription(e.target.value)}
                  />
                  <Button onClick={handleCreateRoom} className="w-full text-sm">
                    Create
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <div className="col-span-2 bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4 flex flex-col min-h-[520px]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-lg font-semibold text-genesis-cipher-cyan">{selectedRoom.name}</div>
                    <div className="text-xs text-genesis-text-tertiary">{selectedRoom.description}</div>
                  </div>
                  <div className="text-xs text-genesis-text-tertiary">{selectedRoom.memberCount} online</div>
                </div>
                <div className="flex-1 bg-genesis-glass-light/40 rounded p-3 border border-genesis-border-default/10 overflow-auto space-y-3">
                  {roomMessages.map((msg) => (
                    <div key={msg.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-genesis-cipher-cyan font-semibold">{msg.from}</span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-100">{msg.content}</div>
                    </div>
                  ))}
                  {roomMessages.length === 0 && (
                    <div className="text-gray-500 text-sm">No messages yet. Start the vibe.</div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    className="flex-1 px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    placeholder="Send a message..."
                    value={composer}
                    onChange={(e) => setComposer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button onClick={handleSend} className="px-4">
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dms' && (
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-1 bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-3 space-y-2">
                <div className="font-semibold text-gray-200">Inbox</div>
                {threads.map((t) => (
                  <div key={t.id} className="p-3 rounded border border-genesis-border-default/20 bg-genesis-glass-light/40">
                    <div className="text-genesis-cipher-cyan font-semibold">{t.with}</div>
                    <div className="text-xs text-genesis-text-tertiary line-clamp-2">{t.lastMessage}</div>
                  </div>
                ))}
              </div>
              <div className="col-span-2 bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4">
                <div className="text-sm text-genesis-text-tertiary">Select a thread to continue the conversation.</div>
              </div>
            </div>
          )}

          {activeTab === 'friends' && (
            <div className="bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-genesis-cipher-cyan">Friend graph</div>
                  <div className="text-sm text-genesis-text-tertiary">Requests, acceptances, blocks.</div>
                </div>
                <Button className="text-sm px-4">Add friend</Button>
              </div>
              <div className="text-sm text-genesis-text-tertiary">Graph visualization coming with backend wiring.</div>
            </div>
          )}

          {activeTab === 'discover' && (
            <div className="bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-genesis-cipher-cyan">Discover</div>
                  <div className="text-sm text-genesis-text-tertiary">Geo + tags. Opt-in only.</div>
                </div>
                <Button className="text-sm px-4">Refresh</Button>
              </div>
              <div className="text-sm text-genesis-text-tertiary">
                Discover uses opt-in location and tags to surface nearby rooms and people. This view is stubbed until
                the backend + on-chain anchors are wired.
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4 space-y-4">
              <div className="text-lg font-semibold text-genesis-cipher-cyan">Profile</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-genesis-text-secondary">Display name</label>
                  <input
                    className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    value={profileDraft?.username || ''}
                    onChange={(e) =>
                      setProfileDraft((prev) =>
                        prev ? { ...prev, username: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-genesis-text-secondary">Bio</label>
                  <input
                    className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    value={profileDraft?.bio || ''}
                    onChange={(e) =>
                      setProfileDraft((prev) =>
                        prev ? { ...prev, bio: e.target.value } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-genesis-text-secondary">Tags (comma separated)</label>
                  <input
                    className="w-full px-3 py-2 bg-genesis-glass-light border border-genesis-border-default/30 rounded text-sm"
                    value={profileDraft?.tags.join(', ') || ''}
                    onChange={(e) =>
                      setProfileDraft((prev) =>
                        prev ? { ...prev, tags: e.target.value.split(',').map((t) => t.trim()).filter(Boolean) } : null
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-genesis-text-secondary">Location opt-in</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={profileDraft?.locationOptIn || false}
                      onChange={(e) =>
                        setProfileDraft((prev) =>
                          prev ? { ...prev, locationOptIn: e.target.checked } : null
                        )
                      }
                    />
                    <span className="text-sm text-genesis-text-secondary">Share coarse location for discovery</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="px-4 text-sm">Save (local draft)</Button>
                <Button variant="secondary" className="px-4 text-sm">
                  Sync to chain (coming soon)
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'quickmatch' && (
            <div className="bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-6 space-y-4">
              <div className="text-lg font-semibold text-genesis-cipher-cyan">Quick Match</div>
              <div className="text-sm text-genesis-text-tertiary">
                Omegle-style: match by proximity and tags. Webcam optional. This UI is ready; signaling/wrtc backend is
                stubbed.
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={startQuickMatch} disabled={quickMatchLooking} className="px-6">
                  {quickMatchLooking ? 'Matching...' : 'Start quick match'}
                </Button>
                <Button variant="secondary" className="px-4">
                  Toggle webcam (UI only)
                </Button>
              </div>
              {quickMatchLooking && <div className="text-genesis-cipher-cyan text-sm">Searching for the perfect vibe...</div>}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-genesis-glass-light/60 border border-genesis-border-default/20 rounded-lg p-4 space-y-4">
              <div className="text-lg font-semibold text-genesis-cipher-cyan">Settings & Moderation</div>
              <div className="grid grid-cols-2 gap-4 text-sm text-genesis-text-secondary">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-200">Room controls</div>
                  <div className="space-y-1 text-genesis-text-tertiary">
                    <div>• Assign mods, mute/ban, lock rooms.</div>
                    <div>• On-chain room metadata anchoring (planned).</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold text-gray-200">Security</div>
                  <div className="space-y-1 text-genesis-text-tertiary">
                    <div>• QorID session required for all actions.</div>
                    <div>• Media hashes and room manifests anchor to chain (coming).</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500">Backend + chain wiring will replace the local stub service.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


