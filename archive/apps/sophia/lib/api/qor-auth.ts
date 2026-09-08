import axios from "axios";
import type { AuthResponse, User } from "@lib/types/index";

const authUrl = process.env.NEXT_PUBLIC_QOR_AUTH_URL || "http://localhost:8080/api/v1";

class QORAuthClient {
  private url: string;

  constructor(url: string = authUrl) {
    this.url = url;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${this.url}/auth/login`, {
      identifier: username,
      password,
    });
    return response.data;
  }

  async signup(username: string, email: string, password: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${this.url}/auth/register`, {
      username,
      email,
      password,
    });
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(
      `${this.url}/auth/refresh`,
      { refresh_token: refreshToken }
    );
    return response.data;
  }

  async verifyToken(accessToken: string): Promise<User> {
    const response = await axios.get<User>(
      `${this.url}/profile`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  }

  async logout(accessToken: string): Promise<void> {
    await axios.post(
      `${this.url}/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
  }

  async enable2FA(accessToken: string): Promise<{ qrCode: string; secret: string }> {
    throw new Error("2FA is not implemented by the current qor-auth service.");
  }

  async verify2FA(accessToken: string, code: string): Promise<void> {
    throw new Error("2FA is not implemented by the current qor-auth service.");
  }
}

export const qorAuth = new QORAuthClient();
