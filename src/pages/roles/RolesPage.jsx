import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ShieldCheck, Plus, Search, Pencil, Trash2, RotateCcw, Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { roleService } from '../../services/roleService'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDateTime } from '../../lib/format'
import RoleFormModal from './RoleFormModal'

export default function RolesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, role }
  const [deleteTarget, setDeleteTarget] = useState(null)

  const filters = { page, pageSize: 20, search: search || undefined }

  const { data, isLoading } = useQuery({
    queryKey: ['roles', filters],
    queryFn: () => roleService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['roles'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => roleService.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa vai trò')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Xóa vai trò thất bại')),
  })

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const columns = [
    {
      key: 'name',
      header: 'Vai trò',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.name}</p>
            {r.description && (
              <p className="truncate text-xs text-slate-400">{r.description}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'permissions',
      header: 'Quyền hạn',
      render: (r) => {
        const perms = r.permissions || []
        if (perms.length === 0) {
          return <span className="text-xs text-slate-400">Không có</span>
        }
        return (
          <div className="flex flex-wrap items-center gap-1">
            {perms.slice(0, 3).map((p) => (
              <Badge key={p} color="bg-brand-50 text-brand-700 ring-brand-600/20">
                {p}
              </Badge>
            ))}
            {perms.length > 3 && (
              <Badge color="bg-slate-100 text-slate-600 ring-slate-600/20">
                +{perms.length - 3}
              </Badge>
            )}
          </div>
        )
      },
    },
    {
      key: 'isSystem',
      header: 'Loại',
      render: (r) =>
        r.isSystem ? (
          <Badge color="bg-amber-100 text-amber-700 ring-amber-600/20">
            <Lock className="h-3 w-3" />
            Hệ thống
          </Badge>
        ) : (
          <Badge color="bg-slate-100 text-slate-600 ring-slate-600/20">Tùy chỉnh</Badge>
        ),
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (r) =>
        r.isActive ? (
          <Badge color="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Hoạt động</Badge>
        ) : (
          <Badge color="bg-slate-100 text-slate-600 ring-slate-600/20">Vô hiệu</Badge>
        ),
    },
    {
      key: 'createdAt',
      header: 'Ngày tạo',
      render: (r) => <span className="text-slate-500">{formatDateTime(r.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setFormState({ mode: 'edit', role: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!r.isSystem && (
            <button
              onClick={() => setDeleteTarget(r)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Xóa"
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
        title="Vai trò"
        description="Quản lý vai trò và quyền hạn truy cập trong hệ thống."
        icon={ShieldCheck}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm vai trò
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo tên hoặc mô tả vai trò..."
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
          emptyTitle="Chưa có vai trò"
          emptyDescription="Thêm vai trò đầu tiên hoặc thay đổi từ khóa tìm kiếm."
          emptyIcon={ShieldCheck}
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

      <RoleFormModal
        open={!!formState}
        mode={formState?.mode}
        role={formState?.role}
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
        title="Xóa vai trò"
        description={`Xóa vai trò "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
