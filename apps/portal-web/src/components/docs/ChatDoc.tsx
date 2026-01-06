"use client";

export function ChatDoc() {
  return (
    <div className="space-y-6 text-sm text-zinc-200">
      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Chat System Overview</h3>
        <p className="text-zinc-300 mb-4">
          The Demiurge chat system provides World Chat, Direct Messages, and custom rooms for social interaction within the ecosystem.
        </p>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Chat Types</h3>
        <div className="space-y-3">
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">World Chat</h4>
            <p className="text-xs text-zinc-300">
              Global chat room visible to all users. Messages are public and persistent. Accessible from the Nexus page.
            </p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Direct Messages (DMs)</h4>
            <p className="text-xs text-zinc-300">
              Private conversations between two users. Messages are private and only visible to participants. Can mention users by username (@username).
            </p>
          </div>
          <div className="p-3 bg-black/20 border border-white/10 rounded-lg">
            <h4 className="font-semibold text-cyan-400 mb-1">Custom Rooms</h4>
            <p className="text-xs text-zinc-300">
              User-created chat rooms with custom settings, rules, and moderation. Room creators can manage settings and moderate content.
            </p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">Features</h3>
        <ul className="text-xs text-zinc-300 space-y-2 list-disc list-inside">
          <li><strong className="text-zinc-100">Media Sharing:</strong> Share images, videos, and NFTs in messages</li>
          <li><strong className="text-zinc-100">Username Mentions:</strong> Mention users with @username</li>
          <li><strong className="text-zinc-100">Message Blurring:</strong> Optional content blurring for safety</li>
          <li><strong className="text-zinc-100">System Messages:</strong> Automated messages at intervals</li>
          <li><strong className="text-zinc-100">Room Music:</strong> Background music playback in rooms</li>
          <li><strong className="text-zinc-100">Moderation:</strong> Silence users, flag content, manage rooms</li>
        </ul>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-zinc-50 mb-3">GraphQL API</h3>
        <div className="p-4 bg-black/20 border border-white/10 rounded-lg">
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Endpoint:</strong> <code className="bg-black/30 px-1 rounded">http://localhost:4000/graphql</code>
          </p>
          <p className="text-xs text-zinc-300 mb-2">
            <strong className="text-zinc-100">Queries:</strong> messages, rooms, users, analytics
          </p>
          <p className="text-xs text-zinc-300">
            <strong className="text-zinc-100">Mutations:</strong> sendMessage, createRoom, updateRoomSettings
          </p>
        </div>
      </div>

      <div className="p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
        <p className="text-xs text-zinc-200">
          <strong>Complete Documentation:</strong> See <code className="bg-black/30 px-1 rounded">docs/chat/page.mdx</code> for GraphQL schema, query examples, and integration guide.
        </p>
      </div>
    </div>
  );
}
