import { useState } from 'react'
import { useQuery, useQueries } from '@tanstack/react-query'
import { Info, MapPin, Tag } from 'lucide-react'
import { buildingService } from '../../services/buildingService'
import { feePolicyService } from '../../services/feePolicyService'
import { parkingMapService } from '../../services/parkingMapService'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardHeader, CardTitle, CardBody } from '../../components/ui/Card'
import Select from '../../components/ui/Select'
import Spinner from '../../components/ui/Spinner'
import { EmptyState } from '../../components/ui/EmptyState'
import { PRICING_TYPE } from '../../lib/enums'
import { formatCurrency } from '../../lib/format'

export default function LotInfoPage() {
  const [buildingId, setBuildingId] = useState('')

  const buildingsQuery = useQuery({
    queryKey: ['buildings', 'options'],
    queryFn: () => buildingService.list({ isActive: true, pageSize: 200 }),
  })
  const buildingOptions = (buildingsQuery.data?.items || []).map((b) => ({ value: b.id, label: b.name }))
  const building = (buildingsQuery.data?.items || []).find((b) => b.id === buildingId)

  // Bảng giá đang áp dụng của tòa nhà.
  const feeQuery = useQuery({
    queryKey: ['fee-policies', 'active', buildingId],
    queryFn: () => feePolicyService.active({ buildingId }),
    enabled: !!buildingId,
  })

  // Danh sách tầng → lấy summary slot trống từng tầng.
  const floorsQuery = useQuery({
    queryKey: ['parking-map', 'floors', buildingId],
    queryFn: () => parkingMapService.buildingFloors(buildingId),
    enabled: !!buildingId,
  })
  const floors = floorsQuery.data || []

  const floorMaps = useQueries({
    queries: floors.map((f) => ({
      queryKey: ['parking-map', 'map', f.floorId],
      queryFn: () => parkingMapService.floorMap(f.floorId),
      enabled: !!f.floorId,
    })),
  })

  const totalAvailable = floorMaps.reduce((sum, q) => sum + (q.data?.summary?.available || 0), 0)
  const totalSlots = floorMaps.reduce((sum, q) => sum + (q.data?.summary?.total || 0), 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin bãi xe"
        description="Xem bảng giá, loại xe phục vụ và số chỗ còn trống."
        icon={Info}
      />

      <Card>
        <CardBody>
          <Select
            label="Chọn bãi xe"
            placeholder="Chọn tòa nhà"
            options={buildingOptions}
            value={buildingId}
            onChange={(e) => setBuildingId(e.target.value)}
            containerClassName="max-w-sm"
          />
        </CardBody>
      </Card>

      {!buildingId && (
        <EmptyState icon={MapPin} title="Chọn bãi xe" description="Chọn một tòa nhà để xem thông tin." />
      )}

      {buildingId && (
        <>
          {building && (
            <Card>
              <CardBody>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                  <div>
                    <p className="text-xs text-slate-400">Tên bãi</p>
                    <p className="font-semibold text-slate-800">{building.name}</p>
                  </div>
                  {building.address && (
                    <div>
                      <p className="text-xs text-slate-400">Địa chỉ</p>
                      <p className="font-medium text-slate-700">{building.address}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-400">Chỗ còn trống</p>
                    <p className="text-lg font-bold text-emerald-600">
                      {totalAvailable}
                      <span className="text-sm font-normal text-slate-400"> / {totalSlots}</span>
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Bảng giá */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-brand-500" />
                    Bảng giá
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {feeQuery.isLoading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : (feeQuery.data || []).length === 0 ? (
                  <EmptyState title="Chưa có bảng giá" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {(feeQuery.data || []).map((p) => (
                      <li key={p.id} className="py-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-800">{p.name}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                            {PRICING_TYPE[p.pricingType]?.label || '—'}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-500">
                          {p.basePrice > 0 && <span>Giá cơ bản: {formatCurrency(p.basePrice)}</span>}
                          {p.hourlyPrice > 0 && <span>Theo giờ: {formatCurrency(p.hourlyPrice)}</span>}
                          {p.dailyPrice > 0 && <span>Theo ngày: {formatCurrency(p.dailyPrice)}</span>}
                          {p.monthlyPrice > 0 && <span>Vé tháng: {formatCurrency(p.monthlyPrice)}</span>}
                          {p.lostTicketFee > 0 && <span>Phí mất thẻ: {formatCurrency(p.lostTicketFee)}</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            {/* Chỗ trống theo tầng */}
            <Card>
              <CardHeader>
                <CardTitle>
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-500" />
                    Chỗ trống theo tầng
                  </span>
                </CardTitle>
              </CardHeader>
              <CardBody>
                {floorsQuery.isLoading ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : floors.length === 0 ? (
                  <EmptyState title="Chưa có tầng" />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {floors.map((f, i) => {
                      const s = floorMaps[i]?.data?.summary
                      return (
                        <li key={f.floorId} className="flex items-center justify-between py-2.5">
                          <span className="font-medium text-slate-700">{f.name}</span>
                          {s ? (
                            <span className="text-sm">
                              <span className="font-bold text-emerald-600">{s.available}</span>
                              <span className="text-slate-400"> trống / {s.total} chỗ</span>
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">đang tải...</span>
                          )}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
