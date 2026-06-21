import { useEffect, useRef, useState } from 'react'
import { HubConnectionState } from '@microsoft/signalr'
import {
  createParkingMapConnection,
  HUB_EVENTS,
  HUB_METHODS,
} from '../lib/signalr'

// Trạng thái kết nối rút gọn cho UI.
export const HUB_STATUS = {
  Disconnected: 'disconnected',
  Connecting: 'connecting',
  Connected: 'connected',
  Reconnecting: 'reconnecting',
}

/**
 * Quản lý vòng đời kết nối ParkingMapHub.
 * - Mở 1 kết nối khi mount, đóng khi unmount.
 * - Tự subscribe vào group của `floorId` đang xem; đổi tầng thì unsubscribe tầng cũ.
 * - Gọi `onSlotChange(event)` mỗi khi nhận `SlotStatusChanged`.
 *
 * @param {string|null} floorId - tầng đang xem (null = không subscribe)
 * @param {(event: object) => void} onSlotChange - callback khi có thay đổi slot
 */
export function useParkingMapHub(floorId, onSlotChange) {
  const [status, setStatus] = useState(HUB_STATUS.Disconnected)
  const connectionRef = useRef(null)
  const subscribedFloorRef = useRef(null)
  // Giữ callback mới nhất mà không phải tạo lại kết nối.
  const handlerRef = useRef(onSlotChange)
  handlerRef.current = onSlotChange

  // Tạo kết nối một lần.
  useEffect(() => {
    const connection = createParkingMapConnection()
    connectionRef.current = connection

    connection.on(HUB_EVENTS.SlotStatusChanged, (event) => {
      handlerRef.current?.(event)
    })

    connection.onreconnecting(() => setStatus(HUB_STATUS.Reconnecting))
    connection.onreconnected(async () => {
      setStatus(HUB_STATUS.Connected)
      // Sau khi reconnect, group bị mất -> subscribe lại tầng hiện tại.
      const fid = subscribedFloorRef.current
      if (fid) {
        try {
          await connection.invoke(HUB_METHODS.SubscribeFloor, fid)
        } catch {
          // bỏ qua, lần đổi tầng sau sẽ thử lại
        }
      }
    })
    connection.onclose(() => setStatus(HUB_STATUS.Disconnected))

    let cancelled = false
    setStatus(HUB_STATUS.Connecting)
    connection
      .start()
      .then(() => {
        if (!cancelled) setStatus(HUB_STATUS.Connected)
      })
      .catch(() => {
        if (!cancelled) setStatus(HUB_STATUS.Disconnected)
      })

    return () => {
      cancelled = true
      connection.off(HUB_EVENTS.SlotStatusChanged)
      connection.stop().catch(() => {})
      connectionRef.current = null
    }
  }, [])

  // Subscribe/unsubscribe khi đổi tầng hoặc khi đã kết nối.
  useEffect(() => {
    const connection = connectionRef.current
    if (!connection) return
    if (status !== HUB_STATUS.Connected) return

    const prev = subscribedFloorRef.current
    if (prev === floorId) return

    let cancelled = false

    const sync = async () => {
      // Rời tầng cũ (nếu có).
      if (prev) {
        try {
          await connection.invoke(HUB_METHODS.UnsubscribeFloor, prev)
        } catch {
          // bỏ qua
        }
      }
      // Vào tầng mới (nếu có).
      if (floorId && !cancelled) {
        try {
          await connection.invoke(HUB_METHODS.SubscribeFloor, floorId)
          subscribedFloorRef.current = floorId
        } catch {
          // bỏ qua
        }
      } else {
        subscribedFloorRef.current = null
      }
    }

    sync()
    return () => {
      cancelled = true
    }
  }, [floorId, status])

  const isLive =
    status === HUB_STATUS.Connected &&
    connectionRef.current?.state === HubConnectionState.Connected

  return { status, isLive }
}
