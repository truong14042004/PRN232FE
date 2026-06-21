import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Plus, Search, Pencil, UserX, RotateCcw, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import { getErrorMessage } from '../../lib/apiClient'
import { ROLE_LABELS, ROLE_BADGE } from '../../lib/enums'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatDateTime } from '../../lib/format'
import UserFormModal from './UserFormModal'

export default function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, user }
  const [deactivateTarget, setDeactivateTarget] = useState(null)

  const filters = { page, pageSize: 20, search: search || undefined }

  const { data, isLoading } = useQuery({
    queryKey: ['users', filters],
    queryFn: () => userService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] })

  const deactivateMutation = useMutation({
    mutationFn: (id) => userService.remove(id),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa tài khoản')
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
    setPage(1)
  }

  const columns = [
    {
      key: 'user',
      header: 'Người dùng',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-semibold text-white">
            {(r.fullName || r.username || '?')
              .split(' ')
              .map((s) => s[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{r.fullName}</p>
            <p className="truncate text-xs text-slate-400">@{r.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (r) => <span className="text-slate-600">{r.email}</span>,
    },
    {
      key: 'roles',
      header: 'Vai trò',
      render: (r) => (
        <div className="flex flex-wrap gap-1">
          {r.roles?.map((role) => (
            <Badge key={role} color={ROLE_BADGE[role]}>
              {ROLE_LABELS[role] || role}
            </Badge>
          ))}
        </div>
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
      key: 'lastLoginAt',
      header: 'Đăng nhập gần nhất',
      render: (r) => <span className="text-slate-500">{formatDateTime(r.lastLoginAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setFormState({ mode: 'edit', user: r })}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            title="Sửa"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {r.isActive && (
            <button
              onClick={() => setDeactivateTarget(r)}
              className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              title="Vô hiệu hóa"
            >
              <UserX className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Người dùng"
        description="Quản lý tài khoản, vai trò và quyền truy cập hệ thống."
        icon={Users}
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </Button>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Input
              label="Tìm kiếm"
              placeholder="Tìm theo tên, username hoặc email..."
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
          emptyTitle="Chưa có người dùng"
          emptyDescription="Thêm người dùng đầu tiên hoặc thay đổi từ khóa tìm kiếm."
          emptyIcon={Users}
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

      <UserFormModal
        open={!!formState}
        mode={formState?.mode}
        user={formState?.user}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={() => {
          deactivateMutation.mutate(deactivateTarget.id)
          setDeactivateTarget(null)
        }}
        title="Vô hiệu hóa tài khoản"
        description={`Vô hiệu hóa tài khoản "${deactivateTarget?.fullName}" (@${deactivateTarget?.username})? Người dùng sẽ không thể đăng nhập cho tới khi được kích hoạt lại.`}
        confirmText="Vô hiệu hóa"
        loading={deactivateMutation.isPending}
      />
    </div>
  )
}
