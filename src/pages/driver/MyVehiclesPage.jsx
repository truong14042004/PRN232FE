import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Car, Plus } from 'lucide-react'
import { vehicleService } from '../../services/vehicleService'
import { useVehicleTypeOptions } from '../../hooks/useOptions'
import { getErrorMessage } from '../../lib/apiClient'
import { PageHeader } from '../../components/ui/PageHeader'
import { Card, CardBody } from '../../components/ui/Card'
import { Table } from '../../components/ui/Table'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { formatDateTime } from '../../lib/format'

export default function MyVehiclesPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ plateNumber: '', vehicleTypeId: '', brand: '', color: '' })

  const { options: vehicleTypeOptions, items: vehicleTypeItems } = useVehicleTypeOptions()
  const vtById = Object.fromEntries((vehicleTypeItems || []).map((t) => [t.id, t.name]))

  const vehiclesQuery = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: () => vehicleService.list({ pageSize: 100 }),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      vehicleService.create({
        plateNumber: form.plateNumber.trim(),
        vehicleTypeId: form.vehicleTypeId,
        brand: form.brand?.trim() || undefined,
        color: form.color?.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success('Đã đăng ký xe')
      setOpen(false)
      setForm({ plateNumber: '', vehicleTypeId: '', brand: '', color: '' })
      qc.invalidateQueries({ queryKey: ['my-vehicles'] })
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Đăng ký xe thất bại')),
  })

  const columns = [
    { key: 'plateNumber', header: 'Biển số', render: (r) => <span className="font-semibold text-slate-800">{r.plateNumber}</span> },
    { key: 'vehicleTypeId', header: 'Loại xe', render: (r) => vtById[r.vehicleTypeId] || '—' },
    { key: 'brand', header: 'Hãng', render: (r) => r.brand || '—' },
    { key: 'color', header: 'Màu', render: (r) => r.color || '—' },
    {
      key: 'isActive',
      header: 'Trạng thái',
      render: (r) => <Badge color={r.isActive ? 'bg-emerald-100 text-emerald-700 ring-emerald-600/20' : 'bg-slate-100 text-slate-700 ring-slate-600/20'}>{r.isActive ? 'Hoạt động' : 'Ngừng'}</Badge>,
    },
    { key: 'createdAt', header: 'Ngày đăng ký', render: (r) => formatDateTime(r.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Xe của tôi"
        description="Đăng ký biển số xe để theo dõi lượt gửi và thanh toán."
        icon={Car}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Đăng ký xe
          </Button>
        }
      />

      <Card>
        <CardBody>
          <Table
            columns={columns}
            data={vehiclesQuery.data?.items || []}
            loading={vehiclesQuery.isLoading}
            emptyTitle="Chưa có xe nào"
            emptyDescription="Đăng ký xe để bắt đầu theo dõi lượt gửi."
          />
        </CardBody>
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Đăng ký xe"
        description="Khai báo xe của bạn để liên kết với các lượt gửi."
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>Hủy</Button>
            <Button
              onClick={() => createMutation.mutate()}
              loading={createMutation.isPending}
              disabled={!form.plateNumber.trim() || !form.vehicleTypeId}
            >
              Đăng ký
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Biển số xe"
            placeholder="51A-123.45"
            value={form.plateNumber}
            onChange={(e) => setForm((f) => ({ ...f, plateNumber: e.target.value }))}
          />
          <Select
            label="Loại xe"
            placeholder="Chọn loại xe"
            options={vehicleTypeOptions}
            value={form.vehicleTypeId}
            onChange={(e) => setForm((f) => ({ ...f, vehicleTypeId: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hãng (tùy chọn)" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
            <Input label="Màu (tùy chọn)" value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
