import { useQuery } from '@tanstack/react-query'
import { buildingService } from '../services/buildingService'
import { vehicleTypeService } from '../services/vehicleTypeService'
import { floorService } from '../services/floorService'
import { zoneService } from '../services/zoneService'

// Các hook nhỏ load danh mục để đổ vào dropdown. Lấy pageSize lớn để gom đủ
// trong một lần gọi (master data thường ít bản ghi).

export function useBuildingOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['buildings', 'options'],
    queryFn: () => buildingService.list({ isActive: true, pageSize: 200 }),
    staleTime: 5 * 60 * 1000,
  })
  const options = (data?.items || []).map((b) => ({ value: b.id, label: b.name }))
  return { items: data?.items || [], options, isLoading }
}

export function useVehicleTypeOptions() {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-types', 'options'],
    queryFn: () => vehicleTypeService.list({ isActive: true, pageSize: 200 }),
    staleTime: 5 * 60 * 1000,
  })
  const options = (data?.items || []).map((t) => ({ value: t.id, label: t.name }))
  return { items: data?.items || [], options, isLoading }
}

// Tầng theo tòa nhà — chỉ chạy khi đã chọn buildingId.
export function useFloorOptions(buildingId) {
  const { data, isLoading } = useQuery({
    queryKey: ['floors', 'options', buildingId],
    queryFn: () => floorService.list({ buildingId, isActive: true, pageSize: 200 }),
    enabled: !!buildingId,
    staleTime: 5 * 60 * 1000,
  })
  const options = (data?.items || []).map((f) => ({
    value: f.id,
    label: `${f.name} (tầng ${f.floorNumber})`,
  }))
  return { items: data?.items || [], options, isLoading }
}

// Khu vực theo tòa nhà (+ tầng nếu có).
export function useZoneOptions(buildingId, floorId, enabled = true) {
  const { data, isLoading } = useQuery({
    queryKey: ['zones', 'options', buildingId, floorId],
    queryFn: () => zoneService.list({ buildingId, floorId, isActive: true, pageSize: 200 }),
    enabled: enabled && !!buildingId,
    staleTime: 5 * 60 * 1000,
  })
  const options = (data?.items || []).map((z) => ({ value: z.id, label: z.name }))
  return { items: data?.items || [], options, isLoading }
}
