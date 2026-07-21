import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Tags, Plus, Search, Pencil, Trash2, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { vehicleTypeService } from '../../services/vehicleTypeService'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDate } from '../../lib/format'
import VehicleTypeFormModal from './VehicleTypeFormModal'

export default function VehicleTypesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formState, setFormState] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filters = { search: search || undefined, page, pageSize: 20 }

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-types', filters],
    queryFn: () => vehicleTypeService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['vehicle-types'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => vehicleTypeService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng áp dụng loại xe')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const columns = [
    {
      key: 'name',
      header: 'Loại xe',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Tags className="h-5 w-5" />
          </div>
          <span className="font-semibold text-slate-900">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Mô tả',
      render: (r) => <span className="text-slate-600">{r.description || '—'}</span>,
    },
    {
      key: 'category',
      header: 'Phân loại',
      render: (r) =>
        r.category === 2 ? (
          <Badge color="bg-blue-100 text-blue-700 ring-blue-600/20">Ô tô</Badge>
        ) : (
          <Badge color="bg-violet-100 text-violet-700 ring-violet-600/20">Xe máy</Badge>
        ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (r) =>
        r.isActive ? (
          <Badge color="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Áp dụng</Badge>
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
            onClick={() => setFormState({ mode: 'edit', vehicleType: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {r.isActive && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Ngừng áp dụng"
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
        title="Loại xe"
        description="Quản lý các loại phương tiện được hỗ trợ trong bãi đỗ."
        icon={Tags}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm loại xe
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo tên loại xe..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              containerClassName="flex-1"
            />
            <div className="flex gap-2">
              <Button onClick={applySearch}>
                <Search className="h-4 w-4" />
                Tìm
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchInput('')
                  setSearch('')
                  setPage(1)
                }}
              >
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
          emptyTitle="Chưa có loại xe"
          emptyDescription="Thêm loại xe đầu tiên (xe máy, ô tô...)."
          emptyIcon={Tags}
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

      <VehicleTypeFormModal
        open={!!formState}
        mode={formState?.mode}
        vehicleType={formState?.vehicleType}
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
        title="Ngừng áp dụng loại xe"
        description={`Ngừng áp dụng loại xe "${deleteTarget?.name}"?`}
        confirmText="Ngừng áp dụng"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
