import { apiClient } from "../apiClient";
import endpoints from "../endpoints";

interface StoreOverrideResponse {
  id: string;
  day: number;
  month: number;
  is_open: boolean;
  start_time: string;
  end_time: string;
}

export const getStoreOverrides = async (): Promise<StoreOverrideResponse[]> => {
  return apiClient.get<StoreOverrideResponse[]>(endpoints["store-overrides"]);
};

export const createStoreOverride = async (
  request: Omit<StoreOverrideResponse, "id">
): Promise<StoreOverrideResponse> => {
  return apiClient.post<StoreOverrideResponse>(
    endpoints["store-overrides"],
    request
  );
};

export const getStoreOverrideById = async ({
  id,
}: {
  id: string;
}): Promise<StoreOverrideResponse> => {
  return apiClient.get<StoreOverrideResponse>(
    endpoints["store-overrides-by-id"](id)
  );
};

export const updateStoreOverrideById = async ({
  id,
  request,
}: {
  id: string;
  request: Omit<StoreOverrideResponse, "id">;
}): Promise<StoreOverrideResponse> => {
  return apiClient.put<StoreOverrideResponse>(
    endpoints["store-overrides-by-id"](id),
    request
  );
};

export const deleteStoreOverrideById = async ({
  id,
}: {
  id: string;
}): Promise<void> => {
  return apiClient.delete(endpoints["store-overrides-by-id"](id));
};

export const getStoreOverridesByMonthofDay = async ({
  day,
  month,
}: {
  day: number;
  month: number;
}): Promise<StoreOverrideResponse[]> => {
  return apiClient.get<StoreOverrideResponse[]>(
    endpoints["store-overrides-by-day"](month, day)
  );
};
