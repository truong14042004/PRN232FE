import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Grid3x3, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { zoneService } from '../../services/zoneService'
import { getErrorMessage } from '../../lib/apiClient'
import { useBuildingOptions, useFloorOptions, useVehicleTypeOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../lib/format'
import ZoneFormModal from './ZoneFormModal'

export default function ZonesPage() {
  const queryClient = useQueryClient()
  const { options: buildingOptions } = useBuildingOptions()
  const { items: vehicleTypes } = useVehicleTypeOptions()
  const [page, setPage] = useState(1)
  const [buildingId, setBuildingId] = useState('')
  const [floorId, setFloorId] = useState('')
  const [formState, setFormState] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { options: floorOptions } = useFloorOptions(buildingId)

  const filters = {
    buildingId: buildingId || undefined,
    floorId: floorId || undefined,
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['zones', filters],
    queryFn: () => zoneService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['zones'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => zoneService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động khu vực')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const buildingName = (id) => buildingOptions.find((b) => b.value === id)?.label || '—'
  const vehicleTypeName = (id) => vehicleTypes.find((t) => t.id === id)?.name || '—'

  const columns = [
    {
      key: 'name',
      header: 'Khu vực',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Grid3x3 className="h-5 w-5" />
          </div>
          <span className="font-semibold text-slate-900">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'buildingId',
      header: 'Tòa nhà',
      render: (r) => <span className="text-slate-600">{buildingName(r.buildingId)}</span>,
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
      key: 'occupancy',
      header: 'Sức chứa',
      align: 'right',
      render: (r) => (
        <span className="font-medium text-slate-700">
          {r.currentOccupancy}
          <span className="text-slate-400"> / {r.capacity}</span>
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (r) =>
        r.isActive ? (
          <Badge color="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Hoạt động</Badge>
        ) : (
          <Badge color="bg-slate-100 text-slate-600 ring-slate-600/20">Ngừng</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (r) => <span className="text-slate-500">{formatDate(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setFormState({ mode: 'edit', zone: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {r.isActive && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Ngừng hoạt động"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Khu vực"
        description="Phân chia khu vực đỗ xe theo tầng và loại phương tiện."
        icon={Grid3x3}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm khu vực
          </Button>
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
                setPage(1)
              }}
              placeholder="Tất cả tòa nhà"
              options={buildingOptions}
              containerClassName="w-full sm:w-56"
            />
            <Select
              label="Tầng"
              value={floorId}
              onChange={(e) => {
                setFloorId(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả tầng"
              options={floorOptions}
              disabled={!buildingId}
              containerClassName="w-full sm:w-56"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setBuildingId('')
                setFloorId('')
                setPage(1)
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Đặt lại
            </Button>
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
          emptyTitle="Chưa có khu vực"
          emptyDescription="Thêm khu vực để nhóm các chỗ đỗ theo loại xe."
          emptyIcon={Grid3x3}
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

      <ZoneFormModal
        open={!!formState}
        mode={formState?.mode}
        zone={formState?.zone}
        defaultBuildingId={buildingId}
        defaultFloorId={floorId}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="Ngừng hoạt động khu vực"
        description={`Ngừng hoạt động khu vực "${deleteTarget?.name}"?`}
        confirmText="Ngừng hoạt động"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
