import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  SquareParking,
  Plus,
  Pencil,
  Trash2,
  Grid2x2Plus,
  CircleDot,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { parkingSlotService } from '../../services/parkingSlotService'
import { getErrorMessage } from '../../lib/apiClient'
import { SLOT_STATUS, SLOT_STATUS_OPTIONS } from '../../lib/enums'
import {
  useBuildingOptions,
  useFloorOptions,
  useZoneOptions,
  useVehicleTypeOptions,
} from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SlotFormModal from './SlotFormModal'
import GenerateGridModal from './GenerateGridModal'
import SlotStatusMenu from './SlotStatusMenu'

export default function ParkingSlotsPage() {
  const queryClient = useQueryClient()
  const { options: buildingOptions } = useBuildingOptions()
  const { items: vehicleTypes } = useVehicleTypeOptions()

  const [page, setPage] = useState(1)
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [zoneId, setZoneId] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, slot }
  const [gridOpen, setGridOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { options: floorOptions } = useFloorOptions(buildingId)
  const { options: zoneOptions } = useZoneOptions(buildingId, floorId)

  const filters = {
    buildingId: buildingId || undefined,
    floorId: floorId || undefined,
    zoneId: zoneId || undefined,
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['parking-slots', 'list', filters],
    queryFn: () => parkingSlotService.list(filters),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['parking-slots'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => parkingSlotService.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa chỗ đỗ')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xóa thất bại')),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => parkingSlotService.updateStatus(id, status),
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái chỗ đỗ')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Cập nhật trạng thái thất bại')),
  })

  const vehicleTypeName = (id) => vehicleTypes.find((t) => t.id === id)?.name || '—'

  const columns = [
    {
      key: 'code',
      header: 'Mã chỗ',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <SquareParking className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.code}</p>
            {r.label && <p className="truncate text-xs text-slate-400">{r.label}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'position',
      header: 'Vị trí (hàng, cột)',
      render: (r) => (
        <span className="text-slate-600">
          H{r.row} · C{r.column}
          {(r.rowSpan > 1 || r.colSpan > 1) && (
            <span className="text-slate-400">
              {' '}
              ({r.rowSpan}×{r.colSpan})
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'vehicleTypeId',
      header: 'Loại xe',
      render: (r) => (
        <Badge color="bg-blue-100 text-blue-700 ring-blue-600/20">
          {vehicleTypeName(r.vehicleTypeId)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={SLOT_STATUS[r.status]?.color}>
          <CircleDot className="h-3 w-3" />
          {SLOT_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <SlotStatusMenu
            slot={r}
            onChange={(status) => statusMutation.mutate({ id: r.id, status })}
            disabled={statusMutation.isPending}
          />
          <button
            onClick={() => setFormState({ mode: 'edit', slot: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => setDeleteTarget(r)}
            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
            title="Xóa"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Chỗ đỗ"
        description="Quản lý từng chỗ đỗ, vị trí trên lưới và trạng thái."
        icon={SquareParking}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setGridOpen(true)}>
              <Grid2x2Plus className="h-4 w-4" />
              Sinh lưới
            </Button>
            <Button onClick={() => setFormState({ mode: 'create' })}>
              <Plus className="h-4 w-4" />
              Thêm chỗ đỗ
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Select
              label="Tòa nhà"
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value)
                setFloorId('')
                setZoneId('')
                setPage(1)
              }}
              placeholder="Tất cả tòa nhà"
              options={buildingOptions}
              containerClassName="w-full sm:w-48"
            />
            <Select
              label="Tầng"
              value={floorId}
              onChange={(e) => {
                setFloorId(e.target.value)
                setZoneId('')
                setPage(1)
              }}
              placeholder="Tất cả tầng"
              options={floorOptions}
              disabled={!buildingId}
              containerClassName="w-full sm:w-48"
            />
            <Select
              label="Khu vực"
              value={zoneId}
              onChange={(e) => {
                setZoneId(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả khu vực"
              options={zoneOptions}
              disabled={!buildingId}
              containerClassName="w-full sm:w-48"
            />
          </div>
        </CardBody>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Table
          columns={columns}
          data={data?.items}
          loading={isLoading}
          emptyTitle="Chưa có chỗ đỗ"
          emptyDescription="Thêm chỗ đỗ thủ công hoặc sinh hàng loạt theo lưới."
          emptyIcon={SquareParking}
        />
        {data && (
          <Pagination
            page={data.page}
            pageSize={data.pageSize}
            totalCount={data.totalCount}
            totalPages={data.totalPages}
            onPageChange={setPage}
          />
        )}
      </motion.div>

      <SlotFormModal
        open={!!formState}
        mode={formState?.mode}
        slot={formState?.slot}
        defaultBuildingId={buildingId}
        defaultFloorId={floorId}
        defaultZoneId={zoneId}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <GenerateGridModal
        open={gridOpen}
        defaultBuildingId={buildingId}
        defaultFloorId={floorId}
        defaultZoneId={zoneId}
        onClose={() => setGridOpen(false)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="Xóa chỗ đỗ"
        description={`Xóa chỗ đỗ "${deleteTarget?.code}"? Chỉ xóa được chỗ đang trống. Thao tác này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
