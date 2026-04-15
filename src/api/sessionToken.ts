let sessionBearerToken: string | undefined;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribeSessionBearer(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionBearerToken() {
  return sessionBearerToken;
}

export function setSessionBearerToken(token: string) {
  sessionBearerToken = token.trim() || undefined;
  emit();
}

export function clearSessionBearerToken() {
  sessionBearerToken = undefined;
  emit();
}
