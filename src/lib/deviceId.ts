import { randomUUID } from "expo-crypto";
import * as SecureStore from "expo-secure-store";

const KEY = "ide_device_id";

export async function getDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(KEY);
  if (!id) {
    id = randomUUID();
    await SecureStore.setItemAsync(KEY, id);
  }
  return id;
}
