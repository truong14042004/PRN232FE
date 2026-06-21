import {
  HubConnectionBuilder,
  HttpTransportType,
  LogLevel,
} from '@microsoft/signalr'
import { tokenStore } from './apiClient'

// SignalR nối THẲNG tới Parking service (không qua Ocelot gateway) vì
// gateway không proxy WebSocket + access_token tốt. Xem cấu hình backend.
const HUB_BASE =
  import.meta.env.VITE_PARKING_HUB_URL || 'http://localhost:5002'

const HUB_PATH = '/hubs/parking-map'

// Tạo một kết nối tới ParkingMapHub. Token được nạp động qua accessTokenFactory
// nên kết nối luôn dùng access token mới nhất trong localStorage.
export function createParkingMapConnection() {
  return new HubConnectionBuilder()
    .withUrl(`${HUB_BASE}${HUB_PATH}`, {
      accessTokenFactory: () => tokenStore.getAccess() || '',
      // Ưu tiên WebSocket, fallback các transport khác.
      transport:
        HttpTransportType.WebSockets |
        HttpTransportType.ServerSentEvents |
        HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .configureLogging(LogLevel.Warning)
    .build()
}

// Tên event server -> client.
export const HUB_EVENTS = {
  SlotStatusChanged: 'SlotStatusChanged',
}

// Tên method client -> server.
export const HUB_METHODS = {
  SubscribeFloor: 'SubscribeFloor',
  UnsubscribeFloor: 'UnsubscribeFloor',
}
