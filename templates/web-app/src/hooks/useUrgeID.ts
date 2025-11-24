"use client";

import { useState, useEffect } from "react";
import { sdk } from "@/lib/sdk";
import { deriveAddress } from "@demiurge/ts-sdk";

export function useUrgeID() {
  const [address, setAddress] = useState<string | null>(null);
  const [privateKey, setPrivateKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedAddress = localStorage.getItem("demiurge_address");
    const storedPrivateKey = localStorage.getItem("demiurge_private_key");
    
    if (storedAddress && storedPrivateKey) {
      setAddress(storedAddress);
      setPrivateKey(storedPrivateKey);
      loadProfile(storedAddress);
    }
  }, []);

  const loadProfile = async (addr: string) => {
    try {
      setLoading(true);
      const prof = await sdk.urgeid.getProfile(addr);
      setProfile(prof);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNew = async () => {
    try {
      setLoading(true);
      // Generate random private key
      const privateKeyBytes = new Uint8Array(32);
      crypto.getRandomValues(privateKeyBytes);
      const privateKeyHex = Array.from(privateKeyBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
      
      const addr = await deriveAddress("0x" + privateKeyHex);
      
      setAddress(addr);
      setPrivateKey("0x" + privateKeyHex);
      
      localStorage.setItem("demiurge_address", addr);
      localStorage.setItem("demiurge_private_key", "0x" + privateKeyHex);
      
      await loadProfile(addr);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExisting = async (addr: string) => {
    try {
      setLoading(true);
      setAddress(addr);
      localStorage.setItem("demiurge_address", addr);
      await loadProfile(addr);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    address,
    privateKey,
    profile,
    loading,
    error,
    generateNew,
    loadExisting,
    refresh: () => address && loadProfile(address),
  };
}

