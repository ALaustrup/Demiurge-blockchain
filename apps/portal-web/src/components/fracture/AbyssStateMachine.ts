"use client";

import { useState, useCallback } from "react";
import { generateKeys, type GeneratedAbyssIdentity } from "@/lib/fracture/crypto/generateKeys";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";

export type AbyssState = "idle" | "checking" | "reject" | "accept" | "binding" | "confirm";

export interface AbyssContext {
  username: string;
  seedPhrase?: string;
  publicKey?: string;
  address?: string;
  error?: string;
}

// Get API URL from environment or use default
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_ABYSSID_API_URL || 'http://localhost:3001';
  }
  return 'http://localhost:3001';
};

/**
 * useAbyssStateMachine
 * 
 * React hook for managing the AbyssID ritual state machine.
 * Controls the flow: idle → checking → reject|accept → binding → confirm
 */
export function useAbyssStateMachine() {
  const { setIdentity } = useAbyssID();
  const [state, setState] = useState<AbyssState>("idle");
  const [context, setContext] = useState<AbyssContext>({
    username: "",
  });

  const setUsername = useCallback((value: string) => {
    setContext((prev) => ({
      ...prev,
      username: value,
      error: undefined,
    }));
    // Reset to idle if previously reject/accept
    if (state === "reject" || state === "accept") {
      setState("idle");
    }
  }, [state]);

  const startChecking = useCallback(async () => {
    if (!context.username.trim()) {
      return;
    }

    setState("checking");

    try {
      const API_URL = getApiUrl();
      const username = context.username.trim();

      // Validate username length client-side first
      if (username.length < 3) {
        setState("reject");
        setContext((prev) => ({
          ...prev,
          error: "Username must be at least 3 characters",
        }));
        return;
      }

      // Call real backend API
      const response = await fetch(`${API_URL}/api/abyssid/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.available) {
        setState("reject");
        setContext((prev) => ({
          ...prev,
          error: data.error || "Username already taken",
        }));
      } else {
        setState("accept");
      }
    } catch (error: any) {
      console.error("Username check failed:", error);
      setState("reject");
      setContext((prev) => ({
        ...prev,
        error: error.message || "Failed to check username availability. Is the backend running?",
      }));
    }
  }, [context.username]);

  const triggerReject = useCallback((reason?: string) => {
    setState("reject");
    if (reason) {
      setContext((prev) => ({
        ...prev,
        error: reason,
      }));
    }
  }, []);

  const triggerAccept = useCallback(() => {
    setState("accept");
  }, []);

  const startBinding = useCallback(async () => {
    setState("binding");

    try {
      const API_URL = getApiUrl();
      const username = context.username.trim();

      // Generate keys
      const generated = await generateKeys(username);
      
      // Derive address from public key (simplified - in production use proper address derivation)
      // For now, use a hex representation of the public key
      const address = "0x" + generated.publicKey.replace(/[^0-9a-f]/gi, '').substring(0, 40).padEnd(40, '0');

      // Register with backend
      const response = await fetch(`${API_URL}/api/abyssid/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          publicKey: generated.publicKey,
          address: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Registration failed' }));
        throw new Error(errorData.error || `Registration failed: ${response.status}`);
      }

      const registrationData = await response.json();

      // Update context with generated keys
      setContext((prev) => ({
        ...prev,
        seedPhrase: generated.seedPhrase,
        publicKey: generated.publicKey,
        address: address,
      }));

      // Store identity in global context
      setIdentity({
        username,
        address,
        publicKey: generated.publicKey,
        seedPhrase: generated.seedPhrase,
        createdAt: registrationData.createdAt || Date.now(),
      });
    } catch (error: any) {
      console.error("Key generation/registration failed:", error);
      setState("reject");
      setContext((prev) => ({
        ...prev,
        error: error.message || "Failed to generate keys or register identity",
      }));
    }
  }, [context.username, setIdentity]);

  const confirmAndProceed = useCallback(() => {
    setState("confirm");
    // Actual routing to /haven will be handled in the dialog component
  }, []);

  return {
    state,
    context,
    setUsername,
    startChecking,
    triggerReject,
    triggerAccept,
    startBinding,
    confirmAndProceed,
  };
}
