import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

export interface DefaultErrorResponse {
  message: string;
}

class ApiClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  private handleResponse<T>(response: AxiosResponse<T>): T {
    return response.data;
  }

  private handleError(error: any): never {
    if (error.response) {
      // Server responded with error status
      throw error.response.data;
    } else if (error.request) {
      // Request was made but no response received
      throw { message: "Network error: No response received" };
    } else {
      // Something else happened
      throw { message: error.message || "An unexpected error occurred" };
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.get<T>(url, config);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async post<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.post<T>(url, data, config);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async put<T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.axiosInstance.put<T>(url, data, config);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.axiosInstance.delete<T>(url, config);
      return this.handleResponse(response);
    } catch (error) {
      this.handleError(error);
    }
  }

  // Method to add interceptors if needed
  addRequestInterceptor(
    onFulfilled?: (
      value: InternalAxiosRequestConfig
    ) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>,
    onRejected?: (error: any) => any
  ) {
    return this.axiosInstance.interceptors.request.use(onFulfilled, onRejected);
  }

  addResponseInterceptor(
    onFulfilled?: (
      value: AxiosResponse
    ) => AxiosResponse | Promise<AxiosResponse>,
    onRejected?: (error: any) => any
  ) {
    return this.axiosInstance.interceptors.response.use(
      onFulfilled,
      onRejected
    );
  }

  // Method to set authorization header
  setAuthToken(token: string) {
    this.axiosInstance.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  }

  // Method to remove authorization header
  removeAuthToken() {
    delete this.axiosInstance.defaults.headers.common["Authorization"];
  }
}

export const apiClient = new ApiClient();
