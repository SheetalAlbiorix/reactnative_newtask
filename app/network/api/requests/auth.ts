import { apiClient } from "../apiClient";
import endpoints from "../endpoints";

export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

interface AuthVerifyResponse {
  email: string;
}

export const authenticationUser = async (
  request: AuthRequest
): Promise<AuthResponse> => {
  return apiClient.post<AuthResponse>(endpoints.auth, request);
};

export const verifyAuthentication = async ({
  token,
}: {
  token: string;
}): Promise<AuthVerifyResponse> => {
  return apiClient.get<AuthVerifyResponse>(endpoints["auth-verify"], {
    headers: { Authorization: `Bearer ${token}` },
  });
};
