import { registerPlugin } from "@capacitor/core";

export interface NativeGoogleUser {
  idToken?: string;
  serverAuthCode?: string;
  email?: string;
  displayName?: string;
  givenName?: string;
  familyName?: string;
}

export interface NativeGoogleAuthPlugin {
  signIn(options?: { clientId?: string }): Promise<NativeGoogleUser>;
  signOut(): Promise<void>;
}

export const NativeGoogleAuth = registerPlugin<NativeGoogleAuthPlugin>("NativeGoogleAuth");
