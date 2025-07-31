import { apiClient } from "../apiClient";
import endpoints from "../endpoints";

interface StoreTimesResponse {
  id: string;
  day_of_week: number;
  end_time: string;
  is_open: boolean;
  start_time: string;
}

export const getStoreTimes = async (): Promise<StoreTimesResponse[]> => {
  return apiClient.get(endpoints["store-times"]);
};

export const createStoreTime = async (
  request: Omit<StoreTimesResponse, "id">
): Promise<StoreTimesResponse> => {
  return apiClient.post<StoreTimesResponse>(endpoints["store-times"], request);
};

export const getStoreTimeById = async ({
  id,
}: {
  id: string;
}): Promise<StoreTimesResponse> => {
  return apiClient.get<StoreTimesResponse>(endpoints["store-times-by-id"](id));
};

export const updateStoreTimeByID = async ({
  id,
  request,
}: {
  id: string;
  request: Omit<StoreTimesResponse, "id">;
}): Promise<StoreTimesResponse> => {
  return apiClient.put<StoreTimesResponse>(
    endpoints["store-times-by-id"](id),
    request
  );
};
export const deleteStoreTimeByID = async (id: string): Promise<void> => {
  return apiClient.delete(endpoints["store-times-by-id"](id));
};

export const getStoreTimesByDay = async ({
  day,
}: {
  day: number;
}): Promise<StoreTimesResponse[]> => {
  return apiClient.get<StoreTimesResponse[]>(
    endpoints["store-times-by-day"](day)
  );
};
