import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { AlertOctagon, Plus, Search, RotateCcw, Pencil, CheckCircle2, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { incidentService } from '../../services/incidentService'
import { getErrorMessage } from '../../lib/apiClient'
import {
  INCIDENT_TYPE,
  INCIDENT_STATUS,
  INCIDENT_TYPE_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
} from '../../lib/incidentEnums'
import { useAuth } from '../../context/AuthContext'
import { useBuildingOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDateTime } from '../../lib/format'
import IncidentFormModal from './IncidentFormModal'
import ResolveIncidentModal from './ResolveIncidentModal'

export default function IncidentsPage() {
  const queryClient = useQueryClient()
  const { hasRole } = useAuth()
  const canManage = hasRole('Admin', 'FacilityManager')

  const { options: buildingOptions } = useBuildingOptions()

  const [page, setPage] = useState(1)
  const [buildingId, setBuildingId] = useState('')
  const [status, setStatus] = useState('')
  const [type, setType] = useState('')
  const [plateNumber, setPlateNumber] = useState('')
  const [plateInput, setPlateInput] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, incident }
  const [resolveTarget, setResolveTarget] = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const filters = {
    page,
    pageSize: 20,
    buildingId: buildingId || undefined,
    status: status !== '' ? Number(status) : undefined,
    type: type !== '' ? Number(type) : undefined,
    plateNumber: plateNumber || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', filters],
    queryFn: () => incidentService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['incidents'] })

  const cancelMutation = useMutation({
    mutationFn: (id) => incidentService.cancel(id),
    onSuccess: () => {
      toast.success('Đã hủy sự cố')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Hủy sự cố thất bại')),
  })

  const applyPlate = () => {
    setPlateNumber(plateInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setBuildingId('')
    setStatus('')
    setType('')
    setPlateInput('')
    setPlateNumber('')
    setPage(1)
  }

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => (
        <span className="font-semibold text-slate-900">{r.plateNumber || '—'}</span>
      ),
    },
    {
      key: 'type',
      header: 'Loại sự cố',
      render: (r) => (
        <Badge color={INCIDENT_TYPE[r.type]?.color}>
          {INCIDENT_TYPE[r.type]?.label || 'Khác'}
        </Badge>
      ),
    },
    {
      key: 'title',
      header: 'Nội dung',
      render: (r) => (
        <div className="min-w-0 max-w-xs">
          <p className="truncate font-medium text-slate-800">{r.title}</p>
          <p className="truncate text-xs text-slate-400">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (r) => (
        <Badge color={INCIDENT_STATUS[r.status]?.color}>
          {INCIDENT_STATUS[r.status]?.label || r.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Thời gian báo',
      render: (r) => <span className="text-slate-500">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => {
        const isClosed = r.status === 3 || r.status === 4
        return (
          <div className="flex items-center justify-end gap-1">
            {canManage && (
              <button
                onClick={() => setFormState({ mode: 'edit', incident: r })}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                title="Sửa"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {canManage && !isClosed && (
              <>
                <button
                  onClick={() => setResolveTarget(r)}
                  className="rounded-lg p-2 text-emerald-500 transition-colors hover:bg-emerald-50"
                  title="Xử lý"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setCancelTarget(r)}
                  className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                  title="Hủy"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="Sự cố"
        description="Ghi nhận và xử lý các sự cố phát sinh trong bãi đỗ xe."
        icon={AlertOctagon}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Ghi nhận sự cố
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Tòa nhà"
              placeholder="Tất cả tòa nhà"
              options={buildingOptions}
              value={buildingId}
              onChange={(e) => {
                setBuildingId(e.target.value)
                setPage(1)
              }}
            />
            <Select
              label="Trạng thái"
              placeholder="Tất cả trạng thái"
              options={INCIDENT_STATUS_OPTIONS}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            />
            <Select
              label="Loại sự cố"
              placeholder="Tất cả loại"
              options={INCIDENT_TYPE_OPTIONS}
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                setPage(1)
              }}
            />
            <div className="flex items-end gap-2">
              <Input
                label="Biển số"
                placeholder="Tìm theo biển số..."
                value={plateInput}
                onChange={(e) => setPlateInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyPlate()}
                containerClassName="flex-1"
              />
              <Button onClick={applyPlate}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
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
          emptyTitle="Chưa có sự cố"
          emptyDescription="Chưa ghi nhận sự cố nào hoặc thay đổi bộ lọc."
          emptyIcon={AlertOctagon}
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

      <IncidentFormModal
        open={!!formState}
        mode={formState?.mode}
        incident={formState?.incident}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <ResolveIncidentModal
        open={!!resolveTarget}
        incident={resolveTarget}
        onClose={() => setResolveTarget(null)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => {
          cancelMutation.mutate(cancelTarget.id)
          setCancelTarget(null)
        }}
        title="Hủy sự cố"
        description={`Hủy sự cố "${cancelTarget?.title}"? Dùng khi sự cố được báo nhầm hoặc không hợp lệ.`}
        confirmText="Hủy sự cố"
        loading={cancelMutation.isPending}
      />
    </div>
  )
}
