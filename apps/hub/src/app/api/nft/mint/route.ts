/**
 * NFT Mint API Route
 * 
 * Mints a new DRC-369 NFT on the Demiurge blockchain via the RPC node.
 * Returns real on-chain results or real errors — never fakes success.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireQorUser, isAuthFailure, isAdminRole } from '@/lib/auth/require-qor-user';
import { isValidAdminApiKey } from '@/lib/auth/admin-api-key';

const RPC_ENDPOINT = process.env.DEMIURGE_RPC_URL || 'http://localhost:9944';

interface MintRequest {
  name: string;
  description?: string;
  image?: string;
  collection?: string;
  creator: string;
  owner: string;
  soulbound?: boolean;
  dynamic?: boolean;
  attributes?: Array<{ trait_type: string; value: string | number }>;
  dynamicState?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Resolve the caller for admin NFT operations.
 *  - `x-api-key`: must match one of NFT_ADMIN_API_KEYS (env, constant-time compare).
 *  - Bearer token / qor_token cookie: validated against qor-auth; role must be admin/god.
 * No hard-coded keys, no prefix bypass, no unverified JWT decoding. Fails closed.
 */
async function authorizeAdmin(
  request: NextRequest
): Promise<{ user: { qor_id: string; role: string } } | NextResponse> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey) {
    if (!isValidAdminApiKey(apiKey)) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    return { user: { qor_id: 'admin-api-key', role: 'admin' } };
  }

  const identity = await requireQorUser(request);
  if (isAuthFailure(identity)) {
    return identity;
  }
  if (!isAdminRole(identity.role)) {
    return NextResponse.json(
      { error: 'Insufficient permissions. god/admin role required.' },
      { status: 403 }
    );
  }
  return { user: { qor_id: identity.qorId, role: identity.role } };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeAdmin(request);
    if (auth instanceof NextResponse) {
      return auth;
    }
    const { user } = auth;
    
    // Parse request body
    const body: MintRequest = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { error: 'NFT name is required' },
        { status: 400 }
      );
    }
    
    // Call the blockchain RPC to mint
    const rpcPayload = {
      jsonrpc: '2.0',
      id: 1,
      method: 'drc369_mint',
      params: [{
        owner: body.owner || user.qor_id,
        name: body.name,
        description: body.description || '',
        image: body.image || '',
        soulbound: body.soulbound || false,
        dynamic: body.dynamic || false,
        metadata: {
          ...(body.metadata || {}),
          collection: body.collection || null,
          creator: body.creator || user.qor_id,
          attributes: body.attributes || [],
          createdBy: user.qor_id,
        },
      }],
    };

    let rpcResponse: Response;
    try {
      rpcResponse = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rpcPayload),
      });
    } catch (err) {
      console.error('[NFT Mint] RPC connection failed:', err);
      return NextResponse.json(
        { 
          error: 'Blockchain node unreachable',
          details: 'Could not connect to the Demiurge RPC node. Ensure the node is running.',
        },
        { status: 503 }
      );
    }
    
    const rpcResult = await rpcResponse.json();
    
    // Propagate RPC errors directly
    if (rpcResult.error) {
      console.error('[NFT Mint] RPC error:', rpcResult.error);
      return NextResponse.json(
        { 
          error: 'Blockchain mint failed',
          rpcError: rpcResult.error.message || rpcResult.error,
          code: rpcResult.error.code,
        },
        { status: 502 }
      );
    }
    
    if (!rpcResult.result) {
      console.error('[NFT Mint] Empty RPC result');
      return NextResponse.json(
        { error: 'Blockchain returned empty result' },
        { status: 502 }
      );
    }

    const mintResult = rpcResult.result;
    
    console.log(`[NFT Mint] Minted on-chain: ${mintResult.token_id} txHash=${mintResult.tx_hash} block=${mintResult.block_number}`);
    
    return NextResponse.json({
      success: true,
      tokenId: mintResult.token_id,
      txHash: mintResult.tx_hash,
      blockNumber: mintResult.block_number,
      owner: mintResult.owner,
      name: mintResult.name,
      soulbound: mintResult.soulbound,
      status: mintResult.status,
      onChain: true,
    });
    
  } catch (error) {
    console.error('[NFT Mint] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to mint NFT', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
