"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

export function useClientId(): string | null {
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("quialaref_client_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("quialaref_client_id", id);
    }
    setClientId(id);
  }, []);

  return clientId;
}
