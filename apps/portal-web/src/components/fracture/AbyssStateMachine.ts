"use client";

import { useState, useCallback } from "react";
import { generateKeys, deriveKeysFromSeed, type GeneratedAbyssIdentity } from "@/lib/fracture/crypto/generateKeys";
import { useAbyssID } from "@/lib/fracture/identity/AbyssIDContext";

export type AbyssState = "idle" | "checking" | "reject" | "accept" | "binding" | "confirm" | "login" | "verifying";

export interface AbyssContext {
  username: string;
  seedPhrase?: string;
  publicKey?: string;
  address?: string;
  error?: string;
  isExistingUser?: boolean; // True if username exists, showing login flow
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
        // Username exists - show login flow instead of reject
        setState("login");
        setContext((prev) => ({
          ...prev,
          isExistingUser: true,
          error: undefined, // Clear any previous errors
        }));
      } else {
        // Username is available - proceed with signup
        setState("accept");
        setContext((prev) => ({
          ...prev,
          isExistingUser: false,
        }));
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

  const setSeedPhrase = useCallback((seedPhrase: string) => {
    setContext((prev) => ({
      ...prev,
      seedPhrase,
      error: undefined,
    }));
  }, []);

  const verifyLogin = useCallback(async () => {
    if (!context.seedPhrase || !context.username.trim()) {
      setState("login");
      setContext((prev) => ({
        ...prev,
        error: "Please enter your security words",
      }));
      return;
    }

    setState("verifying");

    try {
      const API_URL = getApiUrl();
      const username = context.username.trim();
      const seedPhrase = context.seedPhrase.trim();

      // Derive keys from seed phrase
      const { publicKey } = await deriveKeysFromSeed(seedPhrase);
      
      // Get stored identity from backend
      const response = await fetch(`${API_URL}/api/abyssid/${username}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Username not found");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const identityData = await response.json();

      // Verify the derived public key matches the stored one
      if (identityData.publicKey && identityData.publicKey !== publicKey) {
        throw new Error("Invalid security words. The words you entered do not match this identity.");
      }

      // Derive address from public key
      const address = identityData.address || ("0x" + publicKey.replace(/[^0-9a-f]/gi, '').substring(0, 40).padEnd(40, '0'));
      
      // Update context with recovered keys
      setContext((prev) => ({
        ...prev,
        publicKey: identityData.publicKey || publicKey,
        address,
        seedPhrase, // Keep the seed phrase for storage
      }));

      // Store identity in global context
      setIdentity({
        username,
        address: identityData.address || address,
        publicKey,
        seedPhrase,
        createdAt: identityData.createdAt || Date.now(),
      });

      // Success - proceed to confirm
      setState("confirm");
    } catch (error: any) {
      console.error("Login verification failed:", error);
      setState("login");
      setContext((prev) => ({
        ...prev,
        error: error.message || "Invalid security words. Please try again.",
      }));
    }
  }, [context.username, context.seedPhrase, setIdentity]);

  return {
    state,
    context,
    setUsername,
    setSeedPhrase,
    startChecking,
    triggerReject,
    triggerAccept,
    startBinding,
    confirmAndProceed,
    verifyLogin,
  };
}
