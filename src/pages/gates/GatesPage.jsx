import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { DoorOpen, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { gateService } from '../../services/gateService'
import { getErrorMessage } from '../../lib/apiClient'
import { GATE_TYPE } from '../../lib/enums'
import { useBuildingOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../lib/format'
import GateFormModal from './GateFormModal'

export default function GatesPage() {
  const queryClient = useQueryClient()
  const { options: buildingOptions, items: buildings } = useBuildingOptions()
  const [page, setPage] = useState(1)
  const [buildingId, setBuildingId] = useState('')
  const [formState, setFormState] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filters = { buildingId: buildingId || undefined, page, pageSize: 20 }

  const { data, isLoading } = useQuery({
    queryKey: ['gates', filters],
    queryFn: () => gateService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['gates'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => gateService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động cổng')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const buildingName = (id) => buildings.find((b) => b.id === id)?.name || '—'

  const columns = [
    {
      key: 'code',
      header: 'Mã cổng',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <DoorOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{r.name}</p>
            <p className="text-xs text-slate-400">{r.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'buildingId',
      header: 'Tòa nhà',
      render: (r) => <span className="text-slate-600">{buildingName(r.buildingId)}</span>,
    },
    {
      key: 'type',
      header: 'Loại cổng',
      render: (r) => (
        <Badge color={GATE_TYPE[r.type]?.color}>{GATE_TYPE[r.type]?.label || r.type}</Badge>
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
            onClick={() => setFormState({ mode: 'edit', gate: r })}
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
        title="Cổng"
        description="Quản lý các cổng ra/vào của bãi đỗ xe."
        icon={DoorOpen}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm cổng
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
                setPage(1)
              }}
              placeholder="Tất cả tòa nhà"
              options={buildingOptions}
              containerClassName="w-full sm:w-64"
            />
            <Button
              variant="secondary"
              onClick={() => {
                setBuildingId('')
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
          emptyTitle="Chưa có cổng"
          emptyDescription="Thêm cổng ra/vào cho bãi đỗ."
          emptyIcon={DoorOpen}
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

      <GateFormModal
        open={!!formState}
        mode={formState?.mode}
        gate={formState?.gate}
        buildingOptions={buildingOptions}
        defaultBuildingId={buildingId}
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
        title="Ngừng hoạt động cổng"
        description={`Ngừng hoạt động cổng "${deleteTarget?.name}"?`}
        confirmText="Ngừng hoạt động"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
