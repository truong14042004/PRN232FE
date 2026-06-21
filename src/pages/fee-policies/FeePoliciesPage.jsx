import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ScrollText,
  Plus,
  Pencil,
  Trash2,
  Calculator,
  RotateCcw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { feePolicyService } from '../../services/feePolicyService'
import { getErrorMessage } from '../../lib/apiClient'
import { PRICING_TYPE } from '../../lib/enums'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import { Pagination } from '../../components/ui/Pagination'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { formatCurrency, formatDate } from '../../lib/format'
import FeePolicyFormModal from './FeePolicyFormModal'
import CalculateFeeModal from './CalculateFeeModal'

const ACTIVE_OPTIONS = [
  { value: 'true', label: 'Đang áp dụng' },
  { value: 'false', label: 'Ngừng áp dụng' },
]

export default function FeePoliciesPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [isActive, setIsActive] = useState('')
  const [formState, setFormState] = useState(null) // null | { mode, policy }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [calcOpen, setCalcOpen] = useState(false)

  const filters = {
    isActive: isActive === '' ? undefined : isActive === 'true',
    page,
    pageSize: 20,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['fee-policies', filters],
    queryFn: () => feePolicyService.list(filters),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['fee-policies'] })

  const deleteMutation = useMutation({
    mutationFn: (id) => feePolicyService.remove(id),
    onSuccess: () => {
      toast.success('Đã ngừng áp dụng chính sách phí')
      invalidate()
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Thao tác thất bại')),
  })

  const columns = [
    {
      key: 'name',
      header: 'Tên chính sách',
      render: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      key: 'pricingType',
      header: 'Loại tính phí',
      render: (r) => (
        <Badge color="bg-blue-100 text-blue-700 ring-blue-600/20">
          {PRICING_TYPE[r.pricingType]?.label || r.pricingType}
        </Badge>
      ),
    },
    {
      key: 'basePrice',
      header: 'Giá cơ bản',
      align: 'right',
      render: (r) => <span className="font-semibold">{formatCurrency(r.basePrice)}</span>,
    },
    {
      key: 'effectiveFrom',
      header: 'Hiệu lực từ',
      render: (r) => <span className="text-slate-500">{formatDate(r.effectiveFrom)}</span>,
    },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (r) =>
        r.isActive ? (
          <Badge color="bg-emerald-100 text-emerald-700 ring-emerald-600/20">Đang áp dụng</Badge>
        ) : (
          <Badge color="bg-slate-100 text-slate-600 ring-slate-600/20">Ngừng áp dụng</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setFormState({ mode: 'edit', policy: r })}
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
        title="Chính sách phí"
        description="Cấu hình bảng giá gửi xe và công cụ tính phí theo thời gian."
        icon={ScrollText}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setCalcOpen(true)}>
              <Calculator className="h-4 w-4" />
              Tính phí
            </Button>
            <Button onClick={() => setFormState({ mode: 'create' })}>
              <Plus className="h-4 w-4" />
              Tạo chính sách
            </Button>
          </div>
        }
      />

      <Card className="mb-6">
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
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
            <Button
              variant="secondary"
              onClick={() => {
                setIsActive('')
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
          emptyTitle="Chưa có chính sách phí"
          emptyDescription="Tạo chính sách phí đầu tiên để bắt đầu tính phí gửi xe."
          emptyIcon={ScrollText}
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

      <FeePolicyFormModal
        open={!!formState}
        mode={formState?.mode}
        policy={formState?.policy}
        onClose={() => setFormState(null)}
        onSaved={invalidate}
      />

      <CalculateFeeModal open={calcOpen} onClose={() => setCalcOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          deleteMutation.mutate(deleteTarget.id)
          setDeleteTarget(null)
        }}
        title="Ngừng áp dụng chính sách"
        description={`Ngừng áp dụng chính sách "${deleteTarget?.name}"? Chính sách sẽ không còn được dùng để tính phí.`}
        confirmText="Ngừng áp dụng"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
