import AsyncStorage from "@react-native-async-storage/async-storage";

// Centralized key names so the rest of the app never hardcodes the string.
const TOKEN_KEY = "@agri-app/token";
const USER_KEY = "@agri-app/user";

function isStorageUnavailableError(error) {
  const message = error?.message || "";
  return (
    message.includes("Native module is null") ||
    message.includes("legacy storage") ||
    message.includes("cannot access")
  );
}

async function safeStorageOperation(operation, fallbackValue) {
  try {
    return await operation();
  } catch (error) {
    if (isStorageUnavailableError(error)) {
      return fallbackValue;
    }
    throw error;
  }
}

async function writeEntries(entries) {
  if (typeof AsyncStorage.setMany === "function") {
    await AsyncStorage.setMany(Object.fromEntries(entries));
    return;
  }

  if (typeof AsyncStorage.multiSet === "function") {
    await AsyncStorage.multiSet(entries);
    return;
  }

  for (const [key, value] of entries) {
    await AsyncStorage.setItem(key, value);
  }
}

async function readEntries(keys) {
  if (typeof AsyncStorage.getMany === "function") {
    const values = await AsyncStorage.getMany(keys);
    return keys.map((key) => [key, values[key] ?? null]);
  }

  if (typeof AsyncStorage.multiGet === "function") {
    return AsyncStorage.multiGet(keys);
  }

  const results = [];
  for (const key of keys) {
    results.push([key, await AsyncStorage.getItem(key)]);
  }
  return results;
}

async function removeEntries(keys) {
  if (typeof AsyncStorage.removeMany === "function") {
    await AsyncStorage.removeMany(keys);
    return;
  }

  if (typeof AsyncStorage.multiRemove === "function") {
    await AsyncStorage.multiRemove(keys);
    return;
  }

  for (const key of keys) {
    await AsyncStorage.removeItem(key);
  }
}

export async function saveSession(token, user) {
  await safeStorageOperation(
    async () => {
      await writeEntries([
        [TOKEN_KEY, token ?? ""],
        [USER_KEY, JSON.stringify(user ?? null)],
      ]);
    },
    null
  );
}

export async function loadSession() {
  const result = await safeStorageOperation(
    async () => {
      const entries = await readEntries([TOKEN_KEY, USER_KEY]);
      const token = entries.find(([key]) => key === TOKEN_KEY)?.[1] || null;
      const rawUser = entries.find(([key]) => key === USER_KEY)?.[1] || null;

      let user = null;
      try {
        user = rawUser ? JSON.parse(rawUser) : null;
      } catch {
        user = null;
      }

      return { token: token || null, user };
    },
    { token: null, user: null }
  );

  return result;
}

export async function clearSession() {
  await safeStorageOperation(
    async () => {
      await removeEntries([TOKEN_KEY, USER_KEY]);
    },
    null
  );
}
