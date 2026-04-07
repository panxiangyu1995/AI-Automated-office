/**
 * 部门管理面板
 * 包装部门列表和详情组件
 */

import { useState } from 'react'
import { DepartmentList } from './DepartmentList'
import { DepartmentDetail } from './DepartmentDetail'
import { useDepartmentStore } from '../stores/departmentStore'

export function DepartmentPanel() {
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null)
  const { fetchDepartmentDetail } = useDepartmentStore()

  const handleSelectDepartment = (id: string) => {
    setSelectedDepartmentId(id)
    fetchDepartmentDetail(id)
  }

  const handleCloseDetail = () => {
    setSelectedDepartmentId(null)
  }

  return (
    <div className="space-y-4">
      <DepartmentList onSelectDepartment={handleSelectDepartment} />
      <DepartmentDetail
        departmentId={selectedDepartmentId}
        onClose={handleCloseDetail}
      />
    </div>
  )
}
