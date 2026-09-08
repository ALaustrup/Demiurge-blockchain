const STUDIO_NODE = process.env.DEMIURGE_RPC_HOST || "127.0.0.1";
const STUDIO_RPC_PORT = Number(process.env.DEMIURGE_RPC_PORT || 9944);

export async function GET() {
  try {
    // Check if server is reachable
    const isReachable = await checkServerReachability();

    if (isReachable) {
      return Response.json({
        isOnline: true,
        blockHeight: 42069,
        network: "Demiurge Network",
        version: "1.0.0",
        peers: 24,
        timestamp: Date.now(),
        nodeUrl: `ws://${STUDIO_NODE}:${STUDIO_RPC_PORT}`,
      });
    } else {
      return Response.json({
        isOnline: false,
        comingSoon: true,
        message: "Demiurge Network launching soon",
        timestamp: Date.now(),
      });
    }
  } catch (error) {
    console.error("Chain status check error:", error);
    return Response.json({
      isOnline: false,
      comingSoon: true,
      message: "Chain not yet available",
      timestamp: Date.now(),
    });
  }
}

async function checkServerReachability() {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1500);
    const res = await fetch(`http://${STUDIO_NODE}:${STUDIO_RPC_PORT}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}
