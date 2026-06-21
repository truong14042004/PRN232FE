import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Car, Plus, Search, Pencil, Trash2, RotateCcw, Phone } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehicleService } from '../../services/vehicleService'
import { getErrorMessage } from '../../lib/apiClient'
import { useVehicleTypeOptions } from '../../hooks/useOptions'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import VehicleFormModal from './VehicleFormModal'

export default function VehiclesPage() {
  const queryClient = useQueryClient()
  const { items: vehicleTypes, options: vehicleTypeOptions } = useVehicleTypeOptions()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [vehicleTypeId, setVehicleTypeId] = useState('')
  const [formState, setFormState] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filters = {
    search: search || undefined,
    vehicleTypeId: vehicleTypeId || undefined,
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => vehicleService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicles'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => vehicleService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng theo dõi phương tiện')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setVehicleTypeId('')
    setPage(1)
  }

  const vehicleTypeName = (id) => vehicleTypes.find((t) => t.id === id)?.name || '—'

  const columns = [
    {
      key: 'plateNumber',
      header: 'Biển số',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Car className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.plateNumber}</p>
            {(r.brand || r.model) && (
              <p className="truncate text-xs text-slate-400">
                {[r.brand, r.model].filter(Boolean).join(' ')}
                {r.color ? ` · ${r.color}` : ''}
              </p>
            )}
          </div>
        </div>
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
      key: 'owner',
      header: 'Chủ xe',
      render: (r) =>
        r.ownerName || r.ownerPhone ? (
          <div>
            <p className="font-medium text-slate-800">{r.ownerName || '—'}</p>
            {r.ownerPhone && (
              <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Phone className="h-3 w-3" />
                {r.ownerPhone}
              </p>
            )}
          </div>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'subscription',
      header: 'Vé tháng',
      render: (r) =>
        r.activeSubscriptionId ? (
          <Badge color="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Có</Badge>
        ) : (
          <span className="text-slate-400">Không</span>
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
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setFormState({ mode: 'edit', vehicle: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {r.isActive && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Ngừng theo dõi"
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
        title="Phương tiện"
        description="Quản lý hồ sơ phương tiện và thông tin chủ xe."
        icon={Car}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm phương tiện
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo biển số, tên chủ xe..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="flex-1"
            />
            <Select
              label="Loại xe"
              value={vehicleTypeId}
              onChange={(e) => {
                setVehicleTypeId(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả loại xe"
              options={vehicleTypeOptions}
              containerClassName="w-full sm:w-52"
            />
            <div className="flex gap-2">
              <Button onClick={applySearch}>
                <Search className="h-4 w-4" />
                Tìm
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
          emptyTitle="Chưa có phương tiện"
          emptyDescription="Thêm phương tiện đầu tiên hoặc thay đổi bộ lọc."
          emptyIcon={Car}
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

      <VehicleFormModal
        open={!!formState}
        mode={formState?.mode}
        vehicle={formState?.vehicle}
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
        title="Ngừng theo dõi phương tiện"
        description={`Ngừng theo dõi phương tiện biển số "${deleteTarget?.plateNumber}"?`}
        confirmText="Ngừng theo dõi"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
