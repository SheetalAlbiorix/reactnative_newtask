export default {
  /**
   *  POST: login, register
   */
  auth: "/auth",
  /**
   * POST: verify user
   */
  "auth-verify": "/auth/verify",
  /**
   * GET: get all store times
   * POST: create a new store time
   */
  "store-times": "/store-times",
  /**
   * GET: Get store time by ID
   * PUT: Update a store time by ID
   * DELETE: Delete a store time by ID
   */
  "store-times-by-id": (id: string) => `/store-times/${id}`,
  /**
   * GET: Get store times by day
   */
  "store-times-by-day": (day: number | string) => `/store-times/day/${day}`,
  /**
   * GET: get all store overrides
   * POST: create a new store override
   */
  "store-overrides": "/store-overrides",
  /**
   * GET: Get store override by ID
   * PUT: Update a store override by ID
   * DELETE: Delete a store override by ID
   */
  "store-overrides-by-id": (id: string) => `/store-overrides/${id}`,
  /**
   * GET: Get store overrides by day
   */
  "store-overrides-by-day": (month: number | string, day: number | string) =>
    `/store-overrides/date/${month}/${day}`,
};
