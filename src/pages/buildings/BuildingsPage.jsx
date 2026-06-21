import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Building2, Plus, Search, Pencil, Trash2, RotateCcw, Phone, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { buildingService } from '../../services/buildingService'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../lib/format'
import BuildingFormModal from './BuildingFormModal'

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Đang hoạt động' },
  { value: 'false', label: 'Ngừng hoạt động' },
]

export default function BuildingsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [isActive, setIsActive] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, building }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filters = {
    search: search || undefined,
    isActive: isActive === '' ? undefined : isActive === 'true',
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['buildings', filters],
    queryFn: () => buildingService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['buildings'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => buildingService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng hoạt động tòa nhà')
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
    setIsActive('')
    setPage(1)
  }

  const columns = [
    {
      key: 'name',
      header: 'Tòa nhà',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.name}</p>
            <p className="truncate text-xs text-slate-400">{r.address}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phoneNumber',
      header: 'Liên hệ',
      render: (r) =>
        r.phoneNumber ? (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Phone className="h-3.5 w-3.5 text-slate-400" />
            {r.phoneNumber}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'hours',
      header: 'Giờ hoạt động',
      render: (r) =>
        r.openingTime || r.closingTime ? (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            {(r.openingTime || '').slice(0, 5)} – {(r.closingTime || '').slice(0, 5)}
          </span>
        ) : (
          <span className="text-slate-400">Cả ngày</span>
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
            onClick={() => setFormState({ mode: 'edit', building: r })}
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
        title="Tòa nhà"
        description="Quản lý các tòa nhà có bãi đỗ xe trong hệ thống."
        icon={Building2}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm tòa nhà
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo tên hoặc địa chỉ..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="flex-1"
            />
            <Select
              label="Trạng thái"
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value)
                setPage(1)
              }}
              placeholder="Tất cả"
              options={ACTIVE_OPTIONS}
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
          emptyTitle="Chưa có tòa nhà"
          emptyDescription="Thêm tòa nhà đầu tiên để bắt đầu cấu hình bãi đỗ."
          emptyIcon={Building2}
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

      <BuildingFormModal
        open={!!formState}
        mode={formState?.mode}
        building={formState?.building}
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
        title="Ngừng hoạt động tòa nhà"
        description={`Ngừng hoạt động tòa nhà "${deleteTarget?.name}"? Bãi đỗ thuộc tòa nhà này sẽ không còn được dùng.`}
        confirmText="Ngừng hoạt động"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
