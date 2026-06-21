import { api, unwrap } from '../lib/apiClient'

export const parkingMapService = {
  floorMap: async (floorId) => {
    const res = await api.get(`/api/v1/parking-map/floors/${floorId}/map`)
    return unwrap(res)
  },
  buildingFloors: async (buildingId) => {
    const res = await api.get(`/api/v1/parking-map/buildings/${buildingId}/floors`)
    return unwrap(res)
  },
}
